<?php
/**
 * REST API dla adwentu
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_API_Adwent {
    
    private $namespace = 'odwiedziny-chorych/v1';
    private $rest_base = 'adwent';
    
    /**
     * Zarejestruj routes
     */
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_items'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array(
                    'rok' => array(
                        'required' => false,
                        'default' => date('Y'),
                        'sanitize_callback' => 'absint',
                    ),
                ),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'save_items'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array(
                    'rok' => array(
                        'required' => false,
                        'default' => date('Y'),
                        'sanitize_callback' => 'absint',
                    ),
                ),
            ),
        ));
    }
    
    /**
     * Sprawdź uprawnienia
     */
    public function check_permission($request) {
        return OC_Auth::rest_permission($request);
    }
    
    /**
     * @return int[]
     */
    private function get_open_years() {
        $years = get_option('oc_adwent_open_years', array());
        if (!is_array($years)) {
            return array();
        }
        return array_values(array_unique(array_map('intval', $years)));
    }

    /**
     * @param int  $rok
     * @param bool $open
     */
    private function set_year_open($rok, $open) {
        $rok = (int) $rok;
        $years = $this->get_open_years();
        if ($open) {
            if (!in_array($rok, $years, true)) {
                $years[] = $rok;
            }
        } else {
            $years = array_values(array_filter($years, function ($year) use ($rok) {
                return (int) $year !== $rok;
            }));
        }
        update_option('oc_adwent_open_years', $years, false);
    }

    /**
     * @param int $rok
     * @return bool
     */
    private function is_year_open($rok) {
        $rok = (int) $rok;
        if (in_array($rok, $this->get_open_years(), true)) {
            return true;
        }

        global $wpdb;
        $table_adwent = OC_Database::get_table_name('adwent');
        $count = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_adwent WHERE rok = %d",
            $rok
        ));
        if ($count > 0) {
            $this->set_year_open($rok, true);
            return true;
        }
        return false;
    }

    /**
     * @param int $rok
     * @return array<string,array<string,string>>
     */
    private function get_year_data($rok) {
        global $wpdb;
        $table_adwent = OC_Database::get_table_name('adwent');
        $table_szafarze = OC_Database::get_table_name('szafarze');

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT a.data,
                    og.imie as osoba_glowna_imie,
                    p.imie as pomocnik_imie
             FROM $table_adwent a
             LEFT JOIN $table_szafarze og ON a.osoba_glowna_id = og.id
             LEFT JOIN $table_szafarze p ON a.pomocnik_id = p.id
             WHERE a.rok = %d
             ORDER BY a.data ASC",
            $rok
        ), ARRAY_A);

        $adwent = array();
        foreach ((array) $results as $row) {
            $adwent[$row['data']] = array(
                'osobaGlowna' => $row['osoba_glowna_imie'] ?? '',
                'pomocnik' => $row['pomocnik_imie'] ?? '',
            );
        }
        return $adwent;
    }

    /**
     * Pobierz adwent dla roku
     */
    public function get_items($request) {
        $rok = absint($request->get_param('rok')) ?: (int) date('Y');
        return rest_ensure_response(array(
            'open' => $this->is_year_open($rok),
            'dane' => $this->get_year_data($rok),
        ));
    }
    
    /**
     * Zapisz / otwórz / zamknij adwent
     */
    public function save_items($request) {
        global $wpdb;
        $table_adwent = OC_Database::get_table_name('adwent');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
        $params = $request->get_json_params();
        $rok = absint($request->get_param('rok')) ?: (int) date('Y');
        
        $action = $params['action'] ?? 'zapisz_adwent';
        $dane = $params['dane'] ?? array();

        if ($action === 'otworz_adwent') {
            $this->set_year_open($rok, true);
            return rest_ensure_response(array(
                'success' => true,
                'open' => true,
                'dane' => $this->get_year_data($rok),
            ));
        }

        if ($action === 'zamknij_adwent') {
            $wpdb->delete($table_adwent, array('rok' => $rok), array('%d'));
            $this->set_year_open($rok, false);
            return rest_ensure_response(array(
                'success' => true,
                'open' => false,
                'dane' => array(),
            ));
        }
        
        if ($action !== 'zapisz_adwent') {
            return new WP_Error('invalid_action', 'Nieznana akcja', array('status' => 400));
        }

        if (!$this->is_year_open($rok)) {
            return new WP_Error('adwent_closed', 'Adwent na ten rok jest zamknięty.', array('status' => 400));
        }
        
        $wpdb->query('START TRANSACTION');
        
        try {
            foreach ($dane as $data => $values) {
                $osoba_glowna_id = null;
                $pomocnik_id = null;
                
                if (!empty($values['osobaGlowna'])) {
                    $szafarz = $wpdb->get_row($wpdb->prepare(
                        "SELECT id FROM $table_szafarze WHERE imie = %s AND aktywny = 1",
                        $values['osobaGlowna']
                    ));
                    if ($szafarz) {
                        $osoba_glowna_id = $szafarz->id;
                    }
                }
                
                if (!empty($values['pomocnik'])) {
                    $szafarz = $wpdb->get_row($wpdb->prepare(
                        "SELECT id FROM $table_szafarze WHERE imie = %s AND aktywny = 1",
                        $values['pomocnik']
                    ));
                    if ($szafarz) {
                        $pomocnik_id = $szafarz->id;
                    }
                }
                
                $existing = $wpdb->get_row($wpdb->prepare(
                    "SELECT id FROM $table_adwent WHERE data = %s",
                    $data
                ));
                
                if ($existing) {
                    $wpdb->update($table_adwent, array(
                        'osoba_glowna_id' => $osoba_glowna_id,
                        'pomocnik_id' => $pomocnik_id,
                    ), array('id' => $existing->id));
                } else {
                    $wpdb->insert($table_adwent, array(
                        'data' => $data,
                        'rok' => date('Y', strtotime($data)),
                        'osoba_glowna_id' => $osoba_glowna_id,
                        'pomocnik_id' => $pomocnik_id,
                    ));
                }
            }
            
            $wpdb->query('COMMIT');
            
            return rest_ensure_response(array('success' => true));
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('db_error', 'Błąd zapisu: ' . $e->getMessage(), array('status' => 500));
        }
    }
}



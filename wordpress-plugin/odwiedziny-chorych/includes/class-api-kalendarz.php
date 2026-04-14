<?php
/**
 * REST API dla kalendarza
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_API_Kalendarz {
    
    private $namespace = 'odwiedziny-chorych/v1';
    private $rest_base = 'kalendarz';
    
    /**
     * Zarejestruj routes
     */
    public function register_routes() {
        // GET /kalendarz - pobierz kalendarz
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
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_year'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array(
                    'rok' => array(
                        'required' => true,
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
        $nonce = $request->get_header('X-WP-Nonce');
        if ($nonce && wp_verify_nonce($nonce, 'wp_rest')) {
            return true;
        }
        
        $auth_header = $request->get_header('Authorization');
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
            return $this->verify_token($token);
        }
        
        return false;
    }
    
    /**
     * Weryfikuj token
     */
    private function verify_token($token) {
        global $wpdb;
        $table = OC_Database::get_table_name('sesje');
        
        $session = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE token = %s AND data_wygasniecia > NOW()",
            $token
        ));
        
        return $session !== null;
    }
    
    /**
     * Pobierz kalendarz dla roku
     */
    public function get_items($request) {
        global $wpdb;
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
        $rok = $request->get_param('rok');
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT k.*, 
                    og.imie as osoba_glowna_imie,
                    p.imie as pomocnik_imie
             FROM $table_kalendarz k
             LEFT JOIN $table_szafarze og ON k.osoba_glowna_id = og.id
             LEFT JOIN $table_szafarze p ON k.pomocnik_id = p.id
             WHERE k.rok = %d
             ORDER BY k.data ASC",
            $rok
        ), ARRAY_A);
        
        // Konwertuj do formatu zgodnego z frontendem (obiekt z datą jako kluczem)
        $kalendarz = array();
        foreach ($results as $row) {
            $dateKey = $row['data'];
            $kalendarz[$dateKey] = array(
                'osobaGlowna' => $row['osoba_glowna_imie'] ?? '',
                'pomocnik' => $row['pomocnik_imie'] ?? '',
                'uwagi' => $row['uwagi'] ?? '',
            );
        }
        
        return rest_ensure_response($kalendarz);
    }
    
    /**
     * Zapisz kalendarz
     */
    public function save_items($request) {
        global $wpdb;
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
        $params = $request->get_json_params();
        $rok = $request->get_param('rok') ?: date('Y');
        
        $action = $params['action'] ?? 'zapisz_kalendarz';
        $dane = $params['dane'] ?? array();
        
        if ($action !== 'zapisz_kalendarz') {
            return new WP_Error('invalid_action', 'Nieznana akcja', array('status' => 400));
        }
        
        $wpdb->query('START TRANSACTION');
        
        try {
            foreach ($dane as $data => $values) {
                // Pobierz ID szafarzy
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
                
                // Sprawdź czy wpis istnieje
                $existing = $wpdb->get_row($wpdb->prepare(
                    "SELECT id FROM $table_kalendarz WHERE data = %s",
                    $data
                ));
                
                if ($existing) {
                    // Aktualizuj
                    $wpdb->update($table_kalendarz, array(
                        'osoba_glowna_id' => $osoba_glowna_id,
                        'pomocnik_id' => $pomocnik_id,
                        'uwagi' => sanitize_textarea_field($values['uwagi'] ?? ''),
                    ), array('id' => $existing->id));
                    // wpdb->update często pomija NULL — wymuś wyczyszczenie pomocnika, gdy nie przesłano osoby
                    if ($pomocnik_id === null) {
                        $wpdb->query($wpdb->prepare(
                            "UPDATE $table_kalendarz SET pomocnik_id = NULL WHERE id = %d",
                            $existing->id
                        ));
                    }
                } else {
                    // Dodaj nowy
                    $wpdb->insert($table_kalendarz, array(
                        'data' => $data,
                        'rok' => date('Y', strtotime($data)),
                        'osoba_glowna_id' => $osoba_glowna_id,
                        'pomocnik_id' => $pomocnik_id,
                        'uwagi' => sanitize_textarea_field($values['uwagi'] ?? ''),
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
    
    /**
     * Usuń wszystkie wpisy dla danego roku
     */
    public function delete_year($request) {
        global $wpdb;
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        
        $rok = $request->get_param('rok');
        
        if (!$rok) {
            return new WP_Error('missing_year', 'Brak parametru rok', array('status' => 400));
        }
        
        $deleted = $wpdb->delete(
            $table_kalendarz,
            array('rok' => $rok),
            array('%d')
        );
        
        if ($deleted === false) {
            return new WP_Error('db_error', 'Błąd usuwania danych', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'deleted' => $deleted,
            'message' => "Usunięto {$deleted} wpisów dla roku {$rok}"
        ));
    }
}


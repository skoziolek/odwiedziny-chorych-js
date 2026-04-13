<?php
/**
 * REST API dla historii odwiedzin
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_API_Historia {
    
    private $namespace = 'odwiedziny-chorych/v1';
    private $rest_base = 'historia';
    
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
                    'data' => array(
                        'required' => false,
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'typ' => array(
                        'required' => false,
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                ),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'save_item'),
                'permission_callback' => array($this, 'check_permission'),
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
     * Pobierz historię
     */
    public function get_items($request) {
        global $wpdb;
        $table_historia = OC_Database::get_table_name('historia');
        $table_chorzy = OC_Database::get_table_name('chorzy');
        
        $data = $request->get_param('data');
        $typ = $request->get_param('typ');
        
        // Jeśli podano datę, zwróć tylko wpis dla tej daty
        if ($data) {
            $where = $wpdb->prepare("WHERE data = %s", $data);
            if ($typ) {
                $where .= $wpdb->prepare(" AND typ = %s", $typ);
            }
            
            $row = $wpdb->get_row(
                "SELECT * FROM $table_historia $where",
                ARRAY_A
            );
            
            if (!$row) {
                return rest_ensure_response(array('data' => $data, 'chorzy' => array()));
            }
            
            $chorzy_ids = !empty($row['chorzy_ids']) ? explode(',', $row['chorzy_ids']) : array();
            $chorzy_names = array();
            
            foreach ($chorzy_ids as $id) {
                $chory = $wpdb->get_row($wpdb->prepare(
                    "SELECT imie_nazwisko FROM $table_chorzy WHERE id = %d",
                    $id
                ));
                if ($chory) {
                    $chorzy_names[] = $chory->imie_nazwisko;
                }
            }
            
            return rest_ensure_response(array(
                'data' => $row['data'],
                'typ' => $row['typ'],
                'chorzy' => $chorzy_names,
                'uwagi' => $row['uwagi'],
            ));
        }
        
        // Zwróć wszystkie wpisy
        $results = $wpdb->get_results(
            "SELECT * FROM $table_historia ORDER BY data DESC",
            ARRAY_A
        );
        
        $historia = array();
        foreach ($results as $row) {
            $chorzy_ids = !empty($row['chorzy_ids']) ? explode(',', $row['chorzy_ids']) : array();
            $chorzy_names = array();
            
            foreach ($chorzy_ids as $id) {
                $chory = $wpdb->get_row($wpdb->prepare(
                    "SELECT imie_nazwisko FROM $table_chorzy WHERE id = %d",
                    $id
                ));
                if ($chory) {
                    $chorzy_names[] = $chory->imie_nazwisko;
                }
            }
            
            $historia[] = array(
                'data' => $row['data'],
                'typ' => $row['typ'],
                'chorzy' => $chorzy_names,
                'uwagi' => $row['uwagi'],
            );
        }
        
        return rest_ensure_response($historia);
    }
    
    /**
     * Zapisz wpis historii
     */
    public function save_item($request) {
        global $wpdb;
        $table_historia = OC_Database::get_table_name('historia');
        $table_chorzy = OC_Database::get_table_name('chorzy');
        
        $params = $request->get_json_params();
        
        $action = $params['action'] ?? 'dodaj_odwiedziny';
        
        if ($action === 'dodaj_odwiedziny') {
            $data = sanitize_text_field($params['data'] ?? '');
            $chorzy_names = $params['chorzy'] ?? array();
            $uwagi = sanitize_textarea_field($params['uwagi'] ?? '');
            $typ = in_array($params['typ'] ?? 'niedziela', array('niedziela', 'adwent')) ? $params['typ'] : 'niedziela';
            
            // Pobierz ID chorych na podstawie nazw
            $chorzy_ids = array();
            foreach ($chorzy_names as $name) {
                $chory = $wpdb->get_row($wpdb->prepare(
                    "SELECT id FROM $table_chorzy WHERE imie_nazwisko = %s",
                    $name
                ));
                if ($chory) {
                    $chorzy_ids[] = $chory->id;
                }
            }
            
            // Sprawdź czy wpis już istnieje
            $existing = $wpdb->get_row($wpdb->prepare(
                "SELECT id FROM $table_historia WHERE data = %s AND typ = %s",
                $data,
                $typ
            ));
            
            if ($existing) {
                // Aktualizuj
                $wpdb->update($table_historia, array(
                    'chorzy_ids' => implode(',', $chorzy_ids),
                    'uwagi' => $uwagi,
                ), array('id' => $existing->id));
            } else {
                // Dodaj nowy
                $wpdb->insert($table_historia, array(
                    'data' => $data,
                    'typ' => $typ,
                    'chorzy_ids' => implode(',', $chorzy_ids),
                    'uwagi' => $uwagi,
                ));
            }
            
            return rest_ensure_response(array('success' => true));
        }
        
        return new WP_Error('invalid_action', 'Nieznana akcja', array('status' => 400));
    }
}


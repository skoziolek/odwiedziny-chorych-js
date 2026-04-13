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
     * Pobierz adwent dla roku
     */
    public function get_items($request) {
        global $wpdb;
        $table_adwent = OC_Database::get_table_name('adwent');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
        $rok = $request->get_param('rok');
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT a.*, 
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
        foreach ($results as $row) {
            $dateKey = $row['data'];
            $adwent[$dateKey] = array(
                'osobaGlowna' => $row['osoba_glowna_imie'] ?? '',
                'pomocnik' => $row['pomocnik_imie'] ?? '',
            );
        }
        
        return rest_ensure_response($adwent);
    }
    
    /**
     * Zapisz adwent
     */
    public function save_items($request) {
        global $wpdb;
        $table_adwent = OC_Database::get_table_name('adwent');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
        $params = $request->get_json_params();
        $rok = $request->get_param('rok') ?: date('Y');
        
        $action = $params['action'] ?? 'zapisz_adwent';
        $dane = $params['dane'] ?? array();
        
        if ($action !== 'zapisz_adwent') {
            return new WP_Error('invalid_action', 'Nieznana akcja', array('status' => 400));
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



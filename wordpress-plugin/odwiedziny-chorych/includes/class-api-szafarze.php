<?php
/**
 * REST API dla szafarzy
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_API_Szafarze {
    
    private $namespace = 'odwiedziny-chorych/v1';
    private $rest_base = 'szafarze';
    
    /**
     * Zarejestruj routes
     */
    public function register_routes() {
        // GET /szafarze - pobierz wszystkich
        register_rest_route($this->namespace, '/' . $this->rest_base, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_items'),
                'permission_callback' => array($this, 'check_permission'),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'save_items'),
                'permission_callback' => array($this, 'check_permission'),
            ),
        ));
        
        // GET/PUT/DELETE /szafarze/{id}
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>\d+)', array(
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_item'),
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
     * Pobierz wszystkich szafarzy
     */
    public function get_items($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('szafarze');
        
        $results = $wpdb->get_results(
            "SELECT * FROM $table WHERE aktywny = 1 ORDER BY kolejnosc ASC, id ASC",
            ARRAY_A
        );
        
        $szafarze = array();
        foreach ($results as $row) {
            $szafarze[] = array(
                'id' => (int) $row['id'],
                'imie' => $row['imie'],
                'nazwisko' => $row['nazwisko'],
                'adres' => $row['adres'],
                'email' => $row['email'],
                'telefon' => $row['telefon'],
            );
        }
        
        return rest_ensure_response($szafarze);
    }
    
    /**
     * Zapisz szafarzy (bulk save)
     */
    public function save_items($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('szafarze');
        
        $data = $request->get_json_params();
        
        if (!is_array($data)) {
            return new WP_Error('invalid_data', 'Nieprawidłowe dane', array('status' => 400));
        }
        
        $wpdb->query('START TRANSACTION');
        
        try {
            // Oznacz wszystkich jako nieaktywnych
            $wpdb->query("UPDATE $table SET aktywny = 0");
            
            // Dodaj/aktualizuj szafarzy
            $kolejnosc = 0;
            foreach ($data as $szafarz) {
                $imie = sanitize_text_field($szafarz['imie'] ?? '');
                $nazwisko = sanitize_text_field($szafarz['nazwisko'] ?? '');
                
                if (empty($imie) && empty($nazwisko)) {
                    continue;
                }
                
                // Sprawdź czy istnieje
                $existing = $wpdb->get_row($wpdb->prepare(
                    "SELECT id FROM $table WHERE imie = %s AND nazwisko = %s",
                    $imie,
                    $nazwisko
                ));
                
                if ($existing) {
                    // Aktualizuj
                    $wpdb->update($table, array(
                        'adres' => sanitize_text_field($szafarz['adres'] ?? ''),
                        'email' => sanitize_email($szafarz['email'] ?? ''),
                        'telefon' => sanitize_text_field($szafarz['telefon'] ?? ''),
                        'kolejnosc' => $kolejnosc,
                        'aktywny' => 1,
                    ), array('id' => $existing->id));
                } else {
                    // Dodaj nowego
                    $wpdb->insert($table, array(
                        'imie' => $imie,
                        'nazwisko' => $nazwisko,
                        'adres' => sanitize_text_field($szafarz['adres'] ?? ''),
                        'email' => sanitize_email($szafarz['email'] ?? ''),
                        'telefon' => sanitize_text_field($szafarz['telefon'] ?? ''),
                        'kolejnosc' => $kolejnosc,
                        'aktywny' => 1,
                    ));
                }
                
                $kolejnosc++;
            }
            
            $wpdb->query('COMMIT');
            
            return rest_ensure_response(array('success' => true));
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('db_error', 'Błąd zapisu: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Usuń szafarza
     */
    public function delete_item($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('szafarze');
        
        $id = $request->get_param('id');
        
        // Soft delete - oznacz jako nieaktywny
        $result = $wpdb->update($table, array('aktywny' => 0), array('id' => $id));
        
        if ($result === false) {
            return new WP_Error('db_error', 'Błąd usuwania', array('status' => 500));
        }
        
        return rest_ensure_response(array('success' => true));
    }
}



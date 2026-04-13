<?php
/**
 * REST API dla chorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_API_Chorzy {
    
    private $namespace = 'odwiedziny-chorych/v1';
    private $rest_base = 'chorzy';
    
    /**
     * Zarejestruj routes
     */
    public function register_routes() {
        // GET /chorzy - pobierz wszystkich
        register_rest_route($this->namespace, '/' . $this->rest_base, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_items'),
                'permission_callback' => array($this, 'check_permission'),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_item'),
                'permission_callback' => array($this, 'check_permission'),
            ),
        ));
        
        // GET/PUT/DELETE /chorzy/{id}
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>\d+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => array($this, 'check_permission'),
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_item'),
                'permission_callback' => array($this, 'check_permission'),
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_item'),
                'permission_callback' => array($this, 'check_permission'),
            ),
        ));
        
        // POST /chorzy/bulk - zapisz wszystkich naraz
        register_rest_route($this->namespace, '/' . $this->rest_base . '/bulk', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'bulk_save'),
            'permission_callback' => array($this, 'check_permission'),
        ));
    }
    
    /**
     * Sprawdź uprawnienia
     */
    public function check_permission($request) {
        // Sprawdź nonce WordPress
        $nonce = $request->get_header('X-WP-Nonce');
        if ($nonce && wp_verify_nonce($nonce, 'wp_rest')) {
            return true;
        }
        
        // Sprawdź token sesji
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
     * Pobierz wszystkich chorych
     */
    public function get_items($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        
        $status = $request->get_param('status');
        
        $sql = "SELECT * FROM $table";
        if ($status) {
            $sql .= $wpdb->prepare(" WHERE status = %s", $status);
        }
        $sql .= " ORDER BY status DESC, imie_nazwisko ASC";
        
        $results = $wpdb->get_results($sql, ARRAY_A);
        
        // Konwertuj do formatu zgodnego z frontendem
        $chorzy = array();
        foreach ($results as $row) {
            $chorzy[] = array(
                'id' => (int) $row['id'],
                'imieNazwisko' => $row['imie_nazwisko'],
                'adres' => $row['adres'],
                'telefon' => $row['telefon'],
                'uwagi' => $row['uwagi'],
                'status' => $row['status'],
            );
        }
        
        return rest_ensure_response($chorzy);
    }
    
    /**
     * Pobierz jednego chorego
     */
    public function get_item($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        
        $id = $request->get_param('id');
        
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            $id
        ), ARRAY_A);
        
        if (!$row) {
            return new WP_Error('not_found', 'Chory nie znaleziony', array('status' => 404));
        }
        
        return rest_ensure_response(array(
            'id' => (int) $row['id'],
            'imieNazwisko' => $row['imie_nazwisko'],
            'adres' => $row['adres'],
            'telefon' => $row['telefon'],
            'uwagi' => $row['uwagi'],
            'status' => $row['status'],
        ));
    }
    
    /**
     * Utwórz chorego
     */
    public function create_item($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        
        $data = $request->get_json_params();
        
        $result = $wpdb->insert($table, array(
            'imie_nazwisko' => sanitize_text_field($data['imieNazwisko'] ?? ''),
            'adres' => sanitize_text_field($data['adres'] ?? ''),
            'telefon' => sanitize_text_field($data['telefon'] ?? ''),
            'uwagi' => sanitize_textarea_field($data['uwagi'] ?? ''),
            'status' => in_array($data['status'] ?? 'TAK', array('TAK', 'NIE')) ? $data['status'] : 'TAK',
        ));
        
        if ($result === false) {
            return new WP_Error('db_error', 'Błąd zapisu do bazy danych', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'id' => $wpdb->insert_id,
            'success' => true,
        ));
    }
    
    /**
     * Aktualizuj chorego
     */
    public function update_item($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        
        $id = $request->get_param('id');
        $data = $request->get_json_params();
        
        $update_data = array();
        
        if (isset($data['imieNazwisko'])) {
            $update_data['imie_nazwisko'] = sanitize_text_field($data['imieNazwisko']);
        }
        if (isset($data['adres'])) {
            $update_data['adres'] = sanitize_text_field($data['adres']);
        }
        if (isset($data['telefon'])) {
            $update_data['telefon'] = sanitize_text_field($data['telefon']);
        }
        if (isset($data['uwagi'])) {
            $update_data['uwagi'] = sanitize_textarea_field($data['uwagi']);
        }
        if (isset($data['status']) && in_array($data['status'], array('TAK', 'NIE'))) {
            $update_data['status'] = $data['status'];
        }
        
        if (empty($update_data)) {
            return new WP_Error('no_data', 'Brak danych do aktualizacji', array('status' => 400));
        }
        
        $result = $wpdb->update($table, $update_data, array('id' => $id));
        
        if ($result === false) {
            return new WP_Error('db_error', 'Błąd aktualizacji', array('status' => 500));
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Usuń chorego
     */
    public function delete_item($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        
        $id = $request->get_param('id');
        
        $result = $wpdb->delete($table, array('id' => $id));
        
        if ($result === false) {
            return new WP_Error('db_error', 'Błąd usuwania', array('status' => 500));
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Zapisz wszystkich chorych naraz (bulk)
     */
    public function bulk_save($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        
        $data = $request->get_json_params();
        
        if (!is_array($data)) {
            return new WP_Error('invalid_data', 'Nieprawidłowe dane', array('status' => 400));
        }
        
        // Rozpocznij transakcję
        $wpdb->query('START TRANSACTION');
        
        try {
            // Usuń wszystkich chorych
            $wpdb->query("DELETE FROM $table");
            
            // Dodaj nowych
            foreach ($data as $chory) {
                $wpdb->insert($table, array(
                    'imie_nazwisko' => sanitize_text_field($chory['imieNazwisko'] ?? ''),
                    'adres' => sanitize_text_field($chory['adres'] ?? ''),
                    'telefon' => sanitize_text_field($chory['telefon'] ?? ''),
                    'uwagi' => sanitize_textarea_field($chory['uwagi'] ?? ''),
                    'status' => in_array($chory['status'] ?? 'TAK', array('TAK', 'NIE')) ? $chory['status'] : 'TAK',
                ));
            }
            
            $wpdb->query('COMMIT');
            
            return rest_ensure_response(array('success' => true));
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('db_error', 'Błąd zapisu: ' . $e->getMessage(), array('status' => 500));
        }
    }
}



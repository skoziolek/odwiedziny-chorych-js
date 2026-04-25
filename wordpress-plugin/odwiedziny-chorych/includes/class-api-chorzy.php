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
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function format_chory_api_row(array $row) {
        $uwagi_data = $row['uwagi_ostatnio_data'] ?? null;
        $sz_id = isset($row['uwagi_ostatnio_szafarz_id']) ? $row['uwagi_ostatnio_szafarz_id'] : null;
        $przez = null;
        if (!empty($uwagi_data)) {
            if (!empty($sz_id)) {
                $si = $row['oc_sz_imie'] ?? '';
                $sn = $row['oc_sz_nazwisko'] ?? '';
                $przez = trim($si . ' ' . $sn);
                if ($przez === '') {
                    $przez = 'Szafarz #' . (int) $sz_id;
                }
            } else {
                $przez = 'Administrator';
            }
        }
        return array(
            'id' => (int) $row['id'],
            'imieNazwisko' => $row['imie_nazwisko'],
            'adres' => $row['adres'],
            'telefon' => $row['telefon'],
            'uwagi' => $row['uwagi'],
            'status' => $row['status'],
            'uwagiOstatnioPrzez' => $przez,
            'uwagiOstatnioData' => $uwagi_data,
        );
    }
    
    /**
     * Pobierz wszystkich chorych
     */
    public function get_items($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        $table_sz = OC_Database::get_table_name('szafarze');
        
        $status = $request->get_param('status');
        
        $sql = "SELECT c.*, s.imie AS oc_sz_imie, s.nazwisko AS oc_sz_nazwisko FROM $table c"
            . " LEFT JOIN $table_sz s ON c.uwagi_ostatnio_szafarz_id = s.id";
        if ($status) {
            $sql .= $wpdb->prepare(' WHERE c.status = %s', $status);
        }
        $sql .= ' ORDER BY c.status DESC, c.imie_nazwisko ASC';
        
        $results = $wpdb->get_results($sql, ARRAY_A);
        
        $chorzy = array();
        foreach ($results as $row) {
            $chorzy[] = $this->format_chory_api_row($row);
        }
        
        return rest_ensure_response($chorzy);
    }
    
    /**
     * Pobierz jednego chorego
     */
    public function get_item($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        $table_sz = OC_Database::get_table_name('szafarze');
        
        $id = $request->get_param('id');
        
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT c.*, s.imie AS oc_sz_imie, s.nazwisko AS oc_sz_nazwisko FROM $table c"
            . " LEFT JOIN $table_sz s ON c.uwagi_ostatnio_szafarz_id = s.id WHERE c.id = %d",
            $id
        ), ARRAY_A);
        
        if (!$row) {
            return new WP_Error('not_found', 'Chory nie znaleziony', array('status' => 404));
        }
        
        return rest_ensure_response($this->format_chory_api_row($row));
    }
    
    /**
     * Utwórz chorego
     */
    public function create_item($request) {
        global $wpdb;
        $table = OC_Database::get_table_name('chorzy');
        
        $data = $request->get_json_params();

        $uwagi = sanitize_textarea_field($data['uwagi'] ?? '');
        $insert = array(
            'imie_nazwisko' => sanitize_text_field($data['imieNazwisko'] ?? ''),
            'adres' => sanitize_text_field($data['adres'] ?? ''),
            'telefon' => sanitize_text_field($data['telefon'] ?? ''),
            'uwagi' => $uwagi,
            'status' => in_array($data['status'] ?? 'TAK', array('TAK', 'NIE')) ? $data['status'] : 'TAK',
        );
        if ($uwagi !== '') {
            $insert['uwagi_ostatnio_szafarz_id'] = OC_Auth::get_actor_szafarz_id_for_audit($request);
            $insert['uwagi_ostatnio_data'] = current_time('mysql');
        }

        $result = $wpdb->insert($table, $insert);
        
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
        
        $wpdb->query('START TRANSACTION');
        
        try {
            $existing_ids = array_map('intval', (array) $wpdb->get_col("SELECT id FROM $table"));
            $payload_ids = array();
            foreach ($data as $chory) {
                if (!empty($chory['id'])) {
                    $payload_ids[] = (int) $chory['id'];
                }
            }
            $to_delete = array_diff($existing_ids, $payload_ids);
            foreach ($to_delete as $del_id) {
                $wpdb->delete($table, array('id' => $del_id));
            }

            foreach ($data as $chory) {
                $id = !empty($chory['id']) ? (int) $chory['id'] : 0;
                $imie = sanitize_text_field($chory['imieNazwisko'] ?? '');
                $adres = sanitize_text_field($chory['adres'] ?? '');
                $telefon = sanitize_text_field($chory['telefon'] ?? '');
                $uwagi = sanitize_textarea_field($chory['uwagi'] ?? '');
                $status = in_array($chory['status'] ?? 'TAK', array('TAK', 'NIE')) ? $chory['status'] : 'TAK';

                $old_uwagi = null;
                if ($id > 0) {
                    $old_row = $wpdb->get_row($wpdb->prepare("SELECT uwagi FROM $table WHERE id = %d", $id), ARRAY_A);
                    if ($old_row) {
                        $old_uwagi = $old_row['uwagi'];
                    } else {
                        $id = 0;
                    }
                }

                if ($id > 0) {
                    $update = array(
                        'imie_nazwisko' => $imie,
                        'adres' => $adres,
                        'telefon' => $telefon,
                        'uwagi' => $uwagi,
                        'status' => $status,
                    );
                    if ((string) $old_uwagi !== (string) $uwagi) {
                        $update['uwagi_ostatnio_szafarz_id'] = OC_Auth::get_actor_szafarz_id_for_audit($request);
                        $update['uwagi_ostatnio_data'] = current_time('mysql');
                    }
                    $wpdb->update($table, $update, array('id' => $id));
                } else {
                    $insert = array(
                        'imie_nazwisko' => $imie,
                        'adres' => $adres,
                        'telefon' => $telefon,
                        'uwagi' => $uwagi,
                        'status' => $status,
                    );
                    if ($uwagi !== '') {
                        $insert['uwagi_ostatnio_szafarz_id'] = OC_Auth::get_actor_szafarz_id_for_audit($request);
                        $insert['uwagi_ostatnio_data'] = current_time('mysql');
                    }
                    $wpdb->insert($table, $insert);
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



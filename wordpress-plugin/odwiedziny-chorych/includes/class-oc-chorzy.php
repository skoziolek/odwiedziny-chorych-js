<?php
/**
 * Klasa do obsługi chorych
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Chorzy {
    
    /**
     * Nazwa tabeli
     */
    private static $table = 'chorzy';
    
    /**
     * Pobierz wszystkich chorych
     */
    public static function get_all($args = array()) {
        $defaults = array(
            'orderby' => 'imie_nazwisko',
            'order' => 'ASC',
            'status' => null,
            'aktywny' => 1,
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $where = array();
        
        if ($args['aktywny'] !== null) {
            $where['aktywny'] = $args['aktywny'];
        }
        
        if ($args['status'] !== null) {
            $where['status'] = $args['status'];
        }
        
        $results = OC_Database::get_all(self::$table, array(
            'orderby' => $args['orderby'],
            'order' => $args['order'],
            'where' => $where,
        ));
        
        return self::format_results($results);
    }
    
    /**
     * Pobierz chorych posortowanych według statusu
     */
    public static function get_sorted_by_status() {
        $all = self::get_all();
        
        $tak = array_filter($all, function($c) { return $c['status'] === 'TAK'; });
        $puste = array_filter($all, function($c) { return $c['status'] === '' || $c['status'] === null; });
        $nie = array_filter($all, function($c) { return $c['status'] === 'NIE'; });
        
        // Sortuj każdą grupę alfabetycznie
        usort($tak, function($a, $b) { return strcoll($a['imieNazwisko'], $b['imieNazwisko']); });
        usort($puste, function($a, $b) { return strcoll($a['imieNazwisko'], $b['imieNazwisko']); });
        usort($nie, function($a, $b) { return strcoll($a['imieNazwisko'], $b['imieNazwisko']); });
        
        return array_merge($tak, $puste, $nie);
    }
    
    /**
     * Pobierz pojedynczego chorego
     */
    public static function get($id) {
        $result = OC_Database::get_one(self::$table, $id);
        
        if (!$result) {
            return null;
        }
        
        return self::format_single($result);
    }
    
    /**
     * Utwórz nowego chorego
     */
    public static function create($data) {
        $sanitized = self::sanitize_data($data);
        
        $db_data = array(
            'imie_nazwisko' => $sanitized['imieNazwisko'],
            'adres' => $sanitized['adres'],
            'telefon' => $sanitized['telefon'],
            'uwagi' => $sanitized['uwagi'],
            'status' => $sanitized['status'],
            'aktywny' => 1,
        );
        
        return OC_Database::insert(self::$table, $db_data);
    }
    
    /**
     * Zaktualizuj chorego
     */
    public static function update($id, $data) {
        $sanitized = self::sanitize_data($data);
        
        $db_data = array(
            'imie_nazwisko' => $sanitized['imieNazwisko'],
            'adres' => $sanitized['adres'],
            'telefon' => $sanitized['telefon'],
            'uwagi' => $sanitized['uwagi'],
            'status' => $sanitized['status'],
        );
        
        return OC_Database::update(self::$table, $db_data, array('id' => $id));
    }
    
    /**
     * Usuń chorego (soft delete)
     */
    public static function delete($id) {
        return OC_Database::update(self::$table, array('aktywny' => 0), array('id' => $id));
    }
    
    /**
     * Usuń chorego (hard delete)
     */
    public static function hard_delete($id) {
        return OC_Database::delete(self::$table, array('id' => $id));
    }
    
    /**
     * Zapisz wielu chorych (bulk save)
     */
    public static function save_all($chorzy) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        // Rozpocznij transakcję
        $wpdb->query('START TRANSACTION');
        
        try {
            // Oznacz wszystkich jako nieaktywnych
            $wpdb->query("UPDATE $table_name SET aktywny = 0");
            
            foreach ($chorzy as $chory) {
                if (empty($chory['imieNazwisko'])) {
                    continue;
                }
                
                $sanitized = self::sanitize_data($chory);
                
                // Sprawdź czy istnieje po nazwisku
                $existing = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT id FROM $table_name WHERE imie_nazwisko = %s",
                        $sanitized['imieNazwisko']
                    )
                );
                
                $db_data = array(
                    'imie_nazwisko' => $sanitized['imieNazwisko'],
                    'adres' => $sanitized['adres'],
                    'telefon' => $sanitized['telefon'],
                    'uwagi' => $sanitized['uwagi'],
                    'status' => $sanitized['status'],
                    'aktywny' => 1,
                );
                
                if ($existing) {
                    $wpdb->update($table_name, $db_data, array('id' => $existing->id));
                } else {
                    $wpdb->insert($table_name, $db_data);
                }
            }
            
            $wpdb->query('COMMIT');
            return true;
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('save_error', $e->getMessage());
        }
    }
    
    /**
     * Sanityzuj dane wejściowe
     */
    private static function sanitize_data($data) {
        return array(
            'imieNazwisko' => sanitize_text_field($data['imieNazwisko'] ?? ''),
            'adres' => sanitize_textarea_field($data['adres'] ?? ''),
            'telefon' => sanitize_text_field($data['telefon'] ?? ''),
            'uwagi' => sanitize_textarea_field($data['uwagi'] ?? ''),
            'status' => sanitize_text_field($data['status'] ?? ''),
        );
    }
    
    /**
     * Formatuj wyniki z bazy danych
     */
    private static function format_results($results) {
        if (!$results) {
            return array();
        }
        
        return array_map(function($row) {
            return self::format_single($row);
        }, $results);
    }
    
    /**
     * Formatuj pojedynczy wynik
     */
    private static function format_single($row) {
        return array(
            'id' => (int) $row['id'],
            'imieNazwisko' => $row['imie_nazwisko'],
            'adres' => $row['adres'],
            'telefon' => $row['telefon'],
            'uwagi' => $row['uwagi'],
            'status' => $row['status'] ?? '',
            'aktualne' => (bool) $row['aktywny'],
        );
    }
    
    // ==================== REST API ====================
    
    /**
     * REST: Pobierz wszystkich chorych
     */
    public static function rest_get_all($request) {
        $chorzy = self::get_sorted_by_status();
        return new WP_REST_Response($chorzy, 200);
    }
    
    /**
     * REST: Pobierz pojedynczego chorego
     */
    public static function rest_get($request) {
        $id = $request->get_param('id');
        $chory = self::get($id);
        
        if (!$chory) {
            return new WP_Error('not_found', __('Chory nie znaleziony', 'odwiedziny-chorych'), array('status' => 404));
        }
        
        return new WP_REST_Response($chory, 200);
    }
    
    /**
     * REST: Utwórz chorego
     */
    public static function rest_create($request) {
        $data = $request->get_json_params();
        
        // Sprawdź czy to bulk save (tablica chorych)
        if (isset($data[0])) {
            $result = self::save_all($data);
            
            if (is_wp_error($result)) {
                return $result;
            }
            
            return new WP_REST_Response(array('success' => true), 200);
        }
        
        // Pojedynczy chory
        $id = self::create($data);
        
        if (is_wp_error($id)) {
            return $id;
        }
        
        $chory = self::get($id);
        return new WP_REST_Response($chory, 201);
    }
    
    /**
     * REST: Zaktualizuj chorego
     */
    public static function rest_update($request) {
        $id = $request->get_param('id');
        $data = $request->get_json_params();
        
        $result = self::update($id, $data);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        $chory = self::get($id);
        return new WP_REST_Response($chory, 200);
    }
    
    /**
     * REST: Usuń chorego
     */
    public static function rest_delete($request) {
        $id = $request->get_param('id');
        
        $result = self::delete($id);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return new WP_REST_Response(array('deleted' => true), 200);
    }
}




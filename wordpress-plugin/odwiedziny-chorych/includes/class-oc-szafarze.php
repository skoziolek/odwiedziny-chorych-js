<?php
/**
 * Klasa do obsługi szafarzy
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Szafarze {
    
    /**
     * Nazwa tabeli
     */
    private static $table = 'szafarze';
    
    /**
     * Pobierz wszystkich szafarzy
     */
    public static function get_all($args = array()) {
        $defaults = array(
            'orderby' => 'kolejnosc',
            'order' => 'ASC',
            'aktywny' => 1,
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $where = array();
        
        if ($args['aktywny'] !== null) {
            $where['aktywny'] = $args['aktywny'];
        }
        
        $results = OC_Database::get_all(self::$table, array(
            'orderby' => $args['orderby'],
            'order' => $args['order'],
            'where' => $where,
        ));
        
        return self::format_results($results);
    }
    
    /**
     * Pobierz imiona szafarzy (do selectów)
     */
    public static function get_names() {
        $szafarze = self::get_all();
        
        return array_map(function($s) {
            $parts = explode(' ', trim($s['imieNazwisko']));
            return $parts[0]; // Zwróć tylko imię
        }, $szafarze);
    }
    
    /**
     * Pobierz pojedynczego szafarza
     */
    public static function get($id) {
        $result = OC_Database::get_one(self::$table, $id);
        
        if (!$result) {
            return null;
        }
        
        return self::format_single($result);
    }
    
    /**
     * Utwórz nowego szafarza
     */
    public static function create($data) {
        global $wpdb;
        
        $sanitized = self::sanitize_data($data);
        
        // Pobierz najwyższą kolejność
        $table_name = OC_Database::get_table_name(self::$table);
        $max_kolejnosc = $wpdb->get_var("SELECT MAX(kolejnosc) FROM $table_name");
        
        $db_data = array(
            'imie_nazwisko' => $sanitized['imieNazwisko'],
            'telefon' => $sanitized['telefon'],
            'email' => $sanitized['email'],
            'uwagi' => $sanitized['uwagi'],
            'aktywny' => 1,
            'kolejnosc' => ($max_kolejnosc ?? 0) + 1,
        );
        
        return OC_Database::insert(self::$table, $db_data);
    }
    
    /**
     * Zaktualizuj szafarza
     */
    public static function update($id, $data) {
        $sanitized = self::sanitize_data($data);
        
        $db_data = array(
            'imie_nazwisko' => $sanitized['imieNazwisko'],
            'telefon' => $sanitized['telefon'],
            'email' => $sanitized['email'],
            'uwagi' => $sanitized['uwagi'],
        );
        
        return OC_Database::update(self::$table, $db_data, array('id' => $id));
    }
    
    /**
     * Usuń szafarza (soft delete)
     */
    public static function delete($id) {
        return OC_Database::update(self::$table, array('aktywny' => 0), array('id' => $id));
    }
    
    /**
     * Zapisz wszystkich szafarzy (bulk save)
     */
    public static function save_all($szafarze) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        // Rozpocznij transakcję
        $wpdb->query('START TRANSACTION');
        
        try {
            // Oznacz wszystkich jako nieaktywnych
            $wpdb->query("UPDATE $table_name SET aktywny = 0");
            
            $kolejnosc = 1;
            
            foreach ($szafarze as $szafarz) {
                if (empty($szafarz['imieNazwisko'])) {
                    continue;
                }
                
                $sanitized = self::sanitize_data($szafarz);
                
                // Sprawdź czy istnieje po nazwisku
                $existing = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT id FROM $table_name WHERE imie_nazwisko = %s",
                        $sanitized['imieNazwisko']
                    )
                );
                
                $db_data = array(
                    'imie_nazwisko' => $sanitized['imieNazwisko'],
                    'telefon' => $sanitized['telefon'],
                    'email' => $sanitized['email'],
                    'uwagi' => $sanitized['uwagi'],
                    'aktywny' => 1,
                    'kolejnosc' => $kolejnosc++,
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
     * Zmień kolejność szafarzy
     */
    public static function reorder($order) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        foreach ($order as $position => $id) {
            $wpdb->update(
                $table_name,
                array('kolejnosc' => $position + 1),
                array('id' => $id)
            );
        }
        
        return true;
    }
    
    /**
     * Sanityzuj dane wejściowe
     */
    private static function sanitize_data($data) {
        return array(
            'imieNazwisko' => sanitize_text_field($data['imieNazwisko'] ?? ''),
            'telefon' => sanitize_text_field($data['telefon'] ?? ''),
            'email' => sanitize_email($data['email'] ?? ''),
            'uwagi' => sanitize_textarea_field($data['uwagi'] ?? ''),
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
            'telefon' => $row['telefon'],
            'email' => $row['email'],
            'uwagi' => $row['uwagi'],
            'kolejnosc' => (int) $row['kolejnosc'],
        );
    }
    
    // ==================== REST API ====================
    
    /**
     * REST: Pobierz wszystkich szafarzy
     */
    public static function rest_get_all($request) {
        $szafarze = self::get_all();
        return new WP_REST_Response($szafarze, 200);
    }
    
    /**
     * REST: Pobierz pojedynczego szafarza
     */
    public static function rest_get($request) {
        $id = $request->get_param('id');
        $szafarz = self::get($id);
        
        if (!$szafarz) {
            return new WP_Error('not_found', __('Szafarz nie znaleziony', 'odwiedziny-chorych'), array('status' => 404));
        }
        
        return new WP_REST_Response($szafarz, 200);
    }
    
    /**
     * REST: Utwórz szafarza
     */
    public static function rest_create($request) {
        $data = $request->get_json_params();
        
        // Sprawdź czy to bulk save (tablica szafarzy)
        if (isset($data[0])) {
            $result = self::save_all($data);
            
            if (is_wp_error($result)) {
                return $result;
            }
            
            return new WP_REST_Response(array('success' => true), 200);
        }
        
        // Pojedynczy szafarz
        $id = self::create($data);
        
        if (is_wp_error($id)) {
            return $id;
        }
        
        $szafarz = self::get($id);
        return new WP_REST_Response($szafarz, 201);
    }
    
    /**
     * REST: Zaktualizuj szafarza
     */
    public static function rest_update($request) {
        $id = $request->get_param('id');
        $data = $request->get_json_params();
        
        $result = self::update($id, $data);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        $szafarz = self::get($id);
        return new WP_REST_Response($szafarz, 200);
    }
    
    /**
     * REST: Usuń szafarza
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




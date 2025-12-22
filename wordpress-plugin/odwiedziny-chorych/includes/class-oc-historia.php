<?php
/**
 * Klasa do obsługi historii odwiedzin
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Historia {
    
    /**
     * Nazwa tabeli
     */
    private static $table = 'historia';
    
    /**
     * Pobierz całą historię
     */
    public static function get_all($args = array()) {
        $defaults = array(
            'orderby' => 'data',
            'order' => 'DESC',
            'limit' => -1,
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $results = OC_Database::get_all(self::$table, $args);
        
        return self::format_results($results);
    }
    
    /**
     * Pobierz historię dla daty
     */
    public static function get_for_date($date) {
        $result = OC_Database::get_by(self::$table, 'data', $date);
        
        if (!$result) {
            return null;
        }
        
        return self::format_single($result);
    }
    
    /**
     * Pobierz historię dla miesiąca
     */
    public static function get_for_month($year, $month) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        $start_date = sprintf('%04d-%02d-01', $year, $month);
        $end_date = date('Y-m-t', strtotime($start_date));
        
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE data >= %s AND data <= %s ORDER BY data ASC",
                $start_date,
                $end_date
            ),
            ARRAY_A
        );
        
        return self::format_results($results);
    }
    
    /**
     * Zapisz odwiedziny
     */
    public static function save($data) {
        global $wpdb;
        
        $date = sanitize_text_field($data['data'] ?? '');
        
        if (empty($date)) {
            return new WP_Error('missing_date', __('Brak daty', 'odwiedziny-chorych'));
        }
        
        $chorzy = $data['chorzy'] ?? array();
        $chorzy_ids = array_map('intval', array_filter($chorzy, 'is_numeric'));
        $chorzy_nazwy = array_filter($chorzy, function($c) { return !is_numeric($c); });
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        // Sprawdź czy wpis istnieje
        $existing = $wpdb->get_row(
            $wpdb->prepare("SELECT id FROM $table_name WHERE data = %s", $date)
        );
        
        $db_data = array(
            'data' => $date,
            'chorzy_ids' => json_encode($chorzy_ids),
            'chorzy_nazwy' => json_encode($chorzy_nazwy),
            'uwagi' => sanitize_textarea_field($data['uwagi'] ?? ''),
            'szafarz_glowny' => sanitize_text_field($data['szafarzGlowny'] ?? ''),
            'szafarz_pomocnik' => sanitize_text_field($data['szafarzPomocnik'] ?? ''),
        );
        
        if ($existing) {
            $result = $wpdb->update($table_name, $db_data, array('id' => $existing->id));
        } else {
            $result = $wpdb->insert($table_name, $db_data);
        }
        
        if ($result === false) {
            return new WP_Error('save_error', $wpdb->last_error);
        }
        
        return true;
    }
    
    /**
     * Pobierz chorych odwiedzonych w dacie
     */
    public static function get_visited_chorzy($date) {
        $historia = self::get_for_date($date);
        
        if (!$historia) {
            return array();
        }
        
        return $historia['chorzy'];
    }
    
    /**
     * Generuj raport miesięczny
     */
    public static function generate_monthly_report($year, $month) {
        $historia = self::get_for_month($year, $month);
        $kalendarz = OC_Kalendarz::get_for_year($year);
        
        $month_str = sprintf('%04d-%02d', $year, $month);
        
        // Filtruj kalendarz dla tego miesiąca
        $kalendarz_month = array_filter($kalendarz, function($date) use ($month_str) {
            return strpos($date, $month_str) === 0;
        }, ARRAY_FILTER_USE_KEY);
        
        // Statystyki
        $daty = array_keys($kalendarz_month);
        $odwiedzeni_chorzy = array();
        $szafarze = array();
        
        foreach ($historia as $entry) {
            foreach ($entry['chorzy'] as $chory) {
                if (!in_array($chory, $odwiedzeni_chorzy)) {
                    $odwiedzeni_chorzy[] = $chory;
                }
            }
        }
        
        foreach ($kalendarz_month as $date => $entry) {
            if (!empty($entry['osobaGlowna']) && !in_array($entry['osobaGlowna'], $szafarze)) {
                $szafarze[] = $entry['osobaGlowna'];
            }
            if (!empty($entry['pomocnik']) && !in_array($entry['pomocnik'], $szafarze)) {
                $szafarze[] = $entry['pomocnik'];
            }
        }
        
        return array(
            'miesiac' => $month_str,
            'kalendarz' => $kalendarz_month,
            'historia' => $historia,
            'statystyki' => array(
                'daty' => $daty,
                'lacznaLiczbaOdwiedzin' => count($historia),
                'odwiedzeniChorzy' => count($odwiedzeni_chorzy),
                'szafarze' => $szafarze,
            ),
        );
    }
    
    /**
     * Resetuj statusy odwiedzin
     */
    public static function reset_visits($year = null) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        if ($year) {
            return $wpdb->query(
                $wpdb->prepare(
                    "DELETE FROM $table_name WHERE YEAR(data) = %d",
                    $year
                )
            );
        }
        
        return $wpdb->query("TRUNCATE TABLE $table_name");
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
        $chorzy_ids = json_decode($row['chorzy_ids'], true) ?? array();
        $chorzy_nazwy = json_decode($row['chorzy_nazwy'], true) ?? array();
        
        // Połącz nazwy z historii
        $chorzy = $chorzy_nazwy;
        
        return array(
            'id' => (int) $row['id'],
            'data' => $row['data'],
            'chorzy' => $chorzy,
            'uwagi' => $row['uwagi'],
            'szafarzGlowny' => $row['szafarz_glowny'],
            'szafarzPomocnik' => $row['szafarz_pomocnik'],
        );
    }
    
    // ==================== REST API ====================
    
    /**
     * REST: Pobierz historię
     */
    public static function rest_get_all($request) {
        $historia = self::get_all();
        return new WP_REST_Response($historia, 200);
    }
    
    /**
     * REST: Zapisz odwiedziny
     */
    public static function rest_create($request) {
        $params = $request->get_json_params();
        
        $action = $params['action'] ?? 'dodaj_odwiedziny';
        
        switch ($action) {
            case 'dodaj_odwiedziny':
                $data = $params['data'] ?? $params;
                $result = self::save($data);
                break;
                
            case 'pobierz_raport_miesieczny':
                $miesiac = $params['data']['miesiac'] ?? '';
                if (empty($miesiac)) {
                    return new WP_Error('missing_month', __('Brak miesiąca', 'odwiedziny-chorych'));
                }
                
                list($year, $month) = explode('-', $miesiac);
                $raport = self::generate_monthly_report((int) $year, (int) $month);
                
                return new WP_REST_Response(array('data' => $raport), 200);
                
            case 'resetuj_statusy_odwiedzin':
                $year = $params['rok'] ?? null;
                $result = self::reset_visits($year);
                break;
                
            default:
                return new WP_Error('invalid_action', __('Nieznana akcja', 'odwiedziny-chorych'));
        }
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    /**
     * REST: Pobierz raport miesięczny
     */
    public static function rest_get_raport($request) {
        $miesiac = $request->get_param('miesiac');
        
        if (empty($miesiac)) {
            return new WP_Error('missing_month', __('Brak miesiąca', 'odwiedziny-chorych'));
        }
        
        list($year, $month) = explode('-', $miesiac);
        $raport = self::generate_monthly_report((int) $year, (int) $month);
        
        return new WP_REST_Response($raport, 200);
    }
}




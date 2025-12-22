<?php
/**
 * Klasa do obsługi kalendarza
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Kalendarz {
    
    /**
     * Nazwa tabeli
     */
    private static $table = 'kalendarz';
    
    /**
     * Pobierz kalendarz dla roku
     */
    public static function get_for_year($year) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE rok = %d ORDER BY data ASC",
                $year
            ),
            ARRAY_A
        );
        
        // Konwertuj do formatu klucz => wartość (data => dane)
        $kalendarz = array();
        
        foreach ($results as $row) {
            $kalendarz[$row['data']] = array(
                'osobaGlowna' => $row['osoba_glowna'],
                'pomocnik' => $row['pomocnik'],
                'uwagi' => $row['uwagi'],
                'nazwaSwieta' => $row['nazwa_swieta'],
                'jestSwietem' => (bool) $row['jest_swietem'],
            );
        }
        
        return $kalendarz;
    }
    
    /**
     * Pobierz wpis dla konkretnej daty
     */
    public static function get_for_date($date) {
        $result = OC_Database::get_by(self::$table, 'data', $date);
        
        if (!$result) {
            return null;
        }
        
        return array(
            'data' => $result['data'],
            'osobaGlowna' => $result['osoba_glowna'],
            'pomocnik' => $result['pomocnik'],
            'uwagi' => $result['uwagi'],
            'nazwaSwieta' => $result['nazwa_swieta'],
            'jestSwietem' => (bool) $result['jest_swietem'],
        );
    }
    
    /**
     * Zapisz kalendarz
     */
    public static function save($data, $year) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        // Rozpocznij transakcję
        $wpdb->query('START TRANSACTION');
        
        try {
            foreach ($data as $date => $entry) {
                if (empty($date)) {
                    continue;
                }
                
                // Sprawdź czy wpis istnieje
                $existing = $wpdb->get_row(
                    $wpdb->prepare("SELECT id FROM $table_name WHERE data = %s", $date)
                );
                
                $db_data = array(
                    'data' => $date,
                    'rok' => $year,
                    'osoba_glowna' => sanitize_text_field($entry['osobaGlowna'] ?? ''),
                    'pomocnik' => sanitize_text_field($entry['pomocnik'] ?? ''),
                    'uwagi' => sanitize_textarea_field($entry['uwagi'] ?? ''),
                    'nazwa_swieta' => sanitize_text_field($entry['nazwaSwieta'] ?? ''),
                    'jest_swietem' => isset($entry['jestSwietem']) ? (int) $entry['jestSwietem'] : 0,
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
     * Zaktualizuj wpis
     */
    public static function update_entry($date, $data) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        $db_data = array(
            'osoba_glowna' => sanitize_text_field($data['osobaGlowna'] ?? ''),
            'pomocnik' => sanitize_text_field($data['pomocnik'] ?? ''),
            'uwagi' => sanitize_textarea_field($data['uwagi'] ?? ''),
        );
        
        // Sprawdź czy wpis istnieje
        $existing = $wpdb->get_row(
            $wpdb->prepare("SELECT id FROM $table_name WHERE data = %s", $date)
        );
        
        if ($existing) {
            return $wpdb->update($table_name, $db_data, array('id' => $existing->id));
        } else {
            // Utwórz nowy wpis
            $year = date('Y', strtotime($date));
            $db_data['data'] = $date;
            $db_data['rok'] = $year;
            return $wpdb->insert($table_name, $db_data);
        }
    }
    
    /**
     * Auto-przypisz szafarzy
     */
    public static function auto_assign($year, $szafarze_names = null) {
        global $wpdb;
        
        // Pobierz szafarzy jeśli nie podano
        if ($szafarze_names === null) {
            $szafarze_names = OC_Szafarze::get_names();
        }
        
        if (empty($szafarze_names)) {
            return new WP_Error('no_szafarze', __('Brak szafarzy do przypisania', 'odwiedziny-chorych'));
        }
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        // Pobierz wszystkie daty dla roku
        $start_date = "$year-01-01";
        $end_date = "$year-12-31";
        
        // Generuj niedziele i święta
        $dates = self::generate_duty_dates($year);
        
        $szafarz_index = 0;
        $total_szafarze = count($szafarze_names);
        
        // Spróbuj kontynuować z poprzedniego roku
        $prev_year = $year - 1;
        $prev_kalendarz = self::get_for_year($prev_year);
        
        if (!empty($prev_kalendarz)) {
            $last_entry = end($prev_kalendarz);
            if (!empty($last_entry['osobaGlowna'])) {
                $last_index = array_search($last_entry['osobaGlowna'], $szafarze_names);
                if ($last_index !== false) {
                    $szafarz_index = ($last_index + 1) % $total_szafarze;
                }
            }
        }
        
        $wpdb->query('START TRANSACTION');
        
        try {
            foreach ($dates as $date_info) {
                $date = $date_info['date'];
                $szafarz = $szafarze_names[$szafarz_index % $total_szafarze];
                
                // Sprawdź czy wpis istnieje
                $existing = $wpdb->get_row(
                    $wpdb->prepare("SELECT id FROM $table_name WHERE data = %s", $date)
                );
                
                $db_data = array(
                    'osoba_glowna' => $szafarz,
                    'pomocnik' => '',
                    'nazwa_swieta' => $date_info['name'] ?? '',
                    'jest_swietem' => $date_info['is_holiday'] ? 1 : 0,
                );
                
                if ($existing) {
                    $wpdb->update($table_name, $db_data, array('id' => $existing->id));
                } else {
                    $db_data['data'] = $date;
                    $db_data['rok'] = $year;
                    $wpdb->insert($table_name, $db_data);
                }
                
                $szafarz_index++;
            }
            
            $wpdb->query('COMMIT');
            return true;
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('auto_assign_error', $e->getMessage());
        }
    }
    
    /**
     * Generuj daty dyżurów (niedziele i święta) dla roku
     */
    public static function generate_duty_dates($year) {
        $dates = array();
        
        $start = new DateTime("$year-01-01");
        $end = new DateTime("$year-12-31");
        
        $current = clone $start;
        
        while ($current <= $end) {
            $date_str = $current->format('Y-m-d');
            $day_of_week = $current->format('w'); // 0 = niedziela
            
            // Niedziela
            if ($day_of_week == 0) {
                $holiday_name = OC_Swieta::get_name($date_str);
                $dates[] = array(
                    'date' => $date_str,
                    'name' => $holiday_name ?: 'Niedziela',
                    'is_holiday' => false,
                );
            }
            // Święto nakazane (nie niedziela)
            elseif (OC_Swieta::is_swieto_nakazane($date_str)) {
                $dates[] = array(
                    'date' => $date_str,
                    'name' => OC_Swieta::get_name($date_str),
                    'is_holiday' => true,
                );
            }
            
            $current->modify('+1 day');
        }
        
        return $dates;
    }
    
    /**
     * Resetuj przypisania
     */
    public static function reset_assignments($year) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        return $wpdb->query(
            $wpdb->prepare(
                "UPDATE $table_name SET osoba_glowna = '', pomocnik = '' WHERE rok = %d",
                $year
            )
        );
    }
    
    /**
     * Wyczyść kalendarz dla roku
     */
    public static function clear_year($year) {
        global $wpdb;
        
        $table_name = OC_Database::get_table_name(self::$table);
        
        return $wpdb->query(
            $wpdb->prepare("DELETE FROM $table_name WHERE rok = %d", $year)
        );
    }
    
    // ==================== REST API ====================
    
    /**
     * REST: Pobierz kalendarz
     */
    public static function rest_get_all($request) {
        $year = $request->get_param('rok') ?? date('Y');
        
        $kalendarz = self::get_for_year($year);
        
        return new WP_REST_Response($kalendarz, 200);
    }
    
    /**
     * REST: Zapisz kalendarz
     */
    public static function rest_save($request) {
        $params = $request->get_json_params();
        $year = $request->get_param('rok') ?? date('Y');
        
        $action = $params['action'] ?? 'zapisz_kalendarz';
        
        switch ($action) {
            case 'zapisz_kalendarz':
                $data = $params['dane'] ?? array();
                $result = self::save($data, $year);
                break;
                
            case 'auto_assign':
                $result = self::auto_assign($year);
                break;
                
            case 'reset_assignments':
                $result = self::reset_assignments($year);
                break;
                
            case 'clear_year':
                $result = self::clear_year($year);
                break;
                
            default:
                return new WP_Error('invalid_action', __('Nieznana akcja', 'odwiedziny-chorych'));
        }
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
}




<?php
/**
 * REST API dla raportów
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_API_Raporty {
    
    private $namespace = 'odwiedziny-chorych/v1';
    private $rest_base = 'raporty';
    
    /**
     * Zarejestruj routes
     */
    public function register_routes() {
        // GET /raporty/miesieczny
        register_rest_route($this->namespace, '/' . $this->rest_base . '/miesieczny', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_monthly_report'),
            'permission_callback' => array($this, 'check_permission'),
            'args' => array(
                'miesiac' => array(
                    'required' => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));
        
        // GET /raporty/roczny
        register_rest_route($this->namespace, '/' . $this->rest_base . '/roczny', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_yearly_report'),
            'permission_callback' => array($this, 'check_permission'),
            'args' => array(
                'rok' => array(
                    'required' => false,
                    'default' => date('Y'),
                    'sanitize_callback' => 'absint',
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
     * Raport miesięczny
     */
    public function get_monthly_report($request) {
        global $wpdb;
        $table_historia = OC_Database::get_table_name('historia');
        $table_chorzy = OC_Database::get_table_name('chorzy');
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
        $miesiac = $request->get_param('miesiac'); // Format: YYYY-MM
        
        // Pobierz dane z historii dla miesiąca
        $historia = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_historia WHERE data LIKE %s ORDER BY data ASC",
            $miesiac . '%'
        ), ARRAY_A);
        
        // Policz odwiedziny w miesiącu
        $liczba_odwiedzin = count($historia);
        
        // Policz unikalnych chorych w miesiącu
        $chorzy_w_miesiacu = array();
        foreach ($historia as $row) {
            if (!empty($row['chorzy_ids'])) {
                $ids = explode(',', $row['chorzy_ids']);
                foreach ($ids as $id) {
                    $chorzy_w_miesiacu[$id] = true;
                }
            }
        }
        $odwiedzeni_chorzy_w_miesiacu = count($chorzy_w_miesiacu);
        
        // Policz chorych od początku roku
        $rok = substr($miesiac, 0, 4);
        $historia_rok = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_historia WHERE data >= %s AND data <= %s",
            $rok . '-01-01',
            $miesiac . '-31'
        ), ARRAY_A);
        
        $chorzy_od_poczatku = array();
        foreach ($historia_rok as $row) {
            if (!empty($row['chorzy_ids'])) {
                $ids = explode(',', $row['chorzy_ids']);
                foreach ($ids as $id) {
                    $chorzy_od_poczatku[$id] = true;
                }
            }
        }
        $lacznie_chorych_od_poczatku = count($chorzy_od_poczatku);
        
        // Pobierz szafarzy z kalendarza
        $szafarze_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT osoba_glowna_id FROM $table_kalendarz WHERE data LIKE %s AND osoba_glowna_id IS NOT NULL",
            $miesiac . '%'
        ));
        
        $szafarze_names = array();
        foreach ($szafarze_ids as $id) {
            $szafarz = $wpdb->get_row($wpdb->prepare(
                "SELECT imie FROM $table_szafarze WHERE id = %d",
                $id
            ));
            if ($szafarz) {
                $szafarze_names[] = $szafarz->imie;
            }
        }
        
        // Dane kalendarza
        $kalendarz_entries = $wpdb->get_results($wpdb->prepare(
            "SELECT k.data, s.imie as osoba_glowna
             FROM $table_kalendarz k
             LEFT JOIN $table_szafarze s ON k.osoba_glowna_id = s.id
             WHERE k.data LIKE %s
             ORDER BY k.data ASC",
            $miesiac . '%'
        ), ARRAY_A);
        
        $kalendarz = array();
        foreach ($kalendarz_entries as $entry) {
            $kalendarz[$entry['data']] = array(
                'osobaGlowna' => $entry['osoba_glowna'] ?? '',
            );
        }
        
        return rest_ensure_response(array(
            'statystyki' => array(
                'lacznaLiczbaOdwiedzinWMiesiacu' => $liczba_odwiedzin,
                'odwiedzeniChorzyWMiesiacu' => $odwiedzeni_chorzy_w_miesiacu,
                'lacznaLiczbaChorychOdPoczatkuRoku' => $lacznie_chorych_od_poczatku,
                'szafarze' => $szafarze_names,
            ),
            'kalendarz' => $kalendarz,
        ));
    }
    
    /**
     * Raport roczny
     */
    public function get_yearly_report($request) {
        global $wpdb;
        $table_historia = OC_Database::get_table_name('historia');
        
        $rok = $request->get_param('rok');
        
        $historia = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_historia WHERE YEAR(data) = %d ORDER BY data ASC",
            $rok
        ), ARRAY_A);
        
        $chorzy_rok = array();
        foreach ($historia as $row) {
            if (!empty($row['chorzy_ids'])) {
                $ids = explode(',', $row['chorzy_ids']);
                foreach ($ids as $id) {
                    $chorzy_rok[$id] = true;
                }
            }
        }
        
        return rest_ensure_response(array(
            'rok' => $rok,
            'liczbaOdwiedzin' => count($historia),
            'liczbaChorych' => count($chorzy_rok),
        ));
    }
}



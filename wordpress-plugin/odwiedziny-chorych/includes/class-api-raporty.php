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

    /** Typy historii oznaczające zapisany raport odwiedzin (nie listę planu). */
    private const VISIT_TYPES = array('niedziela', 'adwent');
    
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
        return OC_Auth::rest_permission($request);
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
     * @param string $miesiac YYYY-MM
     * @return array{0:int,1:int,2:string}|null
     */
    private function parse_month_param($miesiac) {
        if (!is_string($miesiac) || !preg_match('/^\d{4}-\d{2}$/', $miesiac)) {
            return null;
        }
        $year = (int) substr($miesiac, 0, 4);
        $month = (int) substr($miesiac, 5, 2);
        if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
            return null;
        }
        return array($year, $month, $miesiac);
    }

    /**
     * @param string $csv
     * @return int[]
     */
    private function parse_id_list($csv) {
        $ids = array();
        foreach (explode(',', (string) $csv) as $part) {
            $id = absint(trim($part));
            if ($id > 0) {
                $ids[$id] = true;
            }
        }
        return array_keys($ids);
    }

    /**
     * @return array<int,string>
     */
    private function get_chorzy_name_map() {
        global $wpdb;
        $table_chorzy = OC_Database::get_table_name('chorzy');
        $rows = $wpdb->get_results("SELECT id, imie_nazwisko FROM $table_chorzy", ARRAY_A);
        $map = array();
        foreach ((array) $rows as $row) {
            $map[(int) $row['id']] = $row['imie_nazwisko'];
        }
        return $map;
    }

    /**
     * Liczba wizyt u chorych: każda osoba w każdym zapisanym raporcie osobno.
     * Ta sama osoba odwiedzona w 4 niedziele liczy się jako 4, nie jako 1.
     *
     * @param array<int,array<string,mixed>> $historia
     * @return int
     */
    private function count_chory_visits($historia) {
        $count = 0;
        foreach ((array) $historia as $row) {
            $count += count($this->parse_id_list($row['chorzy_ids'] ?? ''));
        }
        return $count;
    }

    /**
     * @param int    $year
     * @param string $from Y-m-d
     * @param string $to   Y-m-d
     * @return array<int,array<string,mixed>>
     */
    private function get_visit_historia_between($from, $to) {
        global $wpdb;
        $table_historia = OC_Database::get_table_name('historia');
        $types = self::VISIT_TYPES;
        $placeholders = implode(',', array_fill(0, count($types), '%s'));
        $params = array_merge($types, array($from, $to));
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- placeholdery typów z stałej.
        return (array) $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_historia
                 WHERE typ IN ($placeholders)
                   AND data >= %s AND data <= %s
                 ORDER BY data ASC",
                ...$params
            ),
            ARRAY_A
        );
    }
    
    /**
     * Raport miesięczny
     */
    public function get_monthly_report($request) {
        global $wpdb;
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');

        $parsed = $this->parse_month_param((string) $request->get_param('miesiac'));
        if (!$parsed) {
            return new WP_Error('invalid_month', 'Nieprawidłowy miesiąc (oczekiwany format RRRR-MM)', array('status' => 400));
        }
        list($year, $month, $miesiac) = $parsed;
        unset($month);

        $month_start = $miesiac . '-01';
        $month_end = $wpdb->get_var($wpdb->prepare('SELECT LAST_DAY(%s)', $month_start));
        if (!$month_end) {
            return new WP_Error('invalid_month', 'Nie udało się wyznaczyć zakresu dat', array('status' => 400));
        }
        $year_start = sprintf('%04d-01-01', $year);

        $historia_miesiac = $this->get_visit_historia_between($month_start, $month_end);
        $historia_rok = $this->get_visit_historia_between($year_start, $month_end);

        $chorzy_map = $this->get_chorzy_name_map();
        $odwiedzeni_miesiac = $this->count_chory_visits($historia_miesiac);
        $odwiedzeni_rok = $this->count_chory_visits($historia_rok);

        $szafarze_names = (array) $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT s.imie
             FROM (
                SELECT osoba_glowna_id AS sid
                FROM $table_kalendarz
                WHERE data >= %s AND data <= %s AND osoba_glowna_id IS NOT NULL
                UNION
                SELECT pomocnik_id AS sid
                FROM $table_kalendarz
                WHERE data >= %s AND data <= %s AND pomocnik_id IS NOT NULL
             ) ids
             INNER JOIN $table_szafarze s ON s.id = ids.sid
             WHERE s.imie IS NOT NULL AND s.imie <> ''
             ORDER BY s.imie ASC",
            $month_start,
            $month_end,
            $month_start,
            $month_end
        ));

        $kalendarz_entries = (array) $wpdb->get_results($wpdb->prepare(
            "SELECT k.data,
                    og.imie AS osoba_glowna,
                    p.imie AS pomocnik,
                    k.uwagi
             FROM $table_kalendarz k
             LEFT JOIN $table_szafarze og ON k.osoba_glowna_id = og.id
             LEFT JOIN $table_szafarze p ON k.pomocnik_id = p.id
             WHERE k.data >= %s AND k.data <= %s
             ORDER BY k.data ASC",
            $month_start,
            $month_end
        ), ARRAY_A);

        $kalendarz = array();
        foreach ($kalendarz_entries as $entry) {
            $kalendarz[$entry['data']] = array(
                'osobaGlowna' => $entry['osoba_glowna'] ?? '',
                'pomocnik' => $entry['pomocnik'] ?? '',
                'uwagi' => $entry['uwagi'] ?? '',
            );
        }

        $historia = array();
        foreach ($historia_miesiac as $row) {
            $names = array();
            foreach ($this->parse_id_list($row['chorzy_ids'] ?? '') as $id) {
                if (!empty($chorzy_map[$id])) {
                    $names[] = $chorzy_map[$id];
                }
            }
            $historia[] = array(
                'data' => $row['data'],
                'typ' => $row['typ'],
                'chorzy' => $names,
                'uwagi' => $row['uwagi'] ?? '',
            );
        }
        
        return rest_ensure_response(array(
            'statystyki' => array(
                'lacznaLiczbaOdwiedzinWMiesiacu' => count($historia_miesiac),
                'odwiedzeniChorzyWMiesiacu' => $odwiedzeni_miesiac,
                'lacznaLiczbaChorychOdPoczatkuRoku' => $odwiedzeni_rok,
                'szafarze' => array_values($szafarze_names),
            ),
            'kalendarz' => $kalendarz,
            'historia' => $historia,
        ));
    }
    
    /**
     * @param string $from Y-m-d
     * @param string $to   Y-m-d
     * @return string[]
     */
    private function get_szafarze_names_between($from, $to) {
        global $wpdb;
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');

        return (array) $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT s.imie
             FROM (
                SELECT osoba_glowna_id AS sid
                FROM $table_kalendarz
                WHERE data >= %s AND data <= %s AND osoba_glowna_id IS NOT NULL
                UNION
                SELECT pomocnik_id AS sid
                FROM $table_kalendarz
                WHERE data >= %s AND data <= %s AND pomocnik_id IS NOT NULL
             ) ids
             INNER JOIN $table_szafarze s ON s.id = ids.sid
             WHERE s.imie IS NOT NULL AND s.imie <> ''
             ORDER BY s.imie ASC",
            $from,
            $to,
            $from,
            $to
        ));
    }

    /**
     * @param string $from Y-m-d
     * @param string $to   Y-m-d
     * @return array<string,array<string,string>>
     */
    private function get_kalendarz_map_between($from, $to) {
        global $wpdb;
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');

        $entries = (array) $wpdb->get_results($wpdb->prepare(
            "SELECT k.data,
                    og.imie AS osoba_glowna,
                    p.imie AS pomocnik,
                    k.uwagi
             FROM $table_kalendarz k
             LEFT JOIN $table_szafarze og ON k.osoba_glowna_id = og.id
             LEFT JOIN $table_szafarze p ON k.pomocnik_id = p.id
             WHERE k.data >= %s AND k.data <= %s
             ORDER BY k.data ASC",
            $from,
            $to
        ), ARRAY_A);

        $kalendarz = array();
        foreach ($entries as $entry) {
            $kalendarz[$entry['data']] = array(
                'osobaGlowna' => $entry['osoba_glowna'] ?? '',
                'pomocnik' => $entry['pomocnik'] ?? '',
                'uwagi' => $entry['uwagi'] ?? '',
            );
        }
        return $kalendarz;
    }

    /**
     * @param array<int,array<string,mixed>> $historia
     * @param array<int,string>              $chorzy_map
     * @return array<int,array<string,mixed>>
     */
    private function format_historia_rows($historia, $chorzy_map) {
        $out = array();
        foreach ((array) $historia as $row) {
            $names = array();
            foreach ($this->parse_id_list($row['chorzy_ids'] ?? '') as $id) {
                if (!empty($chorzy_map[$id])) {
                    $names[] = $chorzy_map[$id];
                }
            }
            $out[] = array(
                'data' => $row['data'],
                'typ' => $row['typ'],
                'chorzy' => $names,
                'uwagi' => $row['uwagi'] ?? '',
            );
        }
        return $out;
    }

    /**
     * Raport roczny
     */
    public function get_yearly_report($request) {
        $rok = absint($request->get_param('rok'));
        if ($rok < 2000 || $rok > 2100) {
            $rok = (int) date('Y');
        }

        $from = sprintf('%04d-01-01', $rok);
        $to = sprintf('%04d-12-31', $rok);
        $historia_rok = $this->get_visit_historia_between($from, $to);
        $chorzy_map = $this->get_chorzy_name_map();
        $odwiedzeni_rok = $this->count_chory_visits($historia_rok);

        $miesiace = array();
        for ($month = 1; $month <= 12; $month++) {
            $prefix = sprintf('%04d-%02d', $rok, $month);
            $odwiedziny_miesiac = 0;
            $chorzy_miesiac = 0;
            foreach ($historia_rok as $row) {
                if (strpos((string) ($row['data'] ?? ''), $prefix) !== 0) {
                    continue;
                }
                $odwiedziny_miesiac++;
                $chorzy_miesiac += count($this->parse_id_list($row['chorzy_ids'] ?? ''));
            }
            $miesiace[] = array(
                'miesiac' => $prefix,
                'liczbaOdwiedzin' => $odwiedziny_miesiac,
                'odwiedzeniChorzy' => $chorzy_miesiac,
            );
        }

        return rest_ensure_response(array(
            'rok' => $rok,
            'statystyki' => array(
                'lacznaLiczbaOdwiedzinWRoku' => count($historia_rok),
                'odwiedzeniChorzyWRoku' => $odwiedzeni_rok,
                'szafarze' => array_values($this->get_szafarze_names_between($from, $to)),
            ),
            'miesiace' => $miesiace,
            'kalendarz' => $this->get_kalendarz_map_between($from, $to),
            'historia' => $this->format_historia_rows($historia_rok, $chorzy_map),
        ));
    }
}

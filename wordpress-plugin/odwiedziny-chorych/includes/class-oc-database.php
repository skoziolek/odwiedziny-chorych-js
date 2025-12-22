<?php
/**
 * Klasa do obsługi bazy danych
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Database {
    
    /**
     * Prefiks tabel
     */
    private static $prefix = 'oc_';
    
    /**
     * Pobierz pełną nazwę tabeli
     */
    public static function get_table_name($table) {
        global $wpdb;
        return $wpdb->prefix . self::$prefix . $table;
    }
    
    /**
     * Utwórz tabele w bazie danych
     */
    public static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Tabela chorych
        $table_chorzy = self::get_table_name('chorzy');
        $sql_chorzy = "CREATE TABLE $table_chorzy (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            imie_nazwisko varchar(255) NOT NULL,
            adres text,
            telefon varchar(50),
            uwagi text,
            status varchar(10) DEFAULT '',
            aktywny tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_status (status),
            KEY idx_aktywny (aktywny)
        ) $charset_collate;";
        
        // Tabela szafarzy
        $table_szafarze = self::get_table_name('szafarze');
        $sql_szafarze = "CREATE TABLE $table_szafarze (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            imie_nazwisko varchar(255) NOT NULL,
            telefon varchar(50),
            email varchar(255),
            uwagi text,
            aktywny tinyint(1) DEFAULT 1,
            kolejnosc int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_aktywny (aktywny),
            KEY idx_kolejnosc (kolejnosc)
        ) $charset_collate;";
        
        // Tabela kalendarza
        $table_kalendarz = self::get_table_name('kalendarz');
        $sql_kalendarz = "CREATE TABLE $table_kalendarz (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            data date NOT NULL,
            rok year NOT NULL,
            osoba_glowna varchar(255),
            pomocnik varchar(255),
            uwagi text,
            nazwa_swieta varchar(255),
            jest_swietem tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY idx_data (data),
            KEY idx_rok (rok),
            KEY idx_osoba_glowna (osoba_glowna)
        ) $charset_collate;";
        
        // Tabela historii odwiedzin
        $table_historia = self::get_table_name('historia');
        $sql_historia = "CREATE TABLE $table_historia (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            data date NOT NULL,
            chorzy_ids text,
            chorzy_nazwy text,
            uwagi text,
            szafarz_glowny varchar(255),
            szafarz_pomocnik varchar(255),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_data (data)
        ) $charset_collate;";
        
        // Tabela ustawień
        $table_settings = self::get_table_name('settings');
        $sql_settings = "CREATE TABLE $table_settings (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            option_name varchar(191) NOT NULL,
            option_value longtext,
            autoload varchar(20) DEFAULT 'yes',
            PRIMARY KEY (id),
            UNIQUE KEY idx_option_name (option_name)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        dbDelta($sql_chorzy);
        dbDelta($sql_szafarze);
        dbDelta($sql_kalendarz);
        dbDelta($sql_historia);
        dbDelta($sql_settings);
    }
    
    /**
     * Usuń tabele z bazy danych (używane przy odinstalowaniu)
     */
    public static function drop_tables() {
        global $wpdb;
        
        $tables = array('chorzy', 'szafarze', 'kalendarz', 'historia', 'settings');
        
        foreach ($tables as $table) {
            $table_name = self::get_table_name($table);
            $wpdb->query("DROP TABLE IF EXISTS $table_name");
        }
    }
    
    /**
     * Pobierz wszystkie rekordy z tabeli
     */
    public static function get_all($table, $args = array()) {
        global $wpdb;
        
        $table_name = self::get_table_name($table);
        
        $defaults = array(
            'orderby' => 'id',
            'order' => 'ASC',
            'limit' => -1,
            'offset' => 0,
            'where' => array(),
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $sql = "SELECT * FROM $table_name";
        
        // WHERE
        if (!empty($args['where'])) {
            $where_clauses = array();
            foreach ($args['where'] as $key => $value) {
                $where_clauses[] = $wpdb->prepare("$key = %s", $value);
            }
            $sql .= " WHERE " . implode(' AND ', $where_clauses);
        }
        
        // ORDER BY
        $sql .= $wpdb->prepare(" ORDER BY {$args['orderby']} {$args['order']}");
        
        // LIMIT
        if ($args['limit'] > 0) {
            $sql .= $wpdb->prepare(" LIMIT %d OFFSET %d", $args['limit'], $args['offset']);
        }
        
        return $wpdb->get_results($sql, ARRAY_A);
    }
    
    /**
     * Pobierz pojedynczy rekord
     */
    public static function get_one($table, $id) {
        global $wpdb;
        
        $table_name = self::get_table_name($table);
        
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id),
            ARRAY_A
        );
    }
    
    /**
     * Wstaw nowy rekord
     */
    public static function insert($table, $data) {
        global $wpdb;
        
        $table_name = self::get_table_name($table);
        
        $result = $wpdb->insert($table_name, $data);
        
        if ($result === false) {
            return new WP_Error('db_insert_error', $wpdb->last_error);
        }
        
        return $wpdb->insert_id;
    }
    
    /**
     * Zaktualizuj rekord
     */
    public static function update($table, $data, $where) {
        global $wpdb;
        
        $table_name = self::get_table_name($table);
        
        $result = $wpdb->update($table_name, $data, $where);
        
        if ($result === false) {
            return new WP_Error('db_update_error', $wpdb->last_error);
        }
        
        return $result;
    }
    
    /**
     * Usuń rekord
     */
    public static function delete($table, $where) {
        global $wpdb;
        
        $table_name = self::get_table_name($table);
        
        $result = $wpdb->delete($table_name, $where);
        
        if ($result === false) {
            return new WP_Error('db_delete_error', $wpdb->last_error);
        }
        
        return $result;
    }
    
    /**
     * Pobierz rekord po określonym polu
     */
    public static function get_by($table, $field, $value) {
        global $wpdb;
        
        $table_name = self::get_table_name($table);
        
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE $field = %s", $value),
            ARRAY_A
        );
    }
    
    /**
     * Sprawdź czy rekord istnieje
     */
    public static function exists($table, $field, $value) {
        global $wpdb;
        
        $table_name = self::get_table_name($table);
        
        $count = $wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE $field = %s", $value)
        );
        
        return $count > 0;
    }
    
    /**
     * Wykonaj niestandardowe zapytanie
     */
    public static function query($sql) {
        global $wpdb;
        return $wpdb->query($sql);
    }
    
    /**
     * Pobierz wyniki niestandardowego zapytania
     */
    public static function get_results($sql) {
        global $wpdb;
        return $wpdb->get_results($sql, ARRAY_A);
    }
}




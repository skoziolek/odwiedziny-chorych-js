<?php
/**
 * Klasa zarządzania bazą danych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Database {
    
    /**
     * Prefiks tabel
     */
    private static $table_prefix = 'oc_';
    
    /**
     * Pobierz nazwę tabeli
     */
    public static function get_table_name($table) {
        global $wpdb;
        return $wpdb->prefix . self::$table_prefix . $table;
    }
    
    /**
     * Utwórz tabele
     */
    public static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Tabela chorych
        $table_chorzy = self::get_table_name('chorzy');
        $sql_chorzy = "CREATE TABLE $table_chorzy (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            imie_nazwisko varchar(255) NOT NULL,
            adres varchar(500) DEFAULT '',
            telefon varchar(50) DEFAULT '',
            uwagi text DEFAULT '',
            uwagi_ostatnio_szafarz_id bigint(20) unsigned DEFAULT NULL,
            uwagi_ostatnio_data datetime DEFAULT NULL,
            status enum('TAK','NIE') DEFAULT 'TAK',
            data_dodania datetime DEFAULT CURRENT_TIMESTAMP,
            data_modyfikacji datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY status (status),
            KEY imie_nazwisko (imie_nazwisko),
            KEY uwagi_ostatnio_szafarz_id (uwagi_ostatnio_szafarz_id)
        ) $charset_collate;";
        
        dbDelta($sql_chorzy);
        
        // Tabela szafarzy
        $table_szafarze = self::get_table_name('szafarze');
        $sql_szafarze = "CREATE TABLE $table_szafarze (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            imie varchar(100) NOT NULL,
            nazwisko varchar(100) DEFAULT '',
            adres varchar(500) DEFAULT '',
            email varchar(255) DEFAULT '',
            telefon varchar(50) DEFAULT '',
            haslo_hash varchar(255) DEFAULT NULL,
            kolejnosc int(11) DEFAULT 0,
            aktywny tinyint(1) DEFAULT 1,
            data_dodania datetime DEFAULT CURRENT_TIMESTAMP,
            data_modyfikacji datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY kolejnosc (kolejnosc),
            KEY aktywny (aktywny)
        ) $charset_collate;";
        
        dbDelta($sql_szafarze);
        
        // Tabela kalendarza
        $table_kalendarz = self::get_table_name('kalendarz');
        $sql_kalendarz = "CREATE TABLE $table_kalendarz (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            data date NOT NULL,
            rok year NOT NULL,
            osoba_glowna_id bigint(20) unsigned DEFAULT NULL,
            pomocnik_id bigint(20) unsigned DEFAULT NULL,
            uwagi text DEFAULT '',
            PRIMARY KEY (id),
            UNIQUE KEY data (data),
            KEY rok (rok),
            KEY osoba_glowna_id (osoba_glowna_id),
            KEY pomocnik_id (pomocnik_id)
        ) $charset_collate;";
        
        dbDelta($sql_kalendarz);
        
        // Tabela adwentu
        $table_adwent = self::get_table_name('adwent');
        $sql_adwent = "CREATE TABLE $table_adwent (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            data date NOT NULL,
            rok year NOT NULL,
            osoba_glowna_id bigint(20) unsigned DEFAULT NULL,
            pomocnik_id bigint(20) unsigned DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY data (data),
            KEY rok (rok)
        ) $charset_collate;";
        
        dbDelta($sql_adwent);
        
        // Tabela historii odwiedzin
        $table_historia = self::get_table_name('historia');
        $sql_historia = "CREATE TABLE $table_historia (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            data date NOT NULL,
            typ enum('niedziela','adwent') DEFAULT 'niedziela',
            chorzy_ids text DEFAULT '',
            uwagi text DEFAULT '',
            data_zapisu datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY data_typ (data, typ),
            KEY data (data)
        ) $charset_collate;";
        
        dbDelta($sql_historia);
        
        // Tabela sesji (dla bezpieczeństwa)
        $table_sesje = self::get_table_name('sesje');
        $sql_sesje = "CREATE TABLE $table_sesje (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            token varchar(255) NOT NULL,
            szafarz_id bigint(20) unsigned DEFAULT NULL,
            user_ip varchar(45) DEFAULT '',
            user_agent varchar(500) DEFAULT '',
            data_utworzenia datetime DEFAULT CURRENT_TIMESTAMP,
            data_wygasniecia datetime NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY token (token),
            KEY data_wygasniecia (data_wygasniecia),
            KEY szafarz_id (szafarz_id)
        ) $charset_collate;";
        
        dbDelta($sql_sesje);
        
        // Tabela prób logowania (rate limiting)
        $table_proby = self::get_table_name('proby_logowania');
        $sql_proby = "CREATE TABLE $table_proby (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            ip varchar(45) NOT NULL,
            liczba_prob int(11) DEFAULT 1,
            ostatnia_proba datetime DEFAULT CURRENT_TIMESTAMP,
            zablokowany_do datetime DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY ip (ip)
        ) $charset_collate;";
        
        dbDelta($sql_proby);
        
        // Zapisz wersję bazy danych
        update_option('oc_db_version', OC_PLUGIN_VERSION);
        update_option('oc_db_schema_version', '1.2.3');
    }

    /**
     * Uaktualnij schemat po aktualizacji pluginu (istniejące instalacje).
     */
    public static function maybe_upgrade() {
        $schema = get_option('oc_db_schema_version', '');
        if (version_compare($schema, '1.2.3', '<')) {
            self::upgrade_to_1_2_3();
            update_option('oc_db_schema_version', '1.2.3');
        }
    }

    /**
     * @param string $table
     * @param string $column
     * @param string $definition SQL fragment po nazwie kolumny
     */
    private static function add_column_if_missing($table, $column, $definition) {
        global $wpdb;
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- nazwa tabeli z get_table_name()
        $exists = $wpdb->get_results($wpdb->prepare("SHOW COLUMNS FROM `{$table}` LIKE %s", $column));
        if (!empty($exists)) {
            return;
        }
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $wpdb->query("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
    }

    private static function upgrade_to_1_2_3() {
        global $wpdb;

        $t_sz = self::get_table_name('szafarze');
        self::add_column_if_missing($t_sz, 'haslo_hash', 'varchar(255) NULL DEFAULT NULL');

        $t_ses = self::get_table_name('sesje');
        self::add_column_if_missing($t_ses, 'szafarz_id', 'bigint(20) unsigned NULL DEFAULT NULL');

        $t_ch = self::get_table_name('chorzy');
        self::add_column_if_missing($t_ch, 'uwagi_ostatnio_szafarz_id', 'bigint(20) unsigned NULL DEFAULT NULL');
        self::add_column_if_missing($t_ch, 'uwagi_ostatnio_data', 'datetime NULL DEFAULT NULL');

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $idx = $wpdb->get_results("SHOW INDEX FROM `{$t_ch}` WHERE Key_name = 'uwagi_ostatnio_szafarz_id'");
        if (empty($idx)) {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $wpdb->query("ALTER TABLE `{$t_ch}` ADD KEY uwagi_ostatnio_szafarz_id (uwagi_ostatnio_szafarz_id)");
        }
    }
    
    /**
     * Usuń tabele (przy odinstalowaniu)
     */
    public static function drop_tables() {
        global $wpdb;
        
        $tables = array(
            'chorzy',
            'szafarze',
            'kalendarz',
            'adwent',
            'historia',
            'sesje',
            'proby_logowania'
        );
        
        foreach ($tables as $table) {
            $table_name = self::get_table_name($table);
            $wpdb->query("DROP TABLE IF EXISTS $table_name");
        }
        
        delete_option('oc_db_version');
        delete_option('oc_admin_password_hash');
        delete_option('oc_encryption_key');
    }
    
    /**
     * Szyfruj dane (dla RODO)
     */
    public static function encrypt($data) {
        $key = get_option('oc_encryption_key');
        if (!$key) {
            return $data;
        }
        
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        
        return base64_encode($iv . $encrypted);
    }
    
    /**
     * Deszyfruj dane
     */
    public static function decrypt($data) {
        $key = get_option('oc_encryption_key');
        if (!$key) {
            return $data;
        }
        
        $data = base64_decode($data);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }
}



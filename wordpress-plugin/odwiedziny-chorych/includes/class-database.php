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
            adres text DEFAULT '',
            telefon varchar(500) DEFAULT '',
            uwagi text DEFAULT '',
            uwagi_ostatnio_szafarz_id bigint(20) unsigned DEFAULT NULL,
            uwagi_ostatnio_data datetime DEFAULT NULL,
            status enum('TAK','NIE') DEFAULT 'TAK',
            nastepna_wizyta date DEFAULT NULL,
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
            typ enum('niedziela','adwent','plan_niedziela') DEFAULT 'niedziela',
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
        update_option('oc_db_schema_version', OC_PLUGIN_VERSION);
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
        $schema = get_option('oc_db_schema_version', '');
        if (version_compare($schema, '1.2.8', '<')) {
            self::upgrade_to_1_2_8();
            update_option('oc_db_schema_version', '1.2.8');
        }
        $schema = get_option('oc_db_schema_version', '');
        if (version_compare($schema, '1.2.22', '<')) {
            self::upgrade_to_1_2_22();
            update_option('oc_db_schema_version', '1.2.22');
        }
        $schema = get_option('oc_db_schema_version', '');
        if (version_compare($schema, '1.2.23', '<')) {
            self::upgrade_to_1_2_23();
            update_option('oc_db_schema_version', '1.2.23');
        }
        $schema = get_option('oc_db_schema_version', '');
        if (version_compare($schema, OC_PLUGIN_VERSION, '<')) {
            update_option('oc_db_schema_version', OC_PLUGIN_VERSION);
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

    private static function upgrade_to_1_2_8() {
        $t_ch = self::get_table_name('chorzy');
        // Termin kolejnej wizyty (przypisanie chorego do daty) — nowy raport odwiedzin
        self::add_column_if_missing($t_ch, 'nastepna_wizyta', 'date NULL DEFAULT NULL');
    }

    private static function upgrade_to_1_2_22() {
        global $wpdb;
        $table = self::get_table_name('historia');
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
        if (!$exists) {
            return;
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $col = $wpdb->get_row("SHOW COLUMNS FROM `{$table}` LIKE 'typ'", ARRAY_A);
        $type = strtolower((string) ($col['Type'] ?? ''));
        if (strpos($type, 'plan_niedziela') === false) {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $wpdb->query(
                "ALTER TABLE `{$table}` MODIFY typ enum('niedziela','adwent','plan_niedziela') NOT NULL DEFAULT 'niedziela'"
            );
        }

        // Wpisy odrzucone przez stary ENUM mogły trafić jako pusty typ.
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $wpdb->query("UPDATE `{$table}` SET typ = 'plan_niedziela' WHERE typ = '' OR typ IS NULL");
    }

    private static function upgrade_to_1_2_23() {
        self::ensure_encryption_key();
        self::widen_chorzy_sensitive_columns();
        self::encrypt_existing_chorzy_fields();
    }

    private static function widen_chorzy_sensitive_columns() {
        global $wpdb;
        $table = self::get_table_name('chorzy');
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
        if (!$exists) {
            return;
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $adres = $wpdb->get_row("SHOW COLUMNS FROM `{$table}` LIKE 'adres'", ARRAY_A);
        $adres_type = strtolower((string) ($adres['Type'] ?? ''));
        if ($adres_type !== '' && strpos($adres_type, 'text') === false) {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $wpdb->query("ALTER TABLE `{$table}` MODIFY adres text");
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $telefon = $wpdb->get_row("SHOW COLUMNS FROM `{$table}` LIKE 'telefon'", ARRAY_A);
        $telefon_type = strtolower((string) ($telefon['Type'] ?? ''));
        if ($telefon_type !== '' && strpos($telefon_type, 'text') === false) {
            $width = 0;
            if (preg_match('/varchar\((\d+)\)/', $telefon_type, $match)) {
                $width = (int) $match[1];
            }
            if ($width < 500) {
                // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
                $wpdb->query("ALTER TABLE `{$table}` MODIFY telefon varchar(500) DEFAULT ''");
            }
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
    
    const SENSITIVE_PREFIX = 'ocenc1:';

    public static function ensure_encryption_key() {
        if (get_option('oc_encryption_key')) {
            return;
        }
        update_option('oc_encryption_key', wp_generate_password(32, true, true), false);
    }

    /**
     * @param mixed $data
     * @return bool
     */
    public static function is_encrypted($data) {
        return is_string($data) && strpos($data, self::SENSITIVE_PREFIX) === 0;
    }

    /**
     * Szyfruj adres lub telefon chorego w bazie.
     *
     * @param mixed $data
     * @return string
     */
    public static function encrypt($data) {
        $plain = (string) $data;
        if ($plain === '' || self::is_encrypted($plain)) {
            return $plain;
        }
        if (!function_exists('openssl_encrypt')) {
            throw new Exception('Brak OpenSSL — nie można zapisać danych chorego.');
        }

        self::ensure_encryption_key();
        $key = hash('sha256', (string) get_option('oc_encryption_key'), true);
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($plain, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        if ($encrypted === false) {
            throw new Exception('Nie udało się zaszyfrować danych chorego.');
        }

        return self::SENSITIVE_PREFIX . base64_encode($iv . $encrypted);
    }

    /**
     * @param mixed $data
     * @return string
     */
    public static function decrypt($data) {
        $value = (string) $data;
        if ($value === '' || !self::is_encrypted($value)) {
            return $value;
        }
        if (!function_exists('openssl_decrypt')) {
            return '';
        }

        self::ensure_encryption_key();
        $payload = base64_decode(substr($value, strlen(self::SENSITIVE_PREFIX)), true);
        if ($payload === false || strlen($payload) < 17) {
            return '';
        }

        $key = hash('sha256', (string) get_option('oc_encryption_key'), true);
        $iv = substr($payload, 0, 16);
        $ciphertext = substr($payload, 16);
        $plain = openssl_decrypt($ciphertext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        if ($plain === false) {
            return '';
        }
        return $plain;
    }

    /**
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    public static function decrypt_chory_row(array $row) {
        if (array_key_exists('adres', $row)) {
            $row['adres'] = self::decrypt($row['adres']);
        }
        if (array_key_exists('telefon', $row)) {
            $row['telefon'] = self::decrypt($row['telefon']);
        }
        return $row;
    }

    /**
     * Jednorazowo (i przy imporcie) zaszyfruj jawne adresy i telefony chorych.
     */
    public static function encrypt_existing_chorzy_fields() {
        global $wpdb;
        $table = self::get_table_name('chorzy');
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
        if (!$exists) {
            return;
        }

        self::ensure_encryption_key();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $rows = $wpdb->get_results("SELECT id, adres, telefon FROM `{$table}`", ARRAY_A);
        foreach ((array) $rows as $row) {
            $adres = (string) ($row['adres'] ?? '');
            $telefon = (string) ($row['telefon'] ?? '');
            $new_adres = self::encrypt($adres);
            $new_telefon = self::encrypt($telefon);
            if ($new_adres === $adres && $new_telefon === $telefon) {
                continue;
            }
            $wpdb->update(
                $table,
                array(
                    'adres' => $new_adres,
                    'telefon' => $new_telefon,
                ),
                array('id' => (int) $row['id']),
                array('%s', '%s'),
                array('%d')
            );
        }
    }
}



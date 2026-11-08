<?php
/**
 * Kopia zapasowa JSON: chorzy, szafarze, kalendarz, adwent, historia.
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Backup {

    const TABLES = array('chorzy', 'szafarze', 'kalendarz', 'adwent', 'historia');
    const OPTIONS = array(
        'oc_adwent_open_years',
        'oc_email_reminder_hour',
        'oc_admin_password_hash',
        'oc_encryption_key',
    );

    public static function register_hooks() {
        add_action('admin_post_oc_export_backup', array(__CLASS__, 'handle_admin_export'));
        add_action('rest_api_init', array(__CLASS__, 'register_routes'));
    }

    public static function register_routes() {
        register_rest_route('odwiedziny-chorych/v1', '/backup', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array(__CLASS__, 'rest_export'),
            'permission_callback' => array(__CLASS__, 'rest_permission'),
        ));
    }

    /**
     * @param WP_REST_Request $request
     * @return true|WP_Error
     */
    public static function rest_permission($request) {
        $ok = OC_Auth::rest_permission($request);
        if (is_wp_error($ok) || !$ok) {
            return $ok;
        }
        $session = OC_Auth::get_session_from_request($request);
        if (!OC_Auth::is_app_admin_session($session)) {
            return new WP_Error('oc_forbidden', 'Kopię zapasową pobiera administrator.', array('status' => 403));
        }
        return true;
    }

    /**
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function rest_export($request) {
        unset($request);
        return rest_ensure_response(self::build_export());
    }

    public static function handle_admin_export() {
        if (!current_user_can('manage_options')) {
            wp_die(__('Brak uprawnień.', 'odwiedziny-chorych'), 403);
        }
        check_admin_referer('oc_export_backup');

        $payload = self::build_export();
        $json = wp_json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        if ($json === false) {
            wp_die(__('Nie udało się zbudować pliku JSON.', 'odwiedziny-chorych'), 500);
        }

        $filename = 'odwiedziny-chorych-kopia-' . gmdate('Y-m-d') . '.json';
        nocache_headers();
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($json));
        echo $json;
        exit;
    }

    /**
     * @return array<string,mixed>
     */
    public static function build_export() {
        global $wpdb;
        $tables = array();
        foreach (self::TABLES as $key) {
            $name = OC_Database::get_table_name($key);
            $rows = (array) $wpdb->get_results("SELECT * FROM `$name`", ARRAY_A);
            if ($key === 'chorzy') {
                foreach ($rows as $i => $row) {
                    $rows[$i] = OC_Database::decrypt_chory_row($row);
                }
            }
            $tables[$key] = $rows;
        }

        $options = array();
        foreach (self::OPTIONS as $option) {
            $options[$option] = get_option($option, null);
        }

        return array(
            'plugin' => 'odwiedziny-chorych',
            'version' => defined('OC_PLUGIN_VERSION') ? OC_PLUGIN_VERSION : '',
            'exported_at' => current_time('c'),
            'timezone' => OC_Email_Notifications::get_timezone_label(),
            'data' => array_merge($tables, array('options' => $options)),
        );
    }

    /**
     * @param mixed $payload
     * @return true|WP_Error
     */
    public static function import_payload($payload) {
        if (!is_array($payload)) {
            return new WP_Error('invalid_json', 'Nieprawidłowy format JSON.');
        }

        $data = array();
        if (isset($payload['data']) && is_array($payload['data'])) {
            $data = $payload['data'];
        } else {
            $data = $payload;
        }

        if (isset($payload['plugin']) && $payload['plugin'] !== 'odwiedziny-chorych') {
            return new WP_Error('invalid_plugin', 'To nie jest kopia wtyczki Odwiedziny Chorych.');
        }

        global $wpdb;
        $wpdb->query('START TRANSACTION');

        try {
            foreach (self::TABLES as $key) {
                if (!array_key_exists($key, $data)) {
                    continue;
                }
                if (!is_array($data[$key])) {
                    throw new Exception('Sekcja ' . $key . ' nie jest listą.');
                }
                $table = OC_Database::get_table_name($key);
                $columns = self::get_columns($table);
                if (empty($columns)) {
                    throw new Exception('Brak tabeli ' . $key . '.');
                }
                $wpdb->query("DELETE FROM `$table`");
                foreach ($data[$key] as $row) {
                    if (!is_array($row)) {
                        continue;
                    }
                    $insert = array();
                    foreach ($columns as $column) {
                        if (array_key_exists($column, $row)) {
                            $insert[$column] = $row[$column];
                        }
                    }
                    if (empty($insert)) {
                        continue;
                    }
                    $ok = $wpdb->insert($table, $insert);
                    if ($ok === false) {
                        throw new Exception('Błąd zapisu tabeli ' . $key . ': ' . $wpdb->last_error);
                    }
                }
            }

            if (!empty($data['options']) && is_array($data['options'])) {
                foreach (self::OPTIONS as $option) {
                    if (!array_key_exists($option, $data['options'])) {
                        continue;
                    }
                    $value = $data['options'][$option];
                    if ($value === null) {
                        delete_option($option);
                    } else {
                        update_option($option, $value, false);
                    }
                }
            }

            $wpdb->query('COMMIT');
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('import_failed', $e->getMessage());
        }

        OC_Database::encrypt_existing_chorzy_fields();
        OC_Email_Notifications::maybe_reschedule_cron();
        return true;
    }

    /**
     * @param string $table
     * @return string[]
     */
    private static function get_columns($table) {
        global $wpdb;
        $rows = $wpdb->get_results("SHOW COLUMNS FROM `$table`", ARRAY_A);
        $columns = array();
        foreach ((array) $rows as $row) {
            if (!empty($row['Field'])) {
                $columns[] = $row['Field'];
            }
        }
        return $columns;
    }
}

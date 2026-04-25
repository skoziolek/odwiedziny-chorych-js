<?php
/**
 * Sesja aplikacji (Bearer) — rozpoznawanie administratora vs szafarza
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Auth {

    /**
     * @param string $token
     * @return object|null
     */
    public static function get_session_by_token($token) {
        if ($token === '' || $token === null) {
            return null;
        }
        global $wpdb;
        $table = OC_Database::get_table_name('sesje');
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE token = %s AND data_wygasniecia > NOW()",
            $token
        ));
    }

    /**
     * @param WP_REST_Request $request
     * @return string
     */
    public static function get_bearer_token($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return '';
        }
        return substr($auth_header, 7);
    }

    /**
     * @param WP_REST_Request $request
     * @return object|null
     */
    public static function get_session_from_request($request) {
        return self::get_session_by_token(self::get_bearer_token($request));
    }

    /**
     * Sesja „głównego” konta aplikacji (hasło administratora z ustawień).
     *
     * @param object|null $session
     * @return bool
     */
    public static function is_app_admin_session($session) {
        if (!$session) {
            return false;
        }
        return $session->szafarz_id === null || $session->szafarz_id === '' || (int) $session->szafarz_id === 0;
    }

    /**
     * ID szafarza dla zapisu audytu (null = administrator aplikacji).
     *
     * @param WP_REST_Request $request
     * @return int|null
     */
    public static function get_actor_szafarz_id_for_audit($request) {
        $session = self::get_session_from_request($request);
        if (!$session) {
            return null;
        }
        if (self::is_app_admin_session($session)) {
            return null;
        }
        return (int) $session->szafarz_id;
    }
}

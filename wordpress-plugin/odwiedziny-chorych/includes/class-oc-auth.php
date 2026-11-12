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

    /** Hasło wpisywane przy aktywacji wtyczki — do wykrycia, nie do pokazywania w UI. */
    const DEFAULT_ADMIN_PASSWORD = 'PomocDlaChorych!';

    /**
     * Czy administrator nadal używa hasła z dokumentacji.
     */
    public static function uses_default_admin_password() {
        $hash = get_option('oc_admin_password_hash');
        if (!$hash) {
            return true;
        }
        return password_verify(self::DEFAULT_ADMIN_PASSWORD, $hash);
    }

    /**
     * @return array<string,mixed>
     */
    public static function admin_user_payload() {
        return array(
            'role' => 'admin',
            'szafarzId' => null,
            'label' => 'Administrator',
            'loggedin' => true,
            'mustChangePassword' => self::uses_default_admin_password(),
        );
    }

    /**
     * @param string $new_password
     * @param string $confirm_password
     * @return true|WP_Error
     */
    public static function change_admin_password($new_password, $confirm_password) {
        $new_password = (string) $new_password;
        $confirm_password = (string) $confirm_password;
        if ($new_password === '') {
            return new WP_Error('empty_password', 'Hasło nie może być puste.', array('status' => 400));
        }
        if ($new_password !== $confirm_password) {
            return new WP_Error('password_mismatch', 'Hasła nie są zgodne.', array('status' => 400));
        }
        if (strlen($new_password) < 8) {
            return new WP_Error('password_short', 'Hasło musi mieć co najmniej 8 znaków.', array('status' => 400));
        }
        if ($new_password === self::DEFAULT_ADMIN_PASSWORD) {
            return new WP_Error('password_default', 'Ustaw własne hasło, inne niż hasło startowe z dokumentacji.', array('status' => 400));
        }
        update_option('oc_admin_password_hash', password_hash($new_password, PASSWORD_DEFAULT));
        return true;
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
     * Uprawnienie REST: ważna sesja aplikacji (Bearer).
     * Sam nonce WordPressa z ekranu logowania nie wystarcza.
     *
     * @param WP_REST_Request $request
     * @param bool            $admin_write Gdy true, zapis (POST/PUT/PATCH/DELETE) tylko dla administratora aplikacji.
     * @return bool
     */
    public static function rest_permission($request, $admin_write = false) {
        $session = self::get_session_from_request($request);
        if (!$session) {
            return new WP_Error(
                'oc_unauthorized',
                'Wymagane logowanie do aplikacji.',
                array('status' => 401)
            );
        }
        $method = $request->get_method();
        $write = in_array($method, array('POST', 'PUT', 'DELETE', 'PATCH'), true);
        if ($write && $admin_write && !self::is_app_admin_session($session)) {
            return new WP_Error(
                'oc_forbidden',
                'Brak uprawnień administratora.',
                array('status' => 403)
            );
        }
        return true;
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

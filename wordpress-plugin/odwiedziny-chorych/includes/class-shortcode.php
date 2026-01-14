<?php
/**
 * Shortcode do wyświetlania aplikacji
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Shortcode {
    
    /**
     * Zarejestruj shortcode
     */
    public static function register() {
        add_shortcode('odwiedziny_chorych', array(__CLASS__, 'render'));
        
        // Dodaj REST API dla logowania
        add_action('rest_api_init', array(__CLASS__, 'register_auth_routes'));
    }
    
    /**
     * Zarejestruj routes dla autentykacji
     */
    public static function register_auth_routes() {
        register_rest_route('odwiedziny-chorych/v1', '/auth/login', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array(__CLASS__, 'handle_login'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('odwiedziny-chorych/v1', '/auth/verify', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array(__CLASS__, 'verify_session'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('odwiedziny-chorych/v1', '/auth/logout', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array(__CLASS__, 'handle_logout'),
            'permission_callback' => '__return_true',
        ));
    }
    
    /**
     * Obsługa logowania
     */
    public static function handle_login($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        $username = sanitize_text_field($params['username'] ?? '');
        $password = $params['password'] ?? '';
        
        // Sprawdź rate limiting
        $table_proby = OC_Database::get_table_name('proby_logowania');
        $ip = self::get_client_ip();
        
        $proba = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_proby WHERE ip = %s",
            $ip
        ));
        
        if ($proba && $proba->zablokowany_do && strtotime($proba->zablokowany_do) > time()) {
            $remaining = ceil((strtotime($proba->zablokowany_do) - time()) / 60);
            return new WP_Error(
                'rate_limited',
                sprintf('Zbyt wiele prób logowania. Spróbuj ponownie za %d minut.', $remaining),
                array('status' => 429)
            );
        }
        
        // Sprawdź dane logowania
        if ($username !== 'admin') {
            self::record_failed_attempt($ip);
            return new WP_Error('invalid_credentials', 'Nieprawidłowe dane logowania', array('status' => 401));
        }
        
        $password_hash = get_option('oc_admin_password_hash');
        if (!$password_hash || !password_verify($password, $password_hash)) {
            self::record_failed_attempt($ip);
            return new WP_Error('invalid_credentials', 'Nieprawidłowe dane logowania', array('status' => 401));
        }
        
        // Usuń nieudane próby
        $wpdb->delete($table_proby, array('ip' => $ip));
        
        // Utwórz sesję
        $token = wp_generate_password(64, false);
        $table_sesje = OC_Database::get_table_name('sesje');
        
        $wpdb->insert($table_sesje, array(
            'token' => $token,
            'user_ip' => $ip,
            'user_agent' => sanitize_text_field($_SERVER['HTTP_USER_AGENT'] ?? ''),
            'data_wygasniecia' => date('Y-m-d H:i:s', time() + 8 * 3600), // 8 godzin
        ));
        
        return rest_ensure_response(array(
            'success' => true,
            'token' => $token,
            'user' => array(
                'username' => 'admin',
                'loggedin' => true,
            ),
        ));
    }
    
    /**
     * Zapisz nieudaną próbę logowania
     */
    private static function record_failed_attempt($ip) {
        global $wpdb;
        $table_proby = OC_Database::get_table_name('proby_logowania');
        
        $proba = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_proby WHERE ip = %s",
            $ip
        ));
        
        if ($proba) {
            $liczba_prob = $proba->liczba_prob + 1;
            $zablokowany_do = null;
            
            if ($liczba_prob >= 5) {
                $zablokowany_do = date('Y-m-d H:i:s', time() + 15 * 60); // 15 minut
            }
            
            $wpdb->update($table_proby, array(
                'liczba_prob' => $liczba_prob,
                'ostatnia_proba' => current_time('mysql'),
                'zablokowany_do' => $zablokowany_do,
            ), array('ip' => $ip));
        } else {
            $wpdb->insert($table_proby, array(
                'ip' => $ip,
                'liczba_prob' => 1,
                'ostatnia_proba' => current_time('mysql'),
            ));
        }
    }
    
    /**
     * Pobierz IP klienta
     */
    private static function get_client_ip() {
        $ip = '';
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        return sanitize_text_field($ip);
    }
    
    /**
     * Weryfikuj sesję
     */
    public static function verify_session($request) {
        // Debug - loguj wszystkie nagłówki (tylko dla debugowania, usuń w produkcji)
        $all_headers = $request->get_headers();
        
        // Sprawdź nagłówek Authorization
        $auth_header = $request->get_header('Authorization');
        
        // Jeśli nie ma w Authorization, sprawdź alternatywne sposoby
        if (!$auth_header) {
            // Sprawdź czy może być w innych miejscach (dla debugowania)
            $auth_header = $request->get_header('authorization'); // lowercase
        }
        
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            // Loguj dla debugowania (usuń w produkcji)
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('OC Auth Verify: Brak tokenu. Headers: ' . print_r($all_headers, true));
            }
            return new WP_Error('no_token', 'Brak tokenu autoryzacji', array('status' => 401));
        }
        
        $token = substr($auth_header, 7);
        
        if (empty($token)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('OC Auth Verify: Pusty token');
            }
            return new WP_Error('empty_token', 'Token jest pusty', array('status' => 401));
        }
        
        global $wpdb;
        $table = OC_Database::get_table_name('sesje');
        
        // Sprawdź czy sesja istnieje i nie wygasła
        $session = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE token = %s AND data_wygasniecia > NOW()",
            $token
        ));
        
        if (!$session) {
            // Sprawdź czy token istnieje ale wygasł
            $expired_session = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table WHERE token = %s",
                $token
            ));
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                if ($expired_session) {
                    error_log('OC Auth Verify: Token wygasł. Data wygaśnięcia: ' . $expired_session->data_wygasniecia);
                } else {
                    error_log('OC Auth Verify: Token nie istnieje w bazie');
                }
            }
            
            return new WP_Error('invalid_token', 'Nieprawidłowy lub wygasły token', array('status' => 401));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'user' => array(
                'username' => 'admin',
                'loggedin' => true,
            ),
        ));
    }
    
    /**
     * Wylogowanie
     */
    public static function handle_logout($request) {
        $auth_header = $request->get_header('Authorization');
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
            
            global $wpdb;
            $table = OC_Database::get_table_name('sesje');
            $wpdb->delete($table, array('token' => $token));
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Renderuj shortcode
     */
    public static function render($atts) {
        ob_start();
        include OC_PLUGIN_DIR . 'templates/app.php';
        return ob_get_clean();
    }
}



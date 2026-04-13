<?php
/**
 * Plugin Name: Odwiedziny Chorych
 * Plugin URI: https://example.com/odwiedziny-chorych
 * Description: System zarządzania odwiedzinami chorych - kalendarz, szafarze, raporty
 * Version: 1.2.1
 * Author: Administrator
 * Author URI: https://example.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: odwiedziny-chorych
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

// Zabezpieczenie przed bezpośrednim dostępem
if (!defined('ABSPATH')) {
    exit;
}

// Stałe pluginu
define('OC_PLUGIN_VERSION', '1.2.1');
define('OC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('OC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('OC_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Główna klasa pluginu
 */
class OdwiedzinyChorych {
    
    /**
     * Instancja singletona
     */
    private static $instance = null;
    
    /**
     * Pobierz instancję
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Konstruktor
     */
    private function __construct() {
        $this->load_dependencies();
        $this->init_hooks();
    }
    
    /**
     * Załaduj zależności
     */
    private function load_dependencies() {
        require_once OC_PLUGIN_DIR . 'includes/class-database.php';
        require_once OC_PLUGIN_DIR . 'includes/class-api-chorzy.php';
        require_once OC_PLUGIN_DIR . 'includes/class-api-szafarze.php';
        require_once OC_PLUGIN_DIR . 'includes/class-api-kalendarz.php';
        require_once OC_PLUGIN_DIR . 'includes/class-api-adwent.php';
        require_once OC_PLUGIN_DIR . 'includes/class-api-historia.php';
        require_once OC_PLUGIN_DIR . 'includes/class-api-raporty.php';
        require_once OC_PLUGIN_DIR . 'includes/class-shortcode.php';
        require_once OC_PLUGIN_DIR . 'includes/class-email-notifications.php';
    }
    
    /**
     * Inicjalizuj hooki
     */
    private function init_hooks() {
        // Aktywacja i deaktywacja
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Inicjalizacja
        add_action('init', array($this, 'init'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        
        // Skrypty i style
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
        
        // Menu admina
        add_action('admin_menu', array($this, 'admin_menu'));
        
        // Ukryj WordPress admin bar dla użytkowników końcowych (pokazuj tylko administratorom WordPress)
        add_filter('show_admin_bar', array($this, 'hide_admin_bar_for_guests'));
        
        // Dodaj inline style do ukrycia WordPress header
        add_action('wp_head', array($this, 'hide_wordpress_header_styles'), 999);
        
        // Dodaj viewport meta tag dla responsywności
        add_action('wp_head', array($this, 'add_viewport_meta'), 1);
        
        // Cron job dla emaili
        add_action('oc_daily_email_reminders', array('OC_Email_Notifications', 'check_and_send_reminders'));
    }
    
    /**
     * Aktywacja pluginu
     */
    public function activate() {
        // Utwórz tabele w bazie danych
        OC_Database::create_tables();
        
        // Załaduj klasę emaili (jeśli jeszcze nie załadowana)
        if (!class_exists('OC_Email_Notifications')) {
            require_once OC_PLUGIN_DIR . 'includes/class-email-notifications.php';
        }
        
        // Zaplanuj cron job dla emaili
        OC_Email_Notifications::schedule_cron();
        
        // Utwórz domyślne opcje
        $this->create_default_options();
        
        // Wyczyść cache
        flush_rewrite_rules();
    }
    
    /**
     * Deaktywacja pluginu
     */
    public function deactivate() {
        // Załaduj klasę emaili (jeśli jeszcze nie załadowana)
        if (!class_exists('OC_Email_Notifications')) {
            require_once OC_PLUGIN_DIR . 'includes/class-email-notifications.php';
        }
        
        // Usuń cron job
        OC_Email_Notifications::unschedule_cron();
        
        flush_rewrite_rules();
    }
    
    /**
     * Utwórz domyślne opcje
     */
    private function create_default_options() {
        // Hasło administratora (zahashowane)
        if (!get_option('oc_admin_password_hash')) {
            update_option('oc_admin_password_hash', password_hash('PomocDlaChorych!', PASSWORD_DEFAULT));
        }
        
        // Klucz szyfrowania
        if (!get_option('oc_encryption_key')) {
            update_option('oc_encryption_key', wp_generate_password(32, true, true));
        }
    }
    
    /**
     * Inicjalizacja
     */
    public function init() {
        // Załaduj tłumaczenia
        load_plugin_textdomain('odwiedziny-chorych', false, dirname(OC_PLUGIN_BASENAME) . '/languages');
        
        // Zarejestruj shortcode
        OC_Shortcode::register();
    }
    
    /**
     * Zarejestruj REST API routes
     */
    public function register_rest_routes() {
        // API dla chorych
        $chorzy_api = new OC_API_Chorzy();
        $chorzy_api->register_routes();
        
        // API dla szafarzy
        $szafarze_api = new OC_API_Szafarze();
        $szafarze_api->register_routes();
        
        // API dla kalendarza
        $kalendarz_api = new OC_API_Kalendarz();
        $kalendarz_api->register_routes();
        
        // API dla adwentu
        $adwent_api = new OC_API_Adwent();
        $adwent_api->register_routes();
        
        // API dla historii
        $historia_api = new OC_API_Historia();
        $historia_api->register_routes();
        
        // API dla raportów
        $raporty_api = new OC_API_Raporty();
        $raporty_api->register_routes();
    }
    
    /**
     * Załaduj skrypty i style (frontend)
     */
    public function enqueue_scripts() {
        // Sprawdź czy jesteśmy na stronie z shortcode
        global $post;
        if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'odwiedziny_chorych')) {
            return;
        }
        
        // W trybie developmentu użyj timestamp plików (auto-refresh przy zmianach)
        // W produkcji użyj wersji pluginu
        $css_version = file_exists(OC_PLUGIN_DIR . 'assets/css/style.css') 
            ? filemtime(OC_PLUGIN_DIR . 'assets/css/style.css') 
            : OC_PLUGIN_VERSION;
        $js_version = file_exists(OC_PLUGIN_DIR . 'assets/js/app.js') 
            ? filemtime(OC_PLUGIN_DIR . 'assets/js/app.js') 
            : OC_PLUGIN_VERSION;
        
        // Style
        wp_enqueue_style(
            'oc-styles',
            OC_PLUGIN_URL . 'assets/css/style.css',
            array(),
            $css_version
        );
        
        // Skrypty
        wp_enqueue_script(
            'oc-app',
            OC_PLUGIN_URL . 'assets/js/app.js',
            array(),
            $js_version,
            true
        );
        
        // Przekaż dane do JavaScript
        wp_localize_script('oc-app', 'ocData', array(
            'apiUrl' => rest_url('odwiedziny-chorych/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'pluginUrl' => OC_PLUGIN_URL
        ));
    }
    
    /**
     * Załaduj skrypty i style (admin)
     */
    public function admin_enqueue_scripts($hook) {
        if (strpos($hook, 'odwiedziny-chorych') === false) {
            return;
        }
        
        wp_enqueue_style(
            'oc-admin-styles',
            OC_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            OC_PLUGIN_VERSION
        );
    }
    
    /**
     * Menu administratora
     */
    public function admin_menu() {
        add_menu_page(
            __('Odwiedziny Chorych', 'odwiedziny-chorych'),
            __('Odwiedziny Chorych', 'odwiedziny-chorych'),
            'manage_options',
            'odwiedziny-chorych',
            array($this, 'admin_page'),
            'dashicons-heart',
            30
        );
        
        add_submenu_page(
            'odwiedziny-chorych',
            __('Ustawienia', 'odwiedziny-chorych'),
            __('Ustawienia', 'odwiedziny-chorych'),
            'manage_options',
            'odwiedziny-chorych-settings',
            array($this, 'settings_page')
        );
    }
    
    /**
     * Ukryj admin bar dla użytkowników końcowych
     * Pokazuj tylko administratorom WordPress (nie użytkownikom aplikacji)
     */
    public function hide_admin_bar_for_guests($show) {
        // Pokazuj admin bar tylko administratorom WordPress
        if (current_user_can('manage_options')) {
            return $show;
        }
        // Ukryj dla wszystkich innych
        return false;
    }
    
    /**
     * Dodaj inline style do ukrycia WordPress header i naprawy pozycjonowania
     */
    public function hide_wordpress_header_styles() {
        global $post;
        // Sprawdź czy jesteśmy na stronie z shortcode
        if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'odwiedziny_chorych')) {
            return;
        }
        ?>
        <style id="oc-hide-wordpress-header">
            /* Agresywne ukrywanie WordPress header */
            body header:not(.oc-header),
            body .site-header:not(.oc-header),
            body .main-header:not(.oc-header),
            body .site-header,
            body .wp-site-blocks > header:not(.oc-header),
            body .wp-block-template-part[data-area="header"]:not(.oc-header),
            body .site-branding,
            body .site-title,
            body .site-description,
            body .main-navigation,
            body nav[role="navigation"]:not(.oc-header),
            body header[role="banner"]:not(.oc-header),
            body .site-header-wrapper,
            body #masthead:not(.oc-header),
            body #header:not(.oc-header),
            body .header:not(.oc-header) {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                opacity: 0 !important;
                position: absolute !important;
                left: -9999px !important;
            }
            .oc-container {
                margin-top: 0 !important;
            }
            
            /* WYMUSZENIE układu kolumnowego na mobile - bardzo agresywne */
            @media (max-width: 768px) {
                .oc-header {
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: stretch !important;
                    padding: 10px !important;
                    gap: 10px !important;
                }
                
                .oc-header h1 {
                    order: 1 !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    text-align: center !important;
                }
                
                /* Przycisk Wyloguj jest teraz w .oc-tabs, nie w .oc-header */
            }
        </style>
        <?php
    }
    
    /**
     * Dodaj viewport meta tag dla responsywności
     */
    public function add_viewport_meta() {
        global $post;
        // Sprawdź czy jesteśmy na stronie z shortcode
        if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'odwiedziny_chorych')) {
            return;
        }
        ?>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <?php
    }
    
    /**
     * Strona administratora
     */
    public function admin_page() {
        include OC_PLUGIN_DIR . 'templates/admin-page.php';
    }
    
    /**
     * Strona ustawień
     */
    public function settings_page() {
        include OC_PLUGIN_DIR . 'templates/settings-page.php';
    }
}

// Uruchom plugin
OdwiedzinyChorych::get_instance();

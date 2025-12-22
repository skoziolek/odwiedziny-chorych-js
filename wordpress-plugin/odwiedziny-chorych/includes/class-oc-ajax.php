<?php
/**
 * Klasa do obsługi żądań AJAX
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Ajax {
    
    /**
     * Obsłuż żądanie AJAX
     */
    public static function handle_request() {
        // Weryfikuj nonce
        if (!check_ajax_referer('oc_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => __('Nieprawidłowy token bezpieczeństwa', 'odwiedziny-chorych')), 403);
        }
        
        // Sprawdź uprawnienia
        if (!current_user_can('view_odwiedziny_chorych') && !current_user_can('edit_odwiedziny_chorych')) {
            wp_send_json_error(array('message' => __('Brak uprawnień', 'odwiedziny-chorych')), 403);
        }
        
        $action = isset($_POST['oc_action']) ? sanitize_text_field($_POST['oc_action']) : '';
        
        if (empty($action)) {
            wp_send_json_error(array('message' => __('Brak akcji', 'odwiedziny-chorych')), 400);
        }
        
        // Dispatch do odpowiedniej metody
        switch ($action) {
            // Chorzy
            case 'get_chorzy':
                self::get_chorzy();
                break;
            case 'save_chorzy':
                self::save_chorzy();
                break;
            case 'delete_chory':
                self::delete_chory();
                break;
                
            // Szafarze
            case 'get_szafarze':
                self::get_szafarze();
                break;
            case 'save_szafarze':
                self::save_szafarze();
                break;
            case 'delete_szafarz':
                self::delete_szafarz();
                break;
                
            // Kalendarz
            case 'get_kalendarz':
                self::get_kalendarz();
                break;
            case 'save_kalendarz':
                self::save_kalendarz();
                break;
            case 'auto_assign':
                self::auto_assign();
                break;
            case 'reset_assignments':
                self::reset_assignments();
                break;
                
            // Historia
            case 'get_historia':
                self::get_historia();
                break;
            case 'save_odwiedziny':
                self::save_odwiedziny();
                break;
            case 'get_raport':
                self::get_raport();
                break;
                
            // Backup
            case 'create_backup':
                self::create_backup();
                break;
                
            default:
                wp_send_json_error(array('message' => __('Nieznana akcja', 'odwiedziny-chorych')), 400);
        }
    }
    
    // ==================== CHORZY ====================
    
    private static function get_chorzy() {
        $chorzy = OC_Chorzy::get_sorted_by_status();
        wp_send_json_success($chorzy);
    }
    
    private static function save_chorzy() {
        self::check_edit_permission();
        
        $data = isset($_POST['data']) ? $_POST['data'] : array();
        
        if (is_string($data)) {
            $data = json_decode(stripslashes($data), true);
        }
        
        $result = OC_Chorzy::save_all($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array('message' => __('Zapisano', 'odwiedziny-chorych')));
    }
    
    private static function delete_chory() {
        self::check_edit_permission();
        
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        
        if (!$id) {
            wp_send_json_error(array('message' => __('Brak ID', 'odwiedziny-chorych')));
        }
        
        $result = OC_Chorzy::delete($id);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array('deleted' => true));
    }
    
    // ==================== SZAFARZE ====================
    
    private static function get_szafarze() {
        $szafarze = OC_Szafarze::get_all();
        wp_send_json_success($szafarze);
    }
    
    private static function save_szafarze() {
        self::check_edit_permission();
        
        $data = isset($_POST['data']) ? $_POST['data'] : array();
        
        if (is_string($data)) {
            $data = json_decode(stripslashes($data), true);
        }
        
        $result = OC_Szafarze::save_all($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array('message' => __('Zapisano', 'odwiedziny-chorych')));
    }
    
    private static function delete_szafarz() {
        self::check_edit_permission();
        
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        
        if (!$id) {
            wp_send_json_error(array('message' => __('Brak ID', 'odwiedziny-chorych')));
        }
        
        $result = OC_Szafarze::delete($id);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array('deleted' => true));
    }
    
    // ==================== KALENDARZ ====================
    
    private static function get_kalendarz() {
        $year = isset($_POST['rok']) ? intval($_POST['rok']) : date('Y');
        
        $kalendarz = OC_Kalendarz::get_for_year($year);
        wp_send_json_success($kalendarz);
    }
    
    private static function save_kalendarz() {
        self::check_edit_permission();
        
        $year = isset($_POST['rok']) ? intval($_POST['rok']) : date('Y');
        $data = isset($_POST['data']) ? $_POST['data'] : array();
        
        if (is_string($data)) {
            $data = json_decode(stripslashes($data), true);
        }
        
        $result = OC_Kalendarz::save($data, $year);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array('message' => __('Zapisano', 'odwiedziny-chorych')));
    }
    
    private static function auto_assign() {
        self::check_edit_permission();
        
        $year = isset($_POST['rok']) ? intval($_POST['rok']) : date('Y');
        
        $result = OC_Kalendarz::auto_assign($year);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array('message' => __('Szafarze zostali automatycznie przypisani', 'odwiedziny-chorych')));
    }
    
    private static function reset_assignments() {
        self::check_edit_permission();
        
        $year = isset($_POST['rok']) ? intval($_POST['rok']) : date('Y');
        
        $result = OC_Kalendarz::reset_assignments($year);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array('message' => __('Przypisania zostały zresetowane', 'odwiedziny-chorych')));
    }
    
    // ==================== HISTORIA ====================
    
    private static function get_historia() {
        $historia = OC_Historia::get_all();
        wp_send_json_success($historia);
    }
    
    private static function save_odwiedziny() {
        self::check_edit_permission();
        
        $data = isset($_POST['data']) ? $_POST['data'] : array();
        
        if (is_string($data)) {
            $data = json_decode(stripslashes($data), true);
        }
        
        $result = OC_Historia::save($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array('message' => __('Zapisano', 'odwiedziny-chorych')));
    }
    
    private static function get_raport() {
        $miesiac = isset($_POST['miesiac']) ? sanitize_text_field($_POST['miesiac']) : '';
        
        if (empty($miesiac)) {
            wp_send_json_error(array('message' => __('Brak miesiąca', 'odwiedziny-chorych')));
        }
        
        list($year, $month) = explode('-', $miesiac);
        $raport = OC_Historia::generate_monthly_report((int) $year, (int) $month);
        
        wp_send_json_success(array('data' => $raport));
    }
    
    // ==================== BACKUP ====================
    
    private static function create_backup() {
        self::check_edit_permission();
        
        $year = isset($_POST['rok']) ? intval($_POST['rok']) : date('Y');
        
        $backup = array(
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => OC_VERSION,
            'data' => array(
                'chorzy' => OC_Chorzy::get_all(),
                'szafarze' => OC_Szafarze::get_all(),
                'kalendarz' => OC_Kalendarz::get_for_year($year),
                'historia' => OC_Historia::get_all(),
            ),
        );
        
        wp_send_json_success($backup);
    }
    
    // ==================== HELPERS ====================
    
    private static function check_edit_permission() {
        if (!current_user_can('edit_odwiedziny_chorych')) {
            wp_send_json_error(array('message' => __('Brak uprawnień do edycji', 'odwiedziny-chorych')), 403);
        }
    }
}




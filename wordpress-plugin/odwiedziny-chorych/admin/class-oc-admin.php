<?php
/**
 * Klasa panelu administracyjnego
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Admin {
    
    /**
     * Konstruktor
     */
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Dodaj menu administracyjne
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Odwiedziny Chorych', 'odwiedziny-chorych'),
            __('Odwiedziny Chorych', 'odwiedziny-chorych'),
            'manage_odwiedziny_chorych',
            'odwiedziny-chorych',
            array($this, 'render_dashboard'),
            'dashicons-heart',
            30
        );
        
        add_submenu_page(
            'odwiedziny-chorych',
            __('Dashboard', 'odwiedziny-chorych'),
            __('Dashboard', 'odwiedziny-chorych'),
            'manage_odwiedziny_chorych',
            'odwiedziny-chorych',
            array($this, 'render_dashboard')
        );
        
        add_submenu_page(
            'odwiedziny-chorych',
            __('Ustawienia', 'odwiedziny-chorych'),
            __('Ustawienia', 'odwiedziny-chorych'),
            'manage_odwiedziny_chorych',
            'odwiedziny-chorych-settings',
            array($this, 'render_settings')
        );
        
        add_submenu_page(
            'odwiedziny-chorych',
            __('Import/Eksport', 'odwiedziny-chorych'),
            __('Import/Eksport', 'odwiedziny-chorych'),
            'manage_odwiedziny_chorych',
            'odwiedziny-chorych-import-export',
            array($this, 'render_import_export')
        );
    }
    
    /**
     * Zarejestruj ustawienia
     */
    public function register_settings() {
        register_setting('oc_settings', 'oc_allow_public_access');
        register_setting('oc_settings', 'oc_require_login');
        register_setting('oc_settings', 'oc_default_year');
    }
    
    /**
     * Renderuj dashboard
     */
    public function render_dashboard() {
        // Pobierz statystyki
        $chorzy = OC_Chorzy::get_all();
        $szafarze = OC_Szafarze::get_all();
        $historia = OC_Historia::get_for_month(date('Y'), date('m'));
        
        $total_chorzy = count($chorzy);
        $active_chorzy = count(array_filter($chorzy, function($c) { return $c['status'] === 'TAK'; }));
        $total_szafarze = count($szafarze);
        $odwiedziny_miesiac = count($historia);
        ?>
        
        <div class="wrap">
            <h1><?php _e('Odwiedziny Chorych - Dashboard', 'odwiedziny-chorych'); ?></h1>
            
            <div class="oc-admin-stats">
                <div class="oc-stat-box">
                    <span class="oc-stat-number"><?php echo $total_chorzy; ?></span>
                    <span class="oc-stat-label"><?php _e('Chorych', 'odwiedziny-chorych'); ?></span>
                </div>
                
                <div class="oc-stat-box">
                    <span class="oc-stat-number"><?php echo $active_chorzy; ?></span>
                    <span class="oc-stat-label"><?php _e('Aktywnych (TAK)', 'odwiedziny-chorych'); ?></span>
                </div>
                
                <div class="oc-stat-box">
                    <span class="oc-stat-number"><?php echo $total_szafarze; ?></span>
                    <span class="oc-stat-label"><?php _e('Szafarzy', 'odwiedziny-chorych'); ?></span>
                </div>
                
                <div class="oc-stat-box">
                    <span class="oc-stat-number"><?php echo $odwiedziny_miesiac; ?></span>
                    <span class="oc-stat-label"><?php _e('Odwiedzin w tym miesiącu', 'odwiedziny-chorych'); ?></span>
                </div>
            </div>
            
            <div class="oc-admin-section">
                <h2><?php _e('Szybkie linki', 'odwiedziny-chorych'); ?></h2>
                <p>
                    <?php _e('Aby wyświetlić aplikację na stronie, użyj shortcode:', 'odwiedziny-chorych'); ?>
                    <code>[odwiedziny_chorych]</code>
                </p>
                <p>
                    <?php _e('Dostępne parametry:', 'odwiedziny-chorych'); ?>
                </p>
                <ul>
                    <li><code>year="2025"</code> - <?php _e('domyślny rok', 'odwiedziny-chorych'); ?></li>
                    <li><code>show_tabs="all"</code> - <?php _e('które zakładki pokazać (all, kalendarz, chorzy, szafarze, raporty)', 'odwiedziny-chorych'); ?></li>
                </ul>
            </div>
            
            <div class="oc-admin-section">
                <h2><?php _e('Uprawnienia', 'odwiedziny-chorych'); ?></h2>
                <p><?php _e('Plugin używa następujących uprawnień:', 'odwiedziny-chorych'); ?></p>
                <ul>
                    <li><code>manage_odwiedziny_chorych</code> - <?php _e('pełny dostęp (administratorzy)', 'odwiedziny-chorych'); ?></li>
                    <li><code>edit_odwiedziny_chorych</code> - <?php _e('edycja danych (administratorzy, edytorzy)', 'odwiedziny-chorych'); ?></li>
                    <li><code>view_odwiedziny_chorych</code> - <?php _e('przeglądanie danych (administratorzy, edytorzy)', 'odwiedziny-chorych'); ?></li>
                </ul>
            </div>
        </div>
        
        <style>
            .oc-admin-stats {
                display: flex;
                gap: 20px;
                margin: 20px 0;
                flex-wrap: wrap;
            }
            .oc-stat-box {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                min-width: 150px;
                text-align: center;
            }
            .oc-stat-number {
                display: block;
                font-size: 36px;
                font-weight: bold;
                color: #2271b1;
            }
            .oc-stat-label {
                display: block;
                color: #50575e;
                margin-top: 5px;
            }
            .oc-admin-section {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                margin: 20px 0;
            }
            .oc-admin-section h2 {
                margin-top: 0;
            }
        </style>
        
        <?php
    }
    
    /**
     * Renderuj stronę ustawień
     */
    public function render_settings() {
        ?>
        <div class="wrap">
            <h1><?php _e('Ustawienia - Odwiedziny Chorych', 'odwiedziny-chorych'); ?></h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('oc_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Wymagaj logowania', 'odwiedziny-chorych'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="oc_require_login" value="1" 
                                    <?php checked(get_option('oc_require_login', '1'), '1'); ?>>
                                <?php _e('Użytkownicy muszą być zalogowani, aby korzystać z aplikacji', 'odwiedziny-chorych'); ?>
                            </label>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Domyślny rok', 'odwiedziny-chorych'); ?></th>
                        <td>
                            <select name="oc_default_year">
                                <?php for ($y = date('Y') - 1; $y <= date('Y') + 2; $y++): ?>
                                <option value="<?php echo $y; ?>" <?php selected(get_option('oc_default_year', date('Y')), $y); ?>>
                                    <?php echo $y; ?>
                                </option>
                                <?php endfor; ?>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Renderuj stronę importu/eksportu
     */
    public function render_import_export() {
        // Obsługa importu
        if (isset($_POST['oc_import_data']) && check_admin_referer('oc_import_nonce')) {
            $this->handle_import();
        }
        
        ?>
        <div class="wrap">
            <h1><?php _e('Import/Eksport - Odwiedziny Chorych', 'odwiedziny-chorych'); ?></h1>
            
            <div class="oc-admin-section">
                <h2><?php _e('Eksport danych', 'odwiedziny-chorych'); ?></h2>
                <p><?php _e('Pobierz kopię zapasową wszystkich danych w formacie JSON.', 'odwiedziny-chorych'); ?></p>
                <button class="button button-primary" id="oc-export-btn">
                    <?php _e('Pobierz kopię zapasową', 'odwiedziny-chorych'); ?>
                </button>
            </div>
            
            <div class="oc-admin-section">
                <h2><?php _e('Import danych', 'odwiedziny-chorych'); ?></h2>
                <p><?php _e('Wgraj plik JSON z kopią zapasową. UWAGA: To nadpisze istniejące dane!', 'odwiedziny-chorych'); ?></p>
                
                <form method="post" enctype="multipart/form-data">
                    <?php wp_nonce_field('oc_import_nonce'); ?>
                    <input type="file" name="oc_import_file" accept=".json">
                    <p>
                        <label>
                            <input type="checkbox" name="oc_import_confirm" value="1" required>
                            <?php _e('Potwierdzam, że chcę nadpisać istniejące dane', 'odwiedziny-chorych'); ?>
                        </label>
                    </p>
                    <button type="submit" name="oc_import_data" class="button">
                        <?php _e('Importuj dane', 'odwiedziny-chorych'); ?>
                    </button>
                </form>
            </div>
            
            <div class="oc-admin-section">
                <h2><?php _e('Migracja z wersji Node.js', 'odwiedziny-chorych'); ?></h2>
                <p><?php _e('Jeśli masz dane z poprzedniej wersji Node.js, możesz je zaimportować tutaj.', 'odwiedziny-chorych'); ?></p>
                <p><?php _e('Format pliku: JSON z kluczami chorzy, szafarze, kalendarz, historia', 'odwiedziny-chorych'); ?></p>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#oc-export-btn').on('click', function() {
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'oc_api',
                        oc_action: 'create_backup',
                        nonce: '<?php echo wp_create_nonce('oc_nonce'); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            var blob = new Blob([JSON.stringify(response.data, null, 2)], {type: 'application/json'});
                            var url = URL.createObjectURL(blob);
                            var a = document.createElement('a');
                            a.href = url;
                            a.download = 'odwiedziny_chorych_backup_' + new Date().toISOString().split('T')[0] + '.json';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        } else {
                            alert('Błąd eksportu: ' + response.data.message);
                        }
                    },
                    error: function() {
                        alert('Błąd połączenia z serwerem');
                    }
                });
            });
        });
        </script>
        
        <style>
            .oc-admin-section {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                margin: 20px 0;
            }
            .oc-admin-section h2 {
                margin-top: 0;
            }
        </style>
        
        <?php
    }
    
    /**
     * Obsłuż import danych
     */
    private function handle_import() {
        if (empty($_FILES['oc_import_file']['tmp_name'])) {
            add_settings_error('oc_import', 'no_file', __('Nie wybrano pliku', 'odwiedziny-chorych'));
            return;
        }
        
        $json = file_get_contents($_FILES['oc_import_file']['tmp_name']);
        $data = json_decode($json, true);
        
        if (!$data || json_last_error() !== JSON_ERROR_NONE) {
            add_settings_error('oc_import', 'invalid_json', __('Nieprawidłowy format JSON', 'odwiedziny-chorych'));
            return;
        }
        
        // Import chorych
        if (!empty($data['data']['chorzy']) || !empty($data['chorzy'])) {
            $chorzy = $data['data']['chorzy'] ?? $data['chorzy'];
            OC_Chorzy::save_all($chorzy);
        }
        
        // Import szafarzy
        if (!empty($data['data']['szafarze']) || !empty($data['szafarze'])) {
            $szafarze = $data['data']['szafarze'] ?? $data['szafarze'];
            OC_Szafarze::save_all($szafarze);
        }
        
        // Import kalendarza
        if (!empty($data['data']['kalendarz']) || !empty($data['kalendarz'])) {
            $kalendarz = $data['data']['kalendarz'] ?? $data['kalendarz'];
            foreach ($kalendarz as $year_data) {
                // Obsługuje zarówno stary format (rok => dane) jak i nowy
                if (is_array($year_data)) {
                    $year = date('Y');
                    OC_Kalendarz::save($year_data, $year);
                }
            }
        }
        
        add_settings_error('oc_import', 'success', __('Dane zostały zaimportowane', 'odwiedziny-chorych'), 'updated');
    }
}

// Inicjalizuj panel admina
new OC_Admin();




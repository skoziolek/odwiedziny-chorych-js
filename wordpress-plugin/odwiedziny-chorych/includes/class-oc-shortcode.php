<?php
/**
 * Klasa do obsługi shortcode
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Shortcode {
    
    /**
     * Renderuj shortcode
     */
    public static function render($atts) {
        // Sprawdź czy użytkownik jest zalogowany
        if (!is_user_logged_in()) {
            return self::render_login_required();
        }
        
        // Sprawdź uprawnienia
        if (!current_user_can('view_odwiedziny_chorych') && !current_user_can('edit_odwiedziny_chorych')) {
            return self::render_no_permission();
        }
        
        // Atrybuty
        $atts = shortcode_atts(array(
            'year' => date('Y'),
            'show_tabs' => 'all', // all, kalendarz, chorzy, szafarze, raporty
        ), $atts);
        
        ob_start();
        
        self::render_app($atts);
        
        return ob_get_clean();
    }
    
    /**
     * Renderuj informację o wymaganym logowaniu
     */
    private static function render_login_required() {
        ob_start();
        ?>
        <div class="oc-login-required">
            <div class="oc-message">
                <h2><?php _e('Wymagane logowanie', 'odwiedziny-chorych'); ?></h2>
                <p><?php _e('Musisz być zalogowany, aby uzyskać dostęp do tej aplikacji.', 'odwiedziny-chorych'); ?></p>
                <a href="<?php echo wp_login_url(get_permalink()); ?>" class="oc-btn">
                    <?php _e('Zaloguj się', 'odwiedziny-chorych'); ?>
                </a>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Renderuj informację o braku uprawnień
     */
    private static function render_no_permission() {
        ob_start();
        ?>
        <div class="oc-no-permission">
            <div class="oc-message">
                <h2><?php _e('Brak uprawnień', 'odwiedziny-chorych'); ?></h2>
                <p><?php _e('Nie masz uprawnień do korzystania z tej aplikacji.', 'odwiedziny-chorych'); ?></p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Renderuj główną aplikację
     */
    private static function render_app($atts) {
        $can_edit = current_user_can('edit_odwiedziny_chorych');
        $show_tabs = $atts['show_tabs'];
        $current_year = intval($atts['year']);
        
        // Pobierz dane
        $szafarze_names = OC_Szafarze::get_names();
        ?>
        
        <div id="oc-app" class="oc-app" data-year="<?php echo esc_attr($current_year); ?>">
            
            <!-- Header -->
            <div class="oc-header">
                <h1 class="oc-title"><?php _e('Grafik odwiedzin chorych', 'odwiedziny-chorych'); ?></h1>
            </div>
            
            <!-- Zakładki -->
            <div class="oc-tabs">
                <?php if ($show_tabs === 'all' || strpos($show_tabs, 'kalendarz') !== false): ?>
                <button class="oc-tab-button active" data-tab="kalendarz">
                    📅 <?php _e('Kalendarz', 'odwiedziny-chorych'); ?>
                </button>
                <?php endif; ?>
                
                <?php if ($show_tabs === 'all' || strpos($show_tabs, 'chorzy') !== false): ?>
                <button class="oc-tab-button" data-tab="chorzy">
                    🧑‍⚕️ <?php _e('Dane chorych', 'odwiedziny-chorych'); ?>
                </button>
                <?php endif; ?>
                
                <?php if ($show_tabs === 'all' || strpos($show_tabs, 'szafarze') !== false): ?>
                <button class="oc-tab-button" data-tab="szafarze">
                    🙋‍♂️ <?php _e('Dane szafarzy', 'odwiedziny-chorych'); ?>
                </button>
                <?php endif; ?>
                
                <?php if ($show_tabs === 'all' || strpos($show_tabs, 'raporty') !== false): ?>
                <button class="oc-tab-button" data-tab="raporty">
                    📊 <?php _e('Raporty', 'odwiedziny-chorych'); ?>
                </button>
                <?php endif; ?>
            </div>
            
            <!-- Zakładka Kalendarz -->
            <div id="oc-kalendarz" class="oc-tab-content active">
                <div class="oc-controls">
                    <div class="oc-year-select">
                        <label for="oc-wybierz-rok"><?php _e('Wybierz rok:', 'odwiedziny-chorych'); ?></label>
                        <select id="oc-wybierz-rok">
                            <?php for ($y = $current_year - 1; $y <= $current_year + 2; $y++): ?>
                            <option value="<?php echo $y; ?>" <?php selected($y, $current_year); ?>><?php echo $y; ?></option>
                            <?php endfor; ?>
                        </select>
                    </div>
                    
                    <?php if ($can_edit): ?>
                    <div class="oc-buttons">
                        <button class="oc-btn" id="oc-print-kalendarz"><?php _e('Drukuj', 'odwiedziny-chorych'); ?></button>
                        <button class="oc-btn oc-btn-primary" id="oc-auto-assign"><?php _e('Auto-przypisz szafarzy', 'odwiedziny-chorych'); ?></button>
                        <button class="oc-btn oc-btn-warning" id="oc-reset-assignments"><?php _e('Resetuj przypisania', 'odwiedziny-chorych'); ?></button>
                    </div>
                    <?php endif; ?>
                </div>
                
                <table id="oc-tabela-kalendarz" class="oc-table">
                    <thead>
                        <tr>
                            <th><?php _e('Data', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Nazwa', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Osoba Główna', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Pomocnik', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Uwagi', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Akcje', 'odwiedziny-chorych'); ?></th>
                        </tr>
                    </thead>
                    <tbody id="oc-kalendarz-body">
                        <!-- Generowane przez JavaScript -->
                    </tbody>
                </table>
            </div>
            
            <!-- Zakładka Chorzy -->
            <div id="oc-chorzy" class="oc-tab-content">
                <div class="oc-controls">
                    <?php if ($can_edit): ?>
                    <button class="oc-btn" id="oc-print-chorzy"><?php _e('Drukuj', 'odwiedziny-chorych'); ?></button>
                    <button class="oc-btn oc-btn-primary" id="oc-dodaj-chorego"><?php _e('Dodaj chorego', 'odwiedziny-chorych'); ?></button>
                    <?php endif; ?>
                </div>
                
                <table id="oc-tabela-chorzy" class="oc-table">
                    <thead>
                        <tr>
                            <th><?php _e('Imię i nazwisko', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Adres', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Telefon', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Uwagi', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Status', 'odwiedziny-chorych'); ?></th>
                            <?php if ($can_edit): ?>
                            <th><?php _e('Akcje', 'odwiedziny-chorych'); ?></th>
                            <?php endif; ?>
                        </tr>
                    </thead>
                    <tbody id="oc-chorzy-body">
                        <!-- Generowane przez JavaScript -->
                    </tbody>
                </table>
            </div>
            
            <!-- Zakładka Szafarze -->
            <div id="oc-szafarze" class="oc-tab-content">
                <div class="oc-controls">
                    <?php if ($can_edit): ?>
                    <button class="oc-btn" id="oc-print-szafarze"><?php _e('Drukuj', 'odwiedziny-chorych'); ?></button>
                    <button class="oc-btn oc-btn-primary" id="oc-dodaj-szafarza"><?php _e('Dodaj szafarza', 'odwiedziny-chorych'); ?></button>
                    <?php endif; ?>
                </div>
                
                <table id="oc-tabela-szafarzy" class="oc-table">
                    <thead>
                        <tr>
                            <th><?php _e('Imię i nazwisko', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Telefon', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Email', 'odwiedziny-chorych'); ?></th>
                            <th><?php _e('Uwagi', 'odwiedziny-chorych'); ?></th>
                            <?php if ($can_edit): ?>
                            <th><?php _e('Akcje', 'odwiedziny-chorych'); ?></th>
                            <?php endif; ?>
                        </tr>
                    </thead>
                    <tbody id="oc-szafarze-body">
                        <!-- Generowane przez JavaScript -->
                    </tbody>
                </table>
            </div>
            
            <!-- Zakładka Raporty -->
            <div id="oc-raporty" class="oc-tab-content">
                <div class="oc-controls">
                    <div class="oc-month-select">
                        <label for="oc-wybierz-miesiac"><?php _e('Wybierz miesiąc:', 'odwiedziny-chorych'); ?></label>
                        <select id="oc-wybierz-miesiac">
                            <?php
                            $months = array(
                                '01' => __('Styczeń', 'odwiedziny-chorych'),
                                '02' => __('Luty', 'odwiedziny-chorych'),
                                '03' => __('Marzec', 'odwiedziny-chorych'),
                                '04' => __('Kwiecień', 'odwiedziny-chorych'),
                                '05' => __('Maj', 'odwiedziny-chorych'),
                                '06' => __('Czerwiec', 'odwiedziny-chorych'),
                                '07' => __('Lipiec', 'odwiedziny-chorych'),
                                '08' => __('Sierpień', 'odwiedziny-chorych'),
                                '09' => __('Wrzesień', 'odwiedziny-chorych'),
                                '10' => __('Październik', 'odwiedziny-chorych'),
                                '11' => __('Listopad', 'odwiedziny-chorych'),
                                '12' => __('Grudzień', 'odwiedziny-chorych'),
                            );
                            $current_month = date('m');
                            foreach ($months as $num => $name):
                            ?>
                            <option value="<?php echo $current_year . '-' . $num; ?>" <?php selected($num, $current_month); ?>>
                                <?php echo $name . ' ' . $current_year; ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="oc-buttons">
                        <button class="oc-btn oc-btn-primary" id="oc-generuj-raport"><?php _e('Generuj raport', 'odwiedziny-chorych'); ?></button>
                        <button class="oc-btn" id="oc-drukuj-raport"><?php _e('Drukuj raport', 'odwiedziny-chorych'); ?></button>
                        <button class="oc-btn" id="oc-eksportuj-pdf"><?php _e('Eksportuj do PDF', 'odwiedziny-chorych'); ?></button>
                    </div>
                </div>
                
                <div id="oc-raport-container">
                    <!-- Generowane przez JavaScript -->
                </div>
            </div>
            
            <!-- Modal odwiedzin -->
            <div id="oc-modal-odwiedziny" class="oc-modal">
                <div class="oc-modal-content">
                    <span class="oc-modal-close">&times;</span>
                    <h3 id="oc-modal-title"><?php _e('Oznacz odwiedzonych chorych', 'odwiedziny-chorych'); ?></h3>
                    <form id="oc-form-odwiedziny">
                        <div id="oc-lista-chorych-modal">
                            <!-- Generowane przez JavaScript -->
                        </div>
                        <div class="oc-modal-buttons">
                            <button type="submit" class="oc-btn oc-btn-primary"><?php _e('Zapisz', 'odwiedziny-chorych'); ?></button>
                            <button type="button" class="oc-btn oc-btn-danger" id="oc-cancel-odwiedziny"><?php _e('Anuluj', 'odwiedziny-chorych'); ?></button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Toast notifications -->
            <div id="oc-toast-container"></div>
            
        </div>
        
        <?php
    }
}




<?php
/**
 * Klasa obsługi powiadomień email
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Email_Notifications {
    
    /**
     * Sprawdź i wyślij emaile dla jutrzejszych dyżurów
     */
    public static function check_and_send_reminders() {
        global $wpdb;
        
        // Jutrzejsza data
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        $table_chorzy = OC_Database::get_table_name('chorzy');
        
        // Pobierz dyżury na jutro
        $duties = $wpdb->get_results($wpdb->prepare(
            "SELECT k.*, 
                    og.imie as osoba_glowna_imie,
                    og.email as osoba_glowna_email,
                    p.imie as pomocnik_imie,
                    p.email as pomocnik_email
             FROM $table_kalendarz k
             LEFT JOIN $table_szafarze og ON k.osoba_glowna_id = og.id
             LEFT JOIN $table_szafarze p ON k.pomocnik_id = p.id
             WHERE k.data = %s
             AND (k.osoba_glowna_id IS NOT NULL OR k.pomocnik_id IS NOT NULL)",
            $tomorrow
        ), ARRAY_A);
        
        if (empty($duties)) {
            return;
        }
        
        // Pobierz aktywnych chorych (ze statusem TAK)
        $chorzy = $wpdb->get_results(
            "SELECT imie_nazwisko, adres, telefon, uwagi 
             FROM $table_chorzy 
             WHERE status = 'TAK' 
             ORDER BY imie_nazwisko ASC",
            ARRAY_A
        );
        
        foreach ($duties as $duty) {
            // Wyślij email do głównego szafarza
            if (!empty($duty['osoba_glowna_email']) && is_email($duty['osoba_glowna_email'])) {
                $email_sent_key = 'oc_email_sent_' . $tomorrow . '_' . $duty['osoba_glowna_id'];
                $email_sent = get_option($email_sent_key, false);
                
                if (!$email_sent) {
                    self::send_duty_reminder(
                        $duty['osoba_glowna_email'],
                        $duty['osoba_glowna_imie'],
                        $tomorrow,
                        $chorzy,
                        'glowny'
                    );
                    // Oznacz jako wysłane
                    update_option($email_sent_key, true);
                }
            }
            
            // Wyślij email do pomocnika (jeśli ma inny email niż główny)
            if (!empty($duty['pomocnik_email']) && 
                is_email($duty['pomocnik_email']) && 
                $duty['pomocnik_email'] !== $duty['osoba_glowna_email']) {
                
                $email_sent_key = 'oc_email_sent_' . $tomorrow . '_helper_' . $duty['pomocnik_id'];
                $email_sent = get_option($email_sent_key, false);
                
                if (!$email_sent) {
                    self::send_duty_reminder(
                        $duty['pomocnik_email'],
                        $duty['pomocnik_imie'],
                        $tomorrow,
                        $chorzy,
                        'pomocnik'
                    );
                    // Oznacz jako wysłane
                    update_option($email_sent_key, true);
                }
            }
        }
    }
    
    /**
     * Wyślij przypomnienie o dyżurze
     */
    private static function send_duty_reminder($email, $szafarz_name, $date, $chorzy, $role = 'glowny') {
        $date_formatted = date('Y-m-d', strtotime($date));
        
        // Pobierz nazwę dnia liturgicznego
        if (!class_exists('OC_Swieta')) {
            require_once(plugin_dir_path(__FILE__) . 'class-oc-swieta.php');
        }
        $liturgical_name = OC_Swieta::get_name($date_formatted);
        
        $subject = "Przypomnienie o dyżurze - {$date_formatted}";
        
        // Pobierz URL aplikacji
        $app_url = home_url('/odwiedziny-chorych/');
        
        // HTML version
        $html_message = self::get_html_email($szafarz_name, $date, $liturgical_name, $chorzy, $role, $app_url);
        
        // Headers dla HTML emaila
        $headers = array('Content-Type: text/html; charset=UTF-8');
        
        // Log przed wysyłką
        $log_message = sprintf(
            "[%s] Próba wysłania emaila do: %s (%s) dla daty: %s (rola: %s)",
            date('Y-m-d H:i:s'),
            $email,
            $szafarz_name,
            $date_formatted,
            $role
        );
        self::log_email($log_message);
        
        // Wyślij email
        $result = wp_mail($email, $subject, $html_message, $headers);
        
        // Log po wysyłce
        if ($result) {
            $log_message = sprintf(
                "[%s] ✓ Email WYSLANY pomyślnie do: %s (%s)",
                date('Y-m-d H:i:s'),
                $email,
                $szafarz_name
            );
        } else {
            $log_message = sprintf(
                "[%s] ✗ BŁĄD wysyłki emaila do: %s (%s) - wp_mail() zwróciło false",
                date('Y-m-d H:i:s'),
                $email,
                $szafarz_name
            );
        }
        self::log_email($log_message);
        
        // Sprawdź błędy PHP (jeśli są dostępne)
        if (!$result && function_exists('error_get_last')) {
            $error = error_get_last();
            if ($error && $error['message']) {
                $log_message = sprintf(
                    "[%s] Szczegóły błędu: %s",
                    date('Y-m-d H:i:s'),
                    $error['message']
                );
                self::log_email($log_message);
            }
        }
        
        return $result;
    }
    
    /**
     * Loguj informacje o emailach
     */
    private static function log_email($message) {
        $log_file = WP_CONTENT_DIR . '/oc-email-logs.txt';
        
        // Otwórz plik w trybie append
        $file = fopen($log_file, 'a');
        if ($file) {
            fwrite($file, $message . "\n");
            fclose($file);
        }
        
        // Również loguj do WordPress debug log (jeśli włączony)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('OC Email: ' . $message);
        }
    }
    
    /**
     * Pobierz nazwę dnia tygodnia
     */
    private static function get_day_name($date) {
        $days = array(
            'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 
            'Czwartek', 'Piątek', 'Sobota'
        );
        return $days[date('w', strtotime($date))];
    }
    
    /**
     * Generuj HTML emaila
     */
    private static function get_html_email($szafarz_name, $date, $liturgical_name, $chorzy, $role = 'glowny', $app_url = '') {
        $date_formatted = date('Y-m-d', strtotime($date));
        $role_text = $role === 'glowny' ? 'główny' : 'pomocnik';
        
        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f5f5f5;
                }
                .email-container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background-color: #ffffff;
                }
                .header { 
                    background-color: #ffffff;
                    padding: 30px 20px 20px 20px;
                    text-align: left;
                    border-bottom: 1px solid #e0e0e0;
                }
                .header h1 { 
                    font-size: 24px; 
                    font-weight: bold;
                    color: #6d5c3d;
                    margin: 0 0 15px 0;
                }
                .date-info {
                    color: #666;
                    font-size: 14px;
                    margin: 10px 0;
                }
                .duty-info {
                    color: #333;
                    font-size: 14px;
                    margin: 10px 0;
                }
                .content { 
                    padding: 20px; 
                    background-color: #ffffff;
                }
                .button-container {
                    text-align: center;
                    margin: 30px 0;
                }
                .app-button {
                    display: inline-block;
                    background-color: #8b7355;
                    color: #ffffff !important;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 16px;
                }
                .app-button:hover {
                    background-color: #6d5c3d;
                }
                .chorzy-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background-color: #ffffff;
                }
                .chorzy-table th {
                    background-color: #f5f5f5;
                    color: #333;
                    font-weight: bold;
                    padding: 12px;
                    text-align: left;
                    border: 1px solid #e0e0e0;
                    font-size: 14px;
                }
                .chorzy-table td {
                    padding: 12px;
                    border: 1px solid #e0e0e0;
                    font-size: 14px;
                }
                .chorzy-table tr:nth-child(even) {
                    background-color: #fafafa;
                }
                .footer {
                    padding: 20px;
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    border-top: 1px solid #e0e0e0;
                    background-color: #fafafa;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Przypomnienie o dyżurze</h1>
                    <div class="date-info">
                        <strong>Data:</strong> <?php echo esc_html($date_formatted); ?> — <?php echo esc_html($liturgical_name); ?>
                    </div>
                    <div class="duty-info">
                        Masz zaplanowany dyżur: <strong>Odwiedziny - Parafia (<?php echo esc_html($role_text); ?>)</strong>
                    </div>
                </div>
                
                <div class="content">
                    <?php if (!empty($app_url)): ?>
                    <div class="button-container">
                        <a href="<?php echo esc_url($app_url); ?>" class="app-button">Otwórz aplikację</a>
                    </div>
                    <?php endif; ?>
                    
                    <?php if (!empty($chorzy)): ?>
                    <h3 style="margin-top: 30px; margin-bottom: 15px; color: #333; font-size: 18px;">Aktualna lista chorych do odwiedzenia</h3>
                    <table class="chorzy-table">
                        <thead>
                            <tr>
                                <th>Imię i nazwisko</th>
                                <th>Adres</th>
                                <th>Telefon</th>
                                <th>Uwagi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($chorzy as $chory): ?>
                            <tr>
                                <td><?php echo esc_html($chory['imie_nazwisko'] ?? ''); ?></td>
                                <td><?php echo esc_html($chory['adres'] ?? ''); ?></td>
                                <td><?php echo esc_html($chory['telefon'] ?? ''); ?></td>
                                <td><?php echo esc_html($chory['uwagi'] ?? ''); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php else: ?>
                    <p style="margin-top: 30px; color: #666;">Obecnie nie ma chorych na liście do odwiedzenia.</p>
                    <?php endif; ?>
                </div>
                
                <div class="footer">
                    Jeśli nie chcesz otrzymywać e-maili, skontaktuj się z koordynatorem.
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Zaplanuj cron job
     */
    public static function schedule_cron() {
        if (!wp_next_scheduled('oc_daily_email_reminders')) {
            // Zaplanuj codziennie o 18:00
            wp_schedule_event(
                strtotime('today 18:00'), // Dzisiaj o 18:00
                'daily', // Codziennie
                'oc_daily_email_reminders' // Hook name
            );
        }
    }
    
    /**
     * Usuń cron job
     */
    public static function unschedule_cron() {
        $timestamp = wp_next_scheduled('oc_daily_email_reminders');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'oc_daily_email_reminders');
        }
    }
    
    /**
     * Funkcja testowa - wyślij emaile dla określonej daty (użyteczne do testowania)
     * Można wywołać ręcznie: OC_Email_Notifications::test_send_for_date('2025-01-26');
     */
    public static function test_send_for_date($date) {
        global $wpdb;
        
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        $table_chorzy = OC_Database::get_table_name('chorzy');
        
        // Pobierz dyżury dla podanej daty
        $duties = $wpdb->get_results($wpdb->prepare(
            "SELECT k.*, 
                    og.imie as osoba_glowna_imie,
                    og.email as osoba_glowna_email,
                    p.imie as pomocnik_imie,
                    p.email as pomocnik_email
             FROM $table_kalendarz k
             LEFT JOIN $table_szafarze og ON k.osoba_glowna_id = og.id
             LEFT JOIN $table_szafarze p ON k.pomocnik_id = p.id
             WHERE k.data = %s
             AND (k.osoba_glowna_id IS NOT NULL OR k.pomocnik_id IS NOT NULL)",
            $date
        ), ARRAY_A);
        
        if (empty($duties)) {
            return array('success' => false, 'message' => 'Brak dyżurów dla podanej daty');
        }
        
        // Pobierz aktywnych chorych
        $chorzy = $wpdb->get_results(
            "SELECT imie_nazwisko, adres, telefon, uwagi 
             FROM $table_chorzy 
             WHERE status = 'TAK' 
             ORDER BY imie_nazwisko ASC",
            ARRAY_A
        );
        
        $sent_emails = array();
        
        foreach ($duties as $duty) {
            // Wyślij email do głównego szafarza
            if (!empty($duty['osoba_glowna_email']) && is_email($duty['osoba_glowna_email'])) {
                $result = self::send_duty_reminder(
                    $duty['osoba_glowna_email'],
                    $duty['osoba_glowna_imie'],
                    $date,
                    $chorzy,
                    'glowny'
                );
                $sent_emails[] = array(
                    'email' => $duty['osoba_glowna_email'],
                    'name' => $duty['osoba_glowna_imie'],
                    'success' => $result
                );
            }
            
            // Wyślij email do pomocnika (jeśli ma inny email)
            if (!empty($duty['pomocnik_email']) && 
                is_email($duty['pomocnik_email']) && 
                $duty['pomocnik_email'] !== $duty['osoba_glowna_email']) {
                
                $result = self::send_duty_reminder(
                    $duty['pomocnik_email'],
                    $duty['pomocnik_imie'],
                    $date,
                    $chorzy,
                    'pomocnik'
                );
                $sent_emails[] = array(
                    'email' => $duty['pomocnik_email'],
                    'name' => $duty['pomocnik_imie'],
                    'success' => $result
                );
            }
        }
        
        return array('success' => true, 'sent_emails' => $sent_emails);
    }
}


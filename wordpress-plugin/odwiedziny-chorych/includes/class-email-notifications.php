<?php
/**
 * Klasa obsługi powiadomień email
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Email_Notifications {
    /**
     * Marker daty dla trybu "Okazjonalne odwiedziny".
     *
     * W tym trybie chory jest dodawany ręcznie do konkretnego terminu,
     * więc nie powinien trafiać automatycznie do maila przypominającego.
     */
    private const OCCASIONAL_VISIT_MARKER = '9999-12-31';
    private const SHORTCODE_TAG = 'odwiedziny_chorych';

    /**
     * Pobiera chorych przewidzianych na wskazany dyżur.
     *
     * Zasady:
     * - tylko aktywni (status TAK),
     * - tylko z terminem kolejnej wizyty równym dacie dyżuru,
     * - bez markeru "okazjonalne odwiedziny" (dodawane ręcznie na konkretny dzień).
     *
     * @param string $duty_date Data dyżuru (YYYY-MM-DD)
     * @return array<int,array<string,mixed>>
     */
    private static function get_chorzy_for_duty_date($duty_date) {
        global $wpdb;
        $table_chorzy = OC_Database::get_table_name('chorzy');
        $table_historia = OC_Database::get_table_name('historia');

        // 1) Standardowa lista: aktywni zaplanowani dokładnie na ten termin.
        $scheduled = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, imie_nazwisko, adres, telefon, uwagi
                 FROM $table_chorzy
                 WHERE status = 'TAK'
                   AND nastepna_wizyta IS NOT NULL
                   AND nastepna_wizyta <> %s
                   AND nastepna_wizyta = %s
                 ORDER BY nastepna_wizyta ASC, imie_nazwisko ASC",
                self::OCCASIONAL_VISIT_MARKER,
                $duty_date
            ),
            ARRAY_A
        );

        $merged = array();
        foreach ((array) $scheduled as $row) {
            $row = OC_Database::decrypt_chory_row($row);
            $merged[(int) $row['id']] = $row;
        }

        // 2) Dodatkowa lista ręcznie planowanych na konkretny dzień (modal "Dodaj okazjonalnie").
        $planned_csv = $wpdb->get_var($wpdb->prepare(
            "SELECT chorzy_ids
             FROM $table_historia
             WHERE data = %s AND typ = %s
             LIMIT 1",
            $duty_date,
            'plan_niedziela'
        ));

        $planned_ids = array_values(array_filter(array_map('absint', explode(',', (string) $planned_csv))));
        if (!empty($planned_ids)) {
            $placeholders = implode(',', array_fill(0, count($planned_ids), '%d'));
            $sql = "SELECT id, imie_nazwisko, adres, telefon, uwagi
                    FROM $table_chorzy
                    WHERE status = 'TAK' AND id IN ($placeholders)
                    ORDER BY imie_nazwisko ASC";
            $planned_rows = $wpdb->get_results($wpdb->prepare($sql, ...$planned_ids), ARRAY_A);
            foreach ((array) $planned_rows as $row) {
                $row = OC_Database::decrypt_chory_row($row);
                $merged[(int) $row['id']] = $row;
            }
        }

        return array_values($merged);
    }

    /**
     * Ustala URL aplikacji do przycisku w emailu.
     *
     * Priorytet:
     * 1) filtr `oc_email_app_url`,
     * 2) pierwszy opublikowany post/strona z shortcode [odwiedziny_chorych],
     * 3) fallback historyczny: /odwiedziny-chorych/
     *
     * @return string
     */
    private static function resolve_app_url() {
        $fallback = home_url('/odwiedziny-chorych/');

        $filtered = apply_filters('oc_email_app_url', '');
        if (is_string($filtered) && trim($filtered) !== '') {
            return esc_url_raw($filtered);
        }

        global $wpdb;
        $table_posts = $wpdb->posts;
        $like = '%' . $wpdb->esc_like('[' . self::SHORTCODE_TAG) . '%';
        $ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT ID
                 FROM $table_posts
                 WHERE post_status = 'publish'
                   AND post_type IN ('page', 'post')
                   AND post_content LIKE %s
                 ORDER BY CASE WHEN post_type = 'page' THEN 0 ELSE 1 END, ID ASC
                 LIMIT 20",
                $like
            )
        );

        foreach ((array) $ids as $id) {
            $id = (int) $id;
            if ($id <= 0) {
                continue;
            }
            $content = get_post_field('post_content', $id);
            if (!is_string($content) || !has_shortcode($content, self::SHORTCODE_TAG)) {
                continue;
            }
            $permalink = get_permalink($id);
            if (is_string($permalink) && $permalink !== '') {
                return esc_url_raw($permalink);
            }
        }

        return $fallback;
    }

    /**
     * @return DateTimeZone
     */
    public static function get_wp_timezone() {
        if (function_exists('wp_timezone')) {
            return wp_timezone();
        }

        $string = get_option('timezone_string');
        if (is_string($string) && $string !== '') {
            try {
                return new DateTimeZone($string);
            } catch (Exception $e) {
                // fallback poniżej
            }
        }

        $offset = (float) get_option('gmt_offset');
        $hours = (int) $offset;
        $minutes = (int) round(abs($offset - $hours) * 60);
        $sign = $offset < 0 ? '-' : '+';
        return new DateTimeZone(sprintf('%s%02d:%02d', $sign, abs($hours), $minutes));
    }

    /**
     * @return string
     */
    public static function get_timezone_label() {
        if (function_exists('wp_timezone_string')) {
            $label = wp_timezone_string();
            if (is_string($label) && $label !== '') {
                return $label;
            }
        }
        $string = get_option('timezone_string');
        if (is_string($string) && $string !== '') {
            return $string;
        }
        $offset = (float) get_option('gmt_offset');
        $sign = $offset < 0 ? '-' : '+';
        return sprintf('UTC%s%s', $sign, number_format(abs($offset), 1, '.', ''));
    }

    /**
     * @param string $format
     * @return string
     */
    public static function now_in_wp($format = 'Y-m-d H:i:s') {
        return (new DateTimeImmutable('now', self::get_wp_timezone()))->format($format);
    }

    /**
     * Jutrzejsza data kalendarzowa w strefie WordPressa.
     *
     * @return string Y-m-d
     */
    public static function get_tomorrow_date() {
        return (new DateTimeImmutable('now', self::get_wp_timezone()))
            ->modify('+1 day')
            ->format('Y-m-d');
    }

    /**
     * @return bool
     */
    public static function is_at_or_after_reminder_hour() {
        $now = new DateTimeImmutable('now', self::get_wp_timezone());
        return ((int) $now->format('G')) >= self::get_reminder_hour();
    }

    /**
     * @return string
     */
    public static function get_cron_token() {
        $token = get_option('oc_cron_token', '');
        if (!is_string($token) || strlen($token) < 20) {
            $token = self::regenerate_cron_token();
        }
        return $token;
    }

    /**
     * @return string
     */
    public static function regenerate_cron_token() {
        $token = wp_generate_password(40, false, false);
        update_option('oc_cron_token', $token, false);
        return $token;
    }

    /**
     * Adres, który hosting ma odpalać codziennie o godzinie przypomnienia.
     *
     * @return string
     */
    public static function get_cron_url() {
        return add_query_arg('oc_cron', self::get_cron_token(), home_url('/'));
    }

    /**
     * @return array<string,mixed>
     */
    public static function get_last_run() {
        $last = get_option('oc_cron_last_run', array());
        return is_array($last) ? $last : array();
    }

    /**
     * @param string               $source
     * @param array<string,mixed>  $result
     */
    private static function store_last_run($source, $result) {
        update_option('oc_cron_last_run', array(
            'at' => self::now_in_wp(),
            'source' => $source,
            'status' => $result['status'] ?? '',
            'tomorrow' => $result['tomorrow'] ?? '',
            'duties' => isset($result['duties']) ? (int) $result['duties'] : 0,
            'sent' => isset($result['sent']) ? (int) $result['sent'] : 0,
            'failed' => isset($result['failed']) ? (int) $result['failed'] : 0,
            'timezone' => self::get_timezone_label(),
        ), false);
    }

    /**
     * @param array<string,mixed> $result
     * @return string
     */
    public static function format_cron_plain_result($result) {
        return sprintf(
            "OC_%s at=%s tz=%s tomorrow=%s duties=%d sent=%d failed=%d\n",
            strtoupper((string) ($result['status'] ?? 'ok')),
            self::now_in_wp(),
            self::get_timezone_label(),
            $result['tomorrow'] ?? '',
            isset($result['duties']) ? (int) $result['duties'] : 0,
            isset($result['sent']) ? (int) $result['sent'] : 0,
            isset($result['failed']) ? (int) $result['failed'] : 0
        );
    }

    /**
     * Odpala skrypt z hostingu (?oc_cron=token), bez czekania na odwiedziny strony.
     */
    public static function maybe_handle_cron_request() {
        if (!isset($_GET['oc_cron'])) {
            return;
        }

        $provided = sanitize_text_field(wp_unslash($_GET['oc_cron']));
        $expected = self::get_cron_token();
        if ($provided === '' || !hash_equals($expected, $provided)) {
            status_header(403);
            nocache_headers();
            header('Content-Type: text/plain; charset=UTF-8');
            echo 'OC_FORBIDDEN';
            exit;
        }

        $result = self::check_and_send_reminders('hosting');
        status_header(200);
        nocache_headers();
        header('Content-Type: text/plain; charset=UTF-8');
        echo self::format_cron_plain_result($result);
        exit;
    }
    
    /**
     * Sprawdź i wyślij emaile dla jutrzejszych dyżurów.
     *
     * @param string $source wp-cron|hosting|manual
     * @return array<string,mixed>
     */
    public static function check_and_send_reminders($source = 'wp-cron') {
        global $wpdb;

        if (!is_string($source) || $source === '') {
            $source = 'wp-cron';
        }

        $tomorrow = self::get_tomorrow_date();
        $result = array(
            'status' => 'ok',
            'tomorrow' => $tomorrow,
            'duties' => 0,
            'sent' => 0,
            'failed' => 0,
            'timezone' => self::get_timezone_label(),
        );

        if ($source === 'hosting' && !self::is_at_or_after_reminder_hour()) {
            $result['status'] = 'too_early';
            self::store_last_run($source, $result);
            self::log_email(sprintf(
                '[%s] Cron (hosting): za wcześnie (przed %02d:00, strefa %s) — jutro=%s',
                self::now_in_wp(),
                self::get_reminder_hour(),
                self::get_timezone_label(),
                $tomorrow
            ));
            return $result;
        }
        
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
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

        $result['duties'] = is_array($duties) ? count($duties) : 0;

        if (empty($duties)) {
            $result['status'] = 'no_duties';
            self::store_last_run($source, $result);
            self::log_email(sprintf(
                '[%s] Cron (%s): brak dyżurów na jutro %s (%s)',
                self::now_in_wp(),
                $source,
                $tomorrow,
                self::get_timezone_label()
            ));
            return $result;
        }
        
        $chorzy = self::get_chorzy_for_duty_date($tomorrow);
        
        foreach ($duties as $duty) {
            if (!empty($duty['osoba_glowna_email']) && is_email($duty['osoba_glowna_email'])) {
                $email_sent_key = 'oc_email_sent_' . $tomorrow . '_' . $duty['osoba_glowna_id'];
                $email_sent = get_option($email_sent_key, false);
                
                if (!$email_sent) {
                    $sent = self::send_duty_reminder(
                        $duty['osoba_glowna_email'],
                        $duty['osoba_glowna_imie'],
                        $tomorrow,
                        $chorzy,
                        'glowny'
                    );
                    if ($sent) {
                        update_option($email_sent_key, true);
                        $result['sent']++;
                    } else {
                        $result['failed']++;
                        self::log_email(sprintf(
                            "[%s] Mail do %s nieoznaczony jako wysłany — ponowienie przy następnym cronie",
                            self::now_in_wp(),
                            $duty['osoba_glowna_email']
                        ));
                    }
                }
            }
            
            if (!empty($duty['pomocnik_email']) && 
                is_email($duty['pomocnik_email']) && 
                $duty['pomocnik_email'] !== $duty['osoba_glowna_email']) {
                
                $email_sent_key = 'oc_email_sent_' . $tomorrow . '_helper_' . $duty['pomocnik_id'];
                $email_sent = get_option($email_sent_key, false);
                
                if (!$email_sent) {
                    $sent = self::send_duty_reminder(
                        $duty['pomocnik_email'],
                        $duty['pomocnik_imie'],
                        $tomorrow,
                        $chorzy,
                        'pomocnik'
                    );
                    if ($sent) {
                        update_option($email_sent_key, true);
                        $result['sent']++;
                    } else {
                        $result['failed']++;
                        self::log_email(sprintf(
                            "[%s] Mail do %s nieoznaczony jako wysłany — ponowienie przy następnym cronie",
                            self::now_in_wp(),
                            $duty['pomocnik_email']
                        ));
                    }
                }
            }
        }

        self::store_last_run($source, $result);
        self::log_email(sprintf(
            '[%s] Cron (%s): jutro=%s tz=%s dyżury=%d wysłane=%d błędy=%d',
            self::now_in_wp(),
            $source,
            $tomorrow,
            self::get_timezone_label(),
            $result['duties'],
            $result['sent'],
            $result['failed']
        ));

        return $result;
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
        
        // Pobierz URL aplikacji (dynamicznie z faktycznej strony z shortcode).
        $app_url = self::resolve_app_url();
        
        // HTML version
        $html_message = self::get_html_email($szafarz_name, $date, $liturgical_name, $chorzy, $role, $app_url);
        
        // Headers dla HTML emaila
        $headers = array('Content-Type: text/html; charset=UTF-8');
        
        // Log przed wysyłką
        $log_message = sprintf(
            "[%s] Próba wysłania emaila do: %s (%s) dla daty: %s (rola: %s)",
            self::now_in_wp(),
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
                self::now_in_wp(),
                $email,
                $szafarz_name
            );
        } else {
            $log_message = sprintf(
                "[%s] ✗ BŁĄD wysyłki emaila do: %s (%s) - wp_mail() zwróciło false",
                self::now_in_wp(),
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
                    self::now_in_wp(),
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
                }
                .header h1 { 
                    font-size: 24px; 
                    font-weight: bold;
                    color: #5a4a2d;
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
                .chorzy-table thead {
                    display: table-header-group;
                }
                .chorzy-table th {
                    background-color: #f5f0e8;
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
                .chorzy-table tbody tr:nth-child(even) {
                    background-color: #faf9f7;
                }
                .chorzy-table tbody tr:nth-child(odd) {
                    background-color: #ffffff;
                }
                .footer {
                    padding: 20px;
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    background-color: #fafafa;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Przypomnienie o dyżurze</h1>
                    <div class="date-info">
                        Data: <?php echo esc_html($date_formatted); ?> — <?php echo esc_html($liturgical_name); ?>
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
                    <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5a4a2d; font-size: 18px; font-weight: bold;">Aktualna lista chorych do odwiedzenia</h3>
                    <table class="chorzy-table">
                        <thead>
                            <tr>
                                <th>Lp.</th>
                                <th>Imię i nazwisko</th>
                                <th>Adres</th>
                                <th>Telefon</th>
                                <th>Uwagi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($chorzy as $index => $chory): ?>
                            <tr>
                                <td><?php echo (int) ($index + 1); ?></td>
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
     *
     * Codziennie o godzinie z {@see get_reminder_hour()} (domyślnie 12:00, strefa czasowa WordPressa).
     */
    public static function schedule_cron() {
        if (wp_next_scheduled('oc_daily_email_reminders')) {
            return;
        }

        $hour = self::get_reminder_hour();
        $tz = wp_timezone();
        $now = new DateTimeImmutable('now', $tz);
        $run = $now->setTime($hour, 0, 0);
        if ($run <= $now) {
            $run = $run->modify('+1 day');
        }

        wp_schedule_event($run->getTimestamp(), 'daily', 'oc_daily_email_reminders');
    }

    /**
     * Godzina przypomnień (0–23). Stała OC_EMAIL_REMINDER_HOUR lub filtr oc_email_reminder_hour.
     *
     * @return int
     */
    public static function get_reminder_hour() {
        $default = defined('OC_EMAIL_REMINDER_HOUR') ? (int) OC_EMAIL_REMINDER_HOUR : 12;
        if ($default < 0 || $default > 23) {
            $default = 12;
        }
        $hour = (int) get_option('oc_email_reminder_hour', $default);
        if ($hour < 0 || $hour > 23) {
            $hour = $default;
        }

        return (int) apply_filters('oc_email_reminder_hour', $hour);
    }

    /**
     * @param int $hour 0–23
     * @return int|WP_Error
     */
    public static function set_reminder_hour($hour) {
        $hour = (int) $hour;
        if ($hour < 0 || $hour > 23) {
            return new WP_Error('invalid_hour', 'Godzina musi być w zakresie 0–23.');
        }
        update_option('oc_email_reminder_hour', $hour, false);
        self::maybe_reschedule_cron();
        return $hour;
    }

    /**
     * Po zmianie godziny w kodzie / filtrze — usuń stary harmonogram i zaplanuj ponownie.
     */
    public static function maybe_reschedule_cron() {
        $hour = self::get_reminder_hour();
        $stored = get_option('oc_email_reminder_scheduled_hour', null);

        if ($stored !== null && (int) $stored === $hour && wp_next_scheduled('oc_daily_email_reminders')) {
            return;
        }

        self::unschedule_cron();
        update_option('oc_email_reminder_scheduled_hour', $hour);
        self::schedule_cron();
    }

    /**
     * Usuń cron job
     */
    public static function unschedule_cron() {
        wp_clear_scheduled_hook('oc_daily_email_reminders');
    }
    
    /**
     * Funkcja testowa - wyślij emaile dla określonej daty (użyteczne do testowania)
     * Można wywołać ręcznie: OC_Email_Notifications::test_send_for_date('2025-01-26');
     */
    public static function test_send_for_date($date) {
        global $wpdb;
        
        $table_kalendarz = OC_Database::get_table_name('kalendarz');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
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
        
        // Pobierz chorych zaplanowanych na wskazaną datę dyżuru.
        $chorzy = self::get_chorzy_for_duty_date($date);
        
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


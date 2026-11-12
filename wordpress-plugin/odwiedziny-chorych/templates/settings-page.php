<?php
/**
 * Strona ustawień
 */

if (!defined('ABSPATH')) {
    exit;
}

// Obsługa zmiany hasła
if (isset($_POST['oc_change_password']) && wp_verify_nonce($_POST['oc_nonce'], 'oc_change_password')) {
    $new_password = $_POST['oc_new_password'] ?? '';
    $confirm_password = $_POST['oc_confirm_password'] ?? '';
    
    $result = OC_Auth::change_admin_password($new_password, $confirm_password);
    if (is_wp_error($result)) {
        $error = $result->get_error_message();
    } else {
        $success = __('Hasło zostało zmienione.', 'odwiedziny-chorych');
    }
}

if (isset($_POST['oc_regenerate_cron_token']) && isset($_POST['oc_cron_nonce']) && wp_verify_nonce($_POST['oc_cron_nonce'], 'oc_cron_tools')) {
    OC_Email_Notifications::regenerate_cron_token();
    $success = __('Wygenerowano nowy adres crona. Wklej go w panelu hostingu w miejsce poprzedniego.', 'odwiedziny-chorych');
}

if (isset($_POST['oc_run_reminders_now']) && isset($_POST['oc_cron_nonce']) && wp_verify_nonce($_POST['oc_cron_nonce'], 'oc_cron_tools')) {
    $run = OC_Email_Notifications::check_and_send_reminders('manual');
    $success = sprintf(
        /* translators: 1: tomorrow date, 2: timezone, 3: duties, 4: sent, 5: failed */
        __('Uruchomiono przypomnienia. Jutro: %1$s (%2$s), dyżury: %3$d, wysłane: %4$d, błędy: %5$d.', 'odwiedziny-chorych'),
        $run['tomorrow'] ?? '',
        $run['timezone'] ?? '',
        isset($run['duties']) ? (int) $run['duties'] : 0,
        isset($run['sent']) ? (int) $run['sent'] : 0,
        isset($run['failed']) ? (int) $run['failed'] : 0
    );
}

if (isset($_POST['oc_save_reminder_hour']) && isset($_POST['oc_mail_nonce']) && wp_verify_nonce($_POST['oc_mail_nonce'], 'oc_mail_tools')) {
    $saved_hour = OC_Email_Notifications::set_reminder_hour($_POST['oc_reminder_hour'] ?? 12);
    if (is_wp_error($saved_hour)) {
        $error = $saved_hour->get_error_message();
    } else {
        $success = sprintf(
            /* translators: %s: hour HH:00 */
            __('Zapisano godzinę przypomnień: %s.', 'odwiedziny-chorych'),
            sprintf('%02d:00', $saved_hour)
        );
    }
}

if (isset($_POST['oc_test_email']) && isset($_POST['oc_mail_nonce']) && wp_verify_nonce($_POST['oc_mail_nonce'], 'oc_mail_tools')) {
    $test_date = sanitize_text_field(wp_unslash($_POST['oc_test_email_date'] ?? ''));
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $test_date)) {
        $error = __('Podaj datę dyżuru w formacie RRRR-MM-DD.', 'odwiedziny-chorych');
    } else {
        $test = OC_Email_Notifications::test_send_for_date($test_date);
        if (empty($test['success'])) {
            $error = $test['message'] ?? __('Nie udało się wysłać testu.', 'odwiedziny-chorych');
        } else {
            $sent = array();
            foreach ((array) ($test['sent_emails'] ?? array()) as $item) {
                $label = ($item['name'] ?? '') . ' <' . ($item['email'] ?? '') . '>';
                $sent[] = !empty($item['success']) ? $label : $label . ' — błąd';
            }
            $success = empty($sent)
                ? sprintf(__('Na %s nie było adresów e-mail przy dyżurze.', 'odwiedziny-chorych'), $test_date)
                : sprintf(
                    /* translators: 1: date, 2: list of recipients */
                    __('Wysłano test na %1$s: %2$s', 'odwiedziny-chorych'),
                    $test_date,
                    implode('; ', $sent)
                );
        }
    }
}

if (isset($_POST['oc_import_data']) && isset($_POST['oc_import_nonce']) && wp_verify_nonce($_POST['oc_import_nonce'], 'oc_import_backup')) {
    if (empty($_POST['oc_import_confirm'])) {
        $error = __('Zaznacz potwierdzenie, że kopia nadpisze obecne dane.', 'odwiedziny-chorych');
    } elseif (empty($_FILES['oc_import_file']['tmp_name']) || !is_uploaded_file($_FILES['oc_import_file']['tmp_name'])) {
        $error = __('Nie wybrano pliku JSON.', 'odwiedziny-chorych');
    } elseif ((int) ($_FILES['oc_import_file']['size'] ?? 0) > 8 * 1024 * 1024) {
        $error = __('Plik jest za duży (maks. 8 MB).', 'odwiedziny-chorych');
    } else {
        $raw = file_get_contents($_FILES['oc_import_file']['tmp_name']);
        $decoded = json_decode((string) $raw, true);
        if (!is_array($decoded)) {
            $error = __('Nieprawidłowy plik JSON.', 'odwiedziny-chorych');
        } else {
            $imported = OC_Backup::import_payload($decoded);
            if (is_wp_error($imported)) {
                $error = $imported->get_error_message();
            } else {
                $success = __('Dane z kopii zostały wgrane. Odśwież stronę aplikacji (Ctrl+F5).', 'odwiedziny-chorych');
            }
        }
    }
}

$uses_default_password = OC_Auth::uses_default_admin_password();

$reminder_hour = OC_Email_Notifications::get_reminder_hour();
$cron_url = OC_Email_Notifications::get_cron_url();
$tz_label = OC_Email_Notifications::get_timezone_label();
$tomorrow = OC_Email_Notifications::get_tomorrow_date();
$last_run = OC_Email_Notifications::get_last_run();
$next_ts = wp_next_scheduled('oc_daily_email_reminders');
$next_label = $next_ts
    ? (new DateTimeImmutable('@' . (int) $next_ts))->setTimezone(OC_Email_Notifications::get_wp_timezone())->format('Y-m-d H:i')
    : '';
$wp_cron_disabled = defined('DISABLE_WP_CRON') && DISABLE_WP_CRON;
$crontab = sprintf("0 %d * * * curl -fsS '%s'", $reminder_hour, $cron_url);
$source_labels = array(
    'hosting' => __('skrypt na hostingu', 'odwiedziny-chorych'),
    'wp-cron' => __('odwiedziny strony', 'odwiedziny-chorych'),
    'manual' => __('ręczne uruchomienie z panelu', 'odwiedziny-chorych'),
);
$hosting_fresh = false;
if (!empty($last_run['at']) && ($last_run['source'] ?? '') === 'hosting') {
    try {
        $last_dt = new DateTimeImmutable($last_run['at'], OC_Email_Notifications::get_wp_timezone());
        $hosting_fresh = $last_dt >= (new DateTimeImmutable('now', OC_Email_Notifications::get_wp_timezone()))->modify('-36 hours');
    } catch (Exception $e) {
        $hosting_fresh = false;
    }
}

$export_url = wp_nonce_url(admin_url('admin-post.php?action=oc_export_backup'), 'oc_export_backup');
$test_date_value = !empty($test_date) ? $test_date : $tomorrow;
global $wpdb;
$liczba_chorych = (int) $wpdb->get_var('SELECT COUNT(*) FROM ' . OC_Database::get_table_name('chorzy'));
$liczba_szafarzy = (int) $wpdb->get_var('SELECT COUNT(*) FROM ' . OC_Database::get_table_name('szafarze') . ' WHERE aktywny = 1');
?>

<div class="wrap">
    <h1><?php _e('Ustawienia - Odwiedziny Chorych', 'odwiedziny-chorych'); ?></h1>
    
    <?php if (!empty($error)): ?>
        <div class="notice notice-error"><p><?php echo esc_html($error); ?></p></div>
    <?php endif; ?>
    
    <?php if (!empty($success)): ?>
        <div class="notice notice-success"><p><?php echo esc_html($success); ?></p></div>
    <?php endif; ?>

    <?php if ($uses_default_password): ?>
        <div class="notice notice-warning">
            <p><?php _e('Administrator aplikacji nadal używa hasła startowego z dokumentacji. Zmień je poniżej, zanim aplikacja pójdzie na produkcję.', 'odwiedziny-chorych'); ?></p>
        </div>
    <?php endif; ?>

    <div class="oc-admin-section">
        <h2><?php _e('Aplikacja na stronie', 'odwiedziny-chorych'); ?></h2>
        <p>
            <?php _e('Aby wyświetlić aplikację, wstaw na stronie shortcode:', 'odwiedziny-chorych'); ?>
            <code>[odwiedziny_chorych]</code>
        </p>
        <p>
            <?php
            printf(
                /* translators: 1: patients count, 2: ministers count */
                esc_html__('W bazie: %1$d chorych, %2$d aktywnych szafarzy.', 'odwiedziny-chorych'),
                $liczba_chorych,
                $liczba_szafarzy
            );
            ?>
        </p>
    </div>
    
    <form method="post" action="">
        <?php wp_nonce_field('oc_change_password', 'oc_nonce'); ?>
        
        <h2><?php _e('Zmiana hasła', 'odwiedziny-chorych'); ?></h2>
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="oc_new_password"><?php _e('Nowe hasło', 'odwiedziny-chorych'); ?></label>
                </th>
                <td>
                    <input type="password" name="oc_new_password" id="oc_new_password" class="regular-text" required>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="oc_confirm_password"><?php _e('Potwierdź hasło', 'odwiedziny-chorych'); ?></label>
                </th>
                <td>
                    <input type="password" name="oc_confirm_password" id="oc_confirm_password" class="regular-text" required>
                </td>
            </tr>
        </table>
        
        <p class="submit">
            <input type="submit" name="oc_change_password" class="button button-primary" value="<?php _e('Zmień hasło', 'odwiedziny-chorych'); ?>">
        </p>
    </form>

    <hr>

    <h2><?php _e('Przypomnienia e-mail o dyżurze', 'odwiedziny-chorych'); ?></h2>
    <p>
        <?php
        printf(
            /* translators: 1: hour HH:00, 2: timezone label */
            esc_html__('Mail „jutro masz dyżur” wychodzi codziennie od godziny %1$s, według strefy WordPressa (%2$s). „Jutro” to następny dzień w tej strefie, nie czas serwera PHP.', 'odwiedziny-chorych'),
            esc_html(sprintf('%02d:00', $reminder_hour)),
            esc_html($tz_label)
        );
        ?>
        <a href="<?php echo esc_url(admin_url('options-general.php')); ?>"><?php _e('Ustawienia → Ogólne → Strefa czasowa', 'odwiedziny-chorych'); ?></a>
    </p>

    <form method="post" action="">
        <?php wp_nonce_field('oc_mail_tools', 'oc_mail_nonce'); ?>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="oc_reminder_hour"><?php _e('Godzina wysyłki', 'odwiedziny-chorych'); ?></label></th>
                <td>
                    <select name="oc_reminder_hour" id="oc_reminder_hour">
                        <?php for ($h = 0; $h <= 23; $h++): ?>
                            <option value="<?php echo (int) $h; ?>" <?php selected($reminder_hour, $h); ?>>
                                <?php echo esc_html(sprintf('%02d:00', $h)); ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                    <input type="submit" name="oc_save_reminder_hour" class="button" value="<?php esc_attr_e('Zapisz godzinę', 'odwiedziny-chorych'); ?>">
                    <p class="description"><?php _e('Hosting i crontab powinny używać tej samej godziny.', 'odwiedziny-chorych'); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="oc_test_email_date"><?php _e('Test wysyłki', 'odwiedziny-chorych'); ?></label></th>
                <td>
                    <input type="date" name="oc_test_email_date" id="oc_test_email_date" value="<?php echo esc_attr($test_date_value); ?>">
                    <input type="submit" name="oc_test_email" class="button" value="<?php esc_attr_e('Wyślij test na tę datę', 'odwiedziny-chorych'); ?>" onclick="return confirm('<?php echo esc_js(__('To wyśle prawdziwe maile do szafarzy z wpisanym adresem na wybrany dyżur.', 'odwiedziny-chorych')); ?>');">
                    <p class="description"><?php _e('Nie oznacza maila jako „wysłany” przez codzienny cron — ten sam dyżur może dostać przypomnienie jeszcze raz o stałej godzinie.', 'odwiedziny-chorych'); ?></p>
                </td>
            </tr>
        </table>
    </form>
    <p>
        <?php _e('Sam WordPress nie ma budzika: zadanie czeka, aż ktoś otworzy stronę. Żeby mail poszedł w sobotę w południe, a nie dopiero w niedzielę po Mszy, hosting musi odpalać poniższy adres codziennie o tej godzinie — niezależnie od odwiedzin.', 'odwiedziny-chorych'); ?>
    </p>

    <?php if ($wp_cron_disabled && !$hosting_fresh): ?>
        <div class="notice notice-error inline">
            <p><?php _e('W wp-config.php włączono DISABLE_WP_CRON. Bez skryptu na hostingu przypomnienia w ogóle nie wyjdą.', 'odwiedziny-chorych'); ?></p>
        </div>
    <?php elseif ($hosting_fresh): ?>
        <div class="notice notice-success inline">
            <p><?php _e('Hosting odpala skrypt samodzielnie. Przypomnienia nie czekają na wejście na stronę.', 'odwiedziny-chorych'); ?></p>
        </div>
    <?php else: ?>
        <div class="notice notice-warning inline">
            <p><?php _e('Brak sygnału ze skryptu hostingu z ostatnich 36 godzin. Przypomnienia zależą od tego, czy ktoś otworzy stronę po godzinie wysyłki.', 'odwiedziny-chorych'); ?></p>
        </div>
    <?php endif; ?>

    <table class="form-table">
        <tr>
            <th scope="row"><?php _e('Adres dla crona na hostingu', 'odwiedziny-chorych'); ?></th>
            <td>
                <input type="text" class="large-text code" readonly value="<?php echo esc_attr($cron_url); ?>" onclick="this.select();">
                <p class="description">
                    <?php _e('W panelu hostingu (Cron Jobs / Zadania cron) wklej ten adres. Harmonogram: codziennie o godzinie przypomnienia, w tej samej strefie co WordPress. Jeśli hosting ma pole URL, wklej sam adres (bez curl). Nie włączaj cache dla tego adresu i nie publikuj linku — kto go zna, może odpalić wysyłkę.', 'odwiedziny-chorych'); ?>
                </p>
            </td>
        </tr>
        <tr>
            <th scope="row"><?php _e('Przykład crontab', 'odwiedziny-chorych'); ?></th>
            <td>
                <input type="text" class="large-text code" readonly value="<?php echo esc_attr($crontab); ?>" onclick="this.select();">
            </td>
        </tr>
        <tr>
            <th scope="row"><?php _e('Jutro według WordPressa', 'odwiedziny-chorych'); ?></th>
            <td><code><?php echo esc_html($tomorrow); ?></code></td>
        </tr>
        <tr>
            <th scope="row"><?php _e('Ostatnie uruchomienie', 'odwiedziny-chorych'); ?></th>
            <td>
                <?php if (empty($last_run['at'])): ?>
                    <?php _e('Jeszcze nie było.', 'odwiedziny-chorych'); ?>
                <?php else: ?>
                    <?php
                    $source_key = $last_run['source'] ?? '';
                    $source_label = $source_labels[$source_key] ?? $source_key;
                    printf(
                        /* translators: 1: datetime, 2: source, 3: tomorrow date, 4: duties, 5: sent, 6: failed */
                        esc_html__('%1$s (%2$s). Jutro: %3$s, dyżury: %4$d, wysłane: %5$d, błędy: %6$d.', 'odwiedziny-chorych'),
                        esc_html($last_run['at']),
                        esc_html($source_label),
                        esc_html($last_run['tomorrow'] ?? ''),
                        isset($last_run['duties']) ? (int) $last_run['duties'] : 0,
                        isset($last_run['sent']) ? (int) $last_run['sent'] : 0,
                        isset($last_run['failed']) ? (int) $last_run['failed'] : 0
                    );
                    ?>
                <?php endif; ?>
            </td>
        </tr>
        <tr>
            <th scope="row"><?php _e('Zapasowe zadanie WordPressa', 'odwiedziny-chorych'); ?></th>
            <td>
                <?php if ($next_label): ?>
                    <?php
                    printf(
                        /* translators: %s: next run datetime */
                        esc_html__('Najbliższe wp-cron: %s. Zadziała przy odwiedzinach strony, jeśli hosting nie zdąży wcześniej. To tylko zapas.', 'odwiedziny-chorych'),
                        esc_html($next_label)
                    );
                    ?>
                <?php else: ?>
                    <?php _e('Brak zaplanowanego wp-cron.', 'odwiedziny-chorych'); ?>
                <?php endif; ?>
            </td>
        </tr>
    </table>

    <form method="post" action="">
        <?php wp_nonce_field('oc_cron_tools', 'oc_cron_nonce'); ?>
        <p class="submit">
            <input type="submit" name="oc_run_reminders_now" class="button" value="<?php esc_attr_e('Wyślij przypomnienia za jutro teraz', 'odwiedziny-chorych'); ?>" onclick="return confirm('<?php echo esc_js(__('Wysłać teraz maile za jutrzejsze dyżury do szafarzy z adresem e-mail?', 'odwiedziny-chorych')); ?>');">
            <input type="submit" name="oc_regenerate_cron_token" class="button" value="<?php esc_attr_e('Wygeneruj nowy adres crona', 'odwiedziny-chorych'); ?>" onclick="return confirm('<?php echo esc_js(__('Stary adres przestanie działać. Trzeba będzie wkleić nowy w panelu hostingu.', 'odwiedziny-chorych')); ?>');">
        </p>
    </form>

    <hr>

    <h2><?php _e('Kopia zapasowa (plik JSON)', 'odwiedziny-chorych'); ?></h2>
    <p><?php _e('Pobierz listę chorych, szafarzy, kalendarz, Adwent i historię na komputer albo pendrive. Aplikacja nie trzyma drugiej kopii w chmurze. Plik zawiera adresy, telefony i hasła w postaci skrótu — nie wysyłaj go mailem.', 'odwiedziny-chorych'); ?></p>
    <p>
        <a class="button button-primary" href="<?php echo esc_url($export_url); ?>"><?php _e('Pobierz kopię zapasową', 'odwiedziny-chorych'); ?></a>
    </p>

    <h3><?php _e('Wgraj kopię', 'odwiedziny-chorych'); ?></h3>
    <p><?php _e('Wgranie pliku nadpisze obecne dane w bazie. Najpierw pobierz aktualną kopię.', 'odwiedziny-chorych'); ?></p>
    <form method="post" action="" enctype="multipart/form-data">
        <?php wp_nonce_field('oc_import_backup', 'oc_import_nonce'); ?>
        <p>
            <input type="file" name="oc_import_file" accept="application/json,.json" required>
        </p>
        <p>
            <label>
                <input type="checkbox" name="oc_import_confirm" value="1" required>
                <?php _e('Potwierdzam, że chcę nadpisać istniejące dane', 'odwiedziny-chorych'); ?>
            </label>
        </p>
        <p class="submit">
            <input type="submit" name="oc_import_data" class="button" value="<?php esc_attr_e('Importuj dane', 'odwiedziny-chorych'); ?>">
        </p>
    </form>
</div>



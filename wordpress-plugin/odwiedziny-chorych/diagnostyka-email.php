<?php
/**
 * Narzędzie diagnostyczne do sprawdzania wysyłki emaili
 * 
 * Użycie: 
 * http://twoja-strona.local/wp-content/plugins/odwiedziny-chorych/diagnostyka-email.php
 * 
 * UWAGA: Usuń ten plik w produkcji!
 */

// Ładuj WordPress
require_once('../../../wp-load.php');

// Sprawdź czy użytkownik jest zalogowany jako administrator
if (!current_user_can('manage_options')) {
    die('Brak uprawnień. Musisz być zalogowany jako administrator WordPress.');
}

header('Content-Type: text/html; charset=UTF-8');

// Funkcje pomocnicze
function check_log_file() {
    $log_file = WP_CONTENT_DIR . '/oc-email-logs.txt';
    $info = array(
        'exists' => file_exists($log_file),
        'path' => $log_file,
        'size' => file_exists($log_file) ? filesize($log_file) : 0,
        'readable' => file_exists($log_file) ? is_readable($log_file) : false,
        'writable' => is_writable(dirname($log_file)),
        'last_modified' => file_exists($log_file) ? date('Y-m-d H:i:s', filemtime($log_file)) : null,
        'content' => array()
    );
    
    if ($info['exists'] && $info['readable']) {
        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $info['content'] = array_slice(array_reverse($lines), 0, 20); // Ostatnie 20 linii
        $info['total_lines'] = count($lines);
    }
    
    return $info;
}

function test_wp_mail() {
    $test_email = isset($_GET['test_email']) ? sanitize_email($_GET['test_email']) : get_option('admin_email');
    $result = array(
        'email' => $test_email,
        'wp_mail_exists' => function_exists('wp_mail'),
        'mail_function_exists' => function_exists('mail'),
        'result' => false,
        'errors' => array(),
        'warnings' => array()
    );
    
    if (!$result['wp_mail_exists']) {
        $result['errors'][] = 'Funkcja wp_mail() nie istnieje w WordPress!';
        return $result;
    }
    
    if (!$result['mail_function_exists']) {
        $result['warnings'][] = 'Funkcja PHP mail() nie jest dostępna. WordPress potrzebuje plugin SMTP.';
    }
    
    // Próbuj wysłać testowy email
    $subject = 'Test email - Odwiedziny Chorych - ' . date('Y-m-d H:i:s');
    $message = 'To jest testowy email z systemu Odwiedziny Chorych.';
    $headers = array('Content-Type: text/html; charset=UTF-8');
    
    // Przechwyć output
    ob_start();
    $test_result = @wp_mail($test_email, $subject, $message, $headers);
    $output = ob_get_clean();
    
    $result['result'] = $test_result;
    
    if (!$test_result) {
        $result['errors'][] = 'wp_mail() zwróciło FALSE - email nie został wysłany.';
        
        // Sprawdź błędy PHP
        $php_error = error_get_last();
        if ($php_error && $php_error['message']) {
            $result['errors'][] = 'Błąd PHP: ' . $php_error['message'];
        }
        
        if ($output) {
            $result['warnings'][] = 'Output podczas wysyłki: ' . $output;
        }
    } else {
        $result['success'] = true;
        $result['message'] = 'Email został wysłany pomyślnie (według wp_mail()).';
    }
    
    // Sprawdź filtry WordPress
    global $phpmailer;
    if (isset($phpmailer) && is_object($phpmailer)) {
        $result['phpmailer_class'] = get_class($phpmailer);
        
        if (property_exists($phpmailer, 'ErrorInfo') && !empty($phpmailer->ErrorInfo)) {
            $result['errors'][] = 'PHPMailer Error: ' . $phpmailer->ErrorInfo;
        }
    }
    
    return $result;
}

function get_smtp_plugins() {
    $active_plugins = get_option('active_plugins', array());
    $smtp_plugins = array(
        'wp-mail-smtp/wp_mail_smtp.php' => 'WP Mail SMTP',
        'easy-wp-smtp/easy-wp-smtp.php' => 'Easy WP SMTP',
        'post-smtp/postman-smtp.php' => 'Post SMTP',
        'smtp-mailer/main.php' => 'SMTP Mailer'
    );
    
    $found = array();
    foreach ($smtp_plugins as $plugin => $name) {
        if (in_array($plugin, $active_plugins)) {
            $found[] = $name;
        }
    }
    
    return $found;
}

function check_cron_status() {
    $cron_hook = 'oc_daily_email_reminders';
    $crons = _get_cron_array();
    $next_run = false;
    
    if ($crons) {
        foreach ($crons as $timestamp => $cron) {
            if (isset($cron[$cron_hook])) {
                $next_run = $timestamp;
                break;
            }
        }
    }
    
    return array(
        'scheduled' => $next_run !== false,
        'next_run' => $next_run ? date('Y-m-d H:i:s', $next_run) : null,
        'time_until' => $next_run ? human_time_diff(time(), $next_run) : null
    );
}

// Wykonaj testy
$log_info = check_log_file();
$mail_test = null;
$test_triggered = isset($_GET['test']) && $_GET['test'] === '1';

if ($test_triggered) {
    $mail_test = test_wp_mail();
    // Zapisz wynik do logów
    $log_file = WP_CONTENT_DIR . '/oc-email-logs.txt';
    $log_message = sprintf(
        "[%s] TEST - Próba wysłania testowego emaila do: %s - Wynik: %s\n",
        date('Y-m-d H:i:s'),
        $mail_test['email'],
        $mail_test['result'] ? 'SUKCES' : 'BŁĄD'
    );
    if ($mail_test['errors']) {
        $log_message .= "  Błędy: " . implode(', ', $mail_test['errors']) . "\n";
    }
    file_put_contents($log_file, $log_message, FILE_APPEND);
}

$smtp_plugins = get_smtp_plugins();
$cron_status = check_cron_status();
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Diagnostyka emaili - Odwiedziny Chorych</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            max-width: 1200px; 
            margin: 0 auto; 
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h1 { 
            color: #6d5c3d; 
            margin-top: 0; 
        }
        h2 {
            color: #5a4a2d;
            border-bottom: 2px solid #6d5c3d;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        .status {
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid;
        }
        .status.success {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        .status.error {
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }
        .status.warning {
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }
        .status.info {
            background: #d1ecf1;
            border-color: #17a2b8;
            color: #0c5460;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
        }
        th {
            background: #6d5c3d;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .btn {
            background: #6d5c3d;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
            margin: 10px 5px 10px 0;
        }
        .btn:hover {
            background: #5a4a2d;
        }
        .btn-danger {
            background: #d32f2f;
        }
        .btn-danger:hover {
            background: #b71c1c;
        }
        .log-content {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 400px;
            overflow-y: auto;
            margin: 10px 0;
        }
        .log-entry {
            margin: 3px 0;
            padding: 3px 0;
        }
        .log-success { color: #81c784; }
        .log-error { color: #e57373; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
        .info-box {
            background: #e3f2fd;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #2196f3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Diagnostyka wysyłki emaili</h1>
        
        <div class="info-box">
            <strong>Informacja:</strong> To narzędzie pomoże zdiagnozować problemy z wysyłką emaili.<br>
            Jeśli email nie dotarł, sprawdź poniższe sekcje, aby znaleźć przyczynę.
        </div>
        
        <a href="?test=1&test_email=<?php echo esc_attr(isset($_GET['test_email']) ? $_GET['test_email'] : get_option('admin_email')); ?>" class="btn">
            🧪 Wyślij testowy email
        </a>
        <a href="view-email-logs.php" class="btn">
            📋 Zobacz logi emaili
        </a>
        <a href="diagnostyka-email.php" class="btn">
            🔄 Odśwież
        </a>
    </div>
    
    <!-- Test wysyłki -->
    <?php if ($test_triggered && $mail_test): ?>
    <div class="container">
        <h2>Test wysyłki emaila</h2>
        
        <?php if ($mail_test['result']): ?>
            <div class="status success">
                <strong>✓ SUKCES:</strong> Funkcja wp_mail() zwróciła TRUE.<br>
                <small>Email został zaakceptowany przez system WordPress. Sprawdź skrzynkę pocztową (również folder SPAM).</small>
            </div>
        <?php else: ?>
            <div class="status error">
                <strong>✗ BŁĄD:</strong> Funkcja wp_mail() zwróciła FALSE.<br>
                <small>Email nie został wysłany. Zobacz szczegóły poniżej.</small>
            </div>
        <?php endif; ?>
        
        <table>
            <tr>
                <th>Właściwość</th>
                <th>Wartość</th>
            </tr>
            <tr>
                <td>Email testowy</td>
                <td><code><?php echo esc_html($mail_test['email']); ?></code></td>
            </tr>
            <tr>
                <td>wp_mail() istnieje</td>
                <td><?php echo $mail_test['wp_mail_exists'] ? '✓ Tak' : '✗ Nie'; ?></td>
            </tr>
            <tr>
                <td>mail() PHP istnieje</td>
                <td><?php echo $mail_test['mail_function_exists'] ? '✓ Tak' : '✗ Nie'; ?></td>
            </tr>
            <tr>
                <td>Wynik wysyłki</td>
                <td><?php echo $mail_test['result'] ? '✓ TRUE (sukces)' : '✗ FALSE (błąd)'; ?></td>
            </tr>
            <?php if (isset($mail_test['phpmailer_class'])): ?>
            <tr>
                <td>Klasa PHPMailer</td>
                <td><code><?php echo esc_html($mail_test['phpmailer_class']); ?></code></td>
            </tr>
            <?php endif; ?>
        </table>
        
        <?php if (!empty($mail_test['errors'])): ?>
            <div class="status error">
                <strong>Błędy:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <?php foreach ($mail_test['errors'] as $error): ?>
                        <li><?php echo esc_html($error); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($mail_test['warnings'])): ?>
            <div class="status warning">
                <strong>Ostrzeżenia:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <?php foreach ($mail_test['warnings'] as $warning): ?>
                        <li><?php echo esc_html($warning); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <?php if (!$mail_test['mail_function_exists']): ?>
            <div class="status warning">
                <strong>⚠️ Rekomendacja:</strong><br>
                Funkcja PHP mail() nie jest dostępna. To jest normalne w środowisku lokalnym (LocalWP) i wielu hostingach.<br>
                <strong>Rozwiązanie:</strong> Zainstaluj plugin SMTP (np. WP Mail SMTP) i skonfiguruj zewnętrzny serwer SMTP.
            </div>
        <?php endif; ?>
    </div>
    <?php endif; ?>
    
    <!-- Status pluginu SMTP -->
    <div class="container">
        <h2>Pluginy SMTP</h2>
        
        <?php if (empty($smtp_plugins)): ?>
            <div class="status warning">
                <strong>⚠️ Nie znaleziono aktywnych pluginów SMTP</strong><br>
                W środowisku lokalnym i wielu hostingach domyślna funkcja mail() PHP nie działa.<br>
                <strong>Rozwiązanie:</strong> Zainstaluj plugin SMTP:
                <ul style="margin: 10px 0 0 20px;">
                    <li><strong>WP Mail SMTP</strong> (zalecane) - darmowy, łatwy w konfiguracji</li>
                    <li>Easy WP SMTP</li>
                    <li>Post SMTP</li>
                </ul>
            </div>
        <?php else: ?>
            <div class="status success">
                <strong>✓ Znaleziono aktywne pluginy SMTP:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <?php foreach ($smtp_plugins as $plugin): ?>
                        <li><?php echo esc_html($plugin); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Status cron -->
    <div class="container">
        <h2>Status cron (automatyczne wysyłanie)</h2>
        
        <table>
            <tr>
                <th>Właściwość</th>
                <th>Wartość</th>
            </tr>
            <tr>
                <td>Cron zaplanowany</td>
                <td><?php echo $cron_status['scheduled'] ? '✓ Tak' : '✗ Nie'; ?></td>
            </tr>
            <?php if ($cron_status['next_run']): ?>
            <tr>
                <td>Następne uruchomienie</td>
                <td><?php echo esc_html($cron_status['next_run']); ?> (za <?php echo esc_html($cron_status['time_until']); ?>)</td>
            </tr>
            <?php endif; ?>
        </table>
        
        <?php if (!$cron_status['scheduled']): ?>
            <div class="status warning">
                <strong>⚠️ Cron nie jest zaplanowany</strong><br>
                Automatyczne wysyłanie emaili nie będzie działać. Sprawdź czy plugin został poprawnie aktywowany.
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Status logów -->
    <div class="container">
        <h2>Status pliku logów</h2>
        
        <table>
            <tr>
                <th>Właściwość</th>
                <th>Wartość</th>
            </tr>
            <tr>
                <td>Plik istnieje</td>
                <td><?php echo $log_info['exists'] ? '✓ Tak' : '✗ Nie'; ?></td>
            </tr>
            <tr>
                <td>Ścieżka</td>
                <td><code><?php echo esc_html($log_info['path']); ?></code></td>
            </tr>
            <tr>
                <td>Rozmiar</td>
                <td><?php echo esc_html(number_format($log_info['size'] / 1024, 2)); ?> KB</td>
            </tr>
            <tr>
                <td>Czytelny</td>
                <td><?php echo $log_info['readable'] ? '✓ Tak' : '✗ Nie'; ?></td>
            </tr>
            <tr>
                <td>Katalog zapisywalny</td>
                <td><?php echo $log_info['writable'] ? '✓ Tak' : '✗ Nie'; ?></td>
            </tr>
            <?php if ($log_info['last_modified']): ?>
            <tr>
                <td>Ostatnia modyfikacja</td>
                <td><?php echo esc_html($log_info['last_modified']); ?></td>
            </tr>
            <?php endif; ?>
            <?php if (isset($log_info['total_lines'])): ?>
            <tr>
                <td>Liczba wpisów</td>
                <td><?php echo esc_html($log_info['total_lines']); ?></td>
            </tr>
            <?php endif; ?>
        </table>
        
        <?php if (!$log_info['exists']): ?>
            <div class="status info">
                Plik logów jeszcze nie istnieje. Zostanie utworzony przy pierwszej próbie wysyłki emaila.
            </div>
        <?php elseif (!empty($log_info['content'])): ?>
            <h3>Ostatnie wpisy w logach:</h3>
            <div class="log-content">
                <?php foreach ($log_info['content'] as $line): ?>
                    <?php
                    $class = '';
                    if (strpos($line, '✓') !== false || strpos($line, 'WYSLANY') !== false || strpos($line, 'SUKCES') !== false) {
                        $class = 'log-success';
                    } elseif (strpos($line, '✗') !== false || strpos($line, 'BŁĄD') !== false || strpos($line, 'BŁĄD') !== false) {
                        $class = 'log-error';
                    }
                    ?>
                    <div class="log-entry <?php echo $class; ?>"><?php echo esc_html($line); ?></div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Formularz testowy -->
    <div class="container">
        <h2>Wyślij testowy email do innego adresu</h2>
        <form method="GET" action="">
            <input type="hidden" name="test" value="1">
            <p>
                <label>Email testowy:</label><br>
                <input type="email" name="test_email" value="<?php echo esc_attr(isset($_GET['test_email']) ? $_GET['test_email'] : get_option('admin_email')); ?>" style="width: 300px; padding: 8px; margin-top: 5px;">
            </p>
            <button type="submit" class="btn">📧 Wyślij testowy email</button>
        </form>
    </div>
    
    <div class="container" style="margin-top: 30px; font-size: 12px; color: #999;">
        <strong>Uwaga bezpieczeństwa:</strong> Ten plik powinien zostać usunięty w środowisku produkcyjnym!<br>
        <a href="<?php echo admin_url(); ?>">← Powrót do panelu WordPress</a>
    </div>
</body>
</html>



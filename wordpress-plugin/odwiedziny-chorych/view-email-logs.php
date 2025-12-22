<?php
/**
 * Wyświetl logi emaili
 * 
 * UWAGA: Usuń ten plik w produkcji!
 */

// Ładuj WordPress
require_once('../../../wp-load.php');

// Sprawdź czy użytkownik jest zalogowany jako administrator
if (!current_user_can('manage_options')) {
    die('Brak uprawnień. Musisz być zalogowany jako administrator WordPress.');
}

$log_file = WP_CONTENT_DIR . '/oc-email-logs.txt';
$logs = array();
$clear_logs = isset($_GET['clear']) && $_GET['clear'] === '1';

// Wyczyść logi jeśli żądane
if ($clear_logs && isset($_GET['_wpnonce']) && wp_verify_nonce($_GET['_wpnonce'], 'clear_email_logs')) {
    if (file_exists($log_file)) {
        file_put_contents($log_file, '');
    }
    wp_redirect(remove_query_arg(array('clear', '_wpnonce')));
    exit;
}

// Wczytaj logi
if (file_exists($log_file)) {
    $logs = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $logs = array_reverse($logs); // Najnowsze na górze
    $logs = array_slice($logs, 0, 100); // Ostatnie 100 wpisów
} else {
    $logs = array('Brak logów. Jeszcze żaden email nie został wysłany.');
}

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Logi emaili - Odwiedziny Chorych</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
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
        }
        h1 { 
            color: #6d5c3d; 
            margin-top: 0; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .btn {
            background: #6d5c3d;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
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
        .logs {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 4px;
            max-height: 600px;
            overflow-y: auto;
            font-size: 13px;
            line-height: 1.6;
            margin: 20px 0;
        }
        .log-entry {
            margin: 5px 0;
            padding: 5px;
            border-left: 3px solid transparent;
        }
        .log-entry:hover {
            background: #2d2d2d;
        }
        .log-success {
            border-left-color: #4caf50;
            color: #81c784;
        }
        .log-error {
            border-left-color: #f44336;
            color: #e57373;
        }
        .log-info {
            border-left-color: #2196f3;
            color: #64b5f6;
        }
        .info-box {
            background: #e3f2fd;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #2196f3;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .stat-box {
            flex: 1;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #6d5c3d;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            📧 Logi emaili - Odwiedziny Chorych
            <a href="?clear=1&_wpnonce=<?php echo wp_create_nonce('clear_email_logs'); ?>" 
               class="btn btn-danger" 
               onclick="return confirm('Czy na pewno chcesz wyczyścić logi?');">
                Wyczyść logi
            </a>
        </h1>
        
        <?php
        $total_logs = count($logs);
        $success_count = 0;
        $error_count = 0;
        foreach ($logs as $log) {
            if (strpos($log, '✓') !== false || strpos($log, 'WYSLANY') !== false) {
                $success_count++;
            } elseif (strpos($log, '✗') !== false || strpos($log, 'BŁĄD') !== false) {
                $error_count++;
            }
        }
        ?>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-number"><?php echo $total_logs; ?></div>
                <div class="stat-label">Wszystkie wpisy</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" style="color: #4caf50;"><?php echo $success_count; ?></div>
                <div class="stat-label">Wysłane pomyślnie</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" style="color: #f44336;"><?php echo $error_count; ?></div>
                <div class="stat-label">Błędy</div>
            </div>
        </div>
        
        <div class="info-box">
            <strong>Informacja:</strong> Logi są automatycznie zapisywane przy każdej próbie wysłania emaila.<br>
            Lokalizacja pliku: <code><?php echo esc_html($log_file); ?></code><br>
            Wyświetlane są ostatnie 100 wpisów. Najnowsze na górze.
        </div>
        
        <div class="logs">
            <?php if (empty($logs) || (count($logs) === 1 && strpos($logs[0], 'Brak logów') !== false)): ?>
                <div class="log-entry log-info">Brak logów. Jeszcze żaden email nie został wysłany.</div>
            <?php else: ?>
                <?php foreach ($logs as $log): ?>
                    <?php
                    $class = 'log-info';
                    if (strpos($log, '✓') !== false || strpos($log, 'WYSLANY') !== false) {
                        $class = 'log-success';
                    } elseif (strpos($log, '✗') !== false || strpos($log, 'BŁĄD') !== false || strpos($log, 'błąd') !== false) {
                        $class = 'log-error';
                    }
                    ?>
                    <div class="log-entry <?php echo $class; ?>">
                        <?php echo esc_html($log); ?>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        
        <div style="margin-top: 20px; font-size: 12px; color: #999;">
            <strong>Uwaga bezpieczeństwa:</strong> Ten plik powinien zostać usunięty w środowisku produkcyjnym!<br>
            <a href="<?php echo admin_url(); ?>">← Powrót do panelu WordPress</a>
        </div>
    </div>
</body>
</html>



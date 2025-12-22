<?php
/**
 * Plik testowy do ręcznego wysyłania emaili
 * 
 * UWAGA: Ten plik powinien być usunięty w produkcji!
 * 
 * Użycie:
 * 1. Umieść ten plik w folderze głównym pluginu
 * 2. Odwiedź: http://twoja-strona.local/wp-content/plugins/odwiedziny-chorych/test-emails.php?date=2025-01-26
 * 3. Lub użyj w konsoli WordPress: wp eval-file test-emails.php
 */

// Ładuj WordPress
require_once('../../../wp-load.php');

// Sprawdź czy użytkownik jest zalogowany jako administrator
if (!current_user_can('manage_options')) {
    die('Brak uprawnień. Musisz być zalogowany jako administrator.');
}

// Pobierz datę z parametru GET (domyślnie jutro)
$test_date = isset($_GET['date']) ? sanitize_text_field($_GET['date']) : date('Y-m-d', strtotime('+1 day'));

// Załaduj klasę emaili
if (!class_exists('OC_Email_Notifications')) {
    require_once(plugin_dir_path(__FILE__) . 'includes/class-email-notifications.php');
}

// Wyślij testowe emaile
$result = OC_Email_Notifications::test_send_for_date($test_date);

// Wyświetl wyniki
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test wysyłki emaili - Odwiedziny Chorych</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .success { color: green; }
        .error { color: red; }
        .info { background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #6d5c3d; color: white; }
    </style>
</head>
<body>
    <h1>Test wysyłki emaili - Odwiedziny Chorych</h1>
    
    <div class="info">
        <strong>Data testu:</strong> <?php echo esc_html($test_date); ?><br>
        <strong>Data formatowana:</strong> <?php echo date('d.m.Y (l)', strtotime($test_date)); ?>
    </div>
    
    <?php if ($result['success']): ?>
        <h2 class="success">✓ Wysłano emaile:</h2>
        <table>
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Imię</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($result['sent_emails'] as $email): ?>
                <tr>
                    <td><?php echo esc_html($email['email']); ?></td>
                    <td><?php echo esc_html($email['name']); ?></td>
                    <td class="<?php echo $email['success'] ? 'success' : 'error'; ?>">
                        <?php echo $email['success'] ? '✓ Wysłano' : '✗ Błąd'; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php else: ?>
        <h2 class="error">✗ Błąd:</h2>
        <p><?php echo esc_html($result['message']); ?></p>
    <?php endif; ?>
    
    <hr>
    <p><small>
        <strong>Uwaga:</strong> Ten plik powinien zostać usunięty w środowisku produkcyjnym ze względów bezpieczeństwa.<br>
        <strong>Użycie:</strong> ?date=2025-01-26 (domyślnie jutro)
    </small></p>
</body>
</html>



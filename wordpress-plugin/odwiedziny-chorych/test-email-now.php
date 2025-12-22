<?php
/**
 * Prosty skrypt testowy do wysyłki emaili
 * 
 * Użycie: 
 * http://twoja-strona.local/wp-content/plugins/odwiedziny-chorych/test-email-now.php?date=2025-01-26
 * 
 * UWAGA: Usuń ten plik w produkcji!
 */

// Ładuj WordPress
require_once('../../../wp-load.php');

// Sprawdź czy użytkownik jest zalogowany jako administrator
if (!current_user_can('manage_options')) {
    die('Brak uprawnień. Musisz być zalogowany jako administrator WordPress.');
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
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            max-width: 900px; 
            margin: 0 auto; 
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #6d5c3d; margin-top: 0; }
        .success { color: #4caf50; font-weight: bold; }
        .error { color: #f44336; font-weight: bold; }
        .info { 
            background: #e3f2fd; 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 5px; 
            border-left: 4px solid #2196f3;
        }
        .warning {
            background: #fff3cd;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            background: white;
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
        .status-success { color: #4caf50; font-weight: bold; }
        .status-error { color: #f44336; font-weight: bold; }
        .form-group {
            margin: 20px 0;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input {
            padding: 8px;
            width: 200px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .btn {
            background: #6d5c3d;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .btn:hover {
            background: #5a4a2d;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 Test wysyłki emaili - Odwiedziny Chorych</h1>
        
        <div class="form-group">
            <form method="get" action="">
                <label for="date">Wybierz datę dyżuru:</label>
                <input type="date" id="date" name="date" value="<?php echo esc_attr($test_date); ?>" required>
                <button type="submit" class="btn">Wyślij email testowy</button>
            </form>
        </div>
        
        <div class="info">
            <strong>Data testu:</strong> <?php echo esc_html($test_date); ?><br>
            <strong>Data formatowana:</strong> <?php echo date('d.m.Y (l)', strtotime($test_date)); ?><br>
            <strong>Uwaga:</strong> Email zostanie wysłany do wszystkich szafarzy przypisanych do dyżuru w tej dacie.
        </div>
        
        <?php if ($result['success']): ?>
            <?php if (!empty($result['sent_emails'])): ?>
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
                            <td class="<?php echo $email['success'] ? 'status-success' : 'status-error'; ?>">
                                <?php echo $email['success'] ? '✓ Wysłano pomyślnie' : '✗ Błąd wysyłki'; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <div class="warning">
                    <strong>Sprawdź swoją skrzynkę email!</strong> Wiadomości powinny pojawić się w ciągu kilku minut.
                    Jeśli nie widzisz emaili, sprawdź folder SPAM.
                </div>
            <?php else: ?>
                <div class="warning">
                    <strong>Uwaga:</strong> Nie znaleziono szafarzy z przypisanymi emailami dla tej daty.<br>
                    Upewnij się, że:
                    <ul>
                        <li>W kalendarzu jest przypisany szafarz dla daty <?php echo esc_html($test_date); ?></li>
                        <li>Szafarz ma uzupełniony adres email w "Dane szafarzy"</li>
                    </ul>
                </div>
            <?php endif; ?>
        <?php else: ?>
            <h2 class="error">✗ Błąd:</h2>
            <p><?php echo esc_html($result['message']); ?></p>
        <?php endif; ?>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <div style="font-size: 12px; color: #999;">
            <strong>Uwaga bezpieczeństwa:</strong> Ten plik powinien zostać usunięty w środowisku produkcyjnym!<br>
            <strong>Domyślne zachowanie:</strong> System automatycznie wysyła emaile codziennie o 18:00 dla dyżurów na następny dzień.
        </div>
    </div>
</body>
</html>



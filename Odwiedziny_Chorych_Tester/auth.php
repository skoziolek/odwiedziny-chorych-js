<?php
session_start();

// UWAGA: Proszę zmienić to hasło na silniejsze przed umieszczeniem na serwerze!
$correct_password = 'PomocDlaChorych!';

// --- BLOKADA PO 3 NIEUDANYCH PRÓBACH ---
$lock_file = __DIR__ . '/login_lock.json';
$max_attempts = 3;
$lock_time = 3600; // 1 godzina w sekundach

// Sprawdź czy blokada istnieje
$lock_data = [];
if (file_exists($lock_file)) {
    $lock_data = json_decode(file_get_contents($lock_file), true) ?: [];
}
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$now = time();

if (isset($lock_data[$ip]) && $lock_data[$ip]['blocked_until'] > $now) {
    $minutes = ceil(($lock_data[$ip]['blocked_until'] - $now) / 60);
    echo '<h2>Konto zablokowane na ' . $minutes . ' min. Spróbuj ponownie później.</h2>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    if (hash_equals($correct_password, $password)) {
        session_regenerate_id(true);
        $_SESSION['loggedin'] = true;
        // Resetuj licznik prób po udanym logowaniu
        unset($lock_data[$ip]);
        file_put_contents($lock_file, json_encode($lock_data));
        header('Location: main.php');
        exit;
    } else {
        // Zwiększ licznik prób
        $lock_data[$ip]['attempts'] = ($lock_data[$ip]['attempts'] ?? 0) + 1;
        if ($lock_data[$ip]['attempts'] >= $max_attempts) {
            $lock_data[$ip]['blocked_until'] = $now + $lock_time;
        }
        file_put_contents($lock_file, json_encode($lock_data));
        $_SESSION['login_error'] = 'Nieprawidłowe hasło.';
        header('Location: login.php');
        exit;
    }
} else {
    // Przekieruj na stronę logowania, jeśli ktoś wejdzie tu bezpośrednio
    header('Location: login.php');
    exit;
}
?> 
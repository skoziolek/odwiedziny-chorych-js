<?php
session_start();

// Sprawdź czy użytkownik jest zalogowany
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header('Location: login.php');
    exit;
}

// Funkcje szyfrowania danych (RODO)
function encryptData($data) {
    // Obsługa pustych danych
    if (empty($data) && $data !== 0 && $data !== '0') {
        $data = [];
    }
    
    $key = 'OdwiedzinyChorych2024!@#$%^&*()_+'; // W produkcji powinien być w zmiennej środowiskowej
    $method = 'AES-256-CBC';
    
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($method));
    $jsonData = json_encode($data);
    
    if ($jsonData === false) {
        throw new Exception('Błąd kodowania JSON: ' . json_last_error_msg());
    }
    
    $encrypted = openssl_encrypt($jsonData, $method, $key, 0, $iv);
    
    if ($encrypted === false) {
        throw new Exception('Błąd szyfrowania: ' . openssl_error_string());
    }
    
    return [
        'encrypted' => base64_encode($encrypted),
        'iv' => base64_encode($iv)
    ];
}

function decryptData($encryptedData) {
    if (!$encryptedData || !isset($encryptedData['encrypted']) || !isset($encryptedData['iv'])) {
        return null;
    }
    
    $key = 'OdwiedzinyChorych2024!@#$%^&*()_+';
    $method = 'AES-256-CBC';
    
    $encrypted = base64_decode($encryptedData['encrypted']);
    $iv = base64_decode($encryptedData['iv']);
    
    $decrypted = openssl_decrypt($encrypted, $method, $key, 0, $iv);
    return json_decode($decrypted, true);
}

function isEncrypted($data) {
    return is_array($data) && isset($data['encrypted']) && isset($data['iv']);
}

// Obsługa żądań GET (odczyt danych)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $plik = $_GET['plik'] ?? '';
    
    if (!in_array($plik, ['chorzy', 'szafarze', 'kalendarz', 'historia'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nieprawidłowy plik']);
        exit;
    }
    
    $sciezkaPliku = $plik . '.json';

    if (!file_exists($sciezkaPliku)) {
        echo json_encode([]);
        exit;
    }
    
    $dane = json_decode(file_get_contents($sciezkaPliku), true);
    
    // Sprawdź czy dane są zaszyfrowane i deszyfruj jeśli tak
    if (isEncrypted($dane)) {
        $dane = decryptData($dane);
        if ($dane === null) {
            http_response_code(500);
            echo json_encode(['error' => 'Błąd deszyfrowania danych']);
            exit;
        }
    }
    
    echo json_encode($dane);
    exit;
}

// Obsługa żądań POST (zapis danych)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $plik = $_GET['plik'] ?? '';
    
    if (!in_array($plik, ['chorzy', 'szafarze', 'kalendarz', 'historia'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nieprawidłowy plik']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Nieprawidłowe dane JSON: ' . json_last_error_msg()]);
        exit;
    }
    
    // Akceptuj puste tablice i obiekty
    if ($input === null && json_last_error() === JSON_ERROR_NONE) {
        $input = [];
    }
    
    $sciezkaPliku = $plik . '.json';
    
    // Obsługa akcji dla kalendarza
    if ($plik === 'kalendarz') {
        $action = $input['action'] ?? '';
        switch ($action) {
            case 'zapisz_kalendarz':
            case 'resetuj_kalendarz':
                $dane = $input['dane'] ?? [];
                if (file_put_contents($sciezkaPliku, json_encode($dane, JSON_PRETTY_PRINT))) {
                    echo json_encode(['success' => true]);
        } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Błąd zapisu do pliku']);
                }
                exit;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Nieznana akcja']);
                exit;
        }
    }
    
    // Szyfruj dane przed zapisem (tylko dla wrażliwych plików)
    if (in_array($plik, ['chorzy', 'szafarze', 'historia'])) {
        try {
            $daneDoZapisu = encryptData($input);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Błąd szyfrowania: ' . $e->getMessage()]);
            exit;
        }
    } else {
        $daneDoZapisu = $input;
        }

    if (file_put_contents($sciezkaPliku, json_encode($daneDoZapisu, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true]);
        } else {
        http_response_code(500);
        echo json_encode(['error' => 'Błąd zapisu do pliku']);
        }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metoda nieobsługiwana']);
?> 
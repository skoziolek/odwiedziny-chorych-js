<?php
session_start();

// Sprawdź czy użytkownik jest zalogowany
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header('Location: login.php');
    exit;
}

// Funkcja do generowania danych testowych
function generujDaneTestowe() {
    $daneTestowe = [];
    
    // Pobierz pełne imiona i nazwiska szafarzy z funkcji generujDaneTestoweSzafarzy
    $szafarzeTab = generujDaneTestoweSzafarzy();
    $szafarze = array_map(function($s) { return $s['imieNazwisko']; }, $szafarzeTab);
    // Dodaj kilka dodatkowych nazwisk, jeśli potrzeba
    $szafarze = array_merge($szafarze, [
        'Jan Kowalski',
        'Piotr Wiśniewski',
        'Dawid Nowak',
        'Mateusz Zieliński',
        'Damian Kowalczyk'
    ]);
    
    // Generuj dane dla całego roku 2025
    $rok = 2025;
    $startDate = new DateTime("$rok-01-01");
    $endDate = new DateTime("$rok-12-31");
    
    $currentDate = clone $startDate;
    $szafarzIndex = 0;
    
    while ($currentDate <= $endDate) {
        $data = $currentDate->format('Y-m-d');
        $dzienTygodnia = $currentDate->format('N'); // 1=Poniedziałek, 7=Niedziela
        
        // Generuj dane tylko dla niedziel (dzienTygodnia = 7)
        if ($dzienTygodnia == 7) {
            $daneTestowe[$data] = [
                'osobaGlowna' => $szafarze[$szafarzIndex % count($szafarze)],
                'pomocnik' => '',
                'uwagi' => 'Testowe odwiedziny dla ' . $data
            ];
            $szafarzIndex++;
        }
        
        $currentDate->add(new DateInterval('P1D'));
    }
    
    return $daneTestowe;
}

// Funkcja do generowania danych testowych dla chorych
function generujDaneTestoweChorych() {
    return [
        [
            'imieNazwisko' => 'Jan Kowalski',
            'adres' => 'ul. Testowa 1, Warszawa',
            'telefon' => '123-456-789',
            'uwagi' => 'Testowy chory 1',
            'aktualne' => true
        ],
        [
            'imieNazwisko' => 'Anna Nowak',
            'adres' => 'ul. Przykładowa 5, Kraków',
            'telefon' => '987-654-321',
            'uwagi' => 'Testowy chory 2',
            'aktualne' => true
        ],
        [
            'imieNazwisko' => 'Piotr Wiśniewski',
            'adres' => 'ul. Demo 10, Gdańsk',
            'telefon' => '555-123-456',
            'uwagi' => 'Testowy chory 3',
            'aktualne' => true
        ]
    ];
}

// Funkcja do generowania danych testowych dla szafarzy
function generujDaneTestoweSzafarzy() {
    return [
        [
            'imieNazwisko' => 'Tomasz Kowalczyk',
            'telefon' => '111-222-333',
            'email' => 'tomasz@test.pl',
            'uwagi' => 'Testowy szafarz 1'
        ],
        [
            'imieNazwisko' => 'Marek Zieliński',
            'telefon' => '444-555-666',
            'email' => 'marek@test.pl',
            'uwagi' => 'Testowy szafarz 2'
        ],
        [
            'imieNazwisko' => 'Andrzej Dąbrowski',
            'telefon' => '777-888-999',
            'email' => 'andrzej@test.pl',
            'uwagi' => 'Testowy szafarz 3'
        ]
    ];
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
            case 'generuj_dane_testowe':
                // Generuj dane testowe dla wszystkich plików
                $plikiDoGenerowania = [
                    'kalendarz.json' => generujDaneTestowe(),
                    'chorzy.json' => generujDaneTestoweChorych(),
                    'szafarze.json' => generujDaneTestoweSzafarzy(),
                    'historia.json' => []
                ];
                
                $wygenerowanePliki = [];
                
                foreach ($plikiDoGenerowania as $plik => $dane) {
                    if (in_array($plik, ['chorzy.json', 'szafarze.json', 'historia.json'])) {
                        // Dla plików zaszyfrowanych
                        try {
                            $daneZaszyfrowane = encryptData($dane);
                            if (file_put_contents($plik, json_encode($daneZaszyfrowane, JSON_PRETTY_PRINT))) {
                                $wygenerowanePliki[] = $plik;
                            }
                        } catch (Exception $e) {
                            // Ignoruj błędy szyfrowania
                        }
                    } else {
                        // Dla kalendarza bez szyfrowania
                        if (file_put_contents($plik, json_encode($dane, JSON_PRETTY_PRINT))) {
                            $wygenerowanePliki[] = $plik;
                        }
                    }
                }
                
                if (!empty($wygenerowanePliki)) {
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Dane testowe zostały wygenerowane dla plików: ' . implode(', ', $wygenerowanePliki)
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Błąd generowania danych testowych']);
                }
                exit;
            case 'wyczyść_dane_testowe':
                // Wyczyść wszystkie pliki z danymi
                $plikiDoWyczyszczenia = ['kalendarz.json', 'chorzy.json', 'szafarze.json', 'historia.json'];
                $wyczyszczonePliki = [];
                
                foreach ($plikiDoWyczyszczenia as $plik) {
                    if (file_exists($plik)) {
                        // Dla plików zaszyfrowanych (chorzy, szafarze, historia) zapisz pustą zaszyfrowaną tablicę
                        if (in_array($plik, ['chorzy.json', 'szafarze.json', 'historia.json'])) {
                            try {
                                $pusteDaneZaszyfrowane = encryptData([]);
                                if (file_put_contents($plik, json_encode($pusteDaneZaszyfrowane, JSON_PRETTY_PRINT))) {
                                    $wyczyszczonePliki[] = $plik;
                                }
                            } catch (Exception $e) {
                                // Ignoruj błędy szyfrowania pustych danych
                            }
                        } else {
                            // Dla kalendarza zapisz pustą tablicę bez szyfrowania
                            if (file_put_contents($plik, json_encode([], JSON_PRETTY_PRINT))) {
                                $wyczyszczonePliki[] = $plik;
                            }
                        }
                    }
                }
                
                if (!empty($wyczyszczonePliki)) {
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Dane testowe zostały wyczyszczone z plików: ' . implode(', ', $wyczyszczonePliki)
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Błąd czyszczenia danych testowych']);
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
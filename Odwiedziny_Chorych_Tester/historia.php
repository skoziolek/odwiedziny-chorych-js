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

// Obsługa żądań API
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'pobierz_historie':
            $chory_id = $_GET['chory_id'] ?? '';
            $data_od = $_GET['data_od'] ?? '';
            $data_do = $_GET['data_do'] ?? '';
            
            $historia = pobierzHistorieOdwiedzin($chory_id, $data_od, $data_do);
            echo json_encode($historia);
            break;
            
        case 'pobierz_raport_dzienny':
            $data = $_GET['data'] ?? date('Y-m-d');
            $raport = pobierzRaportDzienny($data);
            echo json_encode($raport);
            break;
            
        case 'pobierz_statystyki':
            $miesiac = $_GET['miesiac'] ?? date('Y-m');
            $statystyki = pobierzStatystykiMiesiac($miesiac);
            echo json_encode($statystyki);
            break;
            
        case 'pobierz_raport_miesieczny':
            $miesiac = $_GET['miesiac'] ?? date('Y-m');
            $raport = pobierzRaportMiesieczny($miesiac);
            echo json_encode($raport);
            break;
            
        case 'pobierz_chorych_na_dzien':
            header('Content-Type: application/json');
            $data = $_GET['data'] ?? '';
            
            // Pobierz wszystkich chorych
            $chorzyFile = 'chorzy.json';
            if (!file_exists($chorzyFile)) {
                echo json_encode([]);
                exit;
            }
            
            $chorzyData = json_decode(file_get_contents($chorzyFile), true);
            $chorzy = $chorzyData;
            
            // Sprawdź czy dane są zaszyfrowane
            if (is_array($chorzy) && isset($chorzy['encrypted']) && isset($chorzy['iv'])) {
                $chorzy = decryptData($chorzy);
                if ($chorzy === null) {
                    echo json_encode([]);
                    exit;
                }
            }
            
            if (!is_array($chorzy)) {
                $chorzy = [];
            }
            
            // Pobierz historię odwiedzin dla danego dnia
            $historia = pobierzHistorieOdwiedzin('', $data, $data);
            $odwiedzeniIds = array_column($historia, 'chory_nazwa');
            
            // Przygotuj listę chorych z informacją o statusie odwiedzin
            $chorzyZStatusem = [];
            foreach ($chorzy as $chory) {
                $chorzyZStatusem[] = [
                    'id' => $chory['imieNazwisko'] ?? '',
                    'imieNazwisko' => $chory['imieNazwisko'] ?? '',
                    'status' => in_array($chory['imieNazwisko'], $odwiedzeniIds) ? 'odwiedzone' : 'nie_odwiedzone'
                ];
            }
            
            echo json_encode($chorzyZStatusem);
            exit;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Nieznana akcja']);
            break;
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Nieprawidłowe dane']);
        exit;
    }
    
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'dodaj_odwiedziny':
            $wynik = dodajOdwiedziny($input);
            echo json_encode($wynik);
            break;
            
        case 'edytuj_odwiedziny':
            $wynik = edytujOdwiedziny($input);
            echo json_encode($wynik);
            break;
            
        case 'usun_odwiedziny':
            $wynik = usunOdwiedziny($input['id']);
            echo json_encode($wynik);
            break;
            
        case 'resetuj_statusy_odwiedzin':
            $wynik = resetujStatusyOdwiedzin();
            echo json_encode($wynik);
            break;
            
        case 'oznacz_odwiedzonych':
            $wynik = oznaczOdwiedzonych($input);
            echo json_encode($wynik);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Nieznana akcja']);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Metoda nieobsługiwana']);
}

// Funkcje pomocnicze
function pobierzPlikHistoria() {
    $plik = 'historia.json';
    if (!file_exists($plik)) {
        file_put_contents($plik, json_encode([]));
    }
    return $plik;
}

function dodajOdwiedziny($dane) {
    $plik = pobierzPlikHistoria();
    $historia = json_decode(file_get_contents($plik), true);
    if (!is_array($historia)) {
        $historia = [];
    }
    
    // Usuń elementy, które nie są tablicami (np. stringi po starej migracji/szyfrowaniu)
    $historia = array_filter($historia, 'is_array');
    
    $noweOdwiedziny = [
        'id' => uniqid(),
        'data' => $dane['data'],
        'chory_id' => $dane['chory_id'],
        'chory_nazwa' => $dane['chory_nazwa'],
        'szafarz' => $dane['szafarz'],
        'pomocnik' => $dane['pomocnik'] ?? '',
        'status' => $dane['status'], // 'wykonane', 'nie_wykonane', 'odwolane'
        'uwagi' => $dane['uwagi'] ?? '',
        'czas_rozpoczecia' => $dane['czas_rozpoczecia'] ?? '',
        'czas_zakonczenia' => $dane['czas_zakonczenia'] ?? '',
        'data_utworzenia' => date('Y-m-d H:i:s'),
        'data_modyfikacji' => date('Y-m-d H:i:s')
    ];
    
    $historia[] = $noweOdwiedziny;
    file_put_contents($plik, json_encode($historia, JSON_PRETTY_PRINT));
    
    return ['success' => true, 'id' => $noweOdwiedziny['id']];
}

function edytujOdwiedziny($dane) {
    $plik = pobierzPlikHistoria();
    $historia = json_decode(file_get_contents($plik), true);
    if (!is_array($historia)) {
        $historia = [];
    }
    
    // Usuń elementy, które nie są tablicami (np. stringi po starej migracji/szyfrowaniu)
    $historia = array_filter($historia, 'is_array');
    
    foreach ($historia as &$wpis) {
        if ($wpis['id'] === $dane['id']) {
            $wpis['status'] = $dane['status'];
            $wpis['uwagi'] = $dane['uwagi'] ?? $wpis['uwagi'];
            $wpis['czas_rozpoczecia'] = $dane['czas_rozpoczecia'] ?? $wpis['czas_rozpoczecia'];
            $wpis['czas_zakonczenia'] = $dane['czas_zakonczenia'] ?? $wpis['czas_zakonczenia'];
            $wpis['data_modyfikacji'] = date('Y-m-d H:i:s');
            break;
        }
    }
    
    file_put_contents($plik, json_encode($historia, JSON_PRETTY_PRINT));
    return ['success' => true];
}

function usunOdwiedziny($id) {
    $plik = pobierzPlikHistoria();
    
    $historia = json_decode(file_get_contents($plik), true);
    if (!is_array($historia)) {
        $historia = [];
    }
    
    // Usuń elementy, które nie są tablicami (np. stringi po starej migracji/szyfrowaniu)
    $historia = array_filter($historia, 'is_array');
    
    $historia = array_filter($historia, function($wpis) use ($id) {
        return $wpis['id'] !== $id;
    });
    
    file_put_contents($plik, json_encode(array_values($historia), JSON_PRETTY_PRINT));
    return ['success' => true];
}

function pobierzHistorieOdwiedzin($chory_id = '', $data_od = '', $data_do = '') {
    $plik = pobierzPlikHistoria();
    $historia = json_decode(file_get_contents($plik), true);
    if (!is_array($historia)) {
        $historia = [];
    }
    
    // Usuń elementy, które nie są tablicami (np. stringi po starej migracji/szyfrowaniu)
    $historia = array_filter($historia, 'is_array');
    
    // Filtrowanie po chorym
    if ($chory_id) {
        $historia = array_filter($historia, function($wpis) use ($chory_id) {
            return $wpis['chory_id'] === $chory_id;
        });
    }
    
    // Filtrowanie po dacie
    if ($data_od) {
        $historia = array_filter($historia, function($wpis) use ($data_od) {
            return $wpis['data'] >= $data_od;
        });
    }
    
    if ($data_do) {
        $historia = array_filter($historia, function($wpis) use ($data_do) {
            return $wpis['data'] <= $data_do;
        });
    }
    
    // Sortowanie po dacie (najnowsze pierwsze)
    usort($historia, function($a, $b) {
        return strtotime($b['data']) - strtotime($a['data']);
    });
    
    return array_values($historia);
}

function pobierzRaportDzienny($data) {
    $historia = pobierzHistorieOdwiedzin('', $data, $data);
    
    $raport = [
        'data' => $data,
        'ilosc_odwiedzin' => count($historia),
        'wykonane' => 0,
        'nie_wykonane' => 0,
        'odwolane' => 0,
        'odwiedziny' => $historia
    ];
    
    foreach ($historia as $wpis) {
        switch ($wpis['status']) {
            case 'wykonane':
                $raport['wykonane']++;
                break;
            case 'nie_wykonane':
                $raport['nie_wykonane']++;
                break;
            case 'odwolane':
                $raport['odwolane']++;
                break;
        }
    }
    
    return $raport;
}

function pobierzStatystykiMiesiac($miesiac) {
    $data_od = $miesiac . '-01';
    $data_do = date('Y-m-t', strtotime($data_od));
    
    $historia = pobierzHistorieOdwiedzin('', $data_od, $data_do);
    
    $statystyki = [
        'miesiac' => $miesiac,
        'ilosc_dni' => count(array_unique(array_column($historia, 'data'))),
        'ilosc_odwiedzin' => count($historia),
        'wykonane' => 0,
        'nie_wykonane' => 0,
        'odwolane' => 0,
        'srednio_dziennie' => 0,
        'najaktywniejsi_szafarze' => [],
        'najczesciej_odwiedzani_chorzy' => []
    ];
    
    $szafarze = [];
    $chorzy = [];
    
    foreach ($historia as $wpis) {
        // Liczenie statusów
        switch ($wpis['status']) {
            case 'wykonane':
                $statystyki['wykonane']++;
                break;
            case 'nie_wykonane':
                $statystyki['nie_wykonane']++;
                break;
            case 'odwolane':
                $statystyki['odwolane']++;
                break;
        }
        
        // Liczenie szafarzy
        if (!empty($wpis['szafarz'])) {
            $szafarze[$wpis['szafarz']] = ($szafarze[$wpis['szafarz']] ?? 0) + 1;
        }
        
        // Liczenie chorych
        $chorzy[$wpis['chory_nazwa']] = ($chorzy[$wpis['chory_nazwa']] ?? 0) + 1;
    }
    
    // Średnia dzienna
    if ($statystyki['ilosc_dni'] > 0) {
        $statystyki['srednio_dziennie'] = round($statystyki['ilosc_odwiedzin'] / $statystyki['ilosc_dni'], 1);
    }
    
    // Top 5 szafarzy
    arsort($szafarze);
    $statystyki['najaktywniejsi_szafarze'] = array_slice($szafarze, 0, 5, true);
    
    // Top 5 chorych
    arsort($chorzy);
    $statystyki['najczesciej_odwiedzani_chorzy'] = array_slice($chorzy, 0, 5, true);
    
    return $statystyki;
}

function pobierzRaportMiesieczny($miesiac) {
    $data_od_miesiac = $miesiac . '-01';
    $data_do_miesiac = date('Y-m-t', strtotime($data_od_miesiac));
    $rok = substr($miesiac, 0, 4);
    $data_od_rok = $rok . '-01-01';
    $data_do_rok = $data_do_miesiac;
    
    $plik = pobierzPlikHistoria();
    $historia = json_decode(file_get_contents($plik), true);
    if (!is_array($historia)) {
        $historia = [];
    }
    $historia = array_filter($historia, 'is_array');

    // Wizyty w wybranym miesiącu
    $historia_miesiac = array_filter($historia, function($wpis) use ($data_od_miesiac, $data_do_miesiac) {
        return $wpis['data'] >= $data_od_miesiac && $wpis['data'] <= $data_do_miesiac;
    });
    
    // Wizyty od początku roku do końca wybranego miesiąca
    $historia_rok = array_filter($historia, function($wpis) use ($data_od_rok, $data_do_rok) {
        return $wpis['data'] >= $data_od_rok && $wpis['data'] <= $data_do_rok;
    });

    // Liczba wszystkich wizyt w miesiącu
    $ilosc_wizyt_miesiac = count($historia_miesiac);

    // Liczba wszystkich wizyt od początku roku
    $ilosc_wizyt_rok = count($historia_rok);
    
    $raport = [
        'miesiac' => $miesiac,
        'ilosc_wizyt_miesiac' => $ilosc_wizyt_miesiac,
        'ilosc_wizyt_rok' => $ilosc_wizyt_rok,
        'odwiedziny' => array_values($historia_miesiac)
    ];
    
    return $raport;
}

// Usuwa wszystkie wpisy ze statusem 'odwiedzone' z historii
function resetujStatusyOdwiedzin() {
    $plik = pobierzPlikHistoria();
    $historia = json_decode(file_get_contents($plik), true);
    if (!is_array($historia)) {
        $historia = [];
    }
    
    // Usuń elementy, które nie są tablicami (np. stringi po starej migracji/szyfrowaniu)
    $historia = array_filter($historia, 'is_array');
    
    $nowaHistoria = array_filter($historia, function($wpis) {
        return $wpis['status'] !== 'odwiedzone';
    });
    file_put_contents($plik, json_encode(array_values($nowaHistoria), JSON_PRETTY_PRINT));
    return ['success' => true, 'usunieto' => count($historia) - count($nowaHistoria)];
}

function oznaczOdwiedzonych($input) {
    $data = $input['data'] ?? '';
    $odwiedzeni = $input['odwiedzeni'] ?? [];
    
    if (empty($data) || !is_array($odwiedzeni)) {
        return ['success' => false, 'error' => 'Brak wymaganych danych'];
    }
    
    // Pobierz dane kalendarza dla tej daty
    $kalendarzFile = 'kalendarz.json';
    if (!file_exists($kalendarzFile)) {
        return ['success' => false, 'error' => 'Plik kalendarza nie istnieje'];
    }
    
    $kalendarzData = json_decode(file_get_contents($kalendarzFile), true);
    $kalendarz = $kalendarzData;
    
    // Sprawdź czy dane są zaszyfrowane
    if (is_array($kalendarz) && isset($kalendarz['encrypted']) && isset($kalendarz['iv'])) {
        $kalendarz = decryptData($kalendarz);
        if ($kalendarz === null) {
            return ['success' => false, 'error' => 'Błąd deszyfrowania kalendarza'];
        }
    }
    
    $daneDnia = $kalendarz[$data] ?? null;
    
    if (!$daneDnia || empty($daneDnia['osobaGlowna'])) {
        return ['success' => false, 'error' => 'Brak przypisanej osoby głównej dla tej daty'];
    }
    
    // Pobierz listę chorych
    $chorzyFile = 'chorzy.json';
    if (!file_exists($chorzyFile)) {
        return ['success' => false, 'error' => 'Plik chorych nie istnieje'];
    }
    
    $chorzyData = json_decode(file_get_contents($chorzyFile), true);
    $chorzy = $chorzyData;
    
    // Sprawdź czy dane są zaszyfrowane
    if (is_array($chorzy) && isset($chorzy['encrypted']) && isset($chorzy['iv'])) {
        $chorzy = decryptData($chorzy);
        if ($chorzy === null) {
            return ['success' => false, 'error' => 'Błąd deszyfrowania danych chorych'];
        }
    }
    
    if (!is_array($chorzy)) {
        $chorzy = [];
    }
    
    // Pobierz historię odwiedzin dla tej daty
    $plikHistoria = pobierzPlikHistoria();
    $historia = json_decode(file_get_contents($plikHistoria), true);
    if (!is_array($historia)) {
        $historia = [];
    }
    $historia = array_filter($historia, 'is_array');
    
    // Znajdź chorych po ID
    $chorzyDoOdwiedzenia = [];
    foreach ($odwiedzeni as $choryId) {
        foreach ($chorzy as $chory) {
            if (isset($chory['imieNazwisko']) && $chory['imieNazwisko'] === $choryId) {
                $chorzyDoOdwiedzenia[] = $chory;
                break;
            }
        }
    }
    
    // 1. USUWANIE wpisów dla osób, które były odwiedzone, ale zostały odznaczone
    $odwiedzeniSet = array_flip($odwiedzeni); // dla szybkiego sprawdzania
    $nowaHistoria = [];
    $usuniete = [];
    foreach ($historia as $wpis) {
        if ($wpis['data'] === $data && $wpis['status'] === 'odwiedzone' && !isset($odwiedzeniSet[$wpis['chory_id']])) {
            $usuniete[] = $wpis['chory_id']; // ten wpis usuwamy
            continue;
        }
        $nowaHistoria[] = $wpis;
    }
    // Nadpisz historię bez usuniętych wpisów
    file_put_contents($plikHistoria, json_encode(array_values($nowaHistoria), JSON_PRETTY_PRINT));
    $historia = $nowaHistoria;
    
    // 2. DODAWANIE wpisów dla nowych odwiedzonych (jak poprzednio, bez duplikatów)
    $dodaneOdwiedziny = [];
    foreach ($chorzyDoOdwiedzenia as $chory) {
        $czyIstnieje = false;
        foreach ($historia as $wpis) {
            if ($wpis['data'] === $data && $wpis['chory_id'] === $chory['imieNazwisko']) {
                $czyIstnieje = true;
                break;
            }
        }
        if ($czyIstnieje) {
            continue; // Pomijaj duplikaty
        }
        $odwiedziny = [
            'data' => $data,
            'chory_id' => $chory['imieNazwisko'],
            'chory_nazwa' => $chory['imieNazwisko'],
            'szafarz' => $daneDnia['osobaGlowna'],
            'pomocnik' => $daneDnia['pomocnik'] ?? '',
            'status' => 'odwiedzone',
            'uwagi' => '',
            'data_utworzenia' => date('Y-m-d H:i:s'),
            'data_modyfikacji' => date('Y-m-d H:i:s')
        ];
        $wynik = dodajOdwiedziny($odwiedziny);
        if ($wynik['success']) {
            $dodaneOdwiedziny[] = $chory['imieNazwisko'];
        }
    }
    
    return [
        'success' => true, 
        'dodane_odwiedziny' => $dodaneOdwiedziny,
        'ilosc_dodanych' => count($dodaneOdwiedziny),
        'usuniete' => $usuniete
    ];
}
?> 
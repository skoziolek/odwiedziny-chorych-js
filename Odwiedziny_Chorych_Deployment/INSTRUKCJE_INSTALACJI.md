# Instrukcje Instalacji - Aplikacja "Odwiedziny Chorych"

## Wymagania systemowe
- PHP 8.0 lub nowszy
- Serwer webowy (Apache/Nginx)
- Włączone rozszerzenia PHP: json, openssl

## Instalacja

### 1. Wgranie plików
Wgraj wszystkie pliki z tej paczki do katalogu głównego strony internetowej (np. `/public_html/` lub `/var/www/html/`)

### 2. Ustawienie uprawnień
```bash
chmod 755 *.php *.js *.css *.md
chmod 755 backups/
chmod 644 *.json
```

### 3. Konfiguracja serwera
Upewnij się, że serwer jest skonfigurowany do obsługi PHP.

### 4. Dostęp do aplikacji
- Otwórz w przeglądarce: `http://twoja-domena.pl/`
- Zaloguj się używając hasła: `PomocDlaChorych!`

## Struktura plików
- `index.php` - Strona główna (przekierowanie do logowania)
- `login.php` - System logowania
- `main.php` - Główny panel aplikacji
- `api.php` - API do zarządzania danymi
- `auth.php` - System autoryzacji
- `backup.php` - System kopii zapasowych
- `historia.php` - Historia odwiedzin i raporty
- `logout.php` - Wylogowanie
- `*.js` - Pliki JavaScript (funkcjonalność frontend)
- `*.css` - Style CSS
- `*.json` - Pliki danych (szyfrowane)
- `backups/` - Katalog z kopiami zapasowymi

## Bezpieczeństwo
- Wszystkie dane są szyfrowane
- System automatycznych kopii zapasowych
- Kontrola dostępu przez hasło
- Zabezpieczenia przed atakami

## Funkcje aplikacji
- Zarządzanie listą chorych
- Zarządzanie szafarzami
- Planowanie odwiedzin
- Historia odwiedzin
- Raporty dzienne i miesięczne
- System kopii zapasowych
- Responsywny design

## Wsparcie
W przypadku problemów z instalacją, skontaktuj się z administratorem aplikacji.

---
**Wersja:** 1.2.0  
**Data:** 2025-07-05 
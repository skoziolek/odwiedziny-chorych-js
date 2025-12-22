# Instalacja na Localhost - Instrukcja krok po kroku

## Opcja 1: Local by Flywheel (LocalWP) - NAJŁATWIEJSZE ⭐

### 1. Pobierz i zainstaluj Local by Flywheel
- Pobierz z: https://localwp.com/
- Zainstaluj i uruchom aplikację

### 2. Utwórz nową stronę WordPress
1. Kliknij "Create a new site"
2. Wpisz nazwę: `odwiedziny-chorych`
3. Wybierz środowisko: "Preferred" (PHP 7.4+)
4. Kliknij "Continue"
5. Utwórz konto admina (zapamiętaj login i hasło!)
6. Kliknij "Add Site"

### 3. Skopiuj plugin
1. LocalWP pokaże lokalizację strony (np. `C:\Users\...\Local Sites\odwiedziny-chorych\app\public\wp-content\plugins`)
2. Skopiuj cały folder `odwiedziny-chorych` z `wordpress-plugin/` do tego katalogu
3. Albo:
   - Kliknij prawym na stronę w LocalWP → "Open Site Shell"
   - Wpisz: `cd wp-content/plugins`
   - Skopiuj tam folder pluginu

### 4. Aktywuj plugin
1. W LocalWP kliknij "Open Site Admin" lub "WP Admin"
2. Przejdź do: Wtyczki → Zainstalowane wtyczki
3. Znajdź "Odwiedziny Chorych" i kliknij "Włącz"

### 5. Dodaj shortcode na stronę
1. Przejdź do: Strony → Dodaj nową
2. Wpisz tytuł: "Odwiedziny Chorych"
3. W treści wpisz: `[odwiedziny_chorych]`
4. Kliknij "Opublikuj"
5. Kliknij "Zobacz stronę"

### 6. Gotowe! 🎉
- Aplikacja powinna być dostępna pod adresem: `http://odwiedziny-chorych.local` (lub podobnym)
- Domyślne hasło: `PomocDlaChorych!`
- Możesz zmienić hasło w: Odwiedziny Chorych → Ustawienia

---

## Opcja 2: XAMPP (Windows/Mac/Linux)

### 1. Pobierz i zainstaluj XAMPP
- Windows: https://www.apachefriends.org/download.html
- Zainstaluj w lokalizacji np. `C:\xampp`

### 2. Uruchom Apache i MySQL
- Otwórz XAMPP Control Panel
- Kliknij "Start" przy Apache i MySQL

### 3. Pobierz WordPress
1. Pobierz z: https://wordpress.org/download/
2. Rozpakuj do: `C:\xampp\htdocs\odwiedziny-chorych`

### 4. Utwórz bazę danych
1. Otwórz: http://localhost/phpmyadmin
2. Kliknij "Nowa baza danych"
3. Nazwa: `odwiedziny_chorych`
4. Porównanie: `utf8mb4_general_ci`
5. Kliknij "Utwórz"

### 5. Zainstaluj WordPress
1. Otwórz: http://localhost/odwiedziny-chorych
2. Wybierz język (Polski)
3. Kliknij "Kontynuuj"
4. Kliknij "Zacznijmy!"
5. Wpisz dane bazy danych:
   - Nazwa bazy danych: `odwiedziny_chorych`
   - Nazwa użytkownika: `root`
   - Hasło: (zostaw puste)
   - Adres serwera: `localhost`
   - Prefiks tabel: `wp_`
6. Kliknij "Prześlij"
7. Kliknij "Uruchom instalację"
8. Wypełnij formularz:
   - Tytuł witryny: "Odwiedziny Chorych"
   - Nazwa użytkownika: `admin` (zapamiętaj!)
   - Hasło: (wpisz silne hasło i zapamiętaj!)
   - Email: (twój email)
9. Kliknij "Zainstaluj WordPress"

### 6. Skopiuj plugin
1. Skopiuj folder `wordpress-plugin/odwiedziny-chorych` do:
   `C:\xampp\htdocs\odwiedziny-chorych\wp-content\plugins\`

### 7. Aktywuj plugin
1. Zaloguj się do WordPress: http://localhost/odwiedziny-chorych/wp-admin
2. Przejdź do: Wtyczki → Zainstalowane wtyczki
3. Znajdź "Odwiedziny Chorych" i kliknij "Włącz"

### 8. Dodaj shortcode na stronę
1. Przejdź do: Strony → Dodaj nową
2. Wpisz: `[odwiedziny_chorych]`
3. Kliknij "Opublikuj"
4. Kliknij "Zobacz stronę"

### 9. Gotowe! 🎉
- Aplikacja: http://localhost/odwiedziny-chorych/...
- Domyślne hasło do aplikacji: `PomocDlaChorych!`

---

## Rozwiązywanie problemów

### Plugin się nie aktywuje
- Sprawdź czy wszystkie pliki są skopiowane
- Sprawdź logi błędów WordPress w `wp-content/debug.log`
- Upewnij się że PHP wersja to 7.4+

### Błędy w konsoli przeglądarki
- Otwórz DevTools (F12) → Console
- Sprawdź czy REST API działa: `http://localhost/wp-json/odwiedziny-chorych/v1/`
- Sprawdź czy nonce jest poprawny

### Baza danych nie tworzy się
- Sprawdź uprawnienia MySQL
- Sprawdź czy MySQL działa w XAMPP
- Sprawdź logi błędów w `wp-content/debug.log`

### Aplikacja nie wyświetla się
- Sprawdź czy shortcode jest poprawny: `[odwiedziny_chorych]`
- Sprawdź czy plugin jest aktywny
- Sprawdź czy pliki CSS/JS są załadowane (DevTools → Network)

---

## Szybki test

Po zainstalowaniu sprawdź:

1. ✅ Plugin jest aktywny (Wtyczki → Zainstalowane wtyczki)
2. ✅ Shortcode działa (strona wyświetla aplikację)
3. ✅ Logowanie działa (hasło: `PomocDlaChorych!`)
4. ✅ REST API działa: `http://localhost/wp-json/odwiedziny-chorych/v1/szafarze`



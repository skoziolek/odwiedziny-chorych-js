# Jak uruchomić aplikację w WordPressie - Krok po kroku

## 📋 Wymagania wstępne

- WordPress zainstalowany (lokalnie lub na serwerze)
- Dostęp do panelu administracyjnego WordPress (`/wp-admin`)
- Dostęp do katalogu `wp-content/plugins/` (przez FTP, File Manager, lub SSH)

---

## 🚀 Metoda 1: Instalacja lokalna (LocalWP, XAMPP, itp.)

### Krok 1: Skopiuj plugin

**Opcja A: Jeśli masz plugin w folderze na komputerze:**
1. Znajdź folder `odwiedziny-chorych` (folder pluginu)
2. Skopiuj cały folder `odwiedziny-chorych`
3. Wklej do: `wp-content/plugins/`

**Ścieżka przykład:**
- LocalWP: `C:\Users\TwojeImie\Local Sites\twoja-strona\app\public\wp-content\plugins\`
- XAMPP: `C:\xampp\htdocs\twoja-strona\wp-content\plugins\`

**Opcja B: Jeśli masz plugin jako ZIP:**
1. Rozpakuj archiwum ZIP
2. Skopiuj folder `odwiedziny-chorych` do `wp-content/plugins/`

### Krok 2: Aktywuj plugin

1. Otwórz przeglądarkę
2. Wejdź na adres WordPress: `http://twoja-strona.local/wp-admin` (lub podobny)
3. Zaloguj się do panelu administracyjnego WordPress
4. W menu po lewej stronie kliknij: **Wtyczki** → **Zainstalowane wtyczki**
5. Znajdź **"Odwiedziny Chorych"** na liście wtyczek
6. Kliknij przycisk **"Włącz"** przy wtyczce

✅ **Plugin jest teraz aktywny!**

### Krok 3: Dodaj aplikację na stronę

1. W panelu WordPress przejdź do: **Strony** → **Dodaj nową** (lub edytuj istniejącą)
2. W edytorze strony wpisz lub wklej:
   ```
   [odwiedziny_chorych]
   ```
3. Opcjonalnie - dodaj tytuł strony: **"Odwiedziny Chorych"**
4. Kliknij **"Opublikuj"** (lub **"Zaktualizuj"** jeśli edytujesz istniejącą stronę)

### Krok 4: Otwórz stronę

1. Kliknij **"Zobacz stronę"** (lub wpisz adres strony w przeglądarce)
2. ✅ Powinna wyświetlić się aplikacja "Odwiedziny Chorych"
3. Zaloguj się używając hasła (domyślnie: `PomocDlaChorych!`)

---

## 🌐 Metoda 2: Instalacja na serwerze produkcyjnym

### Krok 1: Skopiuj plugin na serwer

**Opcja A: Przez FTP/SFTP (FileZilla, WinSCP, itp.)**

1. Połącz się z serwerem przez klienta FTP
2. Przejdź do: `/wp-content/plugins/` (lub `/public_html/wp-content/plugins/`)
3. Wgraj folder `odwiedziny-chorych` (przeciągnij i upuść lub Upload)

**Opcja B: Przez Panel Hostingu (cPanel, Plesk, DirectAdmin)**

1. Zaloguj się do panelu hostingu
2. Otwórz **File Manager**
3. Przejdź do: `public_html/wp-content/plugins/` (lub podobna ścieżka)
4. Kliknij **Upload** (lub podobny przycisk)
5. Wybierz folder `odwiedziny-chorych` (lub ZIP i rozpakuj)

**Opcja C: Przez SSH**

```bash
cd /ścieżka/do/wordpress/wp-content/plugins/
# Skopiuj folder odwiedziny-chorych tutaj
scp -r odwiedziny-chorych user@serwer:/ścieżka/wp-content/plugins/
```

### Krok 2: Aktywuj plugin

1. Otwórz przeglądarkę
2. Wejdź na: `https://twoja-strona.pl/wp-admin`
3. Zaloguj się do panelu WordPress
4. Przejdź do: **Wtyczki** → **Zainstalowane wtyczki**
5. Znajdź **"Odwiedziny Chorych"**
6. Kliknij **"Włącz"**

✅ **Plugin aktywny!**

### Krok 3: Dodaj shortcode na stronę

1. **Strony** → **Dodaj nową** (lub edytuj istniejącą)
2. Dodaj shortcode: `[odwiedziny_chorych]`
3. Kliknij **"Opublikuj"**

### Krok 4: Otwórz stronę

1. Wejdź na: `https://twoja-strona.pl/odwiedziny-chorych` (lub adres Twojej strony)
2. ✅ Aplikacja powinna się wyświetlić

---

## ⚙️ Metoda 3: Instalacja przez Git (dla zaawansowanych)

Jeśli masz dostęp do serwera przez SSH:

```bash
# Przejdź do katalogu plugins
cd /ścieżka/do/wordpress/wp-content/plugins/

# Sklonuj repozytorium (jeśli jest na GitHub)
git clone https://github.com/TWOJA_NAZWA/odwiedziny-chorych.git

# Lub skopiuj folder, jeśli masz go lokalnie
```

Następnie aktywuj plugin w panelu WordPress (jak w Kroku 2 powyżej).

---

## 🔧 Konfiguracja po instalacji

### 1. Zmień hasło

1. Przejdź do: **Odwiedziny Chorych** → **Ustawienia** (w menu WordPress)
2. Zmień domyślne hasło: `PomocDlaChorych!`
3. Kliknij **"Zapisz ustawienia"**

⚠️ **WAŻNE:** Zmień hasło przed użyciem aplikacji!

### 2. Skonfiguruj SMTP (dla emaili)

Aplikacja wysyła emaile z przypomnieniami o dyżurach. Musisz skonfigurować SMTP:

1. Zainstaluj plugin **"WP Mail SMTP"** (Wtyczki → Dodaj nową → Wyszukaj "WP Mail SMTP")
2. Aktywuj plugin
3. Przejdź do: **WP Mail SMTP** → **Settings**
4. Skonfiguruj serwer SMTP (Gmail, Outlook, itp.)

📖 **Szczegółowa instrukcja:** Zobacz `INSTALACJA_SMTP.md`

---

## ✅ Weryfikacja - Czy działa?

Sprawdź czy aplikacja działa:

1. ✅ **Wejdź na stronę** z shortcode `[odwiedziny_chorych]`
2. ✅ **Powinien wyświetlić się ekran logowania**
3. ✅ **Zaloguj się** (hasło: `PomocDlaChorych!` - jeśli nie zmieniłeś)
4. ✅ **Powinna wyświetlić się aplikacja** z kalendarzem

Jeśli wszystko działa - **gotowe!** 🎉

---

## 🆘 Rozwiązywanie problemów

### Problem: Plugin nie widoczny na liście wtyczek

**Rozwiązanie:**
- Sprawdź czy folder `odwiedziny-chorych` jest w `wp-content/plugins/`
- Sprawdź czy plik `odwiedziny-chorych.php` jest w folderze pluginu
- Sprawdź uprawnienia do plików (powinny być 644 dla plików, 755 dla folderów)

### Problem: Błąd przy aktywacji

**Rozwiązanie:**
- Sprawdź logi błędów: `wp-content/debug.log`
- Sprawdź czy PHP wersja to 7.4+ (Ustawienia → Info → PHP Version)
- Sprawdź czy WordPress wersja to 5.0+

### Problem: Aplikacja nie wyświetla się na stronie

**Rozwiązanie:**
- Sprawdź czy shortcode jest poprawny: `[odwiedziny_chorych]` (bez spacji w środku)
- Sprawdź czy strona jest opublikowana
- Wyczyść cache przeglądarki (Ctrl+F5)
- Sprawdź czy plugin jest aktywny

### Problem: Błędy w konsoli przeglądarki

**Rozwiązanie:**
- Otwórz DevTools (F12) → Console
- Sprawdź czy REST API działa: `https://twoja-strona.pl/wp-json/odwiedziny-chorych/v1/`
- Sprawdź czy nie ma błędów 404 lub 500

---

## 📚 Dodatkowa dokumentacja

- `INSTRUKCJA_DLA_ADMINA.md` - Pełna instrukcja wdrożenia
- `WDROZENIE_PRODUKCJA.md` - Szczegółowa instrukcja produkcyjna
- `INSTALACJA_SMTP.md` - Konfiguracja SMTP
- `TESTOWANIE_APLIKACJI.md` - Jak przetestować aplikację

---

## ✅ Podsumowanie - Szybki start

1. **Skopiuj folder** `odwiedziny-chorych` do `wp-content/plugins/`
2. **Aktywuj plugin** w WordPress (Wtyczki → Włącz)
3. **Dodaj shortcode** `[odwiedziny_chorych]` na stronę
4. **Otwórz stronę** - aplikacja powinna działać!
5. **Zmień hasło** w Ustawieniach
6. **Skonfiguruj SMTP** (opcjonalnie, dla emaili)

**Gotowe!** 🚀


# Jak uruchomić aplikację w LocalWP - Instrukcja krok po kroku

## 📋 Wymagania

- Program **Local** (LocalWP) zainstalowany i uruchomiony
- Strona WordPress utworzona w Local
- Folder pluginu `odwiedziny-chorych` gotowy

---

## 🚀 Instalacja pluginu w LocalWP

### Krok 1: Znajdź folder strony w Local

1. Otwórz program **Local**
2. Znajdź swoją stronę WordPress na liście
3. Kliknij prawym przyciskiem myszy na stronę
4. Wybierz **"Reveal in Finder"** (Mac) lub **"Reveal in Explorer"** (Windows)
   - Alternatywnie: kliknij ikonę **folderu** obok nazwy strony
5. ✅ Otworzy się folder strony

**Ścieżka folderu:**
- Windows: `C:\Users\TwojeImie\Local Sites\twoja-strona\app\public\`
- Mac: `~/Local Sites/twoja-strona/app/public/`

### Krok 2: Skopiuj plugin

**Opcja A: Przez Eksploratora plików (Windows)**

1. W otwartym folderze strony przejdź do: `wp-content\plugins\`
2. Skopiuj folder `odwiedziny-chorych` z miejsca, gdzie go masz
3. Wklej do folderu `wp-content\plugins\`

**Ścieżka docelowa:**
```
C:\Users\TwojeImie\Local Sites\twoja-strona\app\public\wp-content\plugins\odwiedziny-chorych\
```

**Opcja B: Przez Site Shell (w Local)**

1. W Local kliknij na stronę
2. Kliknij przycisk **"Open Site Shell"** (lub ikonę terminala)
3. Wykonaj komendy:

```bash
# Przejdź do folderu plugins
cd wp-content/plugins

# Jeśli masz plugin w innym miejscu, skopiuj go:
# (przykład - dostosuj ścieżkę źródłową)
cp -r "C:\Users\TwojeImie\Documents\odwiedziny-chorych-js\wordpress-plugin\odwiedziny-chorych" .

# Sprawdź czy folder został skopiowany
ls -la
```

### Krok 3: Aktywuj plugin w WordPress

1. W Local kliknij na swoją stronę
2. Kliknij przycisk **"Open Site"** (lub ikonę globusa)
3. W przeglądarce przejdź do: `http://twoja-strona.local/wp-admin`
4. Zaloguj się do WordPress (hasło admina - sprawdź w Local → Users)
5. W panelu WordPress:
   - Kliknij **"Wtyczki"** w menu po lewej
   - Kliknij **"Zainstalowane wtyczki"**
   - Znajdź **"Odwiedziny Chorych"** na liście
   - Kliknij przycisk **"Włącz"** przy wtyczce

✅ **Plugin jest teraz aktywny!**

### Krok 4: Dodaj aplikację na stronę

**Opcja A: Utwórz nową stronę**

1. W panelu WordPress: **Strony** → **Dodaj nową**
2. Wpisz tytuł: **"Odwiedziny Chorych"**
3. W edytorze wpisz (lub wklej):
   ```
   [odwiedziny_chorych]
   ```
4. Kliknij **"Opublikuj"**
5. Kliknij **"Zobacz stronę"**

**Opcja B: Edytuj istniejącą stronę**

1. W panelu WordPress: **Strony** → **Wszystkie strony**
2. Kliknij **"Edytuj"** przy wybranej stronie
3. Dodaj shortcode: `[odwiedziny_chorych]`
4. Kliknij **"Zaktualizuj"**

### Krok 5: Otwórz aplikację

1. W Local kliknij **"Open Site"**
2. Przejdź do strony, na której dodałeś shortcode
3. ✅ Powinna wyświetlić się aplikacja "Odwiedziny Chorych"
4. Zaloguj się używając hasła (domyślnie: `PomocDlaChorych!`)

---

## 🔧 Konfiguracja po instalacji

### 1. Zmień hasło aplikacji

1. W panelu WordPress: **Odwiedziny Chorych** → **Ustawienia**
2. Zmień domyślne hasło: `PomocDlaChorych!`
3. Kliknij **"Zapisz ustawienia"**

### 2. Skonfiguruj SMTP (opcjonalnie, dla emaili)

Jeśli chcesz testować wysyłkę emaili lokalnie:

1. Zainstaluj plugin **"WP Mail SMTP"**:
   - **Wtyczki** → **Dodaj nową**
   - Wyszukaj: "WP Mail SMTP"
   - Kliknij **"Zainstaluj teraz"** → **"Aktywuj"**

2. Skonfiguruj SMTP (dla lokalnego środowiska możesz użyć "Mail" lub "MailHog")

📖 **Szczegółowa instrukcja:** Zobacz `INSTALACJA_SMTP.md`

---

## 🔍 Szybka weryfikacja

Sprawdź czy wszystko działa:

- [ ] ✅ Plugin widoczny w: Wtyczki → Zainstalowane wtyczki
- [ ] ✅ Plugin aktywny (przycisk "Wyłącz" jest widoczny)
- [ ] ✅ Strona z shortcode `[odwiedziny_chorych]` wyświetla aplikację
- [ ] ✅ Ekran logowania się wyświetla
- [ ] ✅ Logowanie działa (hasło: `PomocDlaChorych!`)

---

## 🆘 Rozwiązywanie problemów w LocalWP

### Problem: Nie widzę folderu "Reveal in Explorer"

**Rozwiązanie:**
- Kliknij ikonę **folderu** obok nazwy strony w Local
- Lub: Kliknij prawym przyciskiem na stronę → wybierz opcję z folderem

### Problem: Plugin nie widoczny na liście wtyczek

**Rozwiązanie:**
1. Sprawdź czy folder `odwiedziny-chorych` jest w: `wp-content/plugins/`
2. Sprawdź czy plik `odwiedziny-chorych.php` jest w folderze pluginu
3. **Zrestartuj stronę w Local:**
   - Kliknij **"Stop Site"**
   - Poczekaj chwilę
   - Kliknij **"Start Site"**
   - Odśwież stronę WordPress

### Problem: Błąd przy aktywacji pluginu

**Rozwiązanie:**
1. Sprawdź logi błędów w Local:
   - Kliknij na stronę w Local
   - Otwórz zakładkę **"Logs"**
   - Sprawdź `php-errors.log`
2. Sprawdź czy PHP wersja to 7.4+:
   - W Local: Kliknij na stronę → **"Settings"** → sprawdź PHP Version
3. Sprawdź czy wszystkie pliki są skopiowane

### Problem: Strona z shortcode wyświetla błąd lub pustą stronę

**Rozwiązanie:**
1. Sprawdź czy shortcode jest poprawny: `[odwiedziny_chorych]` (bez spacji)
2. Sprawdź konsolę przeglądarki (F12 → Console)
3. Sprawdź czy plugin jest aktywny
4. Wyczyść cache:
   - W Local: **"Stop Site"** → **"Start Site"**
   - W przeglądarce: Ctrl+F5 (twarde odświeżenie)

### Problem: Aplikacja się nie ładuje (błędy JavaScript)

**Rozwiązanie:**
1. Otwórz DevTools (F12) → Console
2. Sprawdź błędy
3. Sprawdź czy pliki JS/CSS są załadowane:
   - DevTools → Network
   - Odśwież stronę
   - Sprawdź czy `app.js` i `style.css` są załadowane (status 200)

### Problem: REST API nie działa

**Rozwiązanie:**
1. Sprawdź czy REST API działa:
   - Otwórz w przeglądarce: `http://twoja-strona.local/wp-json/odwiedziny-chorych/v1/`
   - Powinien wyświetlić się JSON (może być pusty, ale nie błąd 404)
2. Jeśli błąd 404:
   - Sprawdź czy permalinks są ustawione (Ustawienia → Stałe linki → Zapisz)
   - Zrestartuj stronę w Local

---

## 📁 Przydatne ścieżki w LocalWP

**Główny folder strony:**
- Windows: `C:\Users\TwojeImie\Local Sites\twoja-strona\app\public\`
- Mac: `~/Local Sites/twoja-strona/app/public/`

**Folder plugins:**
- `wp-content/plugins/odwiedziny-chorych/`

**Logi:**
- W Local: Kliknij stronę → zakładka **"Logs"**
- Lub: `app/logs/php-errors.log`

**Baza danych:**
- W Local: Kliknij stronę → **"Database"** → otworzy phpMyAdmin
- Lub: Użyj **"Open Database"** w Local

---

## ✅ Podsumowanie - Szybki start w LocalWP

1. **Otwórz folder strony** w Local (kliknij ikonę folderu)
2. **Skopiuj** folder `odwiedziny-chorych` do `wp-content/plugins/`
3. **Aktywuj plugin** w WordPress (Wtyczki → Włącz)
4. **Dodaj shortcode** `[odwiedziny_chorych]` na stronę
5. **Otwórz stronę** - aplikacja działa! 🎉

---

**Gotowe!** Jeśli masz problemy, sprawdź sekcję "Rozwiązywanie problemów" powyżej.


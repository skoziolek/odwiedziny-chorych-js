# Wdrożenie na produkcję - Instrukcja krok po kroku

## ✅ Status: APLIKACJA GOTOWA DO WDROŻENIA

Aplikacja jest w pełni gotowa do wdrożenia na stronę opartą na WordPress.

---

## 📋 Checklist przed wdrożeniem

### 1. ✅ Struktura pluginu
- [x] Plugin jest w katalogu `wp-content/plugins/odwiedziny-chorych/`
- [x] Wszystkie pliki są na miejscu
- [x] Brak plików testowych (test-*.php już usunięte)

### 2. ⚠️ Pliki pomocnicze (opcjonalne do usunięcia)
Następujące pliki są pomocnicze i można je usunąć przed wdrożeniem:
- `clear-cache-now.php` - tylko do lokalnego użytku
- `KOPIUJ_PLIKI*.bat`, `KOPIUJ_PLIKI.ps1` - tylko do lokalnego użytku
- `KOPIUJ_PLIKI_DO_LOCALWP.md` - instrukcja lokalna

**Nie musisz ich usuwać** - nie stanowią zagrożenia bezpieczeństwa, ale można je usunąć dla czystości.

### 3. ✅ Konfiguracja bezpieczeństwa
- [x] Kod wyłączający weryfikację SSL usunięty
- [x] Wszystkie dane są sanityzowane
- [x] Rate limiting dla logowania zaimplementowany
- [x] CSRF protection (nonces)
- [x] SQL injection protection (prepared statements)

### 4. ⚠️ Console.log (opcjonalne)
W pliku `assets/js/app.js` są `console.log` użyte do debugowania.
- Nie stanowią zagrożenia bezpieczeństwa
- Można je pozostawić (użytkownicy ich nie zobaczą w normalnym użyciu)
- Albo usunąć/przełączyć na warunkowe: `if (DEBUG) console.log(...)`

### 5. ✅ Responsywność
- [x] Viewport meta tag dodany
- [x] Media queries zaimplementowane
- [x] Wszystkie komponenty responsywne
- [x] Testowane na różnych rozdzielczościach

---

## 🚀 Instrukcja wdrożenia

### KROK 1: Przygotowanie plików

1. **Skopiuj folder pluginu** do serwera produkcyjnego:
   ```bash
   # Lokalizacja docelowa:
   /wp-content/plugins/odwiedziny-chorych/
   ```

2. **Opcjonalnie - usuń pliki pomocnicze** (jeśli chcesz):
   - `clear-cache-now.php`
   - `KOPIUJ_PLIKI*.bat`, `KOPIUJ_PLIKI.ps1`
   - `KOPIUJ_PLIKI_DO_LOCALWP.md`

### KROK 2: Aktywacja pluginu w WordPress

1. Zaloguj się do panelu WordPress (`/wp-admin`)
2. Przejdź do: **Wtyczki** → **Zainstalowane wtyczki**
3. Znajdź **"Odwiedziny Chorych"**
4. Kliknij **"Włącz"**

### KROK 3: Dodanie shortcode na stronę

1. Utwórz nową stronę lub edytuj istniejącą
2. W edytorze dodaj shortcode:
   ```
   [odwiedziny_chorych]
   ```
3. Opublikuj stronę

### KROK 4: Konfiguracja SMTP (WAŻNE!)

Aplikacja wysyła emaile o przypomnieniach. Musisz skonfigurować SMTP:

1. **Zainstaluj plugin SMTP:**
   - Przejdź do: **Wtyczki** → **Dodaj nową**
   - Wyszukaj: **"WP Mail SMTP"**
   - Zainstaluj i aktywuj

2. **Skonfiguruj SMTP:**
   - Przejdź do: **WP Mail SMTP** → **Settings**
   - Wybierz dostawcę (Gmail, Outlook, Other SMTP)
   - Wprowadź dane SMTP:
     - SMTP Host
     - SMTP Port (587 dla TLS, 465 dla SSL)
     - Encryption (TLS lub SSL)
     - Username i Password
   - Zapisz ustawienia

3. **Przetestuj wysyłkę:**
   - W WP Mail SMTP kliknij **"Send Test Email"**
   - Sprawdź czy email dotarł

📖 **Szczegółowa instrukcja:** Zobacz `INSTALACJA_SMTP.md`

### KROK 5: Konfiguracja Cron (opcjonalne, ale zalecane)

Emaile są wysyłane codziennie o 18:00 przez WordPress Cron. Aby mieć pewność, że działają:

1. **Opcja A: Pozostaw WordPress Cron** (najprostsze)
   - WordPress automatycznie uruchomi cron gdy ktoś odwiedzi stronę
   - Jeśli nikt nie odwiedzi strony o 18:00, cron się nie uruchomi

2. **Opcja B: Prawdziwy Cron przez crontab** (zalecane)

   a) Wyłącz WordPress Cron w `wp-config.php`:
   ```php
   define('DISABLE_WP_CRON', true);
   ```

   b) Dodaj cron do crontab serwera:
   ```bash
   # Codziennie o 18:00
   0 18 * * * curl -s https://twoja-strona.pl/wp-cron.php?doing_wp_cron > /dev/null 2>&1
   
   # LUB częściej (co 15 minut) dla większej niezawodności
   */15 * * * * curl -s https://twoja-strona.pl/wp-cron.php?doing_wp_cron > /dev/null 2>&1
   ```

   **Jak dodać cron:**
   - **cPanel:** Cron Jobs → Dodaj nowy cron
   - **Plesk:** Scheduled Tasks → Dodaj nowe zadanie
   - **SSH:** `crontab -e` → dodaj linię powyżej

📖 **Szczegółowa instrukcja:** Zobacz `PRZYGOTOWANIE_DO_PRODUKCJI.md`

### KROK 6: Konfiguracja SSL (zalecane)

Aby aplikacja działała bezpiecznie, użyj HTTPS:

1. **Sprawdź czy hosting oferuje SSL:**
   - Większość hostingu oferuje darmowe SSL (Let's Encrypt)
   - Włącz SSL w panelu hostingu

2. **Zaktualizuj URL w WordPress:**
   - Ustawienia → Ogólne
   - Zmień `http://` na `https://`

📖 **Szczegółowa instrukcja:** Zobacz `KONFIGURACJA_SSL.md`

### KROK 7: Ustawienia aplikacji

1. Zaloguj się do aplikacji (domyślne hasło: `PomocDlaChorych!`)
2. Przejdź do: **Odwiedziny Chorych** → **Ustawienia** (w menu WordPress)
3. **Zmień domyślne hasło** na bezpieczne
4. Skonfiguruj inne opcje jeśli potrzebne

### KROK 8: Testowanie

Przetestuj wszystkie funkcjonalności:

- [ ] Logowanie
- [ ] Wyświetlanie kalendarza
- [ ] Przypisywanie szafarzy
- [ ] Dodawanie chorych
- [ ] Dodawanie szafarzy
- [ ] Tworzenie nowego roku
- [ ] Auto-przypisanie szafarzy
- [ ] Raporty
- [ ] Drukowanie
- [ ] Wysyłka emaili (poczekaj do 18:00 lub uruchom ręcznie przez WP Mail SMTP)

---

## ✅ Po wdrożeniu

### Co działa:
- ✅ Pełna funkcjonalność aplikacji
- ✅ Responsywność na mobile i desktop
- ✅ Wysyłka emaili (jeśli SMTP skonfigurowany)
- ✅ Automatyczne przypomnienia o dyżurach (jeśli cron skonfigurowany)
- ✅ Bezpieczne API
- ✅ Session management

### Co możesz jeszcze zrobić:
- ⚠️ Usunąć `console.log` z `app.js` (opcjonalne)
- ⚠️ Usunąć pliki pomocnicze (`clear-cache-now.php`, etc.) (opcjonalne)
- ⚠️ Dodać aria-labels dla lepszej dostępności (opcjonalne)

---

## 📚 Dokumentacja

Przydatne pliki dokumentacji:
- `README.md` - Ogólna dokumentacja
- `INSTALACJA_SMTP.md` - Konfiguracja SMTP
- `KONFIGURACJA_SSL.md` - Konfiguracja SSL
- `AKTUALIZACJA.md` - Jak aktualizować plugin
- `RESPONSYWNOŚĆ.md` - Informacje o responsywności
- `BEZPIECZENSTWO.md` - Informacje o bezpieczeństwie

---

## 🆘 Rozwiązywanie problemów

### Problem: Plugin się nie aktywuje
- Sprawdź czy wszystkie pliki są skopiowane
- Sprawdź logi błędów WordPress w `wp-content/debug.log`
- Sprawdź czy PHP wersja to 7.4+

### Problem: Aplikacja nie wyświetla się
- Sprawdź czy shortcode jest poprawny: `[odwiedziny_chorych]`
- Sprawdź czy strona jest opublikowana
- Wyczyść cache przeglądarki

### Problem: Emaile nie są wysyłane
- Sprawdź czy plugin SMTP jest zainstalowany i aktywny
- Sprawdź konfigurację SMTP
- Sprawdź czy cron jest skonfigurowany
- Sprawdź folder SPAM w skrzynce email

---

## ✅ Podsumowanie

**Aplikacja jest gotowa do wdrożenia!**

Wystarczy:
1. ✅ Skopiować pliki na serwer
2. ✅ Aktywować plugin w WordPress
3. ✅ Dodać shortcode na stronę
4. ⚠️ Skonfigurować SMTP (wymagane dla emaili)
5. ⚠️ Skonfigurować cron (opcjonalne, ale zalecane)

**Wszystko inne jest już gotowe!**

---

**Data przygotowania:** 2025-12-29  
**Wersja:** 1.0.0  
**Status:** ✅ GOTOWA DO PRODUKCJI


# Instrukcja Wdrożenia dla Administratora

## 📋 Krok po kroku - Wdrożenie pluginu na stronę WordPress

### ✅ KROK 1: Pobierz plugin

**Opcja A: Przez Git (jeśli masz dostęp do repozytorium)**
```bash
git clone https://github.com/TWOJE_REPO/odwiedziny-chorych.git
```

**Opcja B: Pobierz ZIP**
1. Pobierz plik ZIP z repozytorium
2. Rozpakuj archiwum

---

### ✅ KROK 2: Skopiuj plugin na serwer

**Przez FTP/SFTP:**
1. Połącz się z serwerem przez klienta FTP (FileZilla, WinSCP, itp.)
2. Przejdź do: `/wp-content/plugins/`
3. Wgraj folder `odwiedziny-chorych` (zawartość, nie sam folder)

**Przez Panel Hostingu (File Manager):**
1. Zaloguj się do panelu hostingu (cPanel, Plesk, DirectAdmin)
2. Otwórz **File Manager**
3. Przejdź do: `public_html/wp-content/plugins/` (lub podobna ścieżka)
4. Wgraj folder `odwiedziny-chorych`

**Przez SSH:**
```bash
cd /ścieżka/do/wordpress/wp-content/plugins/
# Skopiuj folder odwiedziny-chorych tutaj
```

---

### ✅ KROK 3: Aktywuj plugin w WordPress

1. Zaloguj się do panelu administracyjnego WordPress:
   - Adres: `https://twoja-strona.pl/wp-admin`
   - Użyj swoich danych administratora WordPress

2. Przejdź do: **Wtyczki** → **Zainstalowane wtyczki**

3. Znajdź **"Odwiedziny Chorych"** na liście wtyczek

4. Kliknij przycisk **"Włącz"** przy wtyczce

✅ **Plugin jest teraz aktywny!**

---

### ✅ KROK 4: Sprawdź wymagania techniczne

Upewnij się, że Twój serwer spełnia wymagania:
- ✅ WordPress 5.0 lub nowszy
- ✅ PHP 7.4 lub nowszy
- ✅ MySQL 5.7 lub nowszy
- ✅ Plugin SMTP (do zainstalowania w kroku 5)

---

### ✅ KROK 5: Dodaj aplikację na stronę

1. W panelu WordPress przejdź do: **Strony** → **Dodaj nową** (lub edytuj istniejącą)

2. W edytorze strony dodaj shortcode:
   ```
   [odwiedziny_chorych]
   ```

3. Opcjonalnie - dodaj tytuł strony: **"Odwiedziny Chorych"**

4. Kliknij **"Opublikuj"** (lub **"Zaktualizuj"** jeśli edytujesz istniejącą)

5. Kliknij **"Zobacz stronę"** aby zobaczyć aplikację

✅ **Aplikacja powinna być teraz dostępna na stronie!**

---

### ✅ KROK 6: Skonfiguruj SMTP (WAŻNE dla emaili)

Aplikacja wysyła emaile z przypomnieniami o dyżurach. Musisz skonfigurować SMTP.

#### 5.1: Zainstaluj plugin SMTP

1. W panelu WordPress: **Wtyczki** → **Dodaj nową**
2. Wyszukaj: **"WP Mail SMTP"**
3. Kliknij **"Zainstaluj teraz"**
4. Kliknij **"Aktywuj"**

#### 5.2: Skonfiguruj SMTP

1. Przejdź do: **WP Mail SMTP** → **Settings** (w menu WordPress)

2. Wybierz dostawcę email:
   - **Gmail** - jeśli używasz Gmail
   - **Outlook** - jeśli używasz Outlook
   - **Other SMTP** - dla innych serwerów SMTP

3. Wprowadź dane SMTP:

   **Dla Gmail:**
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - Encryption: `TLS`
   - SMTP Username: Twój adres Gmail
   - SMTP Password: Hasło aplikacji (nie zwykłe hasło! - jak utworzyć: zobacz poniżej)

   **Dla Outlook:**
   - SMTP Host: `smtp-mail.outlook.com`
   - SMTP Port: `587`
   - Encryption: `TLS`
   - SMTP Username: Twój adres Outlook
   - SMTP Password: Twoje hasło Outlook

   **Dla Other SMTP:**
   - Wprowadź dane dostarczone przez Twojego dostawcę hostingu

4. **From Email:** Adres, z którego będą wysyłane emaile
5. **From Name:** Nazwa nadawcy (np. "Odwiedziny Chorych")

6. Kliknij **"Save Settings"**

#### 5.3: Utwórz hasło aplikacji dla Gmail (jeśli używasz Gmail)

1. Przejdź do: https://myaccount.google.com/apppasswords
2. Wybierz aplikację: **"Mail"**
3. Wybierz urządzenie: **"Inne (Niestandardowa nazwa)"**
4. Wpisz: "WordPress"
5. Kliknij **"Generuj"**
6. Skopiuj wygenerowane hasło (16 znaków)
7. Użyj tego hasła jako **SMTP Password** w WP Mail SMTP

#### 5.4: Przetestuj wysyłkę

1. W WP Mail SMTP kliknij zakładkę **"Email Test"**
2. Wpisz swój adres email
3. Kliknij **"Send Email"**
4. Sprawdź skrzynkę email (również folder SPAM)

✅ **Jeśli email dotarł - SMTP jest skonfigurowany poprawnie!**

📖 **Szczegółowa instrukcja:** Zobacz `INSTALACJA_SMTP.md`

---

### ✅ KROK 7: Zmień domyślne hasło aplikacji

1. W panelu WordPress przejdź do: **Odwiedziny Chorych** → **Ustawienia**

2. Znajdź pole **"Hasło administratora"**

3. Wpisz nowe, bezpieczne hasło

4. Kliknij **"Zapisz ustawienia"**

⚠️ **WAŻNE:** 
- Domyślne hasło: `PomocDlaChorych!`
- **ZMIEŃ JE NA PEWNO!**
- Hasło jest wspólne dla wszystkich użytkowników aplikacji

---

### ✅ KROK 8: Skonfiguruj Cron (opcjonalne, ale zalecane)

Emaile są wysyłane codziennie o 18:00 przez WordPress Cron. Aby mieć pewność, że działają:

#### Opcja A: Pozostaw WordPress Cron (najprostsze)
- WordPress automatycznie uruchomi cron gdy ktoś odwiedzi stronę
- ⚠️ Jeśli nikt nie odwiedzi strony o 18:00, cron się nie uruchomi

#### Opcja B: Prawdziwy Cron przez crontab (zalecane)

1. **Wyłącz WordPress Cron** w `wp-config.php`:
   ```php
   define('DISABLE_WP_CRON', true);
   ```

2. **Dodaj cron do crontab serwera:**

   **W cPanel:**
   - Przejdź do: **Cron Jobs**
   - Dodaj nowy cron:
     - Command: `curl -s https://twoja-strona.pl/wp-cron.php?doing_wp_cron > /dev/null 2>&1`
     - Schedule: `0 18 * * *` (codziennie o 18:00)
     - Lub częściej: `*/15 * * * *` (co 15 minut)

   **W Plesk:**
   - Przejdź do: **Scheduled Tasks**
   - Dodaj nowe zadanie (jak powyżej)

   **Przez SSH:**
   ```bash
   crontab -e
   # Dodaj linię:
   0 18 * * * curl -s https://twoja-strona.pl/wp-cron.php?doing_wp_cron > /dev/null 2>&1
   ```

📖 **Szczegółowa instrukcja:** Zobacz `PRZYGOTOWANIE_DO_PRODUKCJI.md`

---

### ✅ KROK 9: Konfiguracja SSL (zalecane)

Aby aplikacja działała bezpiecznie, użyj HTTPS:

1. **Sprawdź czy hosting oferuje SSL:**
   - Większość hostingu oferuje darmowe SSL (Let's Encrypt)
   - Włącz SSL w panelu hostingu

2. **Zaktualizuj URL w WordPress:**
   - Ustawienia → Ogólne
   - Zmień `http://` na `https://` w polach URL

3. **Sprawdź czy strona działa na HTTPS:**
   - Wejdź na stronę - powinna mieć zieloną kłódkę w przeglądarce

📖 **Szczegółowa instrukcja:** Zobacz `KONFIGURACJA_SSL.md`

---

### ✅ KROK 10: Testowanie

Przetestuj wszystkie funkcjonalności:

- [ ] Logowanie do aplikacji
- [ ] Wyświetlanie kalendarza
- [ ] Przypisywanie szafarzy
- [ ] Dodawanie chorych
- [ ] Dodawanie szafarzy
- [ ] Tworzenie nowego roku
- [ ] Auto-przypisanie szafarzy
- [ ] Raporty
- [ ] Drukowanie
- [ ] Wysyłka emaili (poczekaj do 18:00 lub sprawdź w WP Mail SMTP)

---

## 🆘 Rozwiązywanie problemów

### Problem: Plugin się nie aktywuje
- Sprawdź czy wszystkie pliki są skopiowane
- Sprawdź logi błędów WordPress w `wp-content/debug.log`
- Sprawdź czy PHP wersja to 7.4+

### Problem: Aplikacja nie wyświetla się
- Sprawdź czy shortcode jest poprawny: `[odwiedziny_chorych]`
- Sprawdź czy strona jest opublikowana
- Wyczyść cache przeglądarki i WordPress

### Problem: Emaile nie są wysyłane
- Sprawdź czy plugin SMTP jest zainstalowany i aktywny
- Sprawdź konfigurację SMTP
- Sprawdź czy cron jest skonfigurowany
- Sprawdź folder SPAM w skrzynce email

### Problem: Błędy w konsoli przeglądarki
- Otwórz DevTools (F12) → Console
- Sprawdź czy REST API działa: `https://twoja-strona.pl/wp-json/odwiedziny-chorych/v1/`
- Wyczyść cache przeglądarki

---

## 📚 Dodatkowa dokumentacja

- **`INSTRUKCJA_EMAIL_PRZED_DYZUREM.md`** — krótka checklista: co po wpisaniu e-maila szafarza i przypisaniu go w kalendarzu (SMTP, cron, jak działają przypomnienia)
- `README.md` - Ogólna dokumentacja
- `WDROZENIE_PRODUKCJA.md` - Szczegółowa instrukcja wdrożenia
- `INSTALACJA_SMTP.md` - Instrukcja konfiguracji SMTP
- `KONFIGURACJA_SSL.md` - Instrukcja konfiguracji SSL
- `AKTUALIZACJA.md` - Jak aktualizować plugin
- `BEZPIECZENSTWO.md` - Informacje o bezpieczeństwie

---

## ✅ Podsumowanie

Po wykonaniu wszystkich kroków:

1. ✅ Plugin jest zainstalowany i aktywny
2. ✅ Aplikacja jest dostępna na stronie
3. ✅ SMTP jest skonfigurowany (emaile działają)
4. ✅ Hasło zostało zmienione
5. ✅ Aplikacja jest gotowa do użycia!

**Gotowe! 🎉**

---

**Wersja:** 1.0.0  
**Data:** 2025-12-29  
**Status:** ✅ Gotowa do produkcji


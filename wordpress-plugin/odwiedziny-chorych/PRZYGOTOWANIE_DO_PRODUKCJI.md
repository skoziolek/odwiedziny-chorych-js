# Przygotowanie do produkcji - Lista zmian

## ✅ Wykonane zmiany

### 1. Usunięto kod tylko dla lokalnego środowiska
- ❌ Usunięto hook `disable_ssl_verification()` z `odwiedziny-chorych.php`
- ❌ Usunięto metodę `disable_ssl_verification()` z klasy `OdwiedzinyChorych`

**Uzasadnienie:** Kod wyłączający weryfikację certyfikatów SSL był potrzebny tylko dla środowiska lokalnego (LocalWP). W produkcji certyfikaty SSL powinny być zawsze weryfikowane.

### 2. Pliki testowe do usunięcia przed wdrożeniem

⚠️ **WAŻNE:** Przed wdrożeniem na produkcję **USUŃ** następujące pliki:

- `test-email-now.php` - Test wysyłki emaili dla konkretnej daty
- `test-emails.php` - Alternatywny test wysyłki emaili
- `diagnostyka-email.php` - Narzędzie diagnostyczne do sprawdzania konfiguracji SMTP
- `view-email-logs.php` - Podgląd logów wysyłki emaili

**Dlaczego?** Te pliki mogą stanowić zagrożenie bezpieczeństwa, jeśli będą dostępne publicznie. Mogą ujawnić informacje o konfiguracji systemu.

### 3. Alternatywa: Zabezpieczenie plików testowych

Jeśli chcesz zachować pliki testowe, ale zabezpieczyć je przed nieautoryzowanym dostępem, możesz:

#### Opcja A: Usunąć pliki (ZALECANE)
```bash
rm test-email-now.php test-emails.php diagnostyka-email.php view-email-logs.php
```

#### Opcja B: Dodać do `.htaccess` w folderze pluginu
```apache
<FilesMatch "^(test-.*|diagnostyka-email|view-email-logs)\.php$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

**UWAGA:** `.htaccess` działa tylko na serwerach Apache. Jeśli używasz Nginx, musisz skonfigurować reguły w konfiguracji serwera.

---

## 📋 Checklist przed wdrożeniem na produkcję

### Bezpieczeństwo
- [x] Usunięto kod wyłączający weryfikację SSL
- [ ] Usunięto pliki testowe (lub zabezpieczono przez .htaccess)
- [ ] Sprawdzono, że wszystkie hasła są bezpieczne
- [ ] Sprawdzono, że wszystkie dane wrażliwe nie są w kodzie

### Konfiguracja
- [ ] Zainstalowano i skonfigurowano plugin SMTP (WP Mail SMTP)
- [ ] Skonfigurowano zewnętrzny serwer SMTP (Gmail, Outlook, SendGrid, etc.)
- [ ] Przetestowano wysyłkę emaili
- [ ] Skonfigurowano prawdziwy cron przez crontab (opcjonalne, ale zalecane)

### Testy
- [ ] Przetestowano wszystkie funkcjonalności
- [ ] Przetestowano logowanie
- [ ] Przetestowano wysyłkę emaili
- [ ] Przetestowano REST API

### Dokumentacja
- [ ] Przeczytano `KONFIGURACJA_EMAIL_PRODUKCJA.md`
- [ ] Przeczytano `INSTALACJA_LOCALHOST.md` (dla zrozumienia struktury)
- [ ] Przeczytano `AKTUALIZACJA.md` (dla przyszłych aktualizacji)

---

## 🔧 Konfiguracja SMTP w produkcji

Przed wdrożeniem upewnij się, że:

1. **Plugin SMTP jest zainstalowany i aktywny**
   - WP Mail SMTP lub inny plugin SMTP

2. **SMTP jest poprawnie skonfigurowany**
   - SMTP Host, Port, Encryption
   - Username i Password (hasło aplikacji dla Gmail)
   - From Email i From Name

3. **Przetestowano wysyłkę**
   - Użyj funkcji testowej w pluginie SMTP
   - Sprawdź skrzynkę email i folder SPAM

---

## ⏰ Konfiguracja Cron w produkcji

WordPress Cron (`wp-cron`) działa automatycznie, ale ma ograniczenia:
- Wymaga odwiedzin strony o określonej godzinie
- Jeśli nikt nie odwiedza strony o 18:00, cron się nie uruchomi

### Zalecana konfiguracja: Prawdziwy cron przez crontab

1. **Wyłącz WordPress Cron** w `wp-config.php`:
   ```php
   define('DISABLE_WP_CRON', true);
   ```

2. **Dodaj cron do crontab serwera:**
   ```bash
   # Codziennie o 18:00
   0 18 * * * curl -s https://twoja-strona.pl/wp-cron.php?doing_wp_cron > /dev/null 2>&1
   
   # Lub częściej (co 15 minut), aby mieć pewność
   */15 * * * * curl -s https://twoja-strona.pl/wp-cron.php?doing_wp_cron > /dev/null 2>&1
   ```

**Instrukcje dla różnych hostingów:**
- **cPanel:** Cron Jobs → Dodaj nowy cron
- **Plesk:** Scheduled Tasks → Dodaj nowe zadanie
- **SSH:** `crontab -e` → dodaj linię powyżej

---

## 📝 Pliki dokumentacji do zachowania

Te pliki możesz zachować w produkcji (są bezpieczne):

- `README.md` - Ogólna dokumentacja pluginu
- `INSTALACJA_LOCALHOST.md` - Instrukcja instalacji (może być przydatna)
- `INSTALACJA_SMTP.md` - Instrukcja konfiguracji SMTP
- `KONFIGURACJA_EMAIL_PRODUKCJA.md` - Konfiguracja emaili w produkcji
- `AKTUALIZACJA.md` - Instrukcja aktualizacji
- `TESTOWANIE_EMAILI.md` - Dokumentacja testowania (można usunąć jeśli niepotrzebne)

Te pliki można usunąć (są tylko dla deweloperów):

- `ROZWIAZYWANIE_BLEDOW_SMTP.md` - Rozwiązywanie problemów (opcjonalne)
- `ROZWIAZYWANIE_PROBLEMOW_LOCALWP.md` - Problemy z LocalWP (opcjonalne)
- `PRZYGOTOWANIE_DO_PRODUKCJI.md` - Ten plik (można usunąć po wdrożeniu)

---

## ✅ Podsumowanie

Plugin jest gotowy do produkcji po:
1. ✅ Usunięciu/usunięciu kodu wyłączającego weryfikację SSL (WYKONANE)
2. ⚠️ Usunięciu plików testowych (DO WYKONANIA PRZED WDROŻENIEM)
3. ✅ Skonfigurowaniu SMTP w środowisku produkcyjnym
4. ✅ Przetestowaniu wszystkich funkcjonalności

---

## 🚀 Krok po kroku - Wdrożenie na produkcję

1. **Usuń pliki testowe:**
   ```bash
   cd wp-content/plugins/odwiedziny-chorych/
   rm test-email-now.php test-emails.php diagnostyka-email.php view-email-logs.php
   ```

2. **Zainstaluj plugin SMTP:**
   - WP Mail SMTP → Zainstaluj i aktywuj

3. **Skonfiguruj SMTP:**
   - Wypełnij dane SMTP (serwer, port, username, password)
   - Przetestuj wysyłkę

4. **Skonfiguruj cron (opcjonalne, ale zalecane):**
   - Dodaj cron do crontab serwera

5. **Przetestuj:**
   - Sprawdź czy aplikacja działa
   - Sprawdź czy emaile są wysyłane
   - Sprawdź logi (jeśli potrzebne)

6. **Gotowe!** ✅

---

**Data przygotowania:** $(Get-Date -Format "yyyy-MM-dd")
**Wersja pluginu:** 1.0.0


# Konfiguracja wysyłki emaili w środowisku produkcyjnym

## Jak działa wysyłka emaili

System używa funkcji WordPress `wp_mail()`, która w środowisku produkcyjnym może działać na kilka sposobów:

### 1. Domyślna konfiguracja WordPress (może nie działać)

WordPress domyślnie używa funkcji PHP `mail()`, która:
- ✅ **Może działać** na serwerach z poprawnie skonfigurowanym serwerem mailowym (sendmail/postfix)
- ❌ **Często nie działa** lub emaile trafiają do SPAM
- ❌ **Wymaga konfiguracji** serwera przez administratora serwera

### 2. **ZALECANE: Plugin SMTP** (najlepsze rozwiązanie)

Najlepszym rozwiązaniem jest użycie pluginu SMTP, który pozwala wysyłać emaile przez zewnętrzny serwer SMTP (np. Gmail, Outlook, SendGrid, Mailgun).

#### Opcja A: Plugin WP Mail SMTP (darmowy)

1. **Zainstaluj plugin:**
   - W panelu WordPress: Wtyczki → Dodaj nową
   - Wyszukaj: "WP Mail SMTP"
   - Zainstaluj i aktywuj

2. **Skonfiguruj SMTP:**
   - Przejdź do: WP Mail SMTP → Settings
   - Wybierz "Other SMTP" lub konkretnego dostawcę (Gmail, Outlook, etc.)
   - Wprowadź dane SMTP:
     - **SMTP Host:** (np. `smtp.gmail.com` dla Gmail)
     - **SMTP Port:** (zwykle 587 lub 465)
     - **Encryption:** TLS lub SSL
     - **SMTP Username:** Twój adres email
     - **SMTP Password:** Hasło lub hasło aplikacji
   - Zapisz ustawienia

3. **Przetestuj:**
   - Użyj funkcji testowej w pluginie
   - Lub użyj pliku testowego: `test-email-now.php`

#### Opcja B: Inne popularne pluginy SMTP

- **Easy WP SMTP** - prosty w konfiguracji
- **Post SMTP** - z zaawansowanym logowaniem
- **SMTP Mailer** - lekki i szybki

### 3. Serwery email (dla zaawansowanych)

Jeśli masz dostęp do serwera, możesz skonfigurować:

- **Sendmail** - standardowy dla większości serwerów Linux
- **Postfix** - popularny serwer SMTP
- **Zewnętrzne serwisy:** SendGrid, Mailgun, Amazon SES, etc.

## Automatyczne wysyłanie (Cron Job)

System używa WordPress Cron (`wp-cron`), który:

- ✅ **Działa automatycznie** gdy strona jest odwiedzana
- ⚠️ **Wymaga odwiedzin** - jeśli nikt nie odwiedza strony o 18:00, cron się nie uruchomi
- ✅ **Rekomendacja:** Skonfiguruj prawdziwy cron przez crontab na serwerze

### Konfiguracja prawdziwego cron (opcjonalne, ale zalecane)

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

## Sprawdzanie czy emaile są wysyłane

1. **Logi w aplikacji:**
   - Odwiedź: `/wp-content/plugins/odwiedziny-chorych/view-email-logs.php`
   - Zobaczysz wszystkie próby wysyłki

2. **Logi WordPress:**
   - Jeśli `WP_DEBUG_LOG` jest włączony, logi znajdziesz w `wp-content/debug.log`

3. **Testowanie:**
   - Użyj pliku: `test-email-now.php`
   - Sprawdź czy status pokazuje "✓ Wysłano pomyślnie"
   - Sprawdź skrzynkę email i folder SPAM

## Bezpieczeństwo - Usuń pliki testowe w produkcji!

⚠️ **WAŻNE:** Przed wdrożeniem na produkcję **USUŃ** następujące pliki:
- `test-email-now.php`
- `test-emails.php`
- `view-email-logs.php`

Lub ogranicz do nich dostęp przez `.htaccess`:
```apache
<Files "test-*.php">
    Order Allow,Deny
    Deny from all
</Files>
```

## Podsumowanie - Zalecana konfiguracja produkcyjna

1. ✅ **Zainstaluj plugin SMTP** (np. WP Mail SMTP)
2. ✅ **Skonfiguruj zewnętrzny serwer SMTP** (Gmail, Outlook, SendGrid, etc.)
3. ✅ **Przetestuj wysyłkę** używając pliku testowego
4. ✅ **Sprawdź logi** czy emaile są wysyłane
5. ✅ **Skonfiguruj prawdziwy cron** (opcjonalne, ale zalecane)
6. ✅ **Usuń pliki testowe** przed wdrożeniem na produkcję

## Przykładowe konfiguracje SMTP

### Gmail
- SMTP Host: `smtp.gmail.com`
- Port: `587`
- Encryption: `TLS`
- Username: Twój adres Gmail
- Password: Hasło aplikacji (nie zwykłe hasło)

### Outlook/Office 365
- SMTP Host: `smtp.office365.com`
- Port: `587`
- Encryption: `STARTTLS`
- Username: Twój adres email
- Password: Twoje hasło

### SendGrid (darmowy do 100 emaili/dzień)
- SMTP Host: `smtp.sendgrid.net`
- Port: `587`
- Encryption: `TLS`
- Username: `apikey`
- Password: Twój API Key z SendGrid



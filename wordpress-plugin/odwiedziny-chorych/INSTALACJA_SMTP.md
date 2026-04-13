# Instalacja i konfiguracja SMTP - Przewodnik krok po kroku

## Krok 1: Zainstaluj plugin WP Mail SMTP

### 1.1. Otwórz panel WordPress
1. Otwórz w przeglądarce: `http://odwiedziny-chorych.local/wp-admin`
2. Zaloguj się jako administrator

### 1.2. Zainstaluj plugin
1. W lewym menu kliknij: **Wtyczki** → **Dodaj nową**
2. W polu wyszukiwania wpisz: **WP Mail SMTP**
3. Znajdź plugin **"WP Mail SMTP by WPForms"** (autor: WPForms)
4. Kliknij **"Zainstaluj teraz"**
5. Po zakończeniu instalacji kliknij **"Aktywuj"**

---

## Krok 2: Wybierz dostawcę email

Po aktywacji pluginu zostaniesz przekierowany do strony konfiguracji. Musisz wybrać dostawcę email.

### Opcje (od najłatwiejszych):

#### **Opcja A: Gmail (Zalecane dla testów)**

**Wymagania:**
- Konto Gmail
- Włączona 2-etapowa weryfikacja
- Hasło aplikacji (wygenerujesz w kolejnych krokach)

#### **Opcja B: Outlook/Office 365**

**Wymagania:**
- Konto Outlook/Microsoft
- Hasło do konta

#### **Opcja C: Inne SMTP (dowolny serwer SMTP)**

**Wymagania:**
- Adres serwera SMTP
- Port (zwykle 587 lub 465)
- Login i hasło

---

## Krok 3: Konfiguracja Gmail (Najłatwiejsza opcja)

### 3.1. Włącz 2-etapową weryfikację w Gmail

1. Otwórz: https://myaccount.google.com/security
2. W sekcji **"Logowanie do Google"** znajdź **"Weryfikacja dwuetapowa"**
3. Kliknij **"Rozpocznij"** i postępuj zgodnie z instrukcjami
4. **Ważne:** Musisz włączyć 2-etapową weryfikację, aby móc utworzyć hasło aplikacji

### 3.2. Utwórz hasło aplikacji

1. Na stronie: https://myaccount.google.com/security
2. Kliknij **"Hasła aplikacji"** (znajdziesz w sekcji "Weryfikacja dwuetapowa")
3. Jeśli nie widzisz tej opcji, najpierw włącz 2-etapową weryfikację
4. Wybierz aplikację: **"Poczta"**
5. Wybierz urządzenie: **"Inny (Niestandardowa nazwa)"**
6. Wpisz: **"WordPress SMTP"**
7. Kliknij **"Wygeneruj"**
8. **SKOPIUJ HASŁO** (16 znaków, bez spacji) - będziesz go potrzebować w następnym kroku
9. Przykład hasła: `abcd efgh ijkl mnop` → wpisujesz jako: `abcdefghijklmnop`

### 3.3. Skonfiguruj plugin WP Mail SMTP

1. W panelu WordPress przejdź do: **WP Mail SMTP** → **Settings** (lub po prostu **WP Mail SMTP**)
2. W sekcji **"Mailer"** wybierz: **"Gmail"**
3. Wypełnij formularz:

   **From Name (Nazwa nadawcy):**
   ```
   Odwiedziny Chorych
   ```

   **From Email (Email nadawcy):**
   ```
   twoj.email@gmail.com
   ```
   *(użyj tego samego adresu Gmail, dla którego utworzyłeś hasło aplikacji)*

   **Client ID:** *(zostaw puste, jeśli nie masz)*
   
   **Client Secret:** *(zostaw puste, jeśli nie masz)*

4. Kliknij przycisk **"Save Settings"** (Zapisz ustawienia)

### 3.4. Użyj prostszej metody - "Other SMTP"

Jeśli powyższa metoda wydaje się skomplikowana, użyj **"Other SMTP"** z danymi Gmail:

1. W sekcji **"Mailer"** wybierz: **"Other SMTP"**
2. Wypełnij formularz:

   **SMTP Host:**
   ```
   smtp.gmail.com
   ```

   **Encryption:**
   ```
   Yes - Use SSL encryption
   ```
   *(lub wybierz "Yes - Use TLS encryption" jeśli SSL nie działa)*

   **SMTP Port:**
   ```
   465
   ```
   *(lub `587` jeśli używasz TLS)*

   **Auto TLS:**
   ```
   ✓ Enabled (zalecane)
   ```

   **Authentication:**
   ```
   Yes - Use SMTP authentication
   ```

   **SMTP Username:**
   ```
   twoj.email@gmail.com
   ```
   *(twój pełny adres Gmail)*

   **SMTP Password:**
   ```
   [Wklej tutaj hasło aplikacji z kroku 3.2]
   ```
   *(16-znakowe hasło aplikacji, BEZ spacji)*

3. Kliknij **"Save Settings"** (Zapisz ustawienia)

---

## Krok 4: Przetestuj wysyłkę

### 4.1. Test w pluginie WP Mail SMTP

1. W WP Mail SMTP kliknij zakładkę **"Email Test"**
2. Wpisz adres email, na który chcesz otrzymać test
3. Kliknij **"Send Email"**
4. Sprawdź skrzynkę pocztową (również folder SPAM)

### 4.2. Test w naszej aplikacji

1. Otwórz: `http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/diagnostyka-email.php`
2. Kliknij **"🧪 Wyślij testowy email"**
3. Sprawdź skrzynkę pocztową

### 4.3. Sprawdź logi

1. Otwórz: `http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/view-email-logs.php`
2. Sprawdź czy widzisz wpisy o sukcesie wysyłki

---

## Krok 5: Konfiguracja Outlook/Office 365 (Alternatywa)

Jeśli wolisz użyć Outlook zamiast Gmail:

### 5.1. W panelu WP Mail SMTP

1. W sekcji **"Mailer"** wybierz: **"Outlook"** (jeśli dostępne) lub **"Other SMTP"**

### 5.2. Jeśli wybierasz "Other SMTP":

   **SMTP Host:**
   ```
   smtp.office365.com
   ```

   **Encryption:**
   ```
   Yes - Use STARTTLS
   ```

   **SMTP Port:**
   ```
   587
   ```

   **Authentication:**
   ```
   Yes - Use SMTP authentication
   ```

   **SMTP Username:**
   ```
   twoj.email@outlook.com
   ```
   *(lub twoj.email@hotmail.com)*

   **SMTP Password:**
   ```
   [Twoje hasło do konta Outlook]
   ```

---

## Krok 6: Inny serwer SMTP (Zaawansowane)

Jeśli masz własny serwer SMTP lub używasz innego dostawcy:

### Przykładowe dane dla różnych dostawców:

#### SendGrid (darmowy do 100 emaili/dzień):
- **SMTP Host:** `smtp.sendgrid.net`
- **Port:** `587`
- **Encryption:** TLS
- **Username:** `apikey`
- **Password:** Twój API Key z SendGrid

#### Mailgun:
- **SMTP Host:** `smtp.mailgun.org`
- **Port:** `587`
- **Encryption:** TLS
- **Username:** Twój login z Mailgun
- **Password:** Twoje hasło z Mailgun

---

## Rozwiązywanie problemów

### Problem: "Authentication failed" (błąd uwierzytelniania)

**Rozwiązanie:**
- Sprawdź czy hasło aplikacji jest poprawne (dla Gmail)
- Upewnij się, że nie ma spacji w haśle aplikacji
- Sprawdź czy 2-etapowa weryfikacja jest włączona (dla Gmail)

### Problem: "Connection timed out"

**Rozwiązanie:**
- Sprawdź czy port jest poprawny (465 dla SSL, 587 dla TLS)
- Spróbuj zmienić encryption (SSL ↔ TLS)
- Sprawdź czy firewall nie blokuje połączenia

### Problem: Email trafia do SPAM

**Rozwiązanie:**
- To normalne w środowisku lokalnym
- W produkcji dodaj SPF/DKIM records do domeny
- Upewnij się, że "From Email" pasuje do konta SMTP

### Problem: "wp_mail() zwróciło FALSE"

**Rozwiązanie:**
- Sprawdź logi w narzędziu diagnostycznym
- Upewnij się, że plugin SMTP jest aktywny
- Sprawdź czy dane SMTP są poprawne

---

## Weryfikacja czy wszystko działa

Po skonfigurowaniu SMTP, sprawdź:

1. ✅ **Test w WP Mail SMTP:**
   - WP Mail SMTP → Email Test → wyślij test

2. ✅ **Test w narzędziu diagnostycznym:**
   - `diagnostyka-email.php` → kliknij "Wyślij testowy email"
   - Status powinien pokazywać "✓ SUKCES"

3. ✅ **Sprawdź logi:**
   - `view-email-logs.php` → powinny być wpisy o sukcesie

4. ✅ **Sprawdź skrzynkę:**
   - Email powinien dotrzeć (sprawdź też folder SPAM)

---

## Co dalej?

Po pomyślnej konfiguracji SMTP:

1. ✅ System będzie automatycznie wysyłał emaile codziennie o 18:00
2. ✅ Szafarze będą otrzymywać przypomnienia o dyżurach dzień wcześniej
3. ✅ Wszystkie emaile będą logowane w `view-email-logs.php`

---

## Ważne uwagi

⚠️ **Bezpieczeństwo:**
- Nie udostępniaj haseł aplikacji
- W produkcji rozważ użycie zmiennych środowiskowych dla haseł
- Usuń pliki testowe (`test-email-now.php`, `diagnostyka-email.php`, `view-email-logs.php`) przed wdrożeniem

📧 **Limity:**
- Gmail: 500 emaili/dzień (dla kont osobistych)
- Outlook: 300 emaili/dzień
- Sprawdź limity swojego dostawcy



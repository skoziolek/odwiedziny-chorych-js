# Rozwiązywanie błędów SMTP

## Problem: "Could not connect to SMTP host" / "certificate verify failed"

### Przyczyna
W środowisku lokalnym (LocalWP) często występują problemy z certyfikatami SSL. Błąd `certificate verify failed` oznacza, że PHP nie może zweryfikować certyfikatu SSL serwera Gmail.

### Rozwiązanie 1: Użyj portu 587 z TLS (ZALECANE) ⭐

Zamiast portu 465 z SSL, użyj portu 587 z TLS:

1. **Otwórz ustawienia WP Mail SMTP:**
   - WP Mail SMTP → Settings

2. **Zmień konfigurację:**

   **Encryption:**
   ```
   Yes - Use TLS encryption
   ```
   *(NIE SSL!)*

   **SMTP Port:**
   ```
   587
   ```
   *(NIE 465!)*

   **Auto TLS:**
   ```
   ✓ Enabled (zalecane)
   ```

   **Pozostałe ustawienia pozostają bez zmian:**
   - SMTP Host: `smtp.gmail.com`
   - Authentication: `Yes`
   - Username: Twój adres Gmail
   - Password: Hasło aplikacji

3. **Zapisz ustawienia**

4. **Przetestuj ponownie:**
   - Email Test → Wyślij testowy email

---

### Rozwiązanie 2: Wyłącz weryfikację certyfikatu (TYLKO dla lokalnego środowiska!)

⚠️ **UWAGA:** To rozwiązanie jest TYLKO dla środowiska lokalnego! NIE używaj tego w produkcji!

#### Metoda A: Edytuj wp-config.php przez LocalWP

1. **W aplikacji LocalWP:**
   - Kliknij prawym na stronę `odwiedziny-chorych`
   - Wybierz **"Open Site Shell"**

2. **Otwórz wp-config.php w edytorze:**
   ```bash
   code wp-config.php
   ```
   *(lub użyj innego edytora, np. `notepad wp-config.php` w Windows)*

3. **Znajdź linię z:**
   ```php
   /* That's all, stop editing! Happy publishing. */
   ```

4. **Dodaj PRZED tą linią:**
   ```php
   // TYLKO dla lokalnego środowiska - wyłącz weryfikację certyfikatów SSL
   define('WP_MAIL_SMTP_SSL_VERIFY', false);
   ```

5. **Zapisz plik i zamknij edytor**

6. **Przetestuj ponownie wysyłkę emaila**

#### Metoda B: Edytuj przez ikonę "Site folder" (NAJŁATWIEJSZE!) ⭐

1. **W aplikacji LocalWP:**
   - Na ekranie z szczegółami strony (Overview) znajdź ikonę **"Site folder"** obok nazwy strony `odwiedziny-chorych`
   - Kliknij ikonę **"Site folder"** - otworzy się Eksplorator Windows z folderem strony

2. **Przejdź do folderu:**
   - W otwartym folderze przejdź do: `app` → `public`
   - Znajdź plik `wp-config.php`

3. **Otwórz `wp-config.php`:**
   - Kliknij prawym na `wp-config.php` → **"Otwórz za pomocą"** → **Notatnik** (lub inny edytor tekstu)

4. **Znajdź linię:**
   ```php
   /* That's all, stop editing! Happy publishing. */
   ```

5. **Dodaj PRZED tą linią:**
   ```php
   // TYLKO dla lokalnego środowiska - wyłącz weryfikację certyfikatów SSL
   define('WP_MAIL_SMTP_SSL_VERIFY', false);
   ```

6. **Zapisz plik** (Ctrl+S) i zamknij

7. **Przetestuj ponownie wysyłkę emaila**

#### Metoda C: Użyj filtra WordPress (Alternatywa)

Jeśli nie chcesz edytować `wp-config.php`, możesz dodać do pliku `functions.php` motywu (lub lepiej - do pluginu):

```php
// Dodaj do functions.php motywu lub lepiej - stwórz mały plugin
add_action('phpmailer_init', function($phpmailer) {
    $phpmailer->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );
});
```

**UWAGA:** Pamiętaj, aby USUNĄĆ tę linię/kod przed wdrożeniem na produkcję!

---

### Rozwiązanie 3: Sprawdź firewall/antywirus

Czasami firewall lub antywirus blokuje połączenia SMTP:

1. **Tymczasowo wyłącz firewall/antywirus**
2. **Spróbuj wysłać testowy email**
3. **Jeśli działa, dodaj wyjątek dla LocalWP**

---

### Rozwiązanie 4: Użyj innego portu (jeśli 587 też nie działa)

Możesz spróbować portu 25 (ale rzadko działa w lokalnym środowisku):

- **SMTP Port:** `25`
- **Encryption:** `None` (bez szyfrowania)

**UWAGA:** Port 25 często jest blokowany przez dostawców internetu.

---

## Podsumowanie - Zalecana konfiguracja dla LocalWP

Dla środowiska lokalnego (LocalWP) z Gmail:

```
SMTP Host: smtp.gmail.com
Encryption: TLS (NIE SSL!)
SMTP Port: 587 (NIE 465!)
Auto TLS: Enabled
Authentication: Yes
SMTP Username: twoj.email@gmail.com
SMTP Password: [hasło aplikacji]
```

---

## Inne częste błędy

### Błąd: "Authentication failed"

**Rozwiązanie:**
- Sprawdź czy hasło aplikacji jest poprawne (16 znaków, bez spacji)
- Upewnij się, że 2-etapowa weryfikacja jest włączona w Gmail
- Sprawdź czy używasz hasła aplikacji, a nie zwykłego hasła do Gmail

### Błąd: "Connection timed out"

**Rozwiązanie:**
- Sprawdź czy port jest poprawny (587 dla TLS, 465 dla SSL)
- Spróbuj zmienić encryption (TLS ↔ SSL)
- Sprawdź czy firewall nie blokuje połączenia

### Błąd: "Email trafia do SPAM"

**Rozwiązanie:**
- To normalne w środowisku lokalnym
- W produkcji dodaj SPF/DKIM records do domeny
- Upewnij się, że "From Email" pasuje do konta SMTP

---

## Testowanie po naprawie

Po zastosowaniu rozwiązania:

1. **Przetestuj w pluginie:**
   - WP Mail SMTP → Email Test → Wyślij testowy email

2. **Sprawdź logi:**
   - `http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/view-email-logs.php`

3. **Sprawdź skrzynkę email:**
   - Sprawdź folder SPAM jeśli nie widzisz emaila


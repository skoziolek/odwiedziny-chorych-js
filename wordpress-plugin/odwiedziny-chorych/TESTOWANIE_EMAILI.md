# Testowanie wysyłki emaili - Przewodnik krok po kroku

## Krok 1: Sprawdź czy plugin SMTP jest zainstalowany i skonfigurowany

**Jeśli jeszcze nie masz zainstalowanego pluginu SMTP, zobacz: `INSTALACJA_SMTP.md`**

1. Otwórz panel WordPress: `http://odwiedziny-chorych.local/wp-admin`
2. Sprawdź czy plugin SMTP (np. WP Mail SMTP) jest aktywny:
   - Wtyczki → Zainstalowane wtyczki
   - Powinien być widoczny "WP Mail SMTP" lub inny plugin SMTP jako aktywny

---

## Krok 2: Użyj narzędzia diagnostycznego (ZALECANE NAJPIERW)

Narzędzie diagnostyczne pomoże sprawdzić czy wszystko jest poprawnie skonfigurowane.

### 2.1. Otwórz narzędzie diagnostyczne

**Adres URL:**
```
http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/diagnostyka-email.php
```

**WAŻNE:** Musisz być zalogowany jako administrator WordPress!

### 2.2. Sprawdź status

Narzędzie pokaże:
- ✅ Czy plugin SMTP jest zainstalowany i aktywny
- ✅ Czy cron jest zaplanowany
- ✅ Status pliku logów
- ✅ Ostatnie wpisy w logach

### 2.3. Wyślij prosty testowy email

1. W narzędziu diagnostycznym kliknij przycisk **"🧪 Wyślij testowy email"**
2. Sprawdź wynik:
   - Jeśli widzisz **"✓ SUKCES"** - email został zaakceptowany przez system
   - Jeśli widzisz **"✗ BŁĄD"** - sprawdź szczegóły błędu poniżej
3. **Sprawdź swoją skrzynkę email:**
   - Sprawdź skrzynkę odbiorczą
   - Sprawdź folder SPAM (ważne!)
   - Email powinien dotrzeć w ciągu 1-5 minut

---

## Krok 3: Test wysyłki dla konkretnej daty dyżuru

Jeśli chcesz przetestować wysyłkę emaili dla konkretnej daty (z listą chorych), użyj tego narzędzia:

### 3.1. Otwórz test wysyłki dla daty

**Adres URL:**
```
http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/test-email-now.php
```

### 3.2. Wybierz datę

1. W formularzu wybierz datę, dla której chcesz przetestować wysyłkę
2. **WAŻNE:** W kalendarzu musi być przypisany szafarz dla tej daty!
3. **WAŻNE:** Szafarz musi mieć uzupełniony adres email!

### 3.3. Wyślij test

1. Kliknij przycisk **"Wyślij email testowy"**
2. Sprawdź wynik:
   - Powinna pojawić się tabela z informacją, do kogo został wysłany email
   - Status: **"✓ Wysłano pomyślnie"** oznacza sukces

### 3.4. Sprawdź email

1. Otwórz skrzynkę email szafarza (tego, który był przypisany do dyżuru)
2. Sprawdź folder SPAM jeśli nie widzisz emaila
3. Email powinien zawierać:
   - Informację o dacie dyżuru
   - Listę chorych do odwiedzenia (imię, adres, telefon, uwagi)
   - Informację o partnerze (jeśli jest przypisany)

---

## Krok 4: Sprawdź logi

### 4.1. Otwórz logi

**Adres URL:**
```
http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/view-email-logs.php
```

### 4.2. Co zobaczysz

- Wszystkie próby wysyłki emaili
- Datę i godzinę wysyłki
- Adres email odbiorcy
- Status (sukces/błąd)
- Szczegóły błędu (jeśli wystąpił)

---

## Krok 5: Przykładowy scenariusz testowy

### Scenariusz: Chcesz przetestować wysyłkę dla jutrzejszego dyżuru

1. **Przygotuj dane:**
   - Upewnij się, że w kalendarzu jest przypisany szafarz na jutrzejszą datę
   - Upewnij się, że szafarz ma uzupełniony adres email
   - Upewnij się, że są aktywni chorzy (status = TAK)

2. **Otwórz narzędzie testowe:**
   ```
   http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/test-email-now.php
   ```

3. **Wybierz datę:** Jutrzejsza data (powinna być domyślnie wybrana)

4. **Kliknij "Wyślij email testowy"**

5. **Sprawdź wynik:**
   - Powinna pojawić się tabela z informacją, że email został wysłany
   - Status: ✓ Wysłano pomyślnie

6. **Sprawdź skrzynkę email:**
   - Otwórz skrzynkę email szafarza
   - Sprawdź folder SPAM jeśli nie widzisz emaila
   - Email powinien zawierać listę chorych

7. **Sprawdź logi:**
   - Otwórz `view-email-logs.php`
   - Powinien być wpis o wysłaniu emaila z dzisiejszą datą

---

## Rozwiązywanie problemów

### Problem: Email nie dotarł

**Kroki diagnostyczne:**

1. **Sprawdź narzędzie diagnostyczne:**
   - Otwórz `diagnostyka-email.php`
   - Sprawdź czy plugin SMTP jest aktywny
   - Kliknij "Wyślij testowy email"
   - Jeśli pokazuje błąd, sprawdź konfigurację SMTP

2. **Sprawdź logi:**
   - Otwórz `view-email-logs.php`
   - Sprawdź czy jest wpis o próbie wysyłki
   - Jeśli jest błąd, zobacz szczegóły

3. **Sprawdź folder SPAM:**
   - Często emaile z lokalnych serwerów trafiają do SPAM
   - W produkcji dodaj SPF/DKIM records

4. **Sprawdź konfigurację SMTP:**
   - WP Mail SMTP → Settings
   - Sprawdź czy wszystkie dane są poprawne
   - Wykonaj test w pluginie SMTP

### Problem: "Brak dyżurów dla podanej daty"

**Rozwiązanie:**
- Upewnij się, że w kalendarzu jest przypisany szafarz dla wybranej daty
- Sprawdź czy data jest w formacie YYYY-MM-DD (np. 2025-01-26)

### Problem: "Nie znaleziono szafarzy z przypisanymi emailami"

**Rozwiązanie:**
- Sprawdź czy szafarz ma uzupełniony adres email w sekcji "Dane szafarze"
- Email musi być poprawny (sprawdź czy nie ma błędów w pisowni)

### Problem: "wp_mail() zwróciło FALSE"

**Rozwiązanie:**
- Sprawdź czy plugin SMTP jest aktywny i poprawnie skonfigurowany
- Sprawdź logi WordPress (`wp-content/debug.log` jeśli WP_DEBUG_LOG jest włączony)
- Sprawdź konfigurację SMTP w pluginie

---

## Przydatne adresy URL

| Narzędzie | Adres URL |
|-----------|-----------|
| **Diagnostyka emaili** | `http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/diagnostyka-email.php` |
| **Test wysyłki dla daty** | `http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/test-email-now.php` |
| **Logi emaili** | `http://odwiedziny-chorych.local/wp-content/plugins/odwiedziny-chorych/view-email-logs.php` |
| **Panel WordPress** | `http://odwiedziny-chorych.local/wp-admin` |
| **Ustawienia SMTP** | `http://odwiedziny-chorych.local/wp-admin/admin.php?page=wp-mail-smtp` |

---

## Ważne uwagi

⚠️ **Bezpieczeństwo:**
- Pliki testowe (`test-email-now.php`, `diagnostyka-email.php`, `view-email-logs.php`) powinny zostać **usunięte w produkcji**
- Lub ograniczone przez `.htaccess` tylko dla administratorów

📧 **Limity:**
- Gmail: 500 emaili/dzień (dla kont osobistych)
- Outlook: 300 emaili/dzień
- Sprawdź limity swojego dostawcy SMTP

✅ **Produkcja:**
- W środowisku produkcyjnym system automatycznie wysyła emaile codziennie o 18:00
- Cron jest uruchamiany automatycznie przez WordPress
- Zalecane jest skonfigurowanie prawdziwego cron przez crontab serwera


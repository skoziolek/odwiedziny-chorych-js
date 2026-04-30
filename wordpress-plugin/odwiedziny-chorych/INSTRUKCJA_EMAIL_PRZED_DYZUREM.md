# Przypomnienia e-mail przed dyżurem — instrukcja dla administratora

Krótki przewodnik: co musi być zrobione, żeby **szafarz dostał dzień przed dyżurem** e-mail z listą chorych **aktywnych** (w aplikacji: status „AKTYWNY”, w bazie: `TAK`).

---

## Zakładamy, że już masz

- W **Dane szafarzy** u danego szafarza wpisany **działający adres e-mail**.
- W **Kalendarzu** na **konkretną datę** (np. niedzielę dyżuru) **wybranego** tego szafarza jako **Osobę główną** lub **Pomocnika**.

---

## Co zrobić dalej (obowiązkowo)

### 1. Działająca wysyłka e-mail z WordPressa

Bez tego przypomnienia **nie wyjdą** z serwera.

- Zainstaluj i skonfiguruj np. **WP Mail SMTP** (lub inny plugin SMTP).
- Wykonaj **test wysyłki** z poziomu wtyczki SMTP (np. „Email Test”).
- Jeśli test nie dochodzi — popraw konfigurację (często hasło aplikacji przy Gmailu, port 587, TLS).

Szczegóły: plik **`INSTALACJA_SMTP.md`** oraz **Krok 6** w **`INSTRUKCJA_DLA_ADMINA.md`**.

### 2. Zaplanowane zadanie (cron)

Przypomnienia uruchamia **WordPress Cron** raz dziennie (wtyczka ustawia to przy aktywacji), domyślnie w **okolicy godz. 18:00** czasu serwera — **wieczorem w dzień poprzedzający dyżur** jest już „jutro” z punktu widzenia skryptu.

- Na stronie z **małym ruchem** WP-Cron bywa **opóźniony** (uruchamia się przy wejściu na stronę).
- **Zalecane na produkcji:** prawdziwy **cron** na hostingu (np. co 15–30 min wywołanie `wp-cron.php`) albo codziennie o stałej porze — tak jak w **Krok 8** w **`INSTRUKCJA_DLA_ADMINA.md`**.

### 3. Wtyczka „Odwiedziny Chorych” jest **włączona**

Przy **wyłączeniu** wtyczki harmonogram przypomnień jest usuwany; po ponownym **włączeniu** planuje się od nowa (przy aktywacji).

---

## Jak to działa (bez technicznego żargonu)

| Element | Opis |
|--------|------|
| **Kiedy** | System patrzy na **jutrzejszą datę** w kalendarzu i wysyła mail **tego dnia**, gdy zadanie cron się wykona (np. ok. 18:00). |
| **Do kogo** | Na **e-mail** przypisany szafarzowi w **Dane szafarzy** — osobno **główny** i **pomocnik**, jeśli mają różne adresy. |
| **Lista chorych** | Tylko osoby ze statusem **AKTYWNY** (technicznie `TAK`). |
| **Powtórki** | Ten sam szafarz i ta sama data — **jedna** wysyłka (system zapamiętuje wysłanie). |

---

## Szybka weryfikacja po wdrożeniu

1. **SMTP:** test e-maila z pluginu SMTP — **OK**.
2. **Kalendarz:** jutro jest dyżur z Twoim adresem jako główny/pomocnik — **OK**.
3. **Szafarz:** pole e-mail wypełnione — **OK**.
4. Następnego dnia (lub po czasie crona): sprawdź skrzynkę i **SPAM**.
5. Przy problemach: plik logów **`wp-content/oc-email-logs.txt`** na serwerze (krótki zapis prób wysyłki).

---

## Test dla programisty / wsparcia

W kodzie można (np. tymczasowo w motywie potomnym lub wtyczce pomocniczej) wywołać test dla **konkretnej daty** dyżuru:

`OC_Email_Notifications::test_send_for_date('YYYY-MM-DD');`

To wysyła maile tak jak dla tego dnia — **bez** sprawdzania flagi „już wysłano”; używać tylko świadomie, żeby nie spamować szafarzy.

---

## Gdzie szukać dalej

- Pełne wdrożenie: **`INSTRUKCJA_DLA_ADMINA.md`**
- SMTP: **`INSTALACJA_SMTP.md`**
- Błędy wysyłki: **`ROZWIAZYWANIE_BLEDOW_SMTP.md`**

---

*Dokument uzupełnia instrukcję główną; wersja wtyczki zgodna z numerem w `odwiedziny-chorych.php`.*

# Testowanie Aplikacji - Checklist

## 📋 Przewodnik testowania aplikacji "Odwiedziny Chorych"

---

## ✅ 1. TESTY PODSTAWOWE

### 1.1 Logowanie
- [ ] **Logowanie z poprawnym hasłem**
  - Wpisz hasło
  - Kliknij "Zaloguj się"
  - ✅ Powinno przekierować do aplikacji (zakładka Kalendarz)
  - ✅ Powinno wyświetlić kalendarz

- [ ] **Logowanie z błędnym hasłem**
  - Wpisz błędne hasło
  - Kliknij "Zaloguj się"
  - ✅ Powinno wyświetlić komunikat błędu
  - ✅ Nie powinno zalogować

- [ ] **Rate limiting (ograniczenie prób logowania)**
  - Spróbuj zalogować się 5 razy z błędnym hasłem
  - ✅ Po 5 próbach powinno zablokować na 15 minut
  - ✅ Powinien pojawić się komunikat o blokadzie

- [ ] **Sesja (sessionStorage)**
  - Zaloguj się
  - Odśwież stronę (F5)
  - ✅ Powinno pozostać zalogowanym
  - Zamknij przeglądarkę i otwórz ponownie
  - ✅ Powinno wymagać ponownego logowania

---

### 1.2 Wyświetlanie interfejsu
- [ ] **Header**
  - ✅ Powinien wyświetlać "🙏 Odwiedziny Chorych"
  - ✅ Nie powinien nakładać się na przycisk Wyloguj

- [ ] **Menu zakładek**
  - ✅ Powinny być widoczne: Kalendarz, Dane chorych, Dane szafarzy, Raporty
  - ✅ Przycisk "Wyloguj" powinien być w menu (po prawej stronie)
  - ✅ Przycisk "Wyloguj" NIE powinien być w headerze
  - ✅ Wszystkie przyciski powinny być wyśrodkowane jako grupa

- [ ] **Przycisk Wyloguj**
  - ✅ Powinien być widoczny w menu zakładek
  - ✅ Kliknięcie powinno wylogować użytkownika
  - ✅ Po wylogowaniu powinien wrócić ekran logowania

---

## ✅ 2. TESTY ZAKŁADKI KALENDARZ

### 2.1 Wyświetlanie kalendarza
- [ ] **Wybór roku**
  - Wybierz różne lata z listy rozwijanej
  - ✅ Kalendarz powinien się odświeżyć dla wybranego roku

- [ ] **Wyświetlanie danych**
  - ✅ Powinny być widoczne kolumny: Data, Nazwa, Osoba Główna, Pomocnik, Uwagi, Akcje
  - ✅ Powinny być widoczne wszystkie daty w roku
  - ✅ Święta powinny mieć niebieskie tło
  - ✅ Niedziele powinny mieć nazwy liturgiczne (nie tylko "niedziela")

- [ ] **Podświetlanie najbliższego dyżuru**
  - ✅ Wiersz z najbliższym dyżurem powinien mieć żółte podświetlenie
  - ✅ Strona powinna automatycznie przewinąć się do tego wiersza po zalogowaniu

### 2.2 Przypisywanie szafarzy
- [ ] **Edycja dyżuru**
  - Kliknij przycisk "Edytuj" przy dowolnej dacie
  - ✅ Powinno otworzyć modal z formularzem
  - Wybierz "Osoba Główna" i "Pomocnik" z list rozwijanych
  - Dodaj "Uwagi" (opcjonalnie)
  - Kliknij "Zapisz"
  - ✅ Powinno zapisać zmiany
  - ✅ Powinno zamknąć modal
  - ✅ Zmiany powinny być widoczne w tabeli

- [ ] **Zapis danych**
  - Przypisz szafarzy do kilku różnych dat
  - Odśwież stronę (F5)
  - ✅ Wszystkie przypisania powinny pozostać zapisane

### 2.3 Przycisk "Zaplanowane" / "Odwiedzone"
- [ ] **Planowanie odwiedzin**
  - Kliknij przycisk "Zaplanowane" przy dowolnej dacie
  - ✅ Powinno otworzyć modal z listą chorych
  - Zaznacz kilku chorych
  - Kliknij "Zapisz"
  - ✅ Przycisk powinien zmienić się na "Odwiedzone" (zielony)
  - ✅ Powinien mieć klasę `oc-btn-success`

- [ ] **Tooltip przy "Odwiedzone"**
  - Najedź myszką na przycisk "Odwiedzone"
  - ✅ Powinien pojawić się tooltip z listą odwiedzonych chorych
  - ✅ Tooltip powinien zawierać imiona i nazwiska

- [ ] **Edycja odwiedzin**
  - Kliknij "Odwiedzone" (które już ma zaznaczonych chorych)
  - ✅ Modal powinien otworzyć się z już zaznaczonymi chorymi
  - Zmień zaznaczenie
  - Zapisz
  - ✅ Zmiany powinny być zapisane

### 2.4 Przyciski akcji
- [ ] **Drukuj**
  - Kliknij "Drukuj"
  - ✅ Powinien otworzyć podgląd wydruku
  - ✅ Powinien wyświetlić tylko kalendarz (nie inne zakładki)
  - ✅ Kolumna "Akcje" powinna być ukryta w wydruku

- [ ] **Utwórz nowy rok**
  - Kliknij "Utwórz nowy rok"
  - ✅ Powinien utworzyć nowy rok kalendarzowy
  - ✅ Powinien wygenerować wszystkie daty
  - ✅ Powinien wyświetlić komunikat sukcesu

- [ ] **Auto-przypisz szafarzy**
  - Kliknij "Auto-przypisz szafarzy"
  - ✅ Powinien automatycznie przypisać szafarzy do wszystkich dat
  - ✅ Powinien wyświetlić komunikat sukcesu
  - ✅ Przypisania powinny być widoczne w kalendarzu

- [ ] **Adwent**
  - Kliknij "🕯️ Adwent"
  - ✅ Powinna pojawić się zakładka "Adwent" w menu
  - ✅ Kliknięcie ponownie powinno ukryć zakładkę
  - ✅ Zakładka "Adwent" powinna pozostać widoczna po przełączeniu na inne zakładki

---

## ✅ 3. TESTY ZAKŁADKI ADWENT

### 3.1 Wyświetlanie
- [ ] **Tabela Adwent**
  - Przejdź do zakładki "Adwent"
  - ✅ Powinna wyświetlić tabelę z datami adwentowymi
  - ✅ Powinny być kolumny: Data, Dzień tygodnia, Tydzień Adwentu, Osoba Główna, Pomocnik

- [ ] **Wybór roku**
  - Zmień rok w liście rozwijanej
  - ✅ Tabela powinna się odświeżyć

### 3.2 Przypisywanie szafarzy
- [ ] **Edycja**
  - Kliknij "Edytuj" przy dowolnej dacie
  - Wybierz szafarzy
  - Zapisz
  - ✅ Powinno zapisać zmiany

### 3.3 Drukowanie
- [ ] **Drukuj Adwent**
  - Kliknij "Drukuj" w zakładce Adwent
  - ✅ Powinien wyświetlić tylko tabelę Adwent
  - ✅ Kolumna "Pomocnik" powinna być widoczna w wydruku

---

## ✅ 4. TESTY ZAKŁADKI DANE CHORYCH

### 4.1 Wyświetlanie
- [ ] **Lista chorych**
  - Przejdź do zakładki "Dane chorych"
  - ✅ Powinna wyświetlić tabelę z chorymi
  - ✅ Powinny być kolumny: Imię i Nazwisko, Adres, Telefon, Uwagi, Akcje

### 4.2 Dodawanie chorego
- [ ] **Nowy chory**
  - Kliknij "+ Dodaj chorego"
  - ✅ Powinno otworzyć modal z formularzem
  - Wypełnij wszystkie pola
  - Kliknij "Zapisz"
  - ✅ Powinno dodać chorego do listy
  - ✅ Powinno wyświetlić komunikat sukcesu

### 4.3 Edycja chorego
- [ ] **Modyfikacja danych**
  - Kliknij "Edytuj" przy dowolnym chorym
  - ✅ Powinno otworzyć modal z wypełnionymi danymi
  - Zmień dane
  - Zapisz
  - ✅ Zmiany powinny być widoczne w tabeli

### 4.4 Usuwanie chorego
- [ ] **Usuń chorego**
  - Kliknij "Usuń" przy dowolnym chorym
  - ✅ Powinno wyświetlić potwierdzenie
  - Potwierdź
  - ✅ Chory powinien zniknąć z listy

### 4.5 Drukowanie
- [ ] **Drukuj listę chorych**
  - Kliknij "Drukuj"
  - ✅ Powinien wyświetlić podgląd wydruku
  - ✅ Kolumna "Akcje" powinna być ukryta

---

## ✅ 5. TESTY ZAKŁADKI DANE SZAFARZY

### 5.1 Wyświetlanie
- [ ] **Lista szafarzy**
  - Przejdź do zakładki "Dane szafarzy"
  - ✅ Powinna wyświetlić tabelę z szafarzami
  - ✅ Powinny być kolumny: Imię i Nazwisko, Telefon, Email, Akcje

### 5.2 Dodawanie szafarza
- [ ] **Nowy szafarz**
  - Kliknij "+ Dodaj szafarza"
  - Wypełnij formularz
  - Zapisz
  - ✅ Powinno dodać szafarza do listy

### 5.3 Edycja szafarza
- [ ] **Modyfikacja danych**
  - Kliknij "Edytuj"
  - Zmień dane
  - Zapisz
  - ✅ Zmiany powinny być widoczne

### 5.4 Usuwanie szafarza
- [ ] **Usuń szafarza**
  - Kliknij "Usuń"
  - Potwierdź
  - ✅ Szafarz powinien zniknąć z listy

### 5.5 Drukowanie
- [ ] **Drukuj listę szafarzy**
  - Kliknij "Drukuj"
  - ✅ Powinien wyświetlić podgląd wydruku

---

## ✅ 6. TESTY ZAKŁADKI RAPORTY

### 6.1 Wyświetlanie raportu
- [ ] **Raport miesięczny**
  - Przejdź do zakładki "Raporty"
  - Wybierz miesiąc i rok
  - Kliknij "Generuj raport"
  - ✅ Powinien wyświetlić raport z danymi

### 6.2 Drukowanie raportu
- [ ] **Drukuj raport**
  - Kliknij "Drukuj raport"
  - ✅ Powinien wyświetlić podgląd wydruku

---

## ✅ 7. TESTY RESPONSYWNOŚCI (MOBILE)

### 7.1 Wyświetlanie na mobile
- [ ] **Otwórz aplikację na telefonie** (lub użyj DevTools - F12 → Toggle device toolbar)
  - ✅ Wszystkie elementy powinny być widoczne
  - ✅ Tekst powinien być czytelny
  - ✅ Przyciski powinny być łatwe do kliknięcia

### 7.2 Menu zakładek na mobile
- [ ] **Menu**
  - ✅ Przyciski powinny być ułożone w kolumnie (na małych ekranach)
  - ✅ Przycisk "Wyloguj" powinien być poniżej zakładek
  - ✅ Wszystkie przyciski powinny być wyśrodkowane

### 7.3 Tabela kalendarza na mobile
- [ ] **Tabela**
  - ✅ Kolumna "Data" powinna być sticky (przyklejona) przy scrollowaniu
  - ✅ Kolumna "Data" powinna mieć takie samo tło jak wiersz
  - ✅ Tabela powinna być przewijalna w poziomie
  - ✅ Kolumna "Uwagi" może być ukryta na bardzo małych ekranach

### 7.4 Formularze na mobile
- [ ] **Formularze**
  - ✅ Wszystkie pola powinny być łatwe do wypełnienia
  - ✅ Przyciski powinny być wystarczająco duże

---

## ✅ 8. TESTY EMAILI

### 8.1 Konfiguracja SMTP
- [ ] **Sprawdź czy SMTP jest skonfigurowany**
  - Przejdź do: WP Mail SMTP → Settings
  - ✅ Powinien być skonfigurowany dostawca email
  - ✅ Powinien być ustawiony "From Email" i "From Name"

### 8.2 Test wysyłki email
- [ ] **Wyślij test email**
  - W WP Mail SMTP kliknij zakładkę "Email Test"
  - Wpisz swój adres email
  - Kliknij "Send Email"
  - ✅ Powinien dotrzeć email testowy
  - ✅ Sprawdź folder SPAM jeśli nie dotarł

### 8.3 Email z przypomnieniem o dyżurze
- [ ] **Ręczne wysłanie (dla testów)**
  - W panelu WordPress: **Odwiedziny Chorych** → **Ustawienia**
  - Sprawdź czy jest opcja testowa (jeśli dostępna)
  - Lub użyj WP-CLI: `wp eval 'OC_Email_Notifications::test_send_for_date("2025-12-25");'`
  - ✅ Powinien dotrzeć email z przypomnieniem
  - ✅ Email powinien zawierać:
    - ✅ Datę dyżuru
    - ✅ Imię i nazwisko szafarza głównego
    - ✅ Imię i nazwisko pomocnika
    - ✅ Tabelę z chorymi do odwiedzenia
    - ✅ Przycisk "Otwórz aplikację"

### 8.4 Automatyczne wysyłanie (Cron)
- [ ] **Sprawdź czy cron jest aktywny**
  - Zainstaluj plugin "WP Crontrol" (opcjonalnie)
  - Sprawdź czy zadanie `oc_daily_email_reminders` jest zaplanowane
  - ✅ Powinno być zaplanowane na 18:00 codziennie

---

## ✅ 9. TESTY BEZPIECZEŃSTWA

### 9.1 Weryfikacja sesji
- [ ] **Wygasanie sesji**
  - Zaloguj się
  - Odczekaj 8 godzin (lub zmień timeout w kodzie dla testów)
  - Spróbuj wykonać akcję
  - ✅ Powinno wymagać ponownego logowania

### 9.2 Rate limiting
- [ ] **Ograniczenie prób logowania**
  - Spróbuj zalogować się 5 razy z błędnym hasłem
  - ✅ Po 5 próbach powinno zablokować na 15 minut
  - ✅ Powinien pojawić się komunikat o blokadzie

### 9.3 XSS Protection
- [ ] **Test wstrzykiwania kodu**
  - W polu "Uwagi" wpisz: `<script>alert('XSS')</script>`
  - Zapisz
  - ✅ Kod nie powinien się wykonać
  - ✅ Powinien być wyświetlony jako tekst

### 9.4 SQL Injection Protection
- [ ] **Test SQL injection**
  - W polu wyszukiwania wpisz: `' OR '1'='1`
  - ✅ Nie powinno wyświetlić wszystkich danych
  - ✅ Powinno obsłużyć błąd bezpiecznie

---

## ✅ 10. TESTY DOSTĘPNOŚCI

### 10.1 Aria-labels
- [ ] **Sprawdź aria-labels**
  - Otwórz DevTools (F12) → Elements
  - Sprawdź przyciski z emoji
  - ✅ Wszystkie powinny mieć `aria-label`
  - ✅ Tooltip powinien być dostępny dla screen readerów

### 10.2 Nawigacja klawiaturą
- [ ] **Nawigacja Tab**
  - Użyj klawisza Tab do nawigacji
  - ✅ Wszystkie elementy powinny być dostępne
  - ✅ Focus powinien być widoczny

---

## ✅ 11. TESTY WYDAJNOŚCI

### 11.1 Ładowanie strony
- [ ] **Czas ładowania**
  - Otwórz DevTools (F12) → Network
  - Odśwież stronę
  - ✅ Strona powinna załadować się w rozsądnym czasie (< 3 sekundy)

### 11.2 Zapytania do API
- [ ] **Sprawdź zapytania REST API**
  - Otwórz DevTools (F12) → Network
  - Wykonaj różne akcje (dodaj chorego, edytuj dyżur)
  - ✅ Zapytania powinny być szybkie
  - ✅ Nie powinno być błędów 500

---

## ✅ 12. TESTY KONSOLI (DEBUG)

### 12.1 Console.log
- [ ] **Sprawdź konsolę przeglądarki**
  - Otwórz DevTools (F12) → Console
  - Wykonaj różne akcje
  - ✅ W produkcji (DEBUG=false) nie powinno być console.log
  - ✅ Powinny być tylko błędy (jeśli występują)

---

## 📝 RAPORT Z TESTÓW

Po wykonaniu wszystkich testów, stwórz raport:

```
✅ Testy podstawowe: X/Y przeszły
✅ Testy funkcjonalności: X/Y przeszły
✅ Testy responsywności: X/Y przeszły
✅ Testy emaili: X/Y przeszły
✅ Testy bezpieczeństwa: X/Y przeszły

Problemy znalezione:
1. ...
2. ...

Status: ✅ Gotowe do produkcji / ⚠️ Wymaga poprawek
```

---

## 🆘 Rozwiązywanie problemów

Jeśli znajdziesz problemy:

1. **Sprawdź konsolę przeglądarki** (F12 → Console)
2. **Sprawdź logi WordPress** (`wp-content/debug.log`)
3. **Sprawdź logi SMTP** (WP Mail SMTP → Tools → Email Log)
4. **Sprawdź dokumentację** w folderze pluginu

---

**Powodzenia w testowaniu!** 🚀


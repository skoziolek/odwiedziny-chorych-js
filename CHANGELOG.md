# Historia wersji

Numeracja: **MAJOR.MINOR.PATCH** (np. 1.2.0 → 1.3.0 dla nowych funkcji, 1.2.1 dla poprawek).

## [1.2.14] – 2026-07-19

**Wtyczka WordPress**

- Poprawiono numer wersji w kodzie (`OC_PLUGIN_VERSION`) tak, aby był zgodny z wersją wydania i poprawnie odczytywany przez workflow publikacji.
- Wydanie techniczne przygotowujące stabilny release po niespójnym oznaczeniu wersji.

## [1.2.13] – 2026-07-19

**Wtyczka WordPress**

- Raport odwiedzin nie pokazuje już domyślnie wszystkich chorych, gdy dla danej daty nie ma zaplanowanych osób.
- Chorzy oznaczeni jako **okazjonalne odwiedziny** pozostają do ręcznego dodania na konkretny termin.

## [1.2.12] – 2026-07-12

**Wtyczka WordPress**

- Poprawiono przycisk **„Otwórz aplikację”** w mailu przypomnienia o dyżurze: link jest teraz wyznaczany dynamicznie na podstawie opublikowanej strony z shortcode `[odwiedziny_chorych]`.
- Dodano możliwość nadpisania URL aplikacji przez filtr `oc_email_app_url` oraz bezpieczny fallback na domyślną ścieżkę.

## [1.2.11] – 2026-07-05

**Wtyczka WordPress**

- Poprawiono listę chorych w mailach przypominających o dyżurze: wiadomości zawierają tylko osoby zaplanowane (lub zaległe) na konkretną datę dyżuru.
- Chorzy oznaczeni jako **okazjonalne odwiedziny** nie są dodawani automatycznie do maila (pozostają do ręcznego dopisania na wybrany termin).

## [1.2.10] – 2026-06-26

**Wtyczka WordPress**

- Dodano kolumnę **Lp.** w tabeli *Dane chorych* dla łatwiejszego odwoływania się do pozycji.
- Dodano numerację **Lp.** w raporcie odwiedzin (lista osób do odwiedzenia).
- Dodano kolumnę **Lp.** w mailu przypomnienia o dyżurze (tabela chorych).

## [1.2.9] – 2026-06-25

**Wtyczka WordPress**

- Dodano tryb **„Okazjonalne odwiedziny”** w wyborze „Następna wizyta” w raporcie odwiedzin.
- Chorzy oznaczeni jako okazjonalni nie pojawiają się automatycznie na każdej kolejnej dacie dyżuru — są dodawani ręcznie dla konkretnego terminu.
- W raporcie odwiedzin dodano sekcję **„Dodaj chorego okazjonalnego na ten termin”**, która pozwala szybko dopisać chorego „na telefon” do wybranej daty.

## [1.2.8] – 2026-06-11

**Nowy raport odwiedzin (układ pionowy) — WordPress i wersja Node.js**

- Po powrocie od chorych szafarz otwiera w kalendarzu raport w nowej formie: dla każdego chorego ustawia status **Odwiedzona / Nieobecny** oraz wybiera **termin kolejnej wizyty z zamkniętej listy** najbliższych dyżurów (niedziele + święta nakazane). Brak ręcznego wpisywania daty eliminuje pomyłki.
- Wybrany termin **przypisuje chorego do daty** (pole „następna wizyta”): chory pojawia się na liście danego dyżuru, a zaplanowana data jest widoczna w nowej kolumnie **„Następna wizyta”** w zakładce *Dane chorych*.
- Wtyczka WordPress: migracja bazy dodaje kolumnę `nastepna_wizyta` w tabeli chorych (bez utraty danych); obsługa pola w REST API chorych.

## [1.2.7] – 2026-04-17

**Wtyczka WordPress**

- Przypomnienia e-mail o dyżurze: cron domyślnie **12:00** (czas wg ustawień WordPressa); stała `OC_EMAIL_REMINDER_HOUR`, filtr `oc_email_reminder_hour`. Po aktualizacji harmonogram jest **automatycznie przeplanowywany** (poprzednio domyślnie 18:00).

## [1.2.6] – 2026-04-17

**Wtyczka WordPress**

- Release z aktualnego `main`: paczka ZIP i tag **`v1.2.6`** odpowiadają temu numerowi w kodzie. Zawiera m.in. zmiany opisane przy **1.2.5** (zapis hasła szafarza po opuszczeniu pola, `INSTRUKCJA_DLA_SZAFARZA.md`, uzupełnienia w `INSTRUKCJA_DLA_ADMINA.md`).
- Uwaga: wcześniejszy tag **`v1.2.5`** na GitHubie mógł wskazywać na inny commit — do instalacji użyj **`v1.2.6`** lub nowszego.

## [1.2.5] – 2026-04-14

**Wtyczka WordPress**

- Zapis hasła szafarza po opuszczeniu pola „Nowe hasło” (wcześniej zapis często nie następował bez edycji innej komórki).
- Dokumentacja: **`INSTRUKCJA_DLA_SZAFARZA.md`**; w **`INSTRUKCJA_DLA_ADMINA.md`** — rozwiązywanie problemów z hasłem szafarza.

## [1.2.4] – 2026-04-13

**Wtyczka WordPress**

- Wyświetlanie numeru wersji w UI (prawy dolny róg); `version` w `ocData`.
- GitHub Actions: release WordPress — wersja ZIP, tag i opis z `OC_PLUGIN_VERSION` w `odwiedziny-chorych.php` (jedno źródło prawdy).

## [1.2.3] – 2026-04-13

**Wtyczka WordPress**

- Logowanie szafarza osobnym hasłem (ustawianym w zakładce Dane szafarzy); sesja rozróżnia administratora i szafarza; zakładki Szafarze i Raporty ukryte dla konta szafarza.
- Audyt ostatniej zmiany pola „Uwagi” u chorego (kto / kiedy); tooltip w tym samym stylu co podpowiedź „Odwiedzone” w kalendarzu.
- Migracja bazy: `haslo_hash` u szafarzy, `szafarz_id` w sesji, pola audytu u chorych; zapis zbiorczy chorych aktualizuje po `id` (bez kasowania całej tabeli).
- `site-shell/`: skrypty synchronizacji plików wtyczki z repozytorium do instalacji LocalWP (`sync.bat`, `sync-to-local.ps1`).
- UI: lista rozwijana na ekranie logowania dopasowana do reszty formularza; poprawki szerokości kolumn na mobile (status w Dane chorych, Osoba Główna / Pomocnik w kalendarzu i adwencie).

## [1.2.0] – 2025-03-10

- Ujednolicenie numeracji wersji (poprzednio 2.0.0)
- Wprowadzenie systematycznej numeracji dla kolejnych wydań

---

*Aby opublikować nową wersję: zaktualizuj numer w `js-version/package.json`, w `js-version/src/client/js/modules/raporty.js` (pole `version`), w `README.md`, dodaj wpis powyżej, zacommituj, utwórz tag (np. `git tag v1.3.0`) i wypchnij tag (`git push origin v1.3.0`).*

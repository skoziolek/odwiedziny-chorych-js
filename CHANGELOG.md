# Historia wersji

Numeracja: **MAJOR.MINOR.PATCH** (np. 1.2.0 → 1.3.0 dla nowych funkcji, 1.2.1 dla poprawek).

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

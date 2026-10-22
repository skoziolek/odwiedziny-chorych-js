# Status wdrożenia — WordPress (parafia)

**Ostatnia weryfikacja:** 2026-10-22  
**Wersja do wdrożenia:** **1.2.22** (tag Git: **`v1.2.22`**)  
**Gałąź źródłowa:** `main`

---

## Nowości w 1.2.22 (od 1.2.20)

- **Przywróć jako zaplanowane** — cofnięcie pomyłkowo zapisanego raportu bez kasowania listy osób.
- **Telefon** — status wizyty pod nazwiskiem, **Usuń** jako zwykły przycisk; przyciski **Dodaj / Przywróć / Zapisz** w tym samym stylu co na komputerze.
- **Dopisanie okazjonalne** zostaje po odświeżeniu i ponownym logowaniu (naprawa zapisu w bazie).

Zapisane wizyty, kalendarz i lista chorych zostają. Po wgraniu raz otwórz aplikację (aktualizacja bazy), potem **Ctrl+F5**.

---

## Dla administratora WordPress — co dokładnie pobrać?

Repozytorium zawiera też aplikację Node.js (`js-version/`) i dokumentację. **Do WordPressa trafia wyłącznie wtyczka:**

| Co wgrywasz | Gdzie to jest w repozytorium |
|-------------|------------------------------|
| **Jeden folder:** `odwiedziny-chorych` | `wordpress-plugin/odwiedziny-chorych/` |

W środku musi być m.in. plik **`odwiedziny-chorych.php`** (nagłówek wtyczki z **Version: 1.2.22**).

**Nie** wgrywaj całego ZIP repozytorium do `wp-content/plugins/` — powstanie zła struktura katalogów.

### Zalecane: gotowy ZIP z GitHub Release

1. Otwórz listę wydań: https://github.com/skoziolek/odwiedziny-chorych-js/releases  
2. Przy **v1.2.22** pobierz załącznik **`odwiedziny-chorych-v1.2.22.zip`** (to jest sama wtyczka — nie wybieraj „Source code”, jeśli chcesz tylko paczkę do WordPressa).  
3. W WordPress: **Wtyczki → Dodaj nową → Wyślij wtyczkę na serwer** — wgraj ten ZIP.

**Jeśli przy v1.2.22 nie ma jeszcze załącznika:** osoba z uprawnieniami do repozytorium może go wygenerować: [Actions → Release WordPress plugin → Run workflow](https://github.com/skoziolek/odwiedziny-chorych-js/actions/workflows/release-wordpress.yml) (po wmergowaniu zmian na `main`).

### Alternatywa: pobranie z tagu (ręczne wycinanie folderu)

1. Strona tagu: https://github.com/skoziolek/odwiedziny-chorych-js/releases/tag/v1.2.22 (lub zakładka **Tags** przy **`v1.2.22`**).

2. Pobierz archiwum kodu (np. **Source code (zip)**), rozpakuj.

3. Wejdź w: `wordpress-plugin/odwiedziny-chorych/` — ten folder kopiujesz do `wp-content/plugins/` lub pakujesz do własnego ZIP pod **Wyślij**.

Szczegółowa mini-instrukcja jest też w folderze wtyczki:  
`wordpress-plugin/odwiedziny-chorych/INSTRUKCJA_WGRANIA_WORDPRESS.md`.

---

## Weryfikacja plików wtyczki (skrót)

- `odwiedziny-chorych.php` — główny plik wtyczki  
- `assets/js/app.js`, `assets/js/visit-planning.js`, `assets/css/style.css`  
- `templates/app.php`  
- Katalogi: `includes/`, itd. (zgodnie z drzewem w repozytorium)

---

## Instrukcja wdrożenia (FTP / panel hostingu)

1. Przygotuj folder `odwiedziny-chorych` jak wyżej (z tagu **v1.2.22**).  
2. Wgraj do `wp-content/plugins/` (nadpisz pliki przy aktualizacji).  
3. W panelu WordPress: **Wtyczki** — upewnij się, że widać wersję **1.2.22**, w razie potrzeby włącz wtyczkę ponownie.  
4. Shortcode na stronie: `[odwiedziny_chorych]`  
5. SMTP: skonfiguruj wysyłkę e-maili (np. wtyczka WP Mail SMTP).  
6. Zmień domyślne hasło w ustawieniach wtyczki.
7. Otwórz aplikację raz (migracja bazy) i odśwież twardo (**Ctrl+F5**).

---

## Checklist przed wdrożeniem

- [ ] Pobrano kod z tagu **v1.2.22** (albo z gałęzi `main` po merge).  
- [ ] Na serwer trafił wyłącznie folder **`wordpress-plugin/odwiedziny-chorych`**, nie całe repo.  
- [ ] Kopia zapasowa bazy i (przy aktualizacji) folderu wtyczki.  
- [ ] Po wdrożeniu: wersja w panelu WP = **1.2.22**.  
- [ ] Twarde odświeżenie aplikacji (Ctrl+F5), w rogu: **Wersja 1.2.22**.

---

## Wersja (źródło prawdy)

- **Nazwa wersji / tag:** `v1.2.22`  
- **Numer w panelu WordPress:** **1.2.22** (pole Version w `odwiedziny-chorych.php`)

---

## Ważne uwagi

1. Zawsze kopia zapasowa przed nadpisaniem plików na produkcji.  
2. Repozytorium zawiera też projekt **Node.js** — do hostingu WordPress nie jest potrzebny do działania wtyczki.  
3. Szczegóły pod LocalWP: `wordpress-plugin/odwiedziny-chorych/AKTUALIZACJA_LOCALWP.md`.

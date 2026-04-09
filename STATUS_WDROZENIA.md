# Status wdrożenia — WordPress (parafia)

**Ostatnia weryfikacja:** 2026-04-09  
**Wersja do wdrożenia:** **1.2.0** (tag Git: **`v1.2.0`**)  
**Gałąź źródłowa:** `feature/js-migration` (domyślna w repozytorium)

---

## Dla administratora WordPress — co dokładnie pobrać?

Repozytorium zawiera też aplikację Node.js (`js-version/`) i dokumentację. **Do WordPressa trafia wyłącznie wtyczka:**

| Co wgrywasz | Gdzie to jest w repozytorium |
|-------------|------------------------------|
| **Jeden folder:** `odwiedziny-chorych` | `wordpress-plugin/odwiedziny-chorych/` |

W środku musi być m.in. plik **`odwiedziny-chorych.php`** (nagłówek wtyczki z **Version: 1.2.0**).

**Nie** wgrywaj całego ZIP repozytorium do `wp-content/plugins/` — powstanie zła struktura katalogów.

### Najprostsza ścieżka (tag v1.2.0)

1. Wejdź na stronę tagu:  
   https://github.com/skoziolek/odwiedziny-chorych-js/releases/tag/v1.2.0  
   (jeśli nie ma karty Release, użyj: **Releases** / **Tags** w repozytorium i wybierz **`v1.2.0`**.)

2. Pobierz archiwum kodu (np. **Source code (zip)**).

3. Rozpakuj i przejdź do:  
   `wordpress-plugin/odwiedziny-chorych/`  
   Ten folder kopiujesz przez FTP/SFTP do `wp-content/plugins/`, albo pakujesz go do ZIP i wgrywasz przez **Wtyczki → Dodaj nową → Wyślij**.

Szczegółowa mini-instrukcja jest też w folderze wtyczki:  
`wordpress-plugin/odwiedziny-chorych/INSTRUKCJA_WGRANIA_WORDPRESS.md`.

---

## Weryfikacja plików wtyczki (skrót)

- `odwiedziny-chorych.php` — główny plik wtyczki  
- `assets/js/app.js`, `assets/css/style.css`  
- `templates/app.php`  
- Katalogi: `includes/`, itd. (zgodnie z drzewem w repozytorium)

---

## Instrukcja wdrożenia (FTP / panel hostingu)

1. Przygotuj folder `odwiedziny-chorych` jak wyżej (z tagu **v1.2.0**).  
2. Wgraj do `wp-content/plugins/` (nadpisz pliki przy aktualizacji).  
3. W panelu WordPress: **Wtyczki** — upewnij się, że widać wersję **1.2.0**, w razie potrzeby włącz wtyczkę ponownie.  
4. Shortcode na stronie: `[odwiedziny_chorych]`  
5. SMTP: skonfiguruj wysyłkę e-maili (np. wtyczka WP Mail SMTP).  
6. Zmień domyślne hasło w ustawieniach wtyczki.

---

## Checklist przed wdrożeniem

- [ ] Pobrano kod z tagu **v1.2.0** (albo z gałęzi `feature/js-migration` w stanie zgodnym z tym tagiem).  
- [ ] Na serwer trafił wyłącznie folder **`wordpress-plugin/odwiedziny-chorych`**, nie całe repo.  
- [ ] Kopia zapasowa bazy i (przy aktualizacji) folderu wtyczki.  
- [ ] Po wdrożeniu: wersja w panelu WP = **1.2.0**.

---

## Wersja (źródło prawdy)

- **Nazwa wersji / tag:** `v1.2.0`  
- **Numer w panelu WordPress:** **1.2.0** (pole Version w `odwiedziny-chorych.php`)

---

## Ważne uwagi

1. Zawsze kopia zapasowa przed nadpisaniem plików na produkcji.  
2. Repozytorium zawiera też projekt **Node.js** — do hostingu WordPress nie jest potrzebny do działania wtyczki.  
3. Szczegóły pod LocalWP: `wordpress-plugin/odwiedziny-chorych/AKTUALIZACJA_LOCALWP.md`.

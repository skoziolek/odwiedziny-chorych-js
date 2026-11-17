# Status wdrożenia — WordPress (parafia)

**Ostatnia weryfikacja:** 2026-11-17  
**Wersja do wdrożenia:** **1.2.25** (tag Git: **`v1.2.25`**)  
**Gałąź źródłowa:** `main`

---

## Nowości w 1.2.25 (od opublikowanej paczki 1.2.24)

- **Szafarz** nie widzi **Utwórz nowy rok**, **Auto-przypisz szafarzy** ani przycisku **Adwent**. Te poprawki nie weszły do wcześniej pobranego ZIP-a 1.2.24.
- **Laptop** — w **Dane chorych** widać całe nazwisko, adres i uwagi. Przy węższym oknie tabela przesuwa się w bok.
- **Telefon** — listy chorych i szafarzy zostają kartami na całą szerokość.
- **Raport odwiedzin** — usunięty zbędny przycisk **Anuluj**. Okno zamyka krzyżyk.

Zapisane wizyty, kalendarz i listy zostają. Ta wersja nie zmienia struktury bazy. Po wgraniu twarde odświeżenie aplikacji (**Ctrl+F5**).

---

## Dla administratora WordPress — co dokładnie pobrać?

Repozytorium zawiera też aplikację Node.js (`js-version/`) i dokumentację. **Do WordPressa trafia wyłącznie wtyczka:**

| Co wgrywasz | Gdzie to jest w repozytorium |
|-------------|------------------------------|
| **Jeden folder:** `odwiedziny-chorych` | `wordpress-plugin/odwiedziny-chorych/` |

W środku musi być m.in. plik **`odwiedziny-chorych.php`** (nagłówek wtyczki z **Version: 1.2.25**).

**Nie** wgrywaj całego ZIP repozytorium do `wp-content/plugins/` — powstanie zła struktura katalogów.

### Zalecane: gotowy ZIP z GitHub Release

1. Otwórz listę wydań: https://github.com/skoziolek/odwiedziny-chorych-js/releases  
2. Przy **v1.2.25** pobierz załącznik **`odwiedziny-chorych-v1.2.25.zip`** (to jest sama wtyczka — nie wybieraj „Source code”, jeśli chcesz tylko paczkę do WordPressa).  
3. W WordPress: **Wtyczki → Dodaj nową → Wyślij wtyczkę na serwer** — wgraj ten ZIP.

**Jeśli przy v1.2.25 nie ma jeszcze załącznika:** osoba z uprawnieniami do repozytorium może go wygenerować: [Actions → Release WordPress plugin → Run workflow](https://github.com/skoziolek/odwiedziny-chorych-js/actions/workflows/release-wordpress.yml) (po wmergowaniu zmian na `main`).

### Alternatywa: pobranie z tagu (ręczne wycinanie folderu)

1. Strona tagu: https://github.com/skoziolek/odwiedziny-chorych-js/releases/tag/v1.2.25 (lub zakładka **Tags** przy **`v1.2.25`**).

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

1. Przygotuj folder `odwiedziny-chorych` jak wyżej (z tagu **v1.2.25**).  
2. Wgraj do `wp-content/plugins/` (nadpisz pliki przy aktualizacji).  
3. W panelu WordPress: **Wtyczki** — upewnij się, że widać wersję **1.2.25**, w razie potrzeby włącz wtyczkę ponownie.  
4. Shortcode na stronie: `[odwiedziny_chorych]`  
5. SMTP: skonfiguruj wysyłkę e-maili (np. wtyczka WP Mail SMTP).  
6. Zmień domyślne hasło w ustawieniach wtyczki.
7. Odśwież aplikację twardo (**Ctrl+F5**). W rogu ma być **Wersja 1.2.25**.

---

## Checklist przed wdrożeniem

- [ ] Pobrano kod z tagu **v1.2.25** (albo z gałęzi `main` po merge).  
- [ ] Na serwer trafił wyłącznie folder **`wordpress-plugin/odwiedziny-chorych`**, nie całe repo.  
- [ ] Kopia zapasowa bazy i (przy aktualizacji) folderu wtyczki.  
- [ ] Po wdrożeniu: wersja w panelu WP = **1.2.25**.  
- [ ] Twarde odświeżenie aplikacji (Ctrl+F5), w rogu: **Wersja 1.2.25**.
- [ ] Telefon: **Dane chorych** i **Dane szafarzy** są kartami, adres i telefon da się przeczytać.
- [ ] Komputer: w **Dane szafarzy** pole hasła jest na wysokości pozostałych pól w wierszu.

---

## Wersja (źródło prawdy)

- **Nazwa wersji / tag:** `v1.2.25`  
- **Numer w panelu WordPress:** **1.2.25** (pole Version w `odwiedziny-chorych.php`)

---

## Ważne uwagi

1. Zawsze kopia zapasowa przed nadpisaniem plików na produkcji.  
2. Repozytorium zawiera też projekt **Node.js** — do hostingu WordPress nie jest potrzebny do działania wtyczki.  
3. Szczegóły pod LocalWP: `wordpress-plugin/odwiedziny-chorych/AKTUALIZACJA_LOCALWP.md`.

# Wgranie wtyczki do WordPress (dla administratora)

## Co jest „paczką” do WordPressa?

**Tylko ten folder:** `odwiedziny-chorych` (ten, w którym jest plik `odwiedziny-chorych.php`).

- Nie wgrywaj całego repozytorium z GitHub (folderów `js-version`, `README` u góry repo itd.).
- Na serwerze w ścieżce `wp-content/plugins/` ma się znaleźć folder **`odwiedziny-chorych`** z plikiem **`odwiedziny-chorych.php`** w środku.

## Skąd pobrać najnowszą wersję?

1. Otwórz repozytorium na GitHubie i użyj **tagu `v1.2.0`** (to jest nazwa wersji do wdrożenia):  
   https://github.com/skoziolek/odwiedziny-chorych-js/releases/tag/v1.2.0  
   (jeśli nie ma jeszcze wpisu „Release”, wejdź w **Tags** i wybierz `v1.2.0`.)

2. Pobierz kod (np. **Source code (zip)** przy tagu).

3. Po rozpakowaniu ZIP wejdź w:  
   `…/wordpress-plugin/odwiedziny-chorych/`  
   **Ten** folder kopiujesz na serwer (lub pakujesz do ZIP pod instalację z panelu WP — patrz niżej).

## Instalacja z panelu WordPress (upload ZIP)

1. Spakuj **folder** `odwiedziny-chorych` do pliku ZIP tak, żeby **w środku ZIP** od razu był folder `odwiedziny-chorych` z plikiem `odwiedziny-chorych.php` (standardowa struktura wtyczek WP).

2. W WordPress: **Wtyczki** → **Dodaj nową** → **Wyślij wtyczkę na serwer** → wybierz ten ZIP → **Zainstaluj teraz**.

## Jak sprawdzić, że to właściwa wersja?

- W panelu WordPress przy wtyczce **Odwiedziny Chorych** powinna być widoczna wersja **1.2.0** (zgodna z tagiem **v1.2.0**).

Szczegóły i kopie zapasowe: plik `STATUS_WDROZENIA.md` w głównym katalogu repozytorium na GitHubie.

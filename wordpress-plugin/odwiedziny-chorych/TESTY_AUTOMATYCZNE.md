# Testy automatyczne

Ten dokument opisuje aktualny zestaw testów automatycznych dla pluginu `odwiedziny-chorych` oraz sposób ich uruchamiania.

## Co mamy aktualnie

### 1) Testy jednostkowe (Node test runner)

Plik:
- `tests/unit/visit-planning.test.js`

Zakres:
- filtrowanie chorych na termin (`getBasePatientsForDate`, `assembleVisitPatientList`)
- obsługa chorych okazjonalnych (`OCCASIONAL_VISIT_MARKER`)
- merge danych planowanych i historycznych bez duplikatów
- odtwarzanie listy dla dat historycznych
- podział wpisów historii (`niedziela` vs `plan_niedziela`)
- sortowanie alfabetyczne nazw
- wyliczanie kolejnych terminów dyżurów (`getUpcomingDutyDates`)
- kolejka zapisu bez race condition (`createPerKeySaveQueue`)
- zbieranie danych z kart raportu (`collectVisitDataFromCards`)
- stan przycisku `Zaplanowane/Odwiedzone` (`getVisitButtonState`)
- etykiety terminów (`formatRelativeLabel`, `formatNextVisitOption`)
- kontrakt payloadu API oraz flow zapisu raportu (`buildVisitHistoryPayload`, `persistVisitReport`)

### 2) Testy E2E (Playwright)

Plik:
- `tests/e2e/visit-modal.spec.js`

Zakres:
- logowanie do aplikacji
- otwarcie modala `Zaplanowane`
- zapis raportu bez błędów UI
- dodanie chorego okazjonalnie, zamknięcie modala bez zapisu i ponowne otwarcie (sprawdzenie trwałości)

Konfiguracja:
- `playwright.config.js`
- `package.json` (skrypt `test:e2e`)

## Wymagania

- Node.js 18+ (zalecane)
- działająca instancja WordPress z pluginem (np. LocalWP)
- dostępny URL aplikacji (domyślnie testy E2E używają `http://odwiedziny-chorych.local`)

## Instalacja zależności testowych

Uruchom w katalogu pluginu:

```bash
cd wordpress-plugin/odwiedziny-chorych
npm install
npx playwright install chromium
```

## Uruchamianie testów

### Testy jednostkowe

Z roota repo:

```bash
node --test "wordpress-plugin/odwiedziny-chorych/tests/unit/visit-planning.test.js"
```

### Testy E2E

Z katalogu pluginu:

```bash
cd wordpress-plugin/odwiedziny-chorych
npm run test:e2e
```

## Konfiguracja E2E przez zmienne środowiskowe

Opcjonalnie możesz nadpisać domyślne wartości:

- `E2E_BASE_URL` (domyślnie: `http://odwiedziny-chorych.local`)
- `E2E_APP_PATH` (domyślnie: `/odwiedziny-chorych/`)
- `E2E_APP_PASSWORD` (domyślnie: `PomocDlaChorych!`)

Przykład (PowerShell):

```powershell
$env:E2E_BASE_URL = "http://odwiedziny-chorych.local"
$env:E2E_APP_PATH = "/odwiedziny-chorych/"
$env:E2E_APP_PASSWORD = "TwojeHaslo"
npm run test:e2e
```

## Typowe problemy

- Jeśli E2E trafia na stronę bloga zamiast aplikacji:
  - sprawdź `E2E_APP_PATH` i ustaw poprawny path strony z shortcode.
- Jeśli E2E nie może się zalogować:
  - sprawdź hasło (`E2E_APP_PASSWORD`) i czy aplikacja jest dostępna pod wskazanym URL.
- Jeśli testy E2E tworzą artefakty:
  - folder `test-results/` jest generowany automatycznie przez Playwright.


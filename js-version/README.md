# Odwiedziny Chorych - Wersja JavaScript

## Przegląd

To jest migracja aplikacji "Odwiedziny Chorych" z PHP na JavaScript (Node.js + Frontend). Aplikacja zachowuje wszystkie funkcjonalności oryginalnej wersji PHP, ale jest teraz napisana w całości w JavaScript.

## 🎉 Status migracji: UKOŃCZONA (100%)

**Aplikacja JavaScript jest w pełni funkcjonalna i gotowa do użycia!**

### ✅ Co zostało zakończone:
- **Backend**: Node.js + Express z pełnym API
- **Frontend**: Modułowa architektura ES6
- **Autentykacja**: System JWT z zabezpieczeniami
- **Szyfrowanie**: AES-256-CBC dla danych wrażliwych
- **Wszystkie funkcje**: Kalendarz, chorzy, szafarze, raporty, historia
- **Ulepszenia**: Auto-save, walidacja, obsługa błędów, responsywny UI
- **Testy**: Aplikacja przetestowana i działająca

## Architektura

### Backend (Node.js + Express)
- **Serwer**: Express.js z middleware bezpieczeństwa
- **Autentykacja**: JWT (JSON Web Tokens)
- **Szyfrowanie**: AES-256-CBC dla danych wrażliwych (RODO)
- **API**: RESTful endpoints
- **Dane**: Pliki JSON z obsługą szyfrowania

### Frontend (Vanilla JavaScript)
- **Moduły**: ES6 modules z klasami
- **UI**: Responsywny interfejs bez frameworków
- **Komunikacja**: Fetch API z obsługą błędów
- **Drukowanie**: jsPDF dla eksportu do PDF

## Struktura projektu

```
js-version/
├── src/
│   ├── server/                 # Backend Node.js
│   │   ├── server.js          # Główny plik serwera
│   │   ├── routes/            # Endpointy API
│   │   │   ├── auth.js        # Autentykacja
│   │   │   ├── api.js         # Główne API
│   │   │   └── historia.js    # Historia odwiedzin
│   │   └── utils/
│   │       └── crypto.js      # Szyfrowanie danych
│   ├── client/                # Frontend
│   │   ├── html/
│   │   │   └── index.html     # Główna strona
│   │   ├── css/
│   │   │   └── style.css      # Style CSS
│   │   └── js/
│   │       ├── main.js        # Główny moduł
│   │       └── modules/       # Moduły funkcjonalne
│   │           ├── auth.js    # Zarządzanie autoryzacją
│   │           ├── kalendarz.js # Kalendarz odwiedzin
│   │           ├── chorzy.js  # Zarządzanie chorymi
│   │           ├── szafarze.js # Zarządzanie szafarzami
│   │           ├── raporty.js # Raporty i statystyki
│   │           └── utils.js   # Narzędzia pomocnicze
│   └── data/                  # Pliki danych JSON
├── package.json               # Zależności Node.js
└── README.md                  # Ta dokumentacja
```

## Instalacja i uruchomienie

### Wymagania
- Node.js 14.0.0 lub nowszy
- npm lub yarn

### Instalacja
```bash
cd js-version
npm install
```

### Uruchomienie
```bash
# Tryb development (z auto-reload)
npm run dev

# Tryb production
npm start
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

## Konfiguracja

### Zmienne środowiskowe
Utwórz plik `.env` w katalogu `js-version`:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=twoj-sekretny-klucz-jwt
ENCRYPTION_KEY=twoj-klucz-szyfrowania
```

### Dane logowania
Domyślne dane logowania:
- **Użytkownik**: `admin` lub `test`
- **Hasło**: `password`

## Funkcjonalności

### ✅ Zaimplementowane
- [x] System autentykacji (JWT)
- [x] Zarządzanie chorymi
- [x] Zarządzanie szafarzami
- [x] Kalendarz odwiedzin (z obsługą 2025 i 2026)
- [x] Historia odwiedzin
- [x] Raporty miesięczne
- [x] Drukowanie i eksport PDF
- [x] Kopie zapasowe
- [x] Szyfrowanie danych (RODO)
- [x] Generowanie danych testowych
- [x] Responsywny interfejs
- [x] Automatyczne zapisywanie (auto-save)
- [x] Walidacja danych (email, telefon)
- [x] Obsługa błędów z notyfikacjami
- [x] Tworzenie nowego roku kalendarza
- [x] Resetowanie przypisań dyżurów
- [x] Oznaczanie odwiedzin chorych
- [x] Debounced saving (optymalizacja wydajności)

### 🔄 Opcjonalne rozszerzenia (przyszłe wersje)
- [ ] Import/eksport danych z innych systemów
- [ ] Notyfikacje email
- [ ] Zaawansowane raporty statystyczne
- [ ] Integracja z zewnętrznymi kalendarzami
- [ ] Aplikacja mobilna

## API Endpoints

### Autentykacja
- `POST /auth/login` - Logowanie
- `POST /auth/logout` - Wylogowanie
- `GET /auth/verify` - Weryfikacja tokenu

### Dane
- `GET /api/:file` - Pobieranie danych (chorzy, szafarze, kalendarz, historia)
- `POST /api/:file` - Zapis danych

### Historia
- `GET /historia` - Pobieranie historii
- `POST /historia` - Operacje na historii

## Bezpieczeństwo

### Szyfrowanie danych
- Dane wrażliwe (chorzy, szafarze, historia) są szyfrowane AES-256-CBC
- Klucz szyfrowania jest konfigurowalny
- Dane są automatycznie deszyfrowane przy odczycie

### Autentykacja
- JWT tokens z wygaśnięciem
- Automatyczne przekierowanie przy wygaśnięciu sesji
- Blokada konta po 5 nieudanych próbach logowania

### Walidacja
- Walidacja danych wejściowych
- Sanityzacja tekstu
- Walidacja email i telefonu

## Migracja z PHP

### Zachowane funkcjonalności
- Wszystkie funkcje oryginalnej aplikacji PHP
- Identyczny interfejs użytkownika
- Kompatybilność z istniejącymi danymi JSON

### Ulepszenia
- Nowoczesna architektura modułowa
- Lepsze zarządzanie błędami
- Responsywny interfejs
- Automatyczne zapisywanie
- Lepsze narzędzia deweloperskie

## Rozwój

### Dodawanie nowych funkcji
1. Utwórz nowy moduł w `src/client/js/modules/`
2. Dodaj endpoint w `src/server/routes/`
3. Zaktualizuj `main.js` o nowy moduł

### Debugowanie
- Użyj `console.log()` w kodzie klienta
- Sprawdź logi serwera w terminalu
- Użyj narzędzi deweloperskich przeglądarki

## Wsparcie

### Logi
- Logi serwera: terminal
- Logi klienta: konsola przeglądarki
- Błędy: wyświetlane w interfejsie użytkownika

### Częste problemy
1. **Błąd 401**: Sprawdź czy jesteś zalogowany
2. **Błąd 500**: Sprawdź logi serwera
3. **Brak danych**: Sprawdź czy pliki JSON istnieją

## Licencja

MIT License - patrz oryginalna aplikacja PHP


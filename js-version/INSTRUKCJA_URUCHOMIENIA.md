# Instrukcja uruchomienia - Wersja JavaScript

## Szybki start

### 1. Przygotowanie środowiska
```bash
# Przejdź do katalogu aplikacji
cd js-version

# Zainstaluj zależności
npm install
```

### 2. Uruchomienie aplikacji
```bash
# Tryb development (z auto-reload)
npm run dev

# Lub tryb production
npm start
```

### 3. Dostęp do aplikacji
Otwórz przeglądarkę i przejdź do: `http://localhost:3000`

## Dane logowania

**Proste logowanie:**
- **Hasło**: `PomocDlaChorych!`
- Po wpisaniu hasła aplikacja automatycznie się loguje

## Konfiguracja

### Zmienne środowiskowe (opcjonalne)
Utwórz plik `.env` w katalogu `js-version`:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=twoj-sekretny-klucz-jwt
ENCRYPTION_KEY=twoj-klucz-szyfrowania
```

### Port serwera
Domyślnie aplikacja działa na porcie 3000. Aby zmienić port:

```bash
# Ustaw zmienną środowiskową
export PORT=8080
npm start

# Lub w pliku .env
PORT=8080
```

## Struktura danych

### Pliki JSON
Aplikacja używa plików JSON do przechowywania danych:
- `src/data/chorzy.json` - Lista chorych (zaszyfrowane)
- `src/data/szafarze.json` - Lista szafarzy (zaszyfrowane)
- `src/data/kalendarz.json` - Kalendarz na bieżący rok
- `src/data/kalendarz_2025.json` - Kalendarz na 2025
- `src/data/kalendarz_2026.json` - Kalendarz na 2026
- `src/data/historia.json` - Historia odwiedzin (zaszyfrowane)

### Szyfrowanie
Dane wrażliwe (chorzy, szafarze, historia) są automatycznie szyfrowane przy zapisie i deszyfrowane przy odczycie.

## Funkcjonalności

### Kalendarz
- Wyświetlanie kalendarza na wybrany rok
- Przypisywanie szafarzy do niedziel
- Automatyczne generowanie nowego roku
- Resetowanie przypisań

### Zarządzanie chorymi
- Dodawanie, edycja, usuwanie chorych
- Oznaczanie statusu (TAK/NIE)
- Sortowanie według statusu
- Drukowanie listy

### Zarządzanie szafarzami
- Dodawanie, edycja, usuwanie szafarzy
- Walidacja email i telefonu
- Drukowanie listy

### Raporty
- Raporty miesięczne
- Statystyki odwiedzin
- Eksport do PDF
- Drukowanie raportów

### Kopie zapasowe
- Automatyczne tworzenie kopii zapasowych
- Pobieranie pliku JSON z danymi
- Przywracanie z kopii zapasowej

## Rozwiązywanie problemów

### Aplikacja się nie uruchamia
```bash
# Sprawdź czy Node.js jest zainstalowany
node --version

# Sprawdź czy port jest wolny
lsof -i :3000

# Zainstaluj zależności ponownie
rm -rf node_modules package-lock.json
npm install
```

### Błąd 401 (Unauthorized)
- Sprawdź czy jesteś zalogowany
- Wyczyść cache przeglądarki
- Sprawdź czy token JWT jest ważny

### Błąd 500 (Internal Server Error)
- Sprawdź logi serwera w terminalu
- Sprawdź czy pliki JSON istnieją
- Sprawdź uprawnienia do zapisu plików

### Dane się nie zapisują
- Sprawdź uprawnienia do zapisu w katalogu `src/data/`
- Sprawdź czy serwer ma dostęp do plików
- Sprawdź logi serwera

### Problemy z szyfrowaniem
- Sprawdź czy klucz szyfrowania jest ustawiony
- Sprawdź czy pliki JSON nie są uszkodzone
- Sprawdź logi serwera

## Logi i debugowanie

### Logi serwera
Logi są wyświetlane w terminalu gdzie uruchomiono aplikację:
```bash
npm run dev
```

### Logi przeglądarki
Otwórz narzędzia deweloperskie (F12) i sprawdź zakładkę Console.

### Poziom logowania
Ustaw zmienną środowiskową:
```bash
NODE_ENV=development npm run dev
```

## Bezpieczeństwo

### Zmiana haseł
Edytuj plik `src/server/routes/auth.js` i zaktualizuj hashe haseł:
```javascript
const validCredentials = {
  'admin': '$2a$10$nowy_hash_hasla',
  'test': '$2a$10$nowy_hash_hasla'
};
```

### Zmiana kluczy szyfrowania
Zaktualizuj klucze w plikach:
- `src/server/routes/auth.js` (JWT_SECRET)
- `src/server/utils/crypto.js` (ENCRYPTION_KEY)

### HTTPS (produkcja)
W środowisku produkcyjnym skonfiguruj HTTPS:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

## Wsparcie

### Częste pytania
1. **Czy mogę używać tej wersji obok wersji PHP?** - Nie, ta wersja zastępuje wersję PHP
2. **Czy dane są kompatybilne?** - Tak, używa tych samych plików JSON
3. **Czy mogę migrować dane?** - Tak, skopiuj pliki JSON z wersji PHP do `src/data/`

### Kontakt
W przypadku problemów sprawdź:
1. Logi serwera
2. Logi przeglądarki
3. Dokumentację API
4. Pliki konfiguracyjne

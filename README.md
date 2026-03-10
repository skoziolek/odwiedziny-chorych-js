# 🚀 Odwiedziny Chorych - Wersja Node.js

## 📦 Opis

Nowoczesna wersja aplikacji "Odwiedziny Chorych" do zarządzania dyżurami odwiedzin chorych w parafii, zbudowana w Node.js z Express.

## 🎯 Funkcjonalności

- ✅ **Automatyczne przypisywanie dyżurów** z rotacyjnym systemem
- ✅ **Ręczna edycja** przypisań
- ✅ **Zarządzanie chorymi** (dodawanie, edycja, usuwanie)
- ✅ **Zarządzanie szafarzami** (dodawanie, edycja, usuwanie)
- ✅ **Kalendarz miesięczny** z świętami kościelnymi
- ✅ **Prosty system logowania** z hasłem
- ✅ **Responsywny design** (działa na telefonach)
- ✅ **Szyfrowanie danych** (RODO)
- ✅ **API REST** z autoryzacją

## 🚀 Szybki start

### Wymagania
- **Node.js** 16+ 
- **npm** (zazwyczaj dołączony do Node.js)

### Uruchomienie

1. **Przejdź do katalogu aplikacji:**
   ```bash
   cd js-version
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Uruchom aplikację:**
   ```bash
   npm start
   ```

4. **Otwórz przeglądarkę:** `http://localhost:3000`

5. **Zaloguj się hasłem:** `PomocDlaChorych!`

## 📁 Struktura plików

```
Odwiedziny-chorych-1/
├── js-version/                      ← GŁÓWNA APLIKACJA
│   ├── src/
│   │   ├── client/                  ← Frontend (HTML, CSS, JS)
│   │   ├── data/                    ← Dane aplikacji (zaszyfrowane)
│   │   └── server/                  ← Backend (Node.js, Express)
│   ├── package.json                 ← Zależności Node.js
│   ├── README.md                    ← Instrukcje aplikacji
│   └── start.bat/sh                 ← Skrypty uruchomienia
└── README.md                        ← Ten plik
```

## 🔧 Wymagania

- **Node.js** 16+ 
- **npm** (zazwyczaj dołączony do Node.js)
- **Przeglądarka** internetowa

## 📋 Szczegółowe instrukcje

Zobacz plik `js-version/INSTRUKCJA_URUCHOMIENIA.md` dla szczegółowych instrukcji.

## 🐛 Raportowanie błędów

Jeśli znajdziesz błąd, podaj:
1. Krok do odtworzenia błędu
2. Oczekiwane vs rzeczywiste zachowanie
3. Przeglądarka i system operacyjny
4. Zrzut ekranu (jeśli możliwe)

## 💡 Wskazówki

- **Nie przenoś plików** podczas działania serwera
- **Użyj Ctrl+C** aby zatrzymać serwer
- **Sprawdź konsolę** (F12) jeśli coś nie działa
- **Sprawdź logi serwera** w terminalu

## 📞 Wsparcie

W razie problemów:
1. Sprawdź czy Node.js jest zainstalowane
2. Sprawdź czy port 3000 jest wolny
3. Sprawdź logi serwera w terminalu
4. Sprawdź konsolę przeglądarki (F12)

---

**Wersja:** 1.2.0  
**Data:** 15 stycznia 2025  
**Autor:** Sebastian Koziolek  

Numeracja wersji: 1.x.x (np. 1.2, 1.3, 1.4). Kolejne wydania oznaczane w `package.json`, w pliku `js-version/src/client/js/modules/raporty.js` (pole `version` w kopii zapasowej) oraz jako tag Git (np. `v1.2.0`).
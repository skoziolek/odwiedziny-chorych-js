# 🚀 Odwiedziny Chorych - Wersja przenośna

## 📦 Opis

Przenośna wersja aplikacji "Odwiedziny Chorych" do zarządzania dyżurami odwiedzin chorych w parafii.

## 🎯 Funkcjonalności

- ✅ **Automatyczne przypisywanie dyżurów** z rotacyjnym systemem
- ✅ **Ręczna edycja** przypisań
- ✅ **Zarządzanie chorymi** (dodawanie, edycja, usuwanie)
- ✅ **Zarządzanie szafarzami** (dodawanie, edycja, usuwanie)
- ✅ **Kalendarz miesięczny** z świętami kościelnymi
- ✅ **System logowania** i autoryzacji
- ✅ **Responsywny design** (działa na telefonach)

## 🚀 Szybki start

### Windows (ZALECANE)

1. **Kliknij dwukrotnie na:** `START_APLIKACJI.bat`
2. **Otwórz przeglądarkę:** `http://localhost:8080/login.php`
3. **Przetestuj aplikację!**

### Jeśli nie masz PHP:

1. Pobierz XAMPP: https://www.apachefriends.org/
2. Zainstaluj (tylko Apache + PHP)
3. Skopiuj folder `odwiedziny-chorych` do `C:\xampp\htdocs\`
4. Uruchom Apache w XAMPP Control Panel
5. Otwórz: `http://localhost/odwiedziny-chorych/login.php`

## 📁 Struktura plików

```
Odwiedziny_Chorych_Portable/
├── START_APLIKACJI.bat              ← URUCHOM TUTAJ
├── odwiedziny-chorych/              ← Pliki aplikacji
│   ├── login.php                    ← Strona logowania
│   ├── main.php                     ← Główna aplikacja
│   ├── api.php                      ← API
│   ├── *.js                         ← JavaScript
│   ├── *.css                        ← Style
│   └── *.json                       ← Dane
├── INSTRUKCJE_DLA_TESTERA_WINDOWS.md ← Szczegółowe instrukcje
└── README.md                        ← Ten plik
```

## 🔧 Wymagania

- **Windows** 7/8/10/11
- **PHP** 7.4+ (lub XAMPP/WAMP)
- **Przeglądarka** internetowa

## 📋 Plan testowania

Zobacz plik `INSTRUKCJE_DLA_TESTERA_WINDOWS.md` dla szczegółowego planu testowania.

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
- **Uruchom jako administrator** jeśli są problemy z portem

## 📞 Wsparcie

W razie problemów:
1. Sprawdź czy PHP jest zainstalowane
2. Spróbuj inny port (8081, 8082)
3. Uruchom jako administrator
4. Sprawdź firewall

---

**Wersja:** 1.0.0  
**Data:** 22 czerwca 2025  
**Autor:** Sebastian Koziolek 
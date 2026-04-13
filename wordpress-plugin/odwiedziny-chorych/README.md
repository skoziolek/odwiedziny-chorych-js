# Odwiedziny Chorych - Plugin WordPress

System zarządzania odwiedzinami chorych zintegrowany z WordPress.

## 📋 Wymagania

- WordPress 5.0 lub nowszy
- PHP 7.4 lub nowszy
- MySQL 5.7 lub nowszy
- Plugin SMTP (np. WP Mail SMTP) - dla wysyłki emaili

## 🚀 Szybka Instalacja dla Administratora

### Krok 1: Pobierz plugin
```bash
# Przez Git:
git clone https://github.com/TWOJE_REPO/odwiedziny-chorych.git

# Lub pobierz ZIP i rozpakuj
```

### Krok 2: Skopiuj na serwer
Skopiuj folder `odwiedziny-chorych` do katalogu `/wp-content/plugins/` na serwerze WordPress.

### Krok 3: Aktywuj plugin
1. Zaloguj się do panelu WordPress (`/wp-admin`)
2. Przejdź do: **Wtyczki** → **Zainstalowane wtyczki**
3. Znajdź **"Odwiedziny Chorych"** i kliknij **"Włącz"**

### Krok 4: Dodaj shortcode
1. Utwórz nową stronę lub edytuj istniejącą
2. Dodaj shortcode: `[odwiedziny_chorych]`
3. Opublikuj stronę

### Krok 5: Skonfiguruj SMTP (WAŻNE dla emaili)
1. Zainstaluj plugin **"WP Mail SMTP"**
2. Skonfiguruj serwer SMTP (Gmail, Outlook, itp.)
3. Przetestuj wysyłkę emaili

📖 **Szczegółowa instrukcja:** Zobacz `WDROZENIE_PRODUKCJA.md`

### Krok 6: Zmień hasło
1. Przejdź do: **Odwiedziny Chorych** → **Ustawienia**
2. Zmień domyślne hasło: `PomocDlaChorych!`

---

## 📖 Szczegółowa Instalacja

1. **Skopiuj folder pluginu**
   - Skopiuj cały folder `odwiedziny-chorych` do katalogu `wp-content/plugins/` na serwerze WordPress.

2. **Aktywuj plugin**
   - Zaloguj się do panelu administracyjnego WordPress
   - Przejdź do: Wtyczki → Zainstalowane wtyczki
   - Znajdź "Odwiedziny Chorych" i kliknij "Włącz"

3. **Dodaj shortcode na stronę**
   - Utwórz nową stronę lub edytuj istniejącą
   - Dodaj shortcode: `[odwiedziny_chorych]`
   - Opublikuj stronę

4. **Zmień domyślne hasło**
   - Przejdź do: Odwiedziny Chorych → Ustawienia
   - Zmień domyślne hasło (domyślnie: `PomocDlaChorych!`)

## Użycie

Po zainstalowaniu pluginu i dodaniu shortcode na stronę:

1. Wejdź na stronę z aplikacją
2. Zaloguj się hasłem
3. Zarządzaj:
   - **Kalendarz** - przypisywanie szafarzy do dyżurów
   - **Adwent** - kalendarz dni adwentowych
   - **Dane chorych** - lista chorych do odwiedzania
   - **Dane szafarzy** - lista szafarzy
   - **Raporty** - statystyki miesięczne

## Bezpieczeństwo

- Hasło jest hashowane (bcrypt/password_hash)
- Rate limiting - max 5 prób logowania, potem 15 min blokady
- Sesje wygasają po 8 godzinach
- Dane są przechowywane w bazie MySQL WordPress
- Wszystkie dane są walidowane i sanityzowane

## REST API

Plugin udostępnia REST API pod adresem: `/wp-json/odwiedziny-chorych/v1/`

Endpointy:
- `GET /chorzy` - lista chorych
- `POST /chorzy/bulk` - zapis chorych
- `GET /szafarze` - lista szafarzy
- `POST /szafarze` - zapis szafarzy
- `GET /kalendarz?rok=2025` - kalendarz
- `POST /kalendarz?rok=2025` - zapis kalendarza
- `GET /adwent?rok=2025` - adwent
- `POST /adwent?rok=2025` - zapis adwentu
- `GET /historia` - historia odwiedzin
- `POST /historia` - dodaj odwiedziny
- `GET /raporty/miesieczny?miesiac=2025-01` - raport miesięczny
- `POST /auth/login` - logowanie
- `GET /auth/verify` - weryfikacja sesji
- `POST /auth/logout` - wylogowanie

## Odinstalowanie

Przy odinstalowaniu pluginu wszystkie dane zostaną usunięte z bazy danych.

## 📚 Dokumentacja

- `INSTRUKCJA_DLA_ADMINA.md` - **GŁÓWNA INSTRUKCJA** dla administratora (wdrożenie krok po kroku)
- `WDROZENIE_PRODUKCJA.md` - Szczegółowa instrukcja wdrożenia
- `INSTALACJA_SMTP.md` - Konfiguracja SMTP dla emaili
- `KONFIGURACJA_SSL.md` - Konfiguracja SSL
- `AKTUALIZACJA.md` - Jak aktualizować plugin
- `BEZPIECZENSTWO.md` - Informacje o bezpieczeństwie
- `RESPONSYWNOŚĆ.md` - Informacje o responsywności

## 🔧 Funkcjonalności

- ✅ **Kalendarz** - przypisywanie szafarzy do dyżurów
- ✅ **Adwent** - kalendarz dni adwentowych
- ✅ **Dane chorych** - zarządzanie listą chorych
- ✅ **Dane szafarzy** - zarządzanie listą szafarzy
- ✅ **Raporty** - statystyki miesięczne
- ✅ **Emaile** - automatyczne przypomnienia o dyżurach
- ✅ **Responsywność** - działa na mobile i desktop
- ✅ **Drukowanie** - drukowanie kalendarzy i raportów

## 🔒 Bezpieczeństwo

- Hasło jest hashowane (bcrypt/password_hash)
- Rate limiting - max 5 prób logowania, potem 15 min blokady
- Sesje wygasają po 8 godzinach
- Wszystkie dane są walidowane i sanityzowane
- CSRF protection (nonces)
- SQL injection protection (prepared statements)
- Console.log wyłączone w produkcji (warunkowe debugowanie)
- Aria-labels dla lepszej dostępności

## 📖 Instrukcje wdrożenia

**Dla administratora:**
- 📄 `INSTRUKCJA_DLA_ADMINA.md` - **GŁÓWNA INSTRUKCJA** wdrożenia (krok po kroku)
- 📄 `WDROZENIE_PRODUKCJA.md` - Szczegółowa instrukcja wdrożenia
- 📄 `INSTALACJA_SMTP.md` - Konfiguracja SMTP
- 📄 `KONFIGURACJA_SSL.md` - Konfiguracja SSL

**Dla deweloperów:**
- 📄 `PUBLIKACJA_GITHUB.md` - Szybka instrukcja publikacji na GitHub
- 📄 `GITHUB_SETUP.md` - Szczegółowa instrukcja GitHub

## 🌐 Wsparcie

W razie problemów:
1. Sprawdź dokumentację w folderze pluginu
2. Sprawdź logi błędów w `wp-content/debug.log`
3. Sprawdź `ROZWIAZYWANIE_BLEDOW_SMTP.md` dla problemów z emailami
4. Skontaktuj się z administratorem

---

## 📦 Wersja

**Aktualna wersja:** 1.0.0  
**Data wydania:** 2025-12-29  
**Status:** ✅ Gotowa do produkcji

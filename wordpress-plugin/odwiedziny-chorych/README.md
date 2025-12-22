# Odwiedziny Chorych - Plugin WordPress

System zarządzania odwiedzinami chorych zintegrowany z WordPress.

## Wymagania

- WordPress 5.0 lub nowszy
- PHP 7.4 lub nowszy
- MySQL 5.7 lub nowszy

## Instalacja

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

## Wsparcie

W razie problemów skontaktuj się z administratorem.

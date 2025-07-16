# Odwiedziny Chorych - Wersja dla Testera v1.3.0

## Opis wersji
Ta wersja zawiera poprawki w generowaniu danych testowych. Teraz wszystkie wygenerowane dane zawierają pełne imiona i nazwiska chorych oraz szafarzy.

## Zmiany w tej wersji
- ✅ Poprawione generowanie danych testowych dla chorych - teraz zawierają pełne imiona i nazwiska
- ✅ Poprawione generowanie danych testowych dla szafarzy - teraz zawierają pełne imiona i nazwiska  
- ✅ Poprawione generowanie kalendarza - używa pełnych imion i nazwisk szafarzy
- ✅ Przyciski "Generuj dane testowe" i "Wyczyść dane testowe" działają poprawnie
- ✅ Usunięte automatyczne wywołania funkcji drukowania po generowaniu/wyczyszczeniu danych

## Jak testować
1. Uruchom aplikację: `php -S localhost:8000`
2. Zaloguj się hasłem: `PomocDlaChorych!`
3. Przejdź do zakładki "Kalendarz"
4. Użyj przycisku "Generuj dane testowe" - sprawdź czy:
   - W zakładce "Chorzy" pojawiają się pełne imiona i nazwiska
   - W zakładce "Szafarze" pojawiają się pełne imiona i nazwiska
   - W kalendarzu pojawiają się pełne imiona i nazwiska szafarzy
5. Użyj przycisku "Wyczyść dane testowe" - sprawdź czy wszystkie dane zostają usunięte

## Struktura danych testowych
### Chorzy
- Jan Kowalski, ul. Testowa 1, Warszawa
- Anna Nowak, ul. Przykładowa 5, Kraków  
- Piotr Wiśniewski, ul. Demo 10, Gdańsk

### Szafarze
- Tomasz Kowalczyk
- Marek Zieliński
- Andrzej Dąbrowski

### Kalendarz
- Zawiera dyżury na wszystkie niedziele 2025 roku
- Używa pełnych imion i nazwisk szafarzy
- Rotacja szafarzy co tydzień

## Tag GitHub
`v1.3.0-tester`

## Data wydania
6 lipca 2025 
# Rozwiązania problemu z widocznością danych na urządzeniach mobilnych

## Problem
Na urządzeniach mobilnych w zakładce Kalendarz nie widać kto jest przypisany jako osoba główna i pomocnik, ponieważ tabela ma 6 kolumn i jest zbyt szeroka.

## Proponowane rozwiązania

### Rozwiązanie 1: Kompaktowy widok na mobile (ZALECANE) ⭐
- Zmniejszenie fontu i paddingów
- Skrócone nazwy kolumn (np. "Główna" zamiast "Osoba Główna")
- Ukrycie kolumny "Uwagi" na bardzo małych ekranach
- Sticky kolumna "Data" - zawsze widoczna przy scrollowaniu

**Zalety:**
- Wszystkie dane widoczne
- Nie wymaga zmian w JavaScript
- Szybkie do zaimplementowania

### Rozwiązanie 2: Zmiana na układ kartowy na mobile
- Każdy wiersz jako karta z informacjami w układzie pionowym
- Osoba Główna i Pomocnik jako osobne linie
- Łatwe do czytania

**Zalety:**
- Bardzo czytelne
- Wykorzystuje całą szerokość ekranu
- Wszystkie informacje widoczne

**Wady:**
- Wymaga większych zmian w CSS
- Większa wysokość listy

### Rozwiązanie 3: Expandable rows (rozwijane wiersze)
- Na mobile pokaż tylko Data, Nazwa i przycisk "Szczegóły"
- Po kliknięciu rozwija się wiersz z pełnymi informacjami

**Zalety:**
- Kompaktowy widok
- Pełne informacje na żądanie

**Wady:**
- Wymaga zmian w JavaScript
- Dodatkowe kliknięcie do zobaczenia danych

### Rozwiązanie 4: Tylko najważniejsze kolumny na mobile
- Pokaż: Data, Osoba Główna, Pomocnik, Akcje
- Ukryj: Nazwa (lub pokaż skróconą w tooltipie), Uwagi

**Zalety:**
- Najprostsze do zaimplementowania
- Najważniejsze dane widoczne

**Wady:**
- Brak niektórych informacji bez scrollowania

## Rekomendacja

**Rozwiązanie 1 + elementy Rozwiązania 4:**
- Kompaktowy widok z mniejszym fontem i paddingami
- Skrócone nazwy kolumn
- Ukrycie kolumny "Uwagi" na bardzo małych ekranach (można dodać ikonę "i" która pokazuje uwagi w tooltipie)
- Sticky kolumna "Data" dla łatwiejszej nawigacji


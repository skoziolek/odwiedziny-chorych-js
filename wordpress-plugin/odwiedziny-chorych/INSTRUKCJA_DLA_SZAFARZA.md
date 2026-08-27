# Instrukcja dla szafarza — korzystanie z aplikacji „Odwiedziny chorych”

Krótki przewodnik po **interfejsie na stronie parafii** (nie dotyczy panelu WordPress).

---

## 1. Wejście na stronę

Otwórz w przeglądarce adres strony, którą podał **administrator** (np. strona z aplikacją osadzoną shortcode).

---

## 2. Logowanie

1. W polu **Typ konta** wybierz **Szafarz**.
2. Na liście **Szafarz** wybierz **swoje imię i nazwisko** (jeśli Ciebie nie ma, administrator musi dodać Cię w zakładce *Dane szafarzy*).
3. Wpisz **hasło logowania** — ustala i przekazuje **administrator** (osobne od hasła do aplikacji administracyjnej).
4. Kliknij **Zaloguj się**.

Po zalogowaniu u góry zobaczysz np. „Zalogowano jako: …”.

---

## 3. Co widzi szafarz

Szafarz ma w aplikacji **ograniczony** zestaw zakładek (bez edycji listy szafarzy i bez raportów administratorskich):

- **Kalendarz** — terminy niedziel i świąt, przypisania osób, uwagi do dyżurów, zapisywanie planu odwiedzin (okno z listą chorych).
- **Adwent** — jeśli zakładka jest włączona u Was w parafii: podobnie jak kalendarz, dla dni adwentu.
- **Dane chorych** — lista chorych; możliwość przeglądania i uzupełniania informacji (np. pole **Uwagi** przy odwiedzinach).

Zakładki **Dane szafarzy** i **Raporty** są **ukryte** — służą do pracy administratora.

---

## 4. Kalendarz i odwiedziny

- Przełącz **rok** (jeśli jest na pasku), przejdź do odpowiedniego miesiąca.
- **Niedziele, święta oraz dni z informacją o dyżurze** — administrator ustala przypisania; Ty możesz korzystać z funkcji związanych z odwiedzinami zgodnie z tym, co pokazuje się na ekranie.
- Użycie przycisków typu **Drukuj** zależy od potrzeb — wydruk list może być przydatny przed wyjściem do chorych.

### Raport odwiedzin (po dyżurze)

Po kliknięciu w dzień dyżuru otwiera się **Raport odwiedzin** — pionowa lista chorych, którą wypełniasz po wizytach:

1. Przy każdym chorym ustaw **status wizyty**:
   - **Odwiedzona** — wizyta się odbyła (zapisze się wpis w historii odwiedzin),
   - **Nieobecny** — chory był nieobecny / nie udało się odwiedzić.
2. Z listy rozwijanej **Następna wizyta** wybierz **termin kolejnej wizyty**. Lista pokazuje najbliższe dyżury (niedziele i święta nakazane) z podpowiedzią, jak daleko są w czasie (np. „za tydzień”). Wybrany termin **przypisuje chorego do tej daty**.
3. Przy każdej osobie jest **Usuń**. Zdejmuje ją z listy tego dnia. Jeśli miała wizytę zaplanowaną właśnie na ten dzień, następna wizyta ustawi się na najbliższy kolejny dyżur (można to potem zmienić). Osobę dopisaną okazjonalnie Usuń tylko ściąga z tej listy.
4. W razie potrzeby **dodaj chorego okazjonalnie** na ten termin.
5. Kliknij **Zapisz raport**, aby zapamiętać zaznaczenia i terminy. **Anuluj** zamyka okno bez zapisu całego raportu (dodanie i usunięcie z listy zapisuje się od razu).

> Wskazówka: na liście w raporcie pojawiają się chorzy, którzy są w danym dniu **do odwiedzenia** — mają na ten dzień zaplanowaną wizytę albo zostali dopisani ręcznie jako odwiedziny okazjonalne. Jeśli nikt jeszcze nie jest przypisany, okno wyjaśnia, że lista jest pusta i jak dodać osoby.

---

## 5. Dane chorych

- Lista zawiera m.in. **imię i nazwisko, adres, telefon, uwagi, następną wizytę, status** (aktywny / nieaktywny według ustaleń parafii).
- Kolumna **Następna wizyta** pokazuje termin wyznaczony w *Raporcie odwiedzin* (patrz pkt 4). Jeśli termin nie został jeszcze wybrany, widnieje „—”.
- Zmiany zapisują się zgodnie z działaniem aplikacji (automatyczny zapis po edycji pól — nie zamykaj strony od razu po wpisaniu tekstu, daj chwilę na zapis).

---

## 6. Wylogowanie

Kliknij **Wyloguj** w pasku zakładek, żeby zakończyć sesję (szczególnie na współdzielonym komputerze).

---

## 7. Gdy coś nie działa

- **Nie ma mnie na liście szafarzy** — zgłoś to administratorowi (musi mieć dodanego szafarza w *Dane szafarzy*).
- **Hasło nie działa** — upewnij się, że administrator **ustawił hasło i zapisał zmiany**; jeśli nadal problem, poproś o **nowe hasło**.
- **Strona się nie ładuje / błędy** — odśwież stronę (`F5`), sprawdź inna przeglądarkę lub skontaktuj się z administratorem strony.

---

Wiadomości e-mail z przypomnieniem przed dyżurem (jeżeli są włączone) wysyła **system WordPress** na adres wpisany przy szafarzu — o konfiguracji SMTP decyduje administrator; szczegóły: **`INSTRUKCJA_EMAIL_PRZED_DYZUREM.md`**.

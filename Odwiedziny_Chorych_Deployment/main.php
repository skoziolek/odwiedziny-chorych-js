<?php
session_start();

// Jeśli użytkownik nie jest zalogowany, przekieruj go do strony logowania
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Grafik odwiedzin chorych</title>
  <link rel="stylesheet" href="style.css">
  <script type="module">
    import { generujKalendarz, drukujKalendarz, inicjalizujObslugeKalendarza, resetujPrzypisaniaDyzurow } from './kalendarz.js';
    import { wczytajChorych, dodajWierszChorych, drukujListeChorych, aktualizujKolorWiersza, inicjalizujObslugeChorych } from './chorzy.js';
    import { wczytajSzafarzy, dodajWierszSzafarzy, drukujListeSzafarzy, inicjalizujObslugeSzafarzy } from './szafarze.js';
    import { pobierzRaportMiesieczny, wyswietlRaportMiesieczny, drukujRaportMiesieczny, dodajOdwiedziny } from './historia.js';

    // Udostępnienie funkcji globalnie, aby były dostępne z HTML (np. onclick)
    window.dodajWierszChorych = dodajWierszChorych;
    window.dodajWierszSzafarzy = dodajWierszSzafarzy;
    window.drukujListeChorych = drukujListeChorych;
    window.drukujListeSzafarzy = drukujListeSzafarzy;
    window.drukujKalendarz = drukujKalendarz;
    window.generujKalendarz = generujKalendarz;
    window.aktualizujKolorWiersza = aktualizujKolorWiersza;
    window.resetujPrzypisaniaDyzurow = resetujPrzypisaniaDyzurow;
    window.dodajOdwiedziny = dodajOdwiedziny;

    // Funkcja do generowania raportu miesięcznego
    window.generujRaportMiesieczny = async function() {
      const miesiac = document.getElementById('wybierzMiesiac').value;
      const raport = await pobierzRaportMiesieczny(miesiac);
      const html = wyswietlRaportMiesieczny(raport);
      
      const container = document.getElementById('raportContainer');
      container.innerHTML = html;
    };

    // Funkcja do drukowania raportu
    window.drukujRaportMiesieczny = async function() {
      const miesiac = document.getElementById('wybierzMiesiac').value;
      const raport = await pobierzRaportMiesieczny(miesiac);
      drukujRaportMiesieczny(raport);
    };

    // Dodaj funkcję do resetowania statusów odwiedzin
    window.resetujStatusyOdwiedzin = async function() {
      if (!confirm('Czy na pewno chcesz zresetować wszystkie statusy odwiedzin?')) return;
      try {
        const resp = await fetch('historia.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resetuj_statusy_odwiedzin' })
        });
        const wynik = await resp.json();
        if (wynik.success) {
          alert('Statusy odwiedzin zostały zresetowane!');
          await generujKalendarz();
        } else {
          alert('Błąd podczas resetowania statusów!');
        }
      } catch (e) {
        alert('Błąd sieci podczas resetowania statusów!');
      }
    };

    // Dodaj funkcję do migracji danych (zaszyfrowania istniejących)
    window.migrujDaneDoSzyfrowania = async function() {
      if (!confirm('Czy na pewno chcesz zaszyfrować wszystkie istniejące dane? Ta operacja jest nieodwracalna!')) return;
      
      try {

        
        // Pobierz wszystkie dane
        const [chorzy, szafarze, historia] = await Promise.all([
          fetch('api.php?plik=chorzy').then(r => r.json()),
          fetch('api.php?plik=szafarze').then(r => r.json()),
          fetch('api.php?plik=historia').then(r => r.json())
        ]);
        

        
        // Sprawdź czy dane są już zaszyfrowane
        let daneDoZaszyfrowania = [];
        
        if (!chorzy.encrypted && !chorzy.iv) {
          daneDoZaszyfrowania.push(['chorzy', chorzy]);
        }
        
        if (!szafarze.encrypted && !szafarze.iv) {
          daneDoZaszyfrowania.push(['szafarze', szafarze]);
        }
        
        if (!historia.encrypted && !historia.iv) {
          daneDoZaszyfrowania.push(['historia', historia]);
        }
        
        if (daneDoZaszyfrowania.length === 0) {
          alert('Wszystkie dane są już zaszyfrowane!');
          return;
        }
        
        // Zaszyfruj i zapisz dane pojedynczo
        for (const [plik, dane] of daneDoZaszyfrowania) {
          
          try {
            const response = await fetch(`api.php?plik=${plik}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dane)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Błąd przy szyfrowaniu ${plik}:`, response.status, errorText);
              throw new Error(`Błąd ${response.status} przy szyfrowaniu ${plik}: ${errorText}`);
            }
            

          } catch (error) {
            console.error(`Błąd przy szyfrowaniu ${plik}:`, error);
            throw error;
        }
        }
        
        alert(`Dane zostały pomyślnie zaszyfrowane! Zaszyfrowano ${daneDoZaszyfrowania.length} plików.`);
        location.reload(); // Odśwież stronę
      } catch (error) {
        console.error('Błąd podczas migracji:', error);
        alert('Błąd podczas szyfrowania danych: ' + error.message);
      }
    };







    // --- GŁÓWNA INICJALIZACJA APLIKACJI ---
    document.addEventListener('DOMContentLoaded', async () => {


      // Konfiguracja zakładek
      const buttons = document.querySelectorAll(".tab-button");
      const contents = document.querySelectorAll(".tab-content");
      buttons.forEach(button => {
        button.addEventListener("click", () => {
          const tab = button.dataset.tab;
          buttons.forEach(btn => btn.classList.remove("active"));
          contents.forEach(content => content.classList.remove("active"));
          button.classList.add("active");
          document.getElementById(tab).classList.add("active");
        });
      });

      // Krok 1: Wczytaj dane szafarzy i chorych.
      // Czekamy na ich załadowanie, bo kalendarz może z nich korzystać.
      await Promise.all([
        wczytajSzafarzy(),
        wczytajChorych()
      ]);
      
      // Krok 2: Generuj kalendarz, który teraz ma dostęp do aktualnej listy szafarzy.
      await generujKalendarz();
      
      let tabelaKalendarz = document.getElementById('tabelaKalendarzBody');

      // Krok 3: Uruchom nasłuchiwanie na zmiany we wszystkich modułach.
      inicjalizujObslugeChorych();
      inicjalizujObslugeSzafarzy();
      inicjalizujObslugeKalendarza();
      


      // Tooltip dla kalendarza
      if (tabelaKalendarz) {
        // Desktop: hover
        tabelaKalendarz.addEventListener('mouseover', async function(e) {
          if (window.innerWidth < 800) return; // tylko desktop
          const tr = e.target.closest('tr');
          if (!tr || tr.dataset.tooltipActive) return;
          tr.dataset.tooltipActive = '1';
          const dataCell = tr.querySelector('td');
          if (!dataCell) return;
          const data = dataCell.textContent.trim();
          // Pobierz historię odwiedzin dla tej daty
          let odwiedzeni = [];
          try {
            const responseHistoria = await fetch(`historia.php?action=pobierz_raport_dzienny&data=${data}`);
            if (responseHistoria.ok) {
              const raport = await responseHistoria.json();
              odwiedzeni = (raport.odwiedziny || []).filter(o => o.status === 'odwiedzone').map(o => o.chory_nazwa);
            }
          } catch {}
          // USUŃ WSZYSTKIE ISTNIEJĄCE TOOLTIPY
          document.querySelectorAll('.kalendarz-tooltip').forEach(t => t.remove());
          // Stwórz tooltip
          const tooltip = document.createElement('div');
          tooltip.className = 'kalendarz-tooltip';
          tooltip.style.position = 'absolute';
          tooltip.style.background = '#fff';
          tooltip.style.border = '1px solid #ccc';
          tooltip.style.padding = '8px 14px';
          tooltip.style.borderRadius = '6px';
          tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          tooltip.style.zIndex = 2000;
          tooltip.style.fontSize = '15px';
          tooltip.innerHTML = odwiedzeni.length
            ? `<b>Odwiedzeni:</b><br>${odwiedzeni.map(n => `<div>${n}</div>`).join('')}`
            : 'Brak odwiedzin';
          document.body.appendChild(tooltip);
          // Pozycjonowanie
          const rect = tr.getBoundingClientRect();
          tooltip.style.left = (rect.right + 10) + 'px';
          tooltip.style.top = (rect.top + window.scrollY) + 'px';
          tr._tooltip = tooltip;
          // AUTOMATYCZNE UKRYWANIE TOOLTIPA PO 3 SEKUNDACH
          setTimeout(() => {
            if (tooltip.parentNode) {
              tooltip.remove();
              delete tr._tooltip;
              delete tr.dataset.tooltipActive;
            }
          }, 3000);
        });
        tabelaKalendarz.addEventListener('mouseout', function(e) {
          if (window.innerWidth < 800) return;
          const tr = e.target.closest('tr');
          if (tr && tr._tooltip) {
            tr._tooltip.remove();
            delete tr._tooltip;
            delete tr.dataset.tooltipActive;
          }
        });
      }

      // --- DYNAMICZNE PRZYCISKI W ZAKŁADCE KALENDARZA ---
      const kalendarzButtons = document.getElementById('kalendarz-buttons');
      if (kalendarzButtons) {
        // Drukuj kalendarz
        const drukujBtn = document.createElement('button');
        drukujBtn.textContent = 'Drukuj';
        drukujBtn.className = 'uni-btn';
        drukujBtn.onclick = window.drukujKalendarz;
        kalendarzButtons.appendChild(drukujBtn);

        // Przycisk migracji danych (pozostaje widoczny)
        const migracjaBtn = document.createElement('button');
        migracjaBtn.textContent = 'Zaszyfruj dane (RODO)';
        migracjaBtn.className = 'uni-btn';
        migracjaBtn.onclick = window.migrujDaneDoSzyfrowania;
        kalendarzButtons.appendChild(migracjaBtn);
      }
      // --- INICJALIZACJA OBSŁUGI KALENDARZA (tooltipy, zmiany) ---
      inicjalizujObslugeKalendarza();
    });

    window.eksportujRaportPDF = async function() {
      const miesiac = document.getElementById('wybierzMiesiac').value;
      const raport = await pobierzRaportMiesieczny(miesiac);
      if (!raport) {
        alert('Nie udało się pobrać raportu');
        return;
      }
      
      // Funkcja do konwersji polskich znaków na ASCII
      function konwertujPolskieZnaki(text) {
        if (!text) return '';
        return text
          .replace(/ą/g, 'a')
          .replace(/ć/g, 'c')
          .replace(/ę/g, 'e')
          .replace(/ł/g, 'l')
          .replace(/ń/g, 'n')
          .replace(/ó/g, 'o')
          .replace(/ś/g, 's')
          .replace(/ź/g, 'z')
          .replace(/ż/g, 'z')
          .replace(/Ą/g, 'A')
          .replace(/Ć/g, 'C')
          .replace(/Ę/g, 'E')
          .replace(/Ł/g, 'L')
          .replace(/Ń/g, 'N')
          .replace(/Ó/g, 'O')
          .replace(/Ś/g, 'S')
          .replace(/Ź/g, 'Z')
          .replace(/Ż/g, 'Z');
      }
      
      // Funkcja do konwersji statusów na wersje bez polskich znaków
      function konwertujStatus(status) {
        const mapowanieStatusow = {
          'odwiedzone': 'odwiedzone',
          'zaplanowane': 'zaplanowane',
          'wykonane': 'wykonane',
          'nie_wykonane': 'nie_wykonane',
          'odwolane': 'odwolane'
        };
        return mapowanieStatusow[status] || status;
      }
      
      // Funkcja do konwersji nazw miesięcy na wersje bez polskich znaków
      function konwertujNazweMiesiaca(nazwaMiesiaca) {
        const mapowanieMiesiecy = {
          'styczeń': 'styczen',
          'luty': 'luty',
          'marzec': 'marzec',
          'kwiecień': 'kwiecien',
          'maj': 'maj',
          'czerwiec': 'czerwiec',
          'lipiec': 'lipiec',
          'sierpień': 'sierpien',
          'wrzesień': 'wrzesien',
          'październik': 'pazdziernik',
          'listopad': 'listopad',
          'grudzień': 'grudzien'
        };
        
        for (const [polski, ascii] of Object.entries(mapowanieMiesiecy)) {
          nazwaMiesiaca = nazwaMiesiaca.replace(polski, ascii);
        }
        return nazwaMiesiaca;
      }
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape' });
      
      // Konwertuj nazwę miesiąca na ASCII
      const miesiacNazwa = new Date(raport.miesiac + '-01').toLocaleDateString('pl-PL', { 
        year: 'numeric', 
        month: 'long' 
      });
      const miesiacNazwaASCII = konwertujNazweMiesiaca(konwertujPolskieZnaki(miesiacNazwa));
      
      doc.setFontSize(18);
      doc.text(`Raport miesieczny - ${miesiacNazwaASCII}`, 14, 18);
      doc.setFontSize(12);
      doc.text(`Liczba wszystkich wizyt w tym miesiacu: ${raport.ilosc_wizyt_miesiac}`, 14, 30);
      doc.text(`Liczba wszystkich wizyt od poczatku roku: ${raport.ilosc_wizyt_rok}`, 14, 38);
      
      // Przygotuj dane do tabeli z konwersją polskich znaków
      const columns = [
        { header: 'Data', dataKey: 'data' },
        { header: 'Chory', dataKey: 'chory_nazwa' },
        { header: 'Szafarz', dataKey: 'szafarz' },
        { header: 'Status', dataKey: 'status' }
      ];
      
      const rows = (raport.odwiedziny || []).map(w => ({
        data: w.data,
        chory_nazwa: konwertujPolskieZnaki(w.chory_nazwa),
        szafarz: konwertujPolskieZnaki(w.szafarz),
        status: konwertujStatus(w.status)
      }));
      
      if (rows.length > 0) {
        doc.autoTable({
          columns,
          body: rows,
          startY: 45,
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
          tableWidth: 'auto',
          theme: 'grid',
          headStyles: { fillColor: [76, 175, 80] },
        });
      } else {
        doc.text('Brak wizyt w tym miesiacu.', 14, 50);
      }
      
      doc.save(`raport_miesieczny_${raport.miesiac}.pdf`);
    };

    document.addEventListener('DOMContentLoaded', function() {
      const backupBtn = document.getElementById('backupBtn');
      if (backupBtn) {
        backupBtn.addEventListener('click', async function() {
          backupBtn.disabled = true;
          backupBtn.textContent = 'Trwa tworzenie kopii...';
          try {
            const resp = await fetch('backup.php');
            const wynik = await resp.json();
            if (wynik.success) {
              alert('Kopia zapasowa wykonana!\nPliki: ' + wynik.files.join(', '));
            } else {
              alert('Błąd podczas backupu: ' + (wynik.error || 'Nieznany błąd.'));
            }
          } catch (e) {
            alert('Błąd połączenia lub serwera.');
          }
          backupBtn.disabled = false;
          backupBtn.textContent = 'Wykonaj kopię zapasową';
        });
      }
    });
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
</head>
<body>
  <div class="header-container">
    <h1 class="center-title">Grafik odwiedzin chorych</h1>
    <a href="logout.php" class="logout-button">Wyloguj</a>
  </div>
  <div class="tabs">
    <button class="tab-button active" data-tab="kalendarz">📅 Kalendarz</button>
    <button class="tab-button" data-tab="chorzy">🧑‍⚕️ Dane chorych</button>
    <button class="tab-button" data-tab="szafarze">🙋‍♂️ Dane szafarzy</button>
    <button class="tab-button" data-tab="raporty">📊 Raporty</button>
  </div>

  <!-- Zakładka Kalendarz -->
  <div id="kalendarz" class="tab-content active">
    <div class="chorzy-przyciski" id="kalendarz-buttons"></div>
    <table id="tabelaKalendarz" style="border:0 !important; outline:0 !important; box-shadow:none !important; border-radius:0 !important;">
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Nazwa</th>
          <th scope="col">Osoba Główna</th>
          <th scope="col">Pomocnik</th>
          <th scope="col">Uwagi</th>
          <th scope="col">Akcje</th>
        </tr>
      </thead>
      <tbody id="tabelaKalendarzBody">
        <!-- Tutaj będą generowane wiersze kalendarza -->
      </tbody>
    </table>
  </div>

  <!-- Zakładka Dane chorych -->
  <div id="chorzy" class="tab-content">
    <div class="chorzy-przyciski">
      <button class="uni-btn" onclick="drukujListeChorych()">Drukuj</button>
      <button class="uni-btn" onclick="dodajWierszChorych()">Dodaj chorego</button>
    </div>
    <table id="tabelaChorych" border="1">
      <thead>
        <tr>
          <th scope="col">Imię i nazwisko</th>
          <th scope="col">Adres</th>
          <th scope="col">Telefon</th>
          <th scope="col">Uwagi</th>
          <th scope="col">Aktualne</th>
          <th scope="col">Akcje</th>
        </tr>
      </thead>
      <tbody id="tabelaChorychBody">
        <!-- Tutaj będą generowane wiersze chorych -->
      </tbody>
    </table>
  </div>

  <!-- Zakładka Dane szafarzy -->
  <div id="szafarze" class="tab-content">
    <div class="chorzy-przyciski">
      <button class="uni-btn" onclick="drukujListeSzafarzy()">Drukuj</button>
      <button class="uni-btn" onclick="dodajWierszSzafarzy()">Dodaj szafarza</button>
    </div>
    <table id="tabelaSzafarzy" border="1">
      <thead>
        <tr>
          <th scope="col">Imię i nazwisko</th>
          <th scope="col">Telefon</th>
          <th scope="col">Email</th>
          <th scope="col">Uwagi</th>
          <th scope="col">Akcje</th>
        </tr>
      </thead>
      <tbody id="tabelaSzafarzyBody">
        <!-- Tutaj będą generowane wiersze szafarzy -->
      </tbody>
    </table>
  </div>

  <!-- Zakładka Raporty -->
  <div id="raporty" class="tab-content">
    <div class="raporty-row">
      <select id="wybierzMiesiac">
        <option value="2025-01">Styczeń 2025</option>
        <option value="2025-02">Luty 2025</option>
        <option value="2025-03">Marzec 2025</option>
        <option value="2025-04">Kwiecień 2025</option>
        <option value="2025-05">Maj 2025</option>
        <option value="2025-06" selected>Czerwiec 2025</option>
        <option value="2025-07">Lipiec 2025</option>
        <option value="2025-08">Sierpień 2025</option>
        <option value="2025-09">Wrzesień 2025</option>
        <option value="2025-10">Październik 2025</option>
        <option value="2025-11">Listopad 2025</option>
        <option value="2025-12">Grudzień 2025</option>
      </select>
      <div></div>
    </div>
    <div class="raporty-przyciski">
      <button class="uni-btn" onclick="generujRaportMiesieczny()">Generuj raport</button>
      <button class="uni-btn" onclick="drukujRaportMiesieczny()">Drukuj raport</button>
      <button class="uni-btn" onclick="eksportujRaportPDF()">Eksportuj do PDF</button>
      <button class="uni-btn" id="backupBtn">Wykonaj kopię zapasową</button>
    </div>
    <div id="raportContainer">
      <!-- Tutaj będzie wyświetlany raport -->
    </div>
  </div>

  <!-- MODAL: Oznaczanie odwiedzonych chorych -->
  <div id="modalOdwiedziny" class="modal" style="display:none;">
    <div class="modal-content">
      <span class="close" onclick="zamknijModalOdwiedziny()">&times;</span>
      <h3>Oznacz odwiedzonych chorych</h3>
      <form id="formOdwiedziny">
        <div id="listaChorychModal"></div>
        <button type="submit" class="uni-btn">Zapisz</button>
      </form>
    </div>
  </div>

</body>
</html> 
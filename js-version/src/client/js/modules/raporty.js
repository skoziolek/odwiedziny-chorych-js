// Moduł zarządzania raportami
import { Utils } from './utils.js';

export class RaportyManager {
  constructor(authManager) {
    this.utils = new Utils();
    this.authManager = authManager;
    this.currentRaport = null;
  }

  async init() {
    try {
      this.setupEventListeners();
      console.log('Moduł raportów zainicjalizowany');
    } catch (error) {
      console.error('Błąd inicjalizacji raportów:', error);
      this.utils.showError('Błąd inicjalizacji raportów');
    }
  }

  setupEventListeners() {
    // Obsługa przycisków raportów
    const generujBtn = document.getElementById('generujRaportBtn');
    const drukujBtn = document.getElementById('drukujRaportBtn');
    const eksportujBtn = document.getElementById('eksportujPDFBtn');
    const backupBtn = document.getElementById('backupBtn');

    if (generujBtn) {
      generujBtn.addEventListener('click', () => this.generateRaport());
    }

    if (drukujBtn) {
      drukujBtn.addEventListener('click', () => this.printRaport());
    }

    if (eksportujBtn) {
      eksportujBtn.addEventListener('click', () => this.exportToPDF());
    }

    if (backupBtn) {
      backupBtn.addEventListener('click', () => this.createBackup());
    }
  }

  async generateRaport() {
    try {
      const miesiac = document.getElementById('wybierzMiesiac').value;
      
      const response = await this.authManager.fetchWithAuth('/historia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'pobierz_raport_miesieczny',
          data: { miesiac }
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.currentRaport = result.data;
        this.displayRaport(this.currentRaport);
        this.utils.showSuccess('Raport wygenerowany pomyślnie');
      } else {
        throw new Error('Błąd generowania raportu');
      }
    } catch (error) {
      console.error('Błąd generowania raportu:', error);
      this.utils.showError('Błąd generowania raportu: ' + error.message);
    }
  }

  displayRaport(raport) {
    const container = document.getElementById('raportContainer');
    if (!container) return;

    const { miesiac, kalendarz, historia, statystyki } = raport;

    let html = `
      <div class="raport-content">
        <h2>Raport miesięczny - ${this.formatMonthName(miesiac)}</h2>
        
        <div class="raport-stats">
          <h3>Statystyki</h3>
          <ul>
            <li>Liczba odwiedzin w miesiącu: <strong>${statystyki.lacznaLiczbaOdwiedzin || 0}</strong></li>
            <li>Odwiedzeni chorzy w miesiącu: <strong>${statystyki.odwiedzeniChorzyMiesiac || 0}</strong></li>
            <li>Łączna liczba chorych (od początku roku): <strong>${statystyki.odwiedzeniChorzy || 0}</strong></li>
            <li>Szafarze: <strong>${statystyki.szafarze ? statystyki.szafarze.join(', ') : 'Brak'}</strong></li>
          </ul>
        </div>

        <div class="raport-kalendarz">
          <h3>Kalendarz odwiedzin</h3>
          <table class="raport-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Osoba Główna</th>
                <th>Pomocnik</th>
                <th>Uwagi</th>
                <th>Odwiedzeni chorzy</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Dodaj wiersze kalendarza
    if (statystyki.daty && statystyki.daty.length > 0) {
      statystyki.daty.forEach(data => {
        const dane = kalendarz[data] || {};
        const odwiedziny = historia.find(h => h.data === data);
        
        html += `
          <tr>
            <td>${this.utils.formatDate(new Date(data))}</td>
            <td>${dane.osobaGlowna || ''}</td>
            <td>${dane.pomocnik || ''}</td>
            <td>${dane.uwagi || ''}</td>
            <td>${odwiedziny ? (odwiedziny.chorzy ? odwiedziny.chorzy.join(', ') : '') : ''}</td>
          </tr>
        `;
      });
    } else {
      html += '<tr><td colspan="5">Brak danych dla tego miesiąca</td></tr>';
    }

    html += `
            </tbody>
          </table>
        </div>

        <div class="raport-historia">
          <h3>Historia odwiedzin</h3>
    `;

    if (historia && historia.length > 0) {
      html += '<table class="raport-table"><thead><tr><th>Data</th><th>Odwiedzeni chorzy</th><th>Uwagi</th></tr></thead><tbody>';
      
      historia.forEach(odwiedzina => {
        html += `
          <tr>
            <td>${this.utils.formatDate(new Date(odwiedzina.data))}</td>
            <td>${odwiedzina.chorzy ? odwiedzina.chorzy.join(', ') : ''}</td>
            <td>${odwiedzina.uwagi || ''}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table>';
    } else {
      html += '<p>Brak historii odwiedzin dla tego miesiąca</p>';
    }

    html += '</div></div>';

    container.innerHTML = html;
    
    // Dodaj style wyśrodkowania dla wydruku do tabel raportu
    this.addPrintStylesToRaportTables();
  }

  formatMonthName(miesiac) {
    const [year, month] = miesiac.split('-');
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  printRaport() {
    if (!this.currentRaport) {
      this.utils.showError('Najpierw wygeneruj raport');
      return;
    }

    this.utils.printContent('raportContainer');
  }

  addPrintStylesToRaportTables() {
    // Dodaj style wyśrodkowania dla wydruku do wszystkich tabel raportu
    const tables = document.querySelectorAll('.raport-table');
    tables.forEach(table => {
      // Wyśrodkuj nagłówki
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        header.style.setProperty('text-align', 'center', 'important');
        header.style.setProperty('vertical-align', 'middle', 'important');
      });
      
      // Wyśrodkuj komórki z danymi
      const cells = table.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.setProperty('text-align', 'center', 'important');
        cell.style.setProperty('vertical-align', 'middle', 'important');
      });
    });
  }

  exportToPDF() {
    if (!this.currentRaport) {
      this.utils.showError('Najpierw wygeneruj raport');
      return;
    }

    const container = document.getElementById('raportContainer');
    if (!container) return;

    // Użyj jsPDF do eksportu
    if (typeof window.jspdf === 'undefined') {
      this.utils.showError('Biblioteka jsPDF nie jest załadowana');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Tytuł
    doc.setFontSize(16);
    doc.text(`Raport miesięczny - ${this.formatMonthName(this.currentRaport.miesiac)}`, 20, 20);

    // Statystyki
    doc.setFontSize(12);
    let y = 40;
    doc.text('Statystyki:', 20, y);
    y += 10;
    doc.text(`Liczba odwiedzin w miesiacu: ${this.currentRaport.statystyki.lacznaLiczbaOdwiedzin || 0}`, 20, y);
    y += 10;
    doc.text(`Odwiedzeni chorzy w miesiacu: ${this.currentRaport.statystyki.odwiedzeniChorzyMiesiac || 0}`, 20, y);
    y += 10;
    doc.text(`Laczna liczba chorych (od poczatku roku): ${this.currentRaport.statystyki.odwiedzeniChorzy || 0}`, 20, y);
    y += 10;
    doc.text(`Szafarze: ${this.currentRaport.statystyki.szafarze ? this.currentRaport.statystyki.szafarze.join(', ') : 'Brak'}`, 20, y);

    // Tabela kalendarza
    y += 20;
    doc.text('Kalendarz odwiedzin:', 20, y);
    y += 10;

    const tableData = [];
    if (this.currentRaport.statystyki.daty && this.currentRaport.statystyki.daty.length > 0) {
      this.currentRaport.statystyki.daty.forEach(data => {
        const dane = this.currentRaport.kalendarz[data] || {};
        const odwiedziny = this.currentRaport.historia.find(h => h.data === data);
        
        tableData.push([
          this.utils.formatDate(new Date(data)),
          dane.osobaGlowna || '',
          dane.pomocnik || '',
          dane.uwagi || '',
          odwiedziny ? (odwiedziny.chorzy ? odwiedziny.chorzy.join(', ') : '') : ''
        ]);
      });
    }

    if (tableData.length > 0) {
      doc.autoTable({
        head: [['Data', 'Osoba Główna', 'Pomocnik', 'Uwagi', 'Odwiedzeni chorzy']],
        body: tableData,
        startY: y,
        margin: { left: 20, right: 20 }
      });
    }

    // Zapisz PDF
    doc.save(`raport_${this.currentRaport.miesiac}.pdf`);
    this.utils.showSuccess('Raport wyeksportowany do PDF');
  }

  async createBackup() {
    try {
      const confirmed = await this.utils.confirm('Czy na pewno chcesz utworzyć kopię zapasową?');
      if (!confirmed) return;

      // Pobierz wszystkie dane
      const [chorzy, szafarze, kalendarz, historia] = await Promise.all([
        this.authManager.fetchWithAuth('/api/chorzy').then(r => r.json()),
        this.authManager.fetchWithAuth('/api/szafarze').then(r => r.json()),
        this.authManager.fetchWithAuth('/api/kalendarz').then(r => r.json()),
        this.authManager.fetchWithAuth('/historia').then(r => r.json())
      ]);

      // Utwórz obiekt kopii zapasowej
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.2.0',
        data: {
          chorzy,
          szafarze,
          kalendarz,
          historia
        }
      };

      // Pobierz plik
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.utils.showSuccess('Kopia zapasowa została utworzona');
    } catch (error) {
      console.error('Błąd tworzenia kopii zapasowej:', error);
      this.utils.showError('Błąd tworzenia kopii zapasowej: ' + error.message);
    }
  }

  // Pobierz raport dla określonego miesiąca
  async getRaportForMonth(miesiac) {
    try {
      const response = await this.authManager.fetchWithAuth('/historia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'pobierz_raport_miesieczny',
          data: { miesiac }
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      } else {
        throw new Error('Błąd pobierania raportu');
      }
    } catch (error) {
      console.error('Błąd pobierania raportu:', error);
      throw error;
    }
  }

  // Pobierz statystyki dla określonego okresu
  async getStatsForPeriod(startDate, endDate) {
    try {
      // Implementacja pobierania statystyk dla okresu
      // Można rozszerzyć API o endpoint do statystyk
      return {
        startDate,
        endDate,
        totalVisits: 0,
        totalPatients: 0,
        activeMinisters: []
      };
    } catch (error) {
      console.error('Błąd pobierania statystyk:', error);
      throw error;
    }
  }
}

// Eksportuj klasę - instancja będzie utworzona w main.js

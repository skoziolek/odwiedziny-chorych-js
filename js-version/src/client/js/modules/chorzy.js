// Moduł zarządzania chorymi
import { Utils } from './utils.js';

export class ChorzyManager {
  constructor(authManager) {
    this.utils = new Utils();
    this.authManager = authManager;
    this.chorzyData = [];
    this.debouncedSave = this.utils.debounce(() => this.saveChorzy(), 1000, 'chorzy');
  }

  async init() {
    try {
      await this.loadChorzy();
      this.renderChorzy();
      this.setupEventListeners();
    } catch (error) {
      console.error('Błąd inicjalizacji chorych:', error);
      this.utils.showError('Błąd inicjalizacji chorych');
    }
  }

  async loadChorzy() {
    try {
      const response = await this.authManager.fetchWithAuth('/api/chorzy');
      
      if (!response.ok) {
        console.error('Błąd API chorych:', response.status, response.statusText);
        this.chorzyData = [];
        return;
      }

      if (response.ok) {
        this.chorzyData = await response.json();
        
        // Domyślnie status: '' jeśli nie ustawiony
        this.chorzyData.forEach(chory => {
          if (!('status' in chory)) chory.status = '';
        });

        // Sortowanie: najpierw TAK, potem puste, potem NIE, każda grupa alfabetycznie
        this.chorzyData = [
          ...this.chorzyData.filter(c => c.status === 'TAK').sort((a, b) => (a.imieNazwisko || '').localeCompare(b.imieNazwisko || '')),
          ...this.chorzyData.filter(c => c.status === '').sort((a, b) => (a.imieNazwisko || '').localeCompare(b.imieNazwisko || '')),
          ...this.chorzyData.filter(c => c.status === 'NIE').sort((a, b) => (a.imieNazwisko || '').localeCompare(b.imieNazwisko || ''))
        ];
      } else {
        this.chorzyData = [];
      }
    } catch (error) {
      console.error('Błąd ładowania chorych:', error);
      this.chorzyData = [];
    }
  }

  renderChorzy() {
    const tbody = document.getElementById('tabelaChorychBody');
    if (!tbody) {
      console.error('Nie znaleziono tbody tabeli chorych');
      return;
    }

    tbody.innerHTML = '';

    if (this.chorzyData.length === 0) {
      this.addChoryRow();
    } else {
      
      // Sortuj dane: najpierw TAK (alfabetycznie), potem reszta (alfabetycznie)
      const sortedData = [...this.chorzyData].sort((a, b) => {
        // Najpierw sortuj po statusie (TAK na górze)
        if (a.status === 'TAK' && b.status !== 'TAK') return -1;
        if (a.status !== 'TAK' && b.status === 'TAK') return 1;
        
        // Jeśli statusy są takie same, sortuj alfabetycznie po imieniu i nazwisku
        const nameA = (a.imieNazwisko || '').toLowerCase();
        const nameB = (b.imieNazwisko || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      
      sortedData.forEach((chory, index) => {
        console.log(`Renderowanie chorego ${index}:`, chory);
        try {
          const row = this.createChoryRow(chory, index);
          console.log(`Wiersz ${index} utworzony, dodaję do tabeli`);
          tbody.appendChild(row);
          console.log(`Wiersz ${index} dodany do tabeli`);
        } catch (error) {
          console.error(`Błąd przy tworzeniu wiersza ${index}:`, error);
        }
      });
    }
    
    // Dodaj style wyśrodkowania dla wydruku
    this.addPrintStylesToTable('tabelaChorych');
    console.log('Renderowanie zakończone');
  }

  createChoryRow(chory, index) {
    console.log('Tworzenie wiersza chorego:', chory, 'indeks:', index);
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td contenteditable="true" data-field="imieNazwisko">${chory.imieNazwisko || ''}</td>
      <td contenteditable="true" data-field="adres">${chory.adres || ''}</td>
      <td contenteditable="true" data-field="telefon">${chory.telefon || ''}</td>
      <td contenteditable="true" data-field="uwagi">${chory.uwagi || ''}</td>
      <td>
        <select class="status-select" data-field="status">
          <option value="" ${!chory.status ? 'selected' : ''}></option>
          <option value="TAK" ${chory.status === 'TAK' ? 'selected' : ''}>TAK</option>
          <option value="NIE" ${chory.status === 'NIE' ? 'selected' : ''}>NIE</option>
        </select>
      </td>
      <td>
        <button class="btn-small delete-chory-btn" data-index="${index}">Usuń</button>
      </td>
    `;
    

    // Dodaj obsługę zmian
    const editableCells = row.querySelectorAll('[contenteditable="true"]');
    const statusSelect = row.querySelector('.status-select');
    
    [...editableCells, statusSelect].forEach(element => {
      element.addEventListener('input', () => this.debouncedSave());
      element.addEventListener('change', () => this.debouncedSave());
    });

    // Dodaj obsługę zmiany statusu dla kolorowania wiersza
    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        // Synchronizuj dane z DOM przed zmianą statusu
        this.syncDataFromDOM();
        
        // Zaktualizuj status w danych
        chory.status = statusSelect.value;
        
        // Zaktualizuj kolorowanie wiersza
        if (chory.status === 'TAK') row.className = 'chory-tak';
        else if (chory.status === 'NIE') row.className = 'chory-nie';
        else row.className = '';
        
        // Przerenderuj tabelę po zmianie statusu (dla automatycznego sortowania)
        this.renderChorzy();
      });
    }

    // Dodaj obsługę przycisku usuwania
    const deleteBtn = row.querySelector('.delete-chory-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (event) => {
        const buttonIndex = parseInt(event.target.getAttribute('data-index'));
        this.deleteChory(buttonIndex);
      });
    }

    // Ustaw klasę CSS na podstawie statusu (po ustawieniu innerHTML)
    if (chory.status === 'TAK') row.className = 'chory-tak';
    else if (chory.status === 'NIE') row.className = 'chory-nie';
    else row.className = '';

    return row;
  }

  addChoryRow() {
    const tbody = document.getElementById('tabelaChorychBody');
    const newChory = {
      imieNazwisko: '',
      adres: '',
      telefon: '',
      uwagi: '',
      aktualne: true,
      status: ''
    };

    this.chorzyData.push(newChory);
    const row = this.createChoryRow(newChory, this.chorzyData.length - 1);
    tbody.appendChild(row);
    
    // Zapisz zmiany po dodaniu nowego chorego
    this.debouncedSave();
  }

  syncDataFromDOM() {
    const tbody = document.getElementById('tabelaChorychBody');
    const rows = tbody.querySelectorAll('tr');
    const newData = [];

    rows.forEach((row, index) => {
      const chory = {};

      // Pobierz dane z edytowalnych komórek
      const editableCells = row.querySelectorAll('[contenteditable="true"]');
      editableCells.forEach(cell => {
        const field = cell.dataset.field;
        let value = this.utils.sanitizeText(cell.textContent);
        chory[field] = value;
      });

      // Pobierz status z selecta
      const statusSelect = row.querySelector('.status-select');
      if (statusSelect) {
        chory.status = statusSelect.value;
      }

      // Dodaj tylko jeśli ma imię i nazwisko
      if (chory.imieNazwisko && chory.imieNazwisko.trim()) {
        chory.aktualne = true;
        newData.push(chory);
      }
    });

    this.chorzyData = newData;
  }

  async saveChorzy() {
    try {
      // Najpierw zsynchronizuj dane z DOM, aby zapisać bieżące edycje (np. uwagi)
      this.syncDataFromDOM();

      // Użyj zsynchronizowanych danych
      const dataToSave = this.chorzyData.filter(chory => 
        chory.imieNazwisko && chory.imieNazwisko.trim()
      );

      console.log('Zapisywanie chorych:', dataToSave);

      const response = await this.authManager.fetchWithAuth('/api/chorzy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        this.chorzyData = dataToSave;
        this.utils.showSuccess('Dane chorych zapisane');
      } else {
        throw new Error('Błąd zapisu chorych');
      }
    } catch (error) {
      console.error('Błąd zapisywania chorych:', error);
      this.utils.showError('Błąd zapisywania chorych');
    }
  }

  async deleteChory(index) {
    const confirmed = await this.utils.confirm('Czy na pewno chcesz usunąć tego chorego?');
    if (!confirmed) return;

    // Synchronizuj dane z DOM przed usunięciem
    this.syncDataFromDOM();

    // Sprawdź czy indeks jest prawidłowy
    if (index >= this.chorzyData.length) {
      console.error('Błędny indeks:', index, 'dla tablicy o długości:', this.chorzyData.length);
      return;
    }

    // Usuń chorego z tablicy
    this.chorzyData.splice(index, 1)[0];
    
    // Zapisz zmiany
    await this.saveChorzy();
    
    // Przerenderuj tabelę
    this.renderChorzy();
  }

  setupEventListeners() {
    // Obsługa przycisków
    const dodajBtn = document.getElementById('dodajChoregoBtn');
    const drukujBtn = document.getElementById('drukujChorzyBtn');

    if (dodajBtn) {
      dodajBtn.addEventListener('click', () => this.addChoryRow());
    }

    if (drukujBtn) {
      drukujBtn.addEventListener('click', () => this.printChorzy());
    }
  }

  printChorzy() {
    this.utils.printContent('tabelaChorych');
  }

  addPrintStylesToTable(tableId) {
    // Dodaj style wyśrodkowania dla wydruku do tabeli
    const table = document.getElementById(tableId);
    if (!table) return;
    
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
      
      // Wyśrodkuj elementy wewnątrz komórek
      const elements = cell.querySelectorAll('input, button, select, div, span');
      elements.forEach(element => {
        element.style.setProperty('text-align', 'center', 'important');
        element.style.setProperty('margin', '0 auto', 'important');
        element.style.setProperty('display', 'block', 'important');
      });
    });
  }

  // Funkcja do aktualizacji koloru wiersza (używana przez inne moduły)
  updateRowColor(row, status) {
    row.className = '';
    if (status === 'TAK') row.className = 'chory-tak';
    else if (status === 'NIE') row.className = 'chory-nie';
  }

  // Pobierz listę chorych (używane przez inne moduły)
  getChorzyList() {
    return this.chorzyData.filter(chory => chory.imieNazwisko && chory.imieNazwisko.trim());
  }

  // Pobierz chorych z określonym statusem
  getChorzyByStatus(status) {
    return this.chorzyData.filter(chory => chory.status === status);
  }

  // Pobierz wszystkich aktywnych chorych
  getActiveChorzy() {
    return this.chorzyData.filter(chory => chory.aktualne && chory.imieNazwisko && chory.imieNazwisko.trim());
  }
}

// Eksportuj klasę - instancja będzie utworzona w main.js

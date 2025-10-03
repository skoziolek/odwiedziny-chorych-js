// Moduł zarządzania szafarzami
import { Utils } from './utils.js';

export class SzafarzeManager {
  constructor(authManager) {
    this.utils = new Utils();
    this.authManager = authManager;
    this.szafarzeData = [];
    this.debouncedSave = this.utils.debounce(() => this.saveSzafarze(), 1000, 'szafarze');
  }

  async init() {
    try {
      await this.loadSzafarze();
      this.renderSzafarze();
      this.setupEventListeners();
      console.log('Moduł szafarzy zainicjalizowany');
    } catch (error) {
      console.error('Błąd inicjalizacji szafarzy:', error);
      this.utils.showError('Błąd inicjalizacji szafarzy');
    }
  }

  async loadSzafarze() {
    try {
      const response = await this.authManager.fetchWithAuth('/api/szafarze');

      if (response.ok) {
        this.szafarzeData = await response.json();
        // Usunięto sortowanie alfabetyczne - szafarze są wyświetlani w kolejności dodawania
      } else {
        this.szafarzeData = [];
      }
    } catch (error) {
      console.error('Błąd ładowania szafarzy:', error);
      this.szafarzeData = [];
    }
  }

  renderSzafarze() {
    const tbody = document.getElementById('tabelaSzafarzyBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.szafarzeData.length === 0) {
      this.addSzafarzRow();
    } else {
      this.szafarzeData.forEach((szafarz, index) => {
        const row = this.createSzafarzRow(szafarz, index);
        tbody.appendChild(row);
      });
    }
    
    // Dodaj style wyśrodkowania dla wydruku
    this.addPrintStylesToTable('tabelaSzafarzy');
  }

  createSzafarzRow(szafarz, index) {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td contenteditable="true" data-field="imieNazwisko">${szafarz.imieNazwisko || ''}</td>
      <td contenteditable="true" data-field="telefon">${szafarz.telefon || ''}</td>
      <td contenteditable="true" data-field="email">${szafarz.email || ''}</td>
      <td contenteditable="true" data-field="uwagi">${szafarz.uwagi || ''}</td>
      <td>
        <button class="btn-small delete-szafarz-btn" data-index="${index}">Usuń</button>
      </td>
    `;

    // Dodaj obsługę zmian
    const editableCells = row.querySelectorAll('[contenteditable="true"]');
    
    editableCells.forEach(element => {
      element.addEventListener('input', () => this.debouncedSave());
    });

    // Dodaj obsługę przycisku usuwania
    const deleteBtn = row.querySelector('.delete-szafarz-btn');
    deleteBtn.addEventListener('click', () => this.deleteSzafarz(index));

    return row;
  }

  addSzafarzRow() {
    const tbody = document.getElementById('tabelaSzafarzyBody');
    const newSzafarz = {
      imieNazwisko: '',
      telefon: '',
      email: '',
      uwagi: ''
    };

    this.szafarzeData.push(newSzafarz);
    const row = this.createSzafarzRow(newSzafarz, this.szafarzeData.length - 1);
    tbody.appendChild(row);
    
    // Zapisz zmiany po dodaniu nowego szafarza
    this.debouncedSave();
  }

  syncDataFromDOM() {
    const tbody = document.getElementById('tabelaSzafarzyBody');
    const rows = tbody.querySelectorAll('tr');
    const newData = [];

    rows.forEach((row, index) => {
      const szafarz = {};

      // Pobierz dane z edytowalnych komórek
      const editableCells = row.querySelectorAll('[contenteditable="true"]');
      editableCells.forEach(cell => {
        const field = cell.dataset.field;
        let value = this.utils.sanitizeText(cell.textContent);
        szafarz[field] = value;
      });

      // Dodaj tylko jeśli ma imię i nazwisko
      if (szafarz.imieNazwisko && szafarz.imieNazwisko.trim()) {
        newData.push(szafarz);
      }
    });

    this.szafarzeData = newData;
  }

  async saveSzafarze() {
    try {
      // Synchronizuj dane z DOM przed zapisem
      this.syncDataFromDOM();
      
      // Użyj danych z this.szafarzeData zamiast pobierać z DOM
      const dataToSave = this.szafarzeData.filter(szafarz => 
        szafarz.imieNazwisko && szafarz.imieNazwisko.trim()
      );

      const response = await this.authManager.fetchWithAuth('/api/szafarze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        this.szafarzeData = dataToSave;
        this.utils.showSuccess('Dane szafarzy zapisane');
      } else {
        const errorText = await response.text();
        console.error('Błąd zapisu szafarzy:', response.status, errorText);
        throw new Error('Błąd zapisu szafarzy');
      }
    } catch (error) {
      console.error('Błąd zapisywania szafarzy:', error);
      this.utils.showError('Błąd zapisywania szafarzy');
    }
  }

  async deleteSzafarz(index) {
    const confirmed = await this.utils.confirm('Czy na pewno chcesz usunąć tego szafarza?');
    if (!confirmed) return;

    // Najpierw zsynchronizuj dane z DOM do this.szafarzeData
    this.syncDataFromDOM();
    
    // Usuń szafarza z tablicy
    this.szafarzeData.splice(index, 1);
    
    // Zapisz zmiany
    await this.saveSzafarze();
    
    // Przerenderuj tabelę
    this.renderSzafarze();
  }

  setupEventListeners() {
    // Obsługa przycisków
    const dodajBtn = document.getElementById('dodajSzafarzaBtn');
    const drukujBtn = document.getElementById('drukujSzafarzeBtn');

    if (dodajBtn) {
      dodajBtn.addEventListener('click', () => this.addSzafarzRow());
    }

    if (drukujBtn) {
      drukujBtn.addEventListener('click', () => this.printSzafarze());
    }
  }

  printSzafarze() {
    this.utils.printContent('tabelaSzafarzy');
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

  // Pobierz listę szafarzy (używane przez inne moduły)
  getSzafarzeList() {
    return this.szafarzeData.filter(szafarz => szafarz.imieNazwisko && szafarz.imieNazwisko.trim());
  }

  // Pobierz imiona i nazwiska szafarzy
  getSzafarzeNames() {
    return this.getSzafarzeList().map(szafarz => szafarz.imieNazwisko);
  }

  // Pobierz szafarza po imieniu i nazwisku
  getSzafarzByName(name) {
    return this.szafarzeData.find(szafarz => szafarz.imieNazwisko === name);
  }

  // Sprawdź czy szafarz istnieje
  hasSzafarz(name) {
    return this.szafarzeData.some(szafarz => szafarz.imieNazwisko === name);
  }

  // Dodaj nowego szafarza programowo
  async addSzafarz(szafarzData) {
    const newSzafarz = {
      imieNazwisko: szafarzData.imieNazwisko || '',
      telefon: szafarzData.telefon || '',
      email: szafarzData.email || '',
      uwagi: szafarzData.uwagi || ''
    };

    this.szafarzeData.push(newSzafarz);
    await this.saveSzafarze();
    this.renderSzafarze();
  }

  // Aktualizuj szafarza programowo
  async updateSzafarz(name, updateData) {
    const index = this.szafarzeData.findIndex(szafarz => szafarz.imieNazwisko === name);
    if (index !== -1) {
      this.szafarzeData[index] = { ...this.szafarzeData[index], ...updateData };
      await this.saveSzafarze();
      this.renderSzafarze();
    }
  }

  // Usuń szafarza programowo
  async removeSzafarz(name) {
    const index = this.szafarzeData.findIndex(szafarz => szafarz.imieNazwisko === name);
    if (index !== -1) {
      this.szafarzeData.splice(index, 1);
      await this.saveSzafarze();
      this.renderSzafarze();
    }
  }
}

// Eksportuj klasę - instancja będzie utworzona w main.js

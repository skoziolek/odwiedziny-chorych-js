// Moduł zarządzania kalendarzem
import { Utils } from './utils.js';

export class KalendarzManager {
  constructor(authManager) {
    this.utils = new Utils();
    this.authManager = authManager;
    this.currentYear = new Date().getFullYear().toString();
    this.kalendarzData = {};
    this.szafarze = [];
    this.debouncedSave = this.utils.debounce(() => this.saveKalendarz(), 1000, 'kalendarz');
  }

  async init() {
    try {
      // Inicjalizuj opcje roku
      this.initializeYearOptions();
      
      // Pobierz dane szafarzy
      await this.loadSzafarze();
      
      // Pobierz dane kalendarza
      await this.loadKalendarz();
      
      // Wygeneruj kalendarz
      await this.generateKalendarz();
      
      // Ustaw obsługę zdarzeń
      this.setupEventListeners();
      
      // Ustaw nasłuchiwanie na zmiany szafarzy
      this.setupSzafarzeListener();
      
    } catch (error) {
      console.error('Błąd inicjalizacji kalendarza:', error);
      this.utils.showError('Błąd inicjalizacji kalendarza');
    }
  }

  initializeYearOptions() {
    const rokSelect = document.getElementById('wybierzRok');
    if (!rokSelect) return;

    // Wyczyść istniejące opcje
    rokSelect.innerHTML = '';

    // Generuj opcje dla aktualnego roku i 2 lata w przód
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year <= currentYear + 2; year++) {
      const option = document.createElement('option');
      option.value = year.toString();
      option.textContent = year.toString();
      if (year === currentYear) {
        option.selected = true;
      }
      rokSelect.appendChild(option);
    }

    // Ustaw nasłuchiwanie na zmiany roku
    rokSelect.addEventListener('change', async (e) => {
      this.currentYear = e.target.value;
      await this.loadKalendarz();
      await this.generateKalendarz();
    });
  }

  async loadSzafarze() {
    try {
      const response = await this.authManager.fetchWithAuth('/api/szafarze');
      
      if (response.ok) {
        const data = await response.json();
        
        // Pobierz imiona szafarzy (nowa struktura: imie, nazwisko)
        this.szafarze = data.map(s => {
          // Nowa struktura z osobnymi polami imie i nazwisko
          if (s.imie) {
            return s.imie.trim();
          }
          // Stara struktura z imieNazwisko (kompatybilność wsteczna)
          if (s.imieNazwisko) {
            const parts = s.imieNazwisko.trim().split(' ');
            return parts[0];
          }
          return '';
        }).filter(Boolean);
      } else {
        this.szafarze = [];
      }
    } catch (error) {
      console.error('Błąd ładowania szafarzy:', error);
      this.szafarze = [];
    }
  }

  async loadSzafarzeData() {
    try {
      const response = await this.authManager.fetchWithAuth('/api/szafarze');
      if (response.ok) {
        return await response.json();
      } else {
        return [];
      }
    } catch (error) {
      console.error('Błąd ładowania danych szafarzy:', error);
      return [];
    }
  }

  async loadKalendarz() {
    try {
      const response = await this.authManager.fetchWithAuth(`/api/kalendarz?rok=${this.currentYear}`);
      if (response.ok) {
        this.kalendarzData = await response.json();
      } else {
        this.kalendarzData = {};
      }
    } catch (error) {
      console.error('Błąd ładowania kalendarza:', error);
      this.kalendarzData = {};
    }
  }

  async generateKalendarz() {
    const tbody = document.getElementById('tabelaKalendarzBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Generuj daty dla całego roku
    const startDate = new Date(this.currentYear, 0, 1);
    const endDate = new Date(this.currentYear, 11, 31);
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    let nextDutyDate = null;
    let nextDutyRow = null;

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const dateStr = this.utils.formatDateForAPI(date);
      const isSwieto = this.utils.isSwietoNakazane(date);
      
      // Generuj wiersze dla niedziel (0 = niedziela) LUB świąt nakazanych
      if (dayOfWeek === 0 || isSwieto) {
        const swietoName = this.utils.getSwietoName(date);
        
        const row = this.createKalendarzRow(dateStr, swietoName, isSwieto);
        tbody.appendChild(row);
        
        // Sprawdź czy to najbliższy dyżur (tylko jeśli to aktualny rok)
        if (!nextDutyDate && this.currentYear === currentYear) {
          // Porównaj tylko daty (bez godzin) - ustaw godzinę na 0:00
          const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          if (dateOnly >= todayOnly) {
            nextDutyDate = new Date(date);
            nextDutyRow = row;
          }
        }
      }
    }
    
    // Sprawdź które daty mają zapisane odwiedziny
    await this.checkVisitedDates();
    
    // Dodaj style wyśrodkowania dla nagłówków
    this.addPrintStylesToHeaders();
    
    // Przewiń do najbliższego dyżuru i podświetl wiersz
    this.scrollToNextDuty(nextDutyRow);
  }

  scrollToNextDuty(nextDutyRow) {
    if (!nextDutyRow) return;
    
    // Dodaj klasę podświetlenia
    nextDutyRow.classList.add('next-duty-row');
    
    // Przewiń do wiersza z opóźnieniem (żeby DOM się zaktualizował)
    setTimeout(() => {
      nextDutyRow.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  }

  addPrintStyles(row) {
    // Dodaj style wyśrodkowania dla wydruku do wszystkich elementów w wierszu
    const cells = row.querySelectorAll('td');
    
    cells.forEach((cell, index) => {
      // Dodaj style inline dla wydruku
      cell.style.setProperty('text-align', 'center', 'important');
      cell.style.setProperty('vertical-align', 'middle', 'important');
      
      // Dodaj style do elementów wewnątrz komórek
      const elements = cell.querySelectorAll('select, input, button, div, span');
      
      elements.forEach((element, elIndex) => {
        element.style.setProperty('text-align', 'center', 'important');
        element.style.setProperty('margin', '0 auto', 'important');
        element.style.setProperty('display', 'block', 'important');
      });
    });
  }

  addPrintStylesToHeaders() {
    // Dodaj style wyśrodkowania dla nagłówków tabeli
    const table = document.getElementById('tabelaKalendarz');
    if (!table) return;
    
    const headers = table.querySelectorAll('th');
    
    headers.forEach((header, index) => {
      header.style.setProperty('text-align', 'center', 'important');
      header.style.setProperty('vertical-align', 'middle', 'important');
    });
  }

  setupSzafarzeListener() {
    // Nasłuchuj na zmiany w szafarzach - odśwież listę co 2 sekundy
    setInterval(async () => {
      await this.refreshSzafarze();
    }, 2000);
  }

  async refreshSzafarze() {
    try {
      const response = await this.authManager.fetchWithAuth('/api/szafarze');
      if (response.ok) {
        const data = await response.json();
        const newSzafarze = data.map(s => {
          // Nowa struktura z osobnymi polami imie i nazwisko
          if (s.imie) {
            return s.imie.trim();
          }
          // Stara struktura z imieNazwisko (kompatybilność wsteczna)
          if (s.imieNazwisko) {
            const parts = s.imieNazwisko.trim().split(' ');
            return parts[0];
          }
          return '';
        }).filter(Boolean);
        
        // Sprawdź czy lista się zmieniła
        if (JSON.stringify(newSzafarze) !== JSON.stringify(this.szafarze)) {
          console.log('Lista szafarzy się zmieniła, aktualizuję...');
          this.szafarze = newSzafarze;
          await this.updateSzafarzeInSelects();
        }
      }
    } catch (error) {
      console.error('Błąd odświeżania szafarzy:', error);
    }
  }

  async updateSzafarzeInSelects() {
    // Zaktualizuj wszystkie selecty z szafarzami w kalendarzu
    const selects = document.querySelectorAll('.osoba-glowna-select, .pomocnik-select');
    selects.forEach(select => {
      const currentValue = select.value;
      const options = select.querySelectorAll('option');
      
      // Usuń wszystkie opcje oprócz pierwszej (-- Wybierz --)
      for (let i = options.length - 1; i > 0; i--) {
        options[i].remove();
      }
      
      // Dodaj nowe opcje
      this.szafarze.forEach(szafarz => {
        const option = document.createElement('option');
        option.value = szafarz;
        option.textContent = szafarz;
        select.appendChild(option);
      });
      
      // Przywróć poprzednią wartość jeśli nadal istnieje
      if (currentValue && this.szafarze.includes(currentValue)) {
        select.value = currentValue;
      }
    });
  }

  createKalendarzRow(dateStr, swietoName, isSwieto) {
    const row = document.createElement('tr');
    const data = this.kalendarzData[dateStr] || {};
    
    // Pobierz lokalną kopię szafarzy
    const szafarzeList = this.szafarze || [];
    
    // Dodaj klasę dla świąt
    if (isSwieto) {
      row.classList.add('swieto-row');
    }
    
    // Generuj opcje dla selectów
    const szafarzeOptions = szafarzeList.map(szafarz => 
      `<option value="${szafarz}" ${data.osobaGlowna === szafarz ? 'selected' : ''}>${szafarz}</option>`
    ).join('');
    
    const pomocnikOptions = szafarzeList.map(szafarz => 
      `<option value="${szafarz}" ${data.pomocnik === szafarz ? 'selected' : ''}>${szafarz}</option>`
    ).join('');
    
    row.innerHTML = `
      <td>${this.utils.formatDate(new Date(dateStr))}</td>
      <td>${swietoName}</td>
      <td>
        <select class="osoba-glowna-select">
          <option value="" ${!data.osobaGlowna ? 'selected' : ''}>-- Wybierz --</option>
          ${szafarzeOptions}
        </select>
      </td>
      <td>
        <select class="pomocnik-select">
          <option value="" ${!data.pomocnik ? 'selected' : ''}>-- Wybierz --</option>
          ${pomocnikOptions}
        </select>
      </td>
      <td contenteditable="true" class="uwagi-input">${data.uwagi || ''}</td>
      <td>
        <button class="btn-small visited-btn" data-date="${dateStr}">Zaplanowane</button>
      </td>
    `;

    // Dodaj obsługę zmian
    const selects = row.querySelectorAll('select');
    const uwagiInput = row.querySelector('.uwagi-input');
    const visitedBtn = row.querySelector('.visited-btn');
    
    // Dodaj style wyśrodkowania dla wydruku
    this.addPrintStyles(row);
    
    [...selects, uwagiInput].forEach(element => {
      element.addEventListener('change', () => this.debouncedSave());
      element.addEventListener('input', () => this.debouncedSave());
    });
    
    // Dodaj obsługę przycisku Zaplanowane
    if (visitedBtn) {
      visitedBtn.addEventListener('click', () => {
        console.log('Przycisk Zaplanowane kliknięty dla daty:', dateStr);
        this.markVisited(dateStr);
      });
    }

    return row;
  }

  async saveKalendarz() {
    try {
      const tbody = document.getElementById('tabelaKalendarzBody');
      const rows = tbody.querySelectorAll('tr');
      const dataToSave = {};

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const dateDisplay = cells[0].textContent.trim();
        if (!dateDisplay) return;

        // Konwertuj datę z formatu "17.12.2025" na "2025-12-17"
        const [day, month, year] = dateDisplay.split('.');
        const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        const [selectGlowna, selectPomocnik] = row.querySelectorAll('select');
        const uwagi = cells[4].textContent.trim();

        if (selectGlowna.value.trim() || selectPomocnik.value.trim() || uwagi) {
          dataToSave[dateKey] = {
            osobaGlowna: selectGlowna.value,
            pomocnik: selectPomocnik.value,
            uwagi: uwagi
          };
        }
      });

      const response = await this.authManager.fetchWithAuth(`/api/kalendarz?rok=${this.currentYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'zapisz_kalendarz', dane: dataToSave })
      });

      if (response.ok) {
        this.kalendarzData = dataToSave;
        this.utils.showSuccess('Kalendarz zapisany');
      } else {
        throw new Error('Błąd zapisu kalendarza');
      }
    } catch (error) {
      console.error('Błąd zapisywania kalendarza:', error);
      this.utils.showError('Błąd zapisywania kalendarza');
    }
  }

  setupEventListeners() {
    // Obsługa zmiany roku
    const rokSelect = document.getElementById('wybierzRok');
    if (rokSelect) {
      rokSelect.addEventListener('change', async (e) => {
        this.currentYear = e.target.value;
        await this.loadKalendarz();
        await this.generateKalendarz();
      });
    }

    // Dodaj przyciski do kalendarza
    this.addKalendarzButtons();
  }

  addKalendarzButtons() {
    console.log('addKalendarzButtons() wywołane');
    const buttonsContainer = document.getElementById('kalendarz-buttons');
    if (!buttonsContainer) {
      console.error('Nie znaleziono elementu kalendarz-buttons');
      return;
    }

    console.log('Dodaję przyciski do kalendarza');
    buttonsContainer.innerHTML = `
      <button class="uni-btn" id="print-btn">Drukuj</button>
      <button class="uni-btn" id="create-year-btn">Utwórz nowy rok</button>
      <button class="uni-btn" id="auto-assign-btn">Auto-przypisz szafarzy</button>
      <button class="uni-btn" id="adwent-btn">🕯️ Adwent</button>
    `;

    // Dodaj event listenery
    this.setupButtonEventListeners();
  }

  setupButtonEventListeners() {
    console.log('Ustawiam event listenery dla przycisków');
    
    // Przycisk drukowania
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        console.log('Przycisk Drukuj kliknięty');
        this.printKalendarz();
      });
    }

    // Przycisk tworzenia nowego roku
    const createYearBtn = document.getElementById('create-year-btn');
    if (createYearBtn) {
      createYearBtn.addEventListener('click', () => {
        console.log('Przycisk Utwórz nowy rok kliknięty');
        this.createNewYear();
      });
    }

    // Przycisk auto-przypisywania szafarzy
    const autoAssignBtn = document.getElementById('auto-assign-btn');
    if (autoAssignBtn) {
      autoAssignBtn.addEventListener('click', () => {
        console.log('Przycisk Auto-przypisz szafarzy kliknięty');
        if (this.autoAssignSzafarze) {
          this.autoAssignSzafarze();
        } else {
          console.error('autoAssignSzafarze nie jest dostępne');
        }
      });
    }

    // Przycisk Adwent
    const adwentBtn = document.getElementById('adwent-btn');
    if (adwentBtn) {
      adwentBtn.addEventListener('click', () => {
        console.log('Przycisk Adwent kliknięty');
        // Użyj globalnego adwentManager
        if (window.adwentManager) {
          window.adwentManager.showAdwentTab();
        } else {
          console.error('adwentManager nie jest dostępne');
        }
      });
    }
  }

  printKalendarz() {
    console.log('Drukowanie kalendarza');
    window.print();
  }

  generateTestData() {
    console.log('Generowanie danych testowych');
    this.utils.showSuccess('Funkcja generowania danych testowych będzie wkrótce dostępna');
  }

  clearTestData() {
    console.log('Czyszczenie danych testowych');
    this.utils.showSuccess('Funkcja czyszczenia danych testowych będzie wkrótce dostępna');
  }


  async markVisited(dateStr) {
    console.log('markVisited wywołane dla daty:', dateStr);
    
    try {
      // Pobierz listę chorych
      const chorzy = await this.loadChorzyList();
      console.log('Załadowano chorych:', chorzy.length);
      
      // Pobierz już odwiedzonych chorych dla tej daty
      const odwiedzeniChorzy = await this.getVisitedChorzyForDate(dateStr);
      
      // Wyświetl modal z listą chorych
      this.showVisitedModal(dateStr, chorzy, odwiedzeniChorzy);
    } catch (error) {
      console.error('Błąd w markVisited:', error);
      this.utils.showError('Błąd ładowania danych chorych');
    }
  }

  async loadChorzyList() {
    try {
      const response = await this.authManager.fetchWithAuth('/api/chorzy');
      
      if (response.ok) {
        let chorzy = await response.json();
        
        // Filtruj tylko chorych ze statusem TAK
        chorzy = chorzy.filter(chory => chory.status === 'TAK');
        
        // Sortuj alfabetycznie
        chorzy.sort((a, b) => (a.imieNazwisko || '').localeCompare(b.imieNazwisko || ''));
        
        return chorzy;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Błąd ładowania chorych:', error);
      return [];
    }
  }

  async getVisitedChorzyForDate(dateStr) {
    try {
      const response = await this.authManager.fetchWithAuth('/historia');
      if (response.ok) {
        const historia = await response.json();
        const entry = historia.find(e => e.data === dateStr);
        return entry ? entry.chorzy || [] : [];
      }
      return [];
    } catch (error) {
      console.error('Błąd ładowania odwiedzin:', error);
      return [];
    }
  }

  showVisitedModal(dateStr, chorzy, odwiedzeniChorzy = []) {
    const modal = document.getElementById('modalOdwiedziny');
    const listaChorych = document.getElementById('listaChorychModal');
    
    // Ustaw tytuł modala
    const modalTitle = modal.querySelector('h3');
    modalTitle.textContent = `Oznacz odwiedzonych chorych - ${this.utils.formatDate(new Date(dateStr))}`;
    
    // Wyczyść poprzednią zawartość
    listaChorych.innerHTML = '';
    
    // Dodaj chorych do listy
    chorzy.forEach((chory, index) => {
      if (chory.imieNazwisko && chory.imieNazwisko.trim()) {
        const choryDiv = document.createElement('div');
        choryDiv.className = 'chory-item';
        choryDiv.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          border: 1px solid #ddd;
          margin: 5px 0;
          border-radius: 4px;
          background: #f9f9f9;
        `;
        
        // Sprawdź czy chory był już odwiedzony
        const isVisited = odwiedzeniChorzy.includes(chory.imieNazwisko);
        
        choryDiv.innerHTML = `
          <label for="chory_${index}" style="flex: 1; cursor: pointer;">
            <strong>${chory.imieNazwisko}</strong>
          </label>
          <input type="checkbox" id="chory_${index}" value="${chory.imieNazwisko}" 
                 ${isVisited ? 'checked' : ''} style="margin-left: 10px;">
        `;
        
        listaChorych.appendChild(choryDiv);
      }
    });
    
    // Ustaw obsługę formularza
    const form = document.getElementById('formOdwiedziny');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.saveVisitedChorzy(dateStr);
    };
    
    // Ustaw obsługę przycisku Anuluj
    const cancelBtn = document.getElementById('cancelVisitedBtn');
    cancelBtn.onclick = () => this.closeVisitedModal();
    
    // Pokaż modal
    modal.style.display = 'block';
    
    // Obsługa zamykania przez X
    const closeBtn = document.getElementById('closeModalBtn');
    closeBtn.onclick = () => this.closeVisitedModal();
  }

  async saveVisitedChorzy(dateStr) {
    try {
      const checkboxes = document.querySelectorAll('#listaChorychModal input[type="checkbox"]:checked');
      const odwiedzeniChorzy = Array.from(checkboxes).map(cb => cb.value);
      
      // Zapisz odwiedziny do historii
      const response = await this.authManager.fetchWithAuth('/historia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'dodaj_odwiedziny',
          data: {
            data: dateStr,
            chorzy: odwiedzeniChorzy,
            uwagi: `Odwiedzeni chorzy: ${odwiedzeniChorzy.join(', ')}`
          }
        })
      });

      if (response.ok) {
        this.utils.showSuccess(`Zapisano odwiedziny dla ${odwiedzeniChorzy.length} chorych`);
        
        // Zmień przycisk "Zaplanowane" na "Odwiedzone"
        this.updateVisitedButton(dateStr);
        
        this.closeVisitedModal();
      } else {
        throw new Error('Błąd zapisywania odwiedzin');
      }
    } catch (error) {
      console.error('Błąd zapisywania odwiedzin:', error);
      this.utils.showError('Błąd zapisywania odwiedzin');
    }
  }

  closeVisitedModal() {
    const modal = document.getElementById('modalOdwiedziny');
    modal.style.display = 'none';
  }

  async updateVisitedButton(dateStr) {
    // Znajdź przycisk dla danej daty
    const buttons = document.querySelectorAll('.visited-btn');
    buttons.forEach(async button => {
      if (button.getAttribute('data-date') === dateStr) {
        button.textContent = 'Odwiedzone';
        button.style.backgroundColor = '#4caf50';
        button.style.color = 'white';
        // Usuń disabled - przycisk nadal ma być klikalny
        button.disabled = false;
        
        // Pobierz listę odwiedzonych chorych dla tooltipa
        const odwiedzeniChorzy = await this.getVisitedChorzyForDate(dateStr);
        if (odwiedzeniChorzy.length > 0) {
          this.setupTooltip(button, odwiedzeniChorzy);
        }
      }
    });
  }

  setupTooltip(button, odwiedzeniChorzy) {
    // Zapisz dane chorych na przycisku
    button._odwiedzeniChorzy = odwiedzeniChorzy;
    
    // Sprawdź czy już ma event listenery
    if (button._hasTooltipListeners) return;
    button._hasTooltipListeners = true;
    
    let tooltipElement = null;
    let isHovering = false;
    
    const createTooltip = () => {
      // Usuń poprzedni tooltip
      if (tooltipElement) {
        tooltipElement.remove();
      }
      
      const chorzy = button._odwiedzeniChorzy || [];
      if (chorzy.length === 0) return null;
      
      tooltipElement = document.createElement('div');
      tooltipElement.className = 'visited-tooltip-container';
      
      // Tytuł
      const title = document.createElement('div');
      title.textContent = 'Odwiedzeni:';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '6px';
      tooltipElement.appendChild(title);
      
      // Lista chorych
      chorzy.forEach(chory => {
        const item = document.createElement('div');
        item.textContent = '• ' + chory;
        item.style.marginBottom = '2px';
        tooltipElement.appendChild(item);
      });
      
      document.body.appendChild(tooltipElement);
      
      // Pozycjonuj tooltip
      const rect = button.getBoundingClientRect();
      const tooltipHeight = tooltipElement.offsetHeight;
      
      // Pozycja nad przyciskiem
      let top = rect.top - tooltipHeight - 10;
      let left = rect.left + (rect.width / 2) - (tooltipElement.offsetWidth / 2);
      
      // Jeśli tooltip wychodzi poza górę ekranu, pokaż pod przyciskiem
      if (top < 10) {
        top = rect.bottom + 10;
      }
      
      // Ogranicz do ekranu
      left = Math.max(10, Math.min(left, window.innerWidth - tooltipElement.offsetWidth - 10));
      
      tooltipElement.style.top = top + 'px';
      tooltipElement.style.left = left + 'px';
      
      return tooltipElement;
    };
    
    const showTooltip = () => {
      isHovering = true;
      // Opóźnienie żeby odróżnić hover od kliknięcia
      setTimeout(() => {
        if (isHovering) {
          createTooltip();
        }
      }, 200);
    };
    
    const hideTooltip = () => {
      isHovering = false;
      if (tooltipElement) {
        tooltipElement.remove();
        tooltipElement = null;
      }
    };
    
    // Event listenery dla hover
    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('mouseleave', hideTooltip);
    
    // Ukryj tooltip przy kliknięciu (bo otworzy się modal)
    button.addEventListener('click', hideTooltip);
  }

  async checkVisitedDates() {
    try {
      // Pobierz historię odwiedzin
      const response = await this.authManager.fetchWithAuth('/historia');
      if (response.ok) {
        const historia = await response.json();
        
        // Znajdź daty z odwiedzinami
        const visitedDates = new Set();
        historia.forEach(entry => {
          if (entry.data && entry.chorzy && entry.chorzy.length > 0) {
            visitedDates.add(entry.data);
          }
        });
        
        // Zaktualizuj przyciski
        const buttons = document.querySelectorAll('.visited-btn');
        for (const button of buttons) {
          const dateStr = button.getAttribute('data-date');
          if (visitedDates.has(dateStr)) {
            button.textContent = 'Odwiedzone';
            button.style.backgroundColor = '#4caf50';
            button.style.color = 'white';
            // Usuń disabled - przycisk nadal ma być klikalny
            button.disabled = false;
            
            // Pobierz listę odwiedzonych chorych dla tooltipa
            const odwiedzeniChorzy = await this.getVisitedChorzyForDate(dateStr);
            if (odwiedzeniChorzy.length > 0) {
              this.setupTooltip(button, odwiedzeniChorzy);
            }
          }
        }
      }
    } catch (error) {
      console.error('Błąd sprawdzania odwiedzin:', error);
    }
  }


  printKalendarz() {
    this.utils.printContent('tabelaKalendarz');
  }

  async generateTestData() {
    const confirmed = await this.utils.confirm('Czy na pewno chcesz wygenerować dane testowe? To nadpisze wszystkie obecne dane!');
    if (!confirmed) return;

    try {
      const response = await this.authManager.fetchWithAuth('/api/kalendarz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'generuj_dane_testowe' })
      });

      if (response.ok) {
        this.utils.showSuccess('Dane testowe zostały wygenerowane!');
        await this.loadKalendarz();
        await this.generateKalendarz();
      } else {
        throw new Error('Błąd generowania danych testowych');
      }
    } catch (error) {
      console.error('Błąd generowania danych testowych:', error);
      this.utils.showError('Błąd generowania danych testowych');
    }
  }

  async clearTestData() {
    const confirmed = await this.utils.confirm('Czy na pewno chcesz wyczyścić wszystkie dane testowe? Ta operacja jest nieodwracalna!');
    if (!confirmed) return;

    try {
      const response = await this.authManager.fetchWithAuth('/api/kalendarz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'wyczyść_dane_testowe' })
      });

      if (response.ok) {
        this.utils.showSuccess('Dane testowe zostały wyczyszczone!');
        await this.loadKalendarz();
        await this.generateKalendarz();
      } else {
        throw new Error('Błąd czyszczenia danych testowych');
      }
    } catch (error) {
      console.error('Błąd czyszczenia danych testowych:', error);
      this.utils.showError('Błąd czyszczenia danych testowych');
    }
  }

  async createNewYear() {
    const nextYear = (parseInt(this.currentYear) + 1).toString();
    
    // Sprawdź czy rok już istnieje w dropdown
    const rokSelect = document.getElementById('wybierzRok');
    if (rokSelect) {
      const existingOption = rokSelect.querySelector(`option[value="${nextYear}"]`);
      if (existingOption) {
        this.utils.showError(`Rok ${nextYear} już istnieje! Wybierz go z listy rozwijalnej.`);
        return;
      }
    }

    const confirmed = await this.utils.confirm(`Czy na pewno chcesz utworzyć nowy rok ${nextYear}? To wygeneruje kalendarz na kolejny rok na podstawie obecnego.`);
    if (!confirmed) return;

    try {
      // Pobierz dane z aktualnego roku
      const response = await this.authManager.fetchWithAuth(`/api/kalendarz?rok=${this.currentYear}`);

      if (!response.ok) throw new Error('Błąd wczytywania danych aktualnego roku');
      
      const currentYearData = await response.json();
      
      // Wygeneruj nowe przypisania dla nowego roku
      const newYearData = this.generateNewYearData(nextYear, currentYearData);
      
      // Zapisz nowy rok
      const saveResponse = await this.authManager.fetchWithAuth(`/api/kalendarz?rok=${nextYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'zapisz_kalendarz', dane: newYearData })
      });

      if (!saveResponse.ok) throw new Error('Błąd zapisu nowego roku');
      
      // Dodaj nowy rok do dropdown
      if (rokSelect) {
        const option = document.createElement('option');
        option.value = nextYear;
        option.textContent = nextYear;
        rokSelect.appendChild(option);
        rokSelect.value = nextYear;
      }
      
      // Przełącz na nowy rok
      this.currentYear = nextYear;
      await this.loadKalendarz();
      await this.generateKalendarz();
      
      this.utils.showSuccess(`Nowy rok ${nextYear} został utworzony i załadowany!`);
      
    } catch (error) {
      console.error('Błąd podczas tworzenia nowego roku:', error);
      this.utils.showError('Wystąpił błąd podczas tworzenia nowego roku: ' + error.message);
    }
  }

  generateNewYearData(year, currentYearData) {
    const newYearData = {};
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    let szafarzIndex = 0;
    
    // Znajdź ostatnie przypisanie z poprzedniego roku
    if (Object.keys(currentYearData).length > 0) {
      const lastDate = Object.keys(currentYearData).sort().pop();
      const lastAssignment = currentYearData[lastDate];
      
      if (lastAssignment && lastAssignment.osobaGlowna) {
        const lastSzafarzIndex = this.szafarze.indexOf(lastAssignment.osobaGlowna);
        if (lastSzafarzIndex !== -1) {
          szafarzIndex = lastSzafarzIndex + 1;
        }
      }
    }

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0) { // Niedziela
        const dateStr = this.utils.formatDateForAPI(date);
        newYearData[dateStr] = {
          osobaGlowna: this.szafarze[szafarzIndex % this.szafarze.length],
          pomocnik: '',
          uwagi: `Automatyczne przypisanie dla ${dateStr}`
        };
        szafarzIndex++;
      }
    }
    
    return newYearData;
  }


  async autoAssignSzafarze() {
    console.log('autoAssignSzafarze wywołane');
    const confirmed = await this.utils.confirm('Czy na pewno chcesz automatycznie przypisać szafarzy według kolejności z tabeli? To nadpisze obecne przypisania.');
    if (!confirmed) return;

    try {
      // Pobierz aktualne dane kalendarza
      const response = await this.authManager.fetchWithAuth(`/api/kalendarz?rok=${this.currentYear}`);
      if (!response.ok) throw new Error('Błąd wczytywania danych kalendarza');
      
      const currentData = await response.json();
      
      // Wygeneruj nowe przypisania
      const newData = await this.generateAutoAssignments(currentData);
      
      // Zapisz nowe przypisania
      const saveResponse = await this.authManager.fetchWithAuth(`/api/kalendarz?rok=${this.currentYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'zapisz_kalendarz', dane: newData })
      });

      if (!saveResponse.ok) throw new Error('Błąd zapisu nowych przypisań');
      
      // Zaktualizuj lokalne dane
      this.kalendarzData = newData;
      
      // Odśwież kalendarz na ekranie
      await this.generateKalendarz();
      
      this.utils.showSuccess('Szafarze zostali automatycznie przypisani!');
      
    } catch (error) {
      console.error('Błąd automatycznego przypisywania:', error);
      this.utils.showError('Błąd automatycznego przypisywania szafarzy');
    }
  }

  async generateAutoAssignments(currentData) {
    const newData = { ...currentData };
    const startDate = new Date(this.currentYear, 0, 1);
    const endDate = new Date(this.currentYear, 11, 31);
    
    // Załaduj pełne dane szafarzy z tabeli
    const szafarzeData = await this.loadSzafarzeData();
    const szafarzeNames = szafarzeData.map(s => {
      // Nowa struktura z osobnymi polami imie i nazwisko
      if (s.imie) {
        return s.imie.trim();
      }
      // Stara struktura z imieNazwisko (kompatybilność wsteczna)
      if (s.imieNazwisko) {
        const parts = s.imieNazwisko.trim().split(' ');
        return parts[0]; // Tylko imię
      }
      return '';
    }).filter(Boolean);
    
    let szafarzIndex = 0;
    
    // Znajdź ostatnie przypisanie z poprzedniego roku
    const previousYear = this.currentYear - 1;
    try {
      const prevResponse = await this.authManager.fetchWithAuth(`/api/kalendarz?rok=${previousYear}`);
      if (prevResponse.ok) {
        const prevData = await prevResponse.json();
        const prevDates = Object.keys(prevData).sort();
        
        if (prevDates.length > 0) {
          const lastDate = prevDates[prevDates.length - 1];
          const lastAssignment = prevData[lastDate];
          
          if (lastAssignment && lastAssignment.osobaGlowna) {
            const lastSzafarzIndex = szafarzeNames.indexOf(lastAssignment.osobaGlowna);
            if (lastSzafarzIndex !== -1) {
              // Rozpocznij od następnego szafarza po ostatnim z poprzedniego roku
              szafarzIndex = (lastSzafarzIndex + 1) % szafarzeNames.length;
            }
          }
        }
      }
    } catch (error) {
      console.log('Nie można załadować danych z poprzedniego roku, rozpoczynam od początku listy');
    }

    // Przypisz szafarzy do wszystkich niedziel i świąt
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const dateStr = this.utils.formatDateForAPI(date);
      const isSwieto = this.utils.isSwietoNakazane(date);
      
           if (dayOfWeek === 0 || isSwieto) {
             // Przypisz szafarza według kolejności z tabeli
             const assignedSzafarz = szafarzeNames[szafarzIndex % szafarzeNames.length];
             
             if (!newData[dateStr]) {
               newData[dateStr] = {};
             }
             
             newData[dateStr].osobaGlowna = assignedSzafarz;
             // Usuń pomocnika z istniejących danych i nie przypisuj automatycznie
             delete newData[dateStr].pomocnik;
             
             szafarzIndex++;
           }
    }
    
    return newData;
  }
}

// Eksportuj klasę - instancja będzie utworzona w main.js

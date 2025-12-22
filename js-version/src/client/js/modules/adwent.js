// Moduł zarządzania Adwentem
import { Utils } from './utils.js';

export class AdwentManager {
  constructor(authManager) {
    this.utils = new Utils();
    this.authManager = authManager;
    this.currentYear = new Date().getFullYear().toString();
    this.adwentData = {};
    this.szafarze = [];
    this.debouncedSave = this.utils.debounce(() => this.saveAdwent(), 1000, 'adwent');
  }

  async init() {
    try {
      await this.loadSzafarze();
      await this.loadAdwent();
      this.setupEventListeners();
      console.log('Moduł adwentu zainicjalizowany');
    } catch (error) {
      console.error('Błąd inicjalizacji adwentu:', error);
      this.utils.showError('Błąd inicjalizacji adwentu');
    }
  }

  async loadSzafarze() {
    try {
      const response = await this.authManager.fetchWithAuth('/api/szafarze');
      if (response.ok) {
        const data = await response.json();
        this.szafarze = data.map(s => {
          if (s.imie) return s.imie.trim();
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

  async loadAdwent() {
    try {
      const response = await this.authManager.fetchWithAuth(`/api/adwent?rok=${this.currentYear}`);
      if (response.ok) {
        this.adwentData = await response.json();
      } else {
        this.adwentData = {};
      }
    } catch (error) {
      console.error('Błąd ładowania adwentu:', error);
      this.adwentData = {};
    }
  }

  // Oblicz datę pierwszej niedzieli Adwentu
  getAdwentStartDate(year) {
    // Boże Narodzenie
    const christmas = new Date(year, 11, 25); // 25 grudnia
    
    // Znajdź 4. niedzielę przed Bożym Narodzeniem
    // Najpierw znajdź niedzielę przed lub w dniu Bożego Narodzenia
    let sundayBeforeChristmas = new Date(christmas);
    
    // Jeśli Boże Narodzenie jest w niedzielę, to jest to 4. niedziela Adwentu
    // W przeciwnym razie cofnij się do poprzedniej niedzieli
    while (sundayBeforeChristmas.getDay() !== 0) {
      sundayBeforeChristmas.setDate(sundayBeforeChristmas.getDate() - 1);
    }
    
    // To jest 4. niedziela Adwentu, więc cofnij się o 3 tygodnie dla 1. niedzieli
    const firstSundayOfAdvent = new Date(sundayBeforeChristmas);
    firstSundayOfAdvent.setDate(firstSundayOfAdvent.getDate() - 21);
    
    return firstSundayOfAdvent;
  }

  // Pobierz wszystkie dni Adwentu (poniedziałek-piątek)
  getAdwentWeekdays(year) {
    const startDate = this.getAdwentStartDate(year);
    const endDate = new Date(year, 11, 24); // 24 grudnia (Wigilia)
    
    const weekdays = [];
    let weekNumber = 1;
    let currentSunday = new Date(startDate);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Aktualizuj numer tygodnia przy każdej niedzieli
      if (dayOfWeek === 0 && date > startDate) {
        weekNumber++;
        currentSunday = new Date(date);
      }
      
      // Dodaj tylko poniedziałek (1) do piątku (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        weekdays.push({
          date: new Date(date),
          dayOfWeek: dayOfWeek,
          weekNumber: weekNumber
        });
      }
    }
    
    return weekdays;
  }

  getDayName(dayOfWeek) {
    const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    return days[dayOfWeek];
  }

  getWeekName(weekNumber) {
    const weeks = ['', 'I Tydzień Adwentu', 'II Tydzień Adwentu', 'III Tydzień Adwentu', 'IV Tydzień Adwentu'];
    return weeks[weekNumber] || `${weekNumber}. Tydzień Adwentu`;
  }

  async generateAdwent() {
    const tbody = document.getElementById('tabelaAdwentBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const weekdays = this.getAdwentWeekdays(parseInt(this.currentYear));
    
    if (weekdays.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="7" style="text-align: center;">Brak dni Adwentu do wyświetlenia</td>';
      tbody.appendChild(row);
      return;
    }

    weekdays.forEach(day => {
      const row = this.createAdwentRow(day);
      tbody.appendChild(row);
    });
  }

  createAdwentRow(day) {
    const row = document.createElement('tr');
    const dateStr = this.utils.formatDateForAPI(day.date);
    const data = this.adwentData[dateStr] || {};

    // Generuj opcje dla selectów
    const szafarzeOptions = this.szafarze.map(szafarz => 
      `<option value="${szafarz}" ${data.osobaGlowna === szafarz ? 'selected' : ''}>${szafarz}</option>`
    ).join('');
    
    const pomocnikOptions = this.szafarze.map(szafarz => 
      `<option value="${szafarz}" ${data.pomocnik === szafarz ? 'selected' : ''}>${szafarz}</option>`
    ).join('');

    row.innerHTML = `
      <td>${this.utils.formatDate(day.date)}</td>
      <td>${this.getDayName(day.dayOfWeek)}</td>
      <td>${this.getWeekName(day.weekNumber)}</td>
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
    `;

    // Dodaj obsługę zmian
    const selects = row.querySelectorAll('select');

    selects.forEach(element => {
      element.addEventListener('change', () => this.debouncedSave());
    });

    return row;
  }

  async saveAdwent() {
    try {
      const tbody = document.getElementById('tabelaAdwentBody');
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

        if (selectGlowna.value.trim() || selectPomocnik.value.trim()) {
          dataToSave[dateKey] = {
            osobaGlowna: selectGlowna.value,
            pomocnik: selectPomocnik.value
          };
        }
      });

      const response = await this.authManager.fetchWithAuth(`/api/adwent?rok=${this.currentYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'zapisz_adwent', dane: dataToSave })
      });

      if (response.ok) {
        this.adwentData = dataToSave;
        this.utils.showSuccess('Adwent zapisany');
      } else {
        throw new Error('Błąd zapisu adwentu');
      }
    } catch (error) {
      console.error('Błąd zapisywania adwentu:', error);
      this.utils.showError('Błąd zapisywania adwentu');
    }
  }

  async markVisited(dateStr) {
    try {
      // Pobierz listę chorych ze statusem TAK
      const response = await this.authManager.fetchWithAuth('/api/chorzy');
      if (!response.ok) {
        this.utils.showError('Błąd ładowania chorych');
        return;
      }
      
      let chorzy = await response.json();
      chorzy = chorzy.filter(c => c.status === 'TAK');
      chorzy.sort((a, b) => (a.imieNazwisko || '').localeCompare(b.imieNazwisko || ''));
      
      // Pobierz już odwiedzonych chorych dla tej daty
      const odwiedzeniChorzy = await this.getVisitedChorzyForDate(dateStr);
      
      // Wyświetl modal
      this.showVisitedModal(dateStr, chorzy, odwiedzeniChorzy);
    } catch (error) {
      console.error('Błąd w markVisited:', error);
      this.utils.showError('Błąd ładowania danych chorych');
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
    
    const modalTitle = modal.querySelector('h3');
    modalTitle.textContent = `Oznacz odwiedzonych chorych - ${this.utils.formatDate(new Date(dateStr))}`;
    
    listaChorych.innerHTML = '';
    
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
        
        const isVisited = odwiedzeniChorzy.includes(chory.imieNazwisko);
        
        choryDiv.innerHTML = `
          <label for="adwent_chory_${index}" style="flex: 1; cursor: pointer;">
            <strong>${chory.imieNazwisko}</strong>
          </label>
          <input type="checkbox" id="adwent_chory_${index}" value="${chory.imieNazwisko}" 
                 ${isVisited ? 'checked' : ''} style="margin-left: 10px;">
        `;
        
        listaChorych.appendChild(choryDiv);
      }
    });
    
    const form = document.getElementById('formOdwiedziny');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.saveVisitedChorzy(dateStr);
    };
    
    const cancelBtn = document.getElementById('cancelVisitedBtn');
    cancelBtn.onclick = () => this.closeVisitedModal();
    
    modal.style.display = 'block';
    
    const closeBtn = document.getElementById('closeModalBtn');
    closeBtn.onclick = () => this.closeVisitedModal();
  }

  async saveVisitedChorzy(dateStr) {
    try {
      const checkboxes = document.querySelectorAll('#listaChorychModal input[type="checkbox"]:checked');
      const odwiedzeniChorzy = Array.from(checkboxes).map(cb => cb.value);
      
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
            uwagi: `Adwent - Odwiedzeni chorzy: ${odwiedzeniChorzy.join(', ')}`
          }
        })
      });

      if (response.ok) {
        this.utils.showSuccess(`Zapisano odwiedziny dla ${odwiedzeniChorzy.length} chorych`);
        this.updateVisitedButton(dateStr, odwiedzeniChorzy);
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

  updateVisitedButton(dateStr, odwiedzeniChorzy) {
    const buttons = document.querySelectorAll('#tabelaAdwent .visited-btn');
    buttons.forEach(button => {
      if (button.getAttribute('data-date') === dateStr) {
        button.textContent = 'Odwiedzone';
        button.style.backgroundColor = '#4caf50';
        button.style.color = 'white';
        
        if (odwiedzeniChorzy.length > 0) {
          this.setupTooltip(button, odwiedzeniChorzy);
        }
      }
    });
  }

  setupTooltip(button, odwiedzeniChorzy) {
    button._odwiedzeniChorzy = odwiedzeniChorzy;
    
    if (button._hasTooltipListeners) return;
    button._hasTooltipListeners = true;
    
    let tooltipElement = null;
    let isHovering = false;
    
    const createTooltip = () => {
      if (tooltipElement) tooltipElement.remove();
      
      const chorzy = button._odwiedzeniChorzy || [];
      if (chorzy.length === 0) return null;
      
      tooltipElement = document.createElement('div');
      tooltipElement.className = 'visited-tooltip-container';
      
      const title = document.createElement('div');
      title.textContent = 'Odwiedzeni:';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '6px';
      tooltipElement.appendChild(title);
      
      chorzy.forEach(chory => {
        const item = document.createElement('div');
        item.textContent = '• ' + chory;
        item.style.marginBottom = '2px';
        tooltipElement.appendChild(item);
      });
      
      document.body.appendChild(tooltipElement);
      
      const rect = button.getBoundingClientRect();
      const tooltipHeight = tooltipElement.offsetHeight;
      
      let top = rect.top - tooltipHeight - 10;
      let left = rect.left + (rect.width / 2) - (tooltipElement.offsetWidth / 2);
      
      if (top < 10) top = rect.bottom + 10;
      left = Math.max(10, Math.min(left, window.innerWidth - tooltipElement.offsetWidth - 10));
      
      tooltipElement.style.top = top + 'px';
      tooltipElement.style.left = left + 'px';
      
      return tooltipElement;
    };
    
    const showTooltip = () => {
      isHovering = true;
      setTimeout(() => {
        if (isHovering) createTooltip();
      }, 200);
    };
    
    const hideTooltip = () => {
      isHovering = false;
      if (tooltipElement) {
        tooltipElement.remove();
        tooltipElement = null;
      }
    };
    
    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('mouseleave', hideTooltip);
    button.addEventListener('click', hideTooltip);
  }

  async checkVisitedDates() {
    try {
      const response = await this.authManager.fetchWithAuth('/historia');
      if (response.ok) {
        const historia = await response.json();
        
        const visitedDates = new Map();
        historia.forEach(entry => {
          if (entry.data && entry.chorzy && entry.chorzy.length > 0) {
            visitedDates.set(entry.data, entry.chorzy);
          }
        });
        
        const buttons = document.querySelectorAll('#tabelaAdwent .visited-btn');
        for (const button of buttons) {
          const dateStr = button.getAttribute('data-date');
          if (visitedDates.has(dateStr)) {
            button.textContent = 'Odwiedzone';
            button.style.backgroundColor = '#4caf50';
            button.style.color = 'white';
            
            const odwiedzeniChorzy = visitedDates.get(dateStr);
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

  setupEventListeners() {
    // Obsługa zmiany roku
    const rokSelect = document.getElementById('wybierzRokAdwent');
    if (rokSelect) {
      rokSelect.value = this.currentYear;
      rokSelect.addEventListener('change', async (e) => {
        this.currentYear = e.target.value;
        await this.loadAdwent();
        await this.generateAdwent();
        await this.checkVisitedDates();
      });
    }

    // Przycisk drukowania
    const drukujBtn = document.getElementById('drukujAdwentBtn');
    if (drukujBtn) {
      drukujBtn.addEventListener('click', () => this.printAdwent());
    }
  }

  showAdwentTab() {
    const adwentTabBtn = document.getElementById('adwentTabBtn');
    const adwentContent = document.getElementById('adwent');
    
    if (!adwentTabBtn || !adwentContent) return;
    
    // Sprawdź czy zakładka Adwent jest już widoczna (content ma klasę active)
    if (adwentContent.classList.contains('active')) {
      // Ukryj zakładkę Adwent
      adwentTabBtn.style.display = 'none';
      adwentTabBtn.classList.remove('active');
      adwentContent.classList.remove('active');
      
      // Przełącz na zakładkę Kalendarz
      const kalendarzBtn = document.querySelector('.tab-button[data-tab="kalendarz"]');
      const kalendarzContent = document.getElementById('kalendarz');
      if (kalendarzBtn && kalendarzContent) {
        kalendarzBtn.classList.add('active');
        kalendarzContent.classList.add('active');
      }
    } else {
      // Ukryj wszystkie inne zakładki
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Pokaż zakładkę Adwent
      adwentTabBtn.style.display = 'inline-block';
      adwentTabBtn.classList.add('active');
      adwentContent.classList.add('active');
      
      // Wygeneruj tabelę Adwentu
      this.generateAdwent().then(() => {
        this.checkVisitedDates();
      });
    }
  }

  printAdwent() {
    this.utils.printContent('tabelaAdwent');
  }
}


// Główny moduł aplikacji
import { AuthManager } from './modules/auth.js';
import { KalendarzManager } from './modules/kalendarz.js';
import { ChorzyManager } from './modules/chorzy.js';
import { SzafarzeManager } from './modules/szafarze.js';
import { RaportyManager } from './modules/raporty.js';
import { Utils } from './modules/utils.js';

class App {
  constructor() {
    console.log('🚀 App constructor wywołane');
    this.authManager = new AuthManager();
    this.kalendarzManager = new KalendarzManager(this.authManager);
    this.chorzyManager = new ChorzyManager(this.authManager);
    this.szafarzeManager = new SzafarzeManager(this.authManager);
    this.raportyManager = new RaportyManager(this.authManager);
    this.utils = new Utils();
    
    this.init();
  }

  async init() {
    // Sprawdź czy użytkownik jest zalogowany
    const isLoggedIn = await this.authManager.checkAuth();
    
    if (!isLoggedIn) {
      this.showLoginScreen();
      return;
    }

    // Inicjalizuj aplikację (zawiera inicjalizację klucza szyfrowania)
    await this.initializeApp();
  }

  showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    // Pokaż ekran logowania, ukryj aplikację
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
    
    // Obsługa formularza logowania
    const form = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('loginError');
    
    // Wyczyść poprzednie event listenery
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = document.getElementById('passwordInput').value;
      const errorDiv = document.getElementById('loginError');
      
      // Sprawdź hasło
      if (password === 'PomocDlaChorych!') {
        // Ukryj błąd jeśli był widoczny
        errorDiv.style.display = 'none';
        
        // Użyj nowego systemu logowania z sesją
        try {
          const success = await this.authManager.simpleLogin(password);
          if (success) {
            // Inicjalizuj aplikację (zawiera inicjalizację klucza szyfrowania)
            await this.initializeApp();
          } else {
            errorDiv.textContent = 'Błąd logowania';
            errorDiv.style.display = 'block';
          }
        } catch (error) {
          errorDiv.textContent = 'Błąd logowania: ' + error.message;
          errorDiv.style.display = 'block';
        }
      } else {
        // Pokaż błąd
        errorDiv.textContent = 'Nieprawidłowe hasło';
        errorDiv.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
      }
    });
    
    // Fokus na pole hasła
    passwordInput.focus();
    
    // Obsługa klawisza Enter w polu hasła
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        newForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  async handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
      const success = await this.authManager.login(username, password);
      if (success) {
        document.getElementById('modalLogin').style.display = 'none';
        await this.initializeApp();
      } else {
        errorDiv.textContent = 'Nieprawidłowe dane logowania';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = 'Błąd logowania: ' + error.message;
      errorDiv.style.display = 'block';
    }
  }

  async initializeApp() {
    try {
      // Inicjalizuj klucz szyfrowania
      console.log('🔐 Inicjalizacja klucza szyfrowania...');
      await Utils.initializeEncryptionKey();
      
      // Ukryj ekran logowania, pokaż aplikację
      const loginScreen = document.getElementById('loginScreen');
      const mainApp = document.getElementById('mainApp');
      if (loginScreen) loginScreen.style.display = 'none';
      if (mainApp) mainApp.style.display = 'block';
      
      // Ustaw menedżery jako globalne dla onclick PRZED inicjalizacją
      window.kalendarzManager = this.kalendarzManager;
      window.chorzyManager = this.chorzyManager;
      window.szafarzeManager = this.szafarzeManager;
      window.authManager = this.authManager;
      window.raportyManager = this.raportyManager;
      
      // Inicjalizuj wszystkie moduły
      console.log('Ładowanie modułów...');
      try {
        await this.kalendarzManager.init();
        console.log('✓ Kalendarz');
        
        // Dodaj event listener do zmiany roku w głównym kalendarzu
        this.setupYearChangeListener();
      } catch (error) {
        console.error('Błąd inicjalizacji kalendarza:', error);
      }
      
      try {
        await this.chorzyManager.init();
        console.log('✓ Chorzy');
      } catch (error) {
        console.error('Błąd inicjalizacji chorych:', error);
      }
      
      try {
        await this.szafarzeManager.init();
        console.log('✓ Szafarze');
      } catch (error) {
        console.error('Błąd inicjalizacji szafarzy:', error);
      }
      
      try {
        await this.raportyManager.init();
        console.log('✓ Raporty');
      } catch (error) {
        console.error('Błąd inicjalizacji raportów:', error);
      }

      // Ustaw obsługę zakładek
      this.setupTabs();
      
      // Ustaw obsługę wylogowania
      this.setupLogout();
      
      console.log('✓ Aplikacja gotowa');
    } catch (error) {
      console.error('Błąd inicjalizacji aplikacji:', error);
      this.utils.showError('Błąd inicjalizacji aplikacji');
    }
  }

  setupTabs() {
    const buttons = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');
    
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Usuń aktywną klasę z wszystkich przycisków i zawartości
        buttons.forEach(btn => btn.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));
        
        // Dodaj aktywną klasę do klikniętego przycisku i odpowiadającej zawartości
        button.classList.add('active');
        document.getElementById(tab).classList.add('active');
      });
    });
    
    // Obsługa ukrytej zakładki administracyjnej
    this.setupHiddenTab();
  }

  setupHiddenTab() {
    // Inicjalizuj kalendarz adwentowy
    this.initAdventCalendar();
    
    // Obsługa przycisku do pokazania ukrytej zakładki (widocznego zawsze)
    this.setupShowAdminButton();
  }

  // Funkcja do obliczania dni adwentu (pomijając niedziele)
  getAdventDays(year) {
    // Adwent zaczyna się w niedzielę 4 tygodnie przed Bożym Narodzeniem
    const christmas = new Date(year, 11, 25); // 25 grudnia
    const firstAdvent = new Date(christmas);
    firstAdvent.setDate(christmas.getDate() - (christmas.getDay() + 21)); // 4 tygodnie wcześniej
    
    const adventDays = [];
    const currentDate = new Date(firstAdvent);
    
    // Przejdź przez wszystkie dni adwentu (do 24 grudnia włącznie)
    while (currentDate < christmas) {
      // Pomijaj niedziele
      if (currentDate.getDay() !== 0) {
        adventDays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return adventDays;
  }

  // Inicjalizacja kalendarza adwentowego
  async initAdventCalendar() {
    // Użyj roku z głównego kalendarza (może być zmieniony przez użytkownika)
    const currentYear = parseInt(this.kalendarzManager.currentYear);
    const adventDays = this.getAdventDays(currentYear);
    
    // Pobierz listę szafarzy
    let szafarze = [];
    try {
      const response = await this.authManager.fetchWithAuth('/api/szafarze');
      if (response.ok) {
        const data = await response.json();
        // Wyodrębnij tylko imię z imieNazwisko (tak jak w głównym kalendarzu)
        szafarze = data.map(s => {
          if (s.imieNazwisko) {
            // Podziel na części i weź pierwszą (imię)
            const parts = s.imieNazwisko.trim().split(' ');
            return parts[0];
          }
          return s.nazwa || s;
        }).filter(Boolean);
      } else {
        // Użyj domyślnej listy
        szafarze = ["Tomasz", "Andrzej", "Piotr", "Dawid", "Mateusz", "Damian", "Sebastian"];
      }
    } catch (error) {
      console.error('Błąd pobierania szafarzy:', error);
      // Użyj domyślnej listy w przypadku błędu
      szafarze = ["Tomasz", "Andrzej", "Piotr", "Dawid", "Mateusz", "Damian", "Sebastian"];
    }
    
    // Wygeneruj HTML kalendarza adwentowego
    this.generateAdventCalendarHTML(adventDays, szafarze);
    
    // Załaduj zapisane dane
    await this.loadAdventData();
    
    // Przewiń do najbliższej daty adwentowej
    this.scrollToNextAdventDay();
  }

    // Generowanie HTML kalendarza adwentowego
    generateAdventCalendarHTML(adventDays, szafarze) {
      const container = document.getElementById('adventCalendarContainer');
      if (!container) return;

      // Załaduj dane adwentowe
      const adventData = this.loadAdventData();

      let html = `
        <div class="advent-calendar">
          <div class="chorzy-przyciski">
            <button class="uni-btn" id="saveAdventBtn">💾 Zapisz dane adwentowe</button>
            <button class="uni-btn" id="clearAdventBtn">🗑️ Wyczyść wszystkie</button>
          </div>
          
        <table id="tabelaAdwentowa" style="border:0 !important; outline:0 !important; box-shadow:none !important; border-radius:0 !important;">
          <thead>
            <tr>
              <th scope="col">Dzień</th>
              <th scope="col">Data</th>
              <th scope="col">Osoba główna</th>
              <th scope="col">Pomocnik</th>
              <th scope="col">Uwagi</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    adventDays.forEach((day, index) => {
      const dateStr = this.utils.formatDateForAPI(day);
      const dayName = day.toLocaleDateString('pl-PL', { weekday: 'long' });
      const formattedDate = day.toLocaleDateString('pl-PL');
      const data = adventData[dateStr] || {};
      
      html += `
        <tr data-date="${dateStr}">
          <td>${dayName}</td>
          <td>${formattedDate}</td>
          <td>
            <select class="advent-osoba-glowna" data-date="${dateStr}">
              <option value="" ${!data.osobaGlowna ? 'selected' : ''}>-- Wybierz --</option>
              ${szafarze.map(szafarz => `<option value="${szafarz}" ${data.osobaGlowna === szafarz ? 'selected' : ''}>${szafarz}</option>`).join('')}
            </select>
          </td>
          <td>
            <select class="advent-pomocnik" data-date="${dateStr}">
              <option value="" ${!data.pomocnik ? 'selected' : ''}>-- Wybierz --</option>
              ${szafarze.map(szafarz => `<option value="${szafarz}" ${data.pomocnik === szafarz ? 'selected' : ''}>${szafarz}</option>`).join('')}
            </select>
          </td>
          <td contenteditable="true" class="uwagi-input">${data.uwagi || ''}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Dodaj event listenery
    this.setupAdventEventListeners();
  }

  // Konfiguracja event listenerów dla kalendarza adwentowego
  setupAdventEventListeners() {
    // Event listenery dla selectów
    const selects = document.querySelectorAll('.advent-osoba-glowna, .advent-pomocnik');
    selects.forEach(select => {
      select.addEventListener('change', () => {
        this.saveAdventData();
      });
    });
    
    // Event listenery dla contenteditable uwag
    const uwagiInputs = document.querySelectorAll('.uwagi-input');
    uwagiInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.saveAdventData();
      });
      input.addEventListener('blur', () => {
        this.saveAdventData();
      });
    });
    
    // Przycisk zapisywania
    const saveBtn = document.getElementById('saveAdventBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveAdventData();
        this.utils.showSuccess('Dane adwentowe zostały zapisane!');
      });
    }
    
    // Przycisk czyszczenia
    const clearBtn = document.getElementById('clearAdventBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz wyczyścić wszystkie dane adwentowe?')) {
          this.clearAdventData();
        }
      });
    }
  }

  // Zapisywanie danych adwentowych
  async saveAdventData() {
    const adventData = {};
    
    // Zbierz dane z formularza
    const rows = document.querySelectorAll('tr[data-date]');
    rows.forEach(row => {
      const date = row.dataset.date;
      const osobaGlowna = row.querySelector('.advent-osoba-glowna').value;
      const pomocnik = row.querySelector('.advent-pomocnik').value;
      const uwagi = row.querySelector('.uwagi-input').textContent.trim();
      
      if (osobaGlowna || pomocnik || uwagi) {
        adventData[date] = {
          osobaGlowna,
          pomocnik,
          uwagi
        };
      }
    });
    
    // Zapisz w localStorage (lub wyślij na serwer)
    localStorage.setItem('adventData', JSON.stringify(adventData));
    console.log('Dane adwentowe zapisane:', adventData);
  }

  // Ładowanie danych adwentowych
  async loadAdventData() {
    try {
      const savedData = localStorage.getItem('adventData');
      if (savedData) {
        const adventData = JSON.parse(savedData);
        
        // Wypełnij formularz zapisanymi danymi
        Object.entries(adventData).forEach(([date, data]) => {
          const row = document.querySelector(`tr[data-date="${date}"]`);
          if (row) {
            const osobaGlownaSelect = row.querySelector('.advent-osoba-glowna');
            const pomocnikSelect = row.querySelector('.advent-pomocnik');
            const uwagiInput = row.querySelector('.advent-uwagi');
            
            if (osobaGlownaSelect) osobaGlownaSelect.value = data.osobaGlowna || '';
            if (pomocnikSelect) pomocnikSelect.value = data.pomocnik || '';
            if (uwagiInput) uwagiInput.value = data.uwagi || '';
          }
        });
        
        console.log('Dane adwentowe załadowane:', adventData);
      }
    } catch (error) {
      console.error('Błąd ładowania danych adwentowych:', error);
    }
  }

  // Czyszczenie danych adwentowych
  clearAdventData() {
    // Wyczyść formularz
    const selects = document.querySelectorAll('.advent-osoba-glowna, .advent-pomocnik');
    selects.forEach(select => select.value = '');
    
    const uwagiInputs = document.querySelectorAll('.uwagi-input');
    uwagiInputs.forEach(input => input.textContent = '');
    
    // Wyczyść localStorage
    localStorage.removeItem('adventData');
    
    this.utils.showSuccess('Dane adwentowe zostały wyczyszczone!');
  }

  // Przewiń do najbliższej daty adwentowej
  scrollToNextAdventDay() {
    // Użyj roku z głównego kalendarza do porównania dat
    const currentYear = parseInt(this.kalendarzManager.currentYear);
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Znajdź najbliższą datę adwentową (dzisiaj lub w przyszłości)
    const rows = document.querySelectorAll('#tabelaAdwentowa tbody tr[data-date]');
    let nextAdventRow = null;
    
    for (let row of rows) {
      const dateStr = row.dataset.date;
      const rowDate = new Date(dateStr);
      const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
      
      if (rowDateOnly >= todayOnly) {
        nextAdventRow = row;
        break;
      }
    }
    
    if (nextAdventRow) {
      // Dodaj klasę podświetlenia
      nextAdventRow.classList.add('next-duty-row');
      
      // Przewiń do wiersza z opóźnieniem
      setTimeout(() => {
        nextAdventRow.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }

        // Obsługa przycisku do pokazania ukrytej zakładki
        setupShowAdminButton() {
          const showAdminBtn = document.getElementById('showAdminTabBtn');
          const hiddenTabButton = document.querySelector('[data-tab="admin"]');

          if (showAdminBtn && hiddenTabButton) {
            // Ustaw początkową nazwę przycisku
            showAdminBtn.textContent = `🕯️ Kalendarz Adwentowy`;

            showAdminBtn.addEventListener('click', () => {
              if (hiddenTabButton.style.display === 'none') {
                // Pokaż zakładkę
                hiddenTabButton.style.display = 'inline-block';
                hiddenTabButton.classList.add('visible');
                showAdminBtn.textContent = `🕯️ Ukryj Kalendarz Adwentowy`;

                // Przełącz na zakładkę administracyjną
                this.switchToAdminTab();
              } else {
                // Ukryj zakładkę
                hiddenTabButton.style.display = 'none';
                hiddenTabButton.classList.remove('visible');
                showAdminBtn.textContent = `🕯️ Kalendarz Adwentowy`;
              }
            });
          }
        }

  // Przełącz na zakładkę kalendarza adwentowego
  switchToAdminTab() {
    // Usuń aktywną klasę z wszystkich przycisków i zawartości
    const buttons = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach(btn => btn.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    // Dodaj aktywną klasę do zakładki kalendarza adwentowego
    const adminButton = document.querySelector('[data-tab="admin"]');
    const adminContent = document.getElementById('admin');

    if (adminButton) adminButton.classList.add('active');
    if (adminContent) adminContent.classList.add('active');
    
    // Przewiń do najbliższej daty adwentowej po przełączeniu
    setTimeout(() => {
      this.scrollToNextAdventDay();
    }, 200);
  }

  // Odśwież kalendarz adwentowy gdy zmieni się rok w głównym kalendarzu
  async refreshAdventCalendar() {
    // Sprawdź czy kalendarz adwentowy jest widoczny
    const hiddenTabButton = document.querySelector('[data-tab="admin"]');
    if (hiddenTabButton && hiddenTabButton.style.display !== 'none') {
      // Odśwież kalendarz adwentowy z nowym rokiem
      await this.initAdventCalendar();
    }
  }

  // Ustaw event listener na zmianę roku w głównym kalendarzu
  setupYearChangeListener() {
    const rokSelect = document.getElementById('wybierzRok');
    if (rokSelect) {
      rokSelect.addEventListener('change', async () => {
        // Odśwież kalendarz adwentowy z nowym rokiem
        await this.refreshAdventCalendar();
      });
    }
  }

  setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.authManager.logout();
      location.reload();
    });
  }
}

// Uruchom aplikację gdy DOM jest gotowy
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM załadowany, tworzę nową instancję App');
  new App();
});

console.log('🚀 Skrypt main.js załadowany');

// Eksportuj dla debugowania
window.App = App;

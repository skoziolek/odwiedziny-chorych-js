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

    // Inicjalizuj aplikację
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
        
        // Ukryj ekran logowania, pokaż aplikację
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
        
        // Ustaw token w pamięci (znika po odświeżeniu strony)
        this.authManager.setToken('simple-login-token');
        
        // Inicjalizuj aplikację
        await this.initializeApp();
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
      // Ukryj ekran logowania, pokaż aplikację
      const loginScreen = document.getElementById('loginScreen');
      const mainApp = document.getElementById('mainApp');
      loginScreen.style.display = 'none';
      mainApp.style.display = 'block';
      
      // Ustaw menedżery jako globalne dla onclick PRZED inicjalizacją
      window.kalendarzManager = this.kalendarzManager;
      window.chorzyManager = this.chorzyManager;
      window.szafarzeManager = this.szafarzeManager;
      window.raportyManager = this.raportyManager;
      
      // Inicjalizuj wszystkie moduły
      console.log('Ładowanie modułów...');
      try {
        await this.kalendarzManager.init();
        console.log('✓ Kalendarz');
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

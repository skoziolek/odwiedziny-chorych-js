// Moduł narzędzi pomocniczych
// Updated: 2025-01-15 15:30
export class Utils {
  // Statyczne dane świąt
  static swietaNakazane = {
      "2025-01-01": "Świętej Bożej Rodzicielki Maryi",
      "2025-01-06": "Objawienie Pańskie (Trzech Króli)",
      "2025-04-20": "Niedziela Zmartwychwstania Pańskiego",
      "2025-04-21": "Poniedziałek Wielkanocny",
      "2025-06-01": "Uroczystość Wniebowstąpienia Pańskiego",
      "2025-06-08": "Uroczystość Zesłania Ducha Świętego",
      "2025-06-19": "Boże Ciało",
      "2025-06-29": "Uroczystość Świętych Apostołów Piotra i Pawła",
      "2025-08-15": "Wniebowzięcie NMP",
      "2025-11-01": "Uroczystość Wszystkich Świętych",
      "2025-12-25": "Boże Narodzenie",
      "2025-12-26": "Drugi Dzień Bożego Narodzenia",
      "2026-01-01": "Świętej Bożej Rodzicielki Maryi",
      "2026-01-06": "Objawienie Pańskie (Trzech Króli)",
      "2026-04-05": "Niedziela Zmartwychwstania Pańskiego",
      "2026-04-06": "Poniedziałek Wielkanocny",
      "2026-05-17": "Uroczystość Wniebowstąpienia Pańskiego",
      "2026-05-24": "Uroczystość Zesłania Ducha Świętego",
      "2026-06-04": "Boże Ciało",
      "2026-08-15": "Wniebowzięcie NMP",
      "2026-11-01": "Uroczystość Wszystkich Świętych",
      "2026-12-25": "Boże Narodzenie",
      "2026-12-26": "Drugi Dzień Bożego Narodzenia"
  };

  static niedzieleLiturgiczne = {
      "2025-01-05": "I Niedziela po Narodzeniu Pańskim",
      "2025-01-12": "Niedziela Chrztu Pańskiego",
      "2025-01-19": "II Niedziela zwykła",
      "2025-01-26": "III Niedziela zwykła",
      "2025-02-02": "IV Niedziela zwykła",
      "2025-02-09": "V Niedziela zwykła",
      "2025-02-16": "VI Niedziela zwykła",
      "2025-02-23": "VII Niedziela zwykła",
      "2025-03-02": "VIII Niedziela zwykła",
      "2025-03-09": "I Niedziela Wielkiego Postu",
      "2025-03-16": "II Niedziela Wielkiego Postu",
      "2025-03-23": "III Niedziela Wielkiego Postu",
      "2025-03-30": "IV Niedziela Wielkiego Postu",
      "2025-04-06": "V Niedziela Wielkiego Postu",
      "2025-04-13": "Niedziela Palmowa",
      "2025-04-27": "II Niedziela Wielkanocna (Miłosierdzia Bożego)",
      "2025-05-04": "III Niedziela Wielkanocna",
      "2025-05-11": "IV Niedziela Wielkanocna",
      "2025-05-18": "V Niedziela Wielkanocna",
      "2025-05-25": "VI Niedziela Wielkanocna",
      "2025-06-08": "IX Niedziela zwykła",
      "2025-06-15": "X Niedziela zwykła",
      "2025-06-22": "XI Niedziela zwykła",
      "2025-07-06": "XII Niedziela zwykła",
      "2025-07-13": "XIII Niedziela zwykła",
      "2025-07-20": "XIV Niedziela zwykła",
      "2025-07-27": "XV Niedziela zwykła",
      "2025-08-03": "XVI Niedziela zwykła",
      "2025-08-10": "XVII Niedziela zwykła",
      "2025-08-17": "XVIII Niedziela zwykła",
      "2025-08-24": "XIX Niedziela zwykła",
      "2025-08-31": "XX Niedziela zwykła",
      "2025-09-07": "XXI Niedziela zwykła",
      "2025-09-14": "XXII Niedziela zwykła",
      "2025-09-21": "XXIII Niedziela zwykła",
      "2025-09-28": "XXIV Niedziela zwykła",
      "2025-10-05": "XXV Niedziela zwykła",
      "2025-10-12": "XXVI Niedziela zwykła",
      "2025-10-19": "XXVII Niedziela zwykła",
      "2025-10-26": "XXVIII Niedziela zwykła",
      "2025-11-02": "XXIX Niedziela zwykła",
      "2025-11-09": "XXX Niedziela zwykła",
      "2025-11-16": "XXXI Niedziela zwykła",
      "2025-11-23": "Uroczystość Jezusa Chrystusa Króla Wszechświata",
      "2025-11-30": "I Niedziela Adwentu",
      "2025-12-07": "II Niedziela Adwentu",
      "2025-12-14": "III Niedziela Adwentu",
      "2025-12-21": "Święto Świętej Rodziny Jezusa, Maryi i Józefa",
      "2025-12-28": "Święto Świętej Rodziny Jezusa, Maryi i Józefa",
      "2026-01-04": "II Niedziela po Narodzeniu Pańskim",
      "2026-01-11": "Niedziela Chrztu Pańskiego",
      "2026-01-18": "II Niedziela zwykła",
      "2026-01-25": "III Niedziela zwykła",
      "2026-02-01": "IV Niedziela zwykła",
      "2026-02-08": "V Niedziela zwykła",
      "2026-02-15": "VI Niedziela zwykła",
      "2026-02-22": "VII Niedziela zwykła",
      "2026-03-01": "VIII Niedziela zwykła",
      "2026-03-08": "I Niedziela Wielkiego Postu",
      "2026-03-15": "II Niedziela Wielkiego Postu",
      "2026-03-22": "III Niedziela Wielkiego Postu",
      "2026-03-29": "Niedziela Palmowa",
      "2026-04-05": "Niedziela Zmartwychwstania Pańskiego",
      "2026-04-12": "II Niedziela Wielkanocna (Miłosierdzia Bożego)",
      "2026-04-19": "III Niedziela Wielkanocna",
      "2026-04-26": "IV Niedziela Wielkanocna",
      "2026-05-03": "V Niedziela Wielkanocna",
      "2026-05-10": "VI Niedziela Wielkanocna",
      "2026-05-17": "Uroczystość Wniebowstąpienia Pańskiego",
      "2026-05-24": "Uroczystość Zesłania Ducha Świętego",
      "2026-05-31": "Uroczystość Najświętszej Trójcy",
      "2026-06-07": "IX Niedziela zwykła",
      "2026-06-14": "X Niedziela zwykła",
      "2026-06-21": "XI Niedziela zwykła",
      "2026-06-28": "Uroczystość Świętych Apostołów Piotra i Pawła",
      "2026-07-05": "XII Niedziela zwykła",
      "2026-07-12": "XIII Niedziela zwykła",
      "2026-07-19": "XIV Niedziela zwykła",
      "2026-07-26": "XV Niedziela zwykła",
      "2026-08-02": "XVI Niedziela zwykła",
      "2026-08-09": "XVII Niedziela zwykła",
      "2026-08-16": "XVIII Niedziela zwykła",
      "2026-08-23": "XIX Niedziela zwykła",
      "2026-08-30": "XX Niedziela zwykła",
      "2026-09-06": "XXI Niedziela zwykła",
      "2026-09-13": "XXII Niedziela zwykła",
      "2026-09-20": "XXIII Niedziela zwykła",
      "2026-09-27": "XXIV Niedziela zwykła",
      "2026-10-04": "XXV Niedziela zwykła",
      "2026-10-11": "XXVI Niedziela zwykła",
      "2026-10-18": "XXVII Niedziela zwykła",
      "2026-10-25": "XXVIII Niedziela zwykła",
      "2026-11-01": "Uroczystość Wszystkich Świętych",
      "2026-11-08": "XXIX Niedziela zwykła",
      "2026-11-15": "XXX Niedziela zwykła",
      "2026-11-22": "Uroczystość Jezusa Chrystusa Króla Wszechświata",
      "2026-11-29": "I Niedziela Adwentu",
      "2026-12-06": "II Niedziela Adwentu",
      "2026-12-13": "III Niedziela Adwentu",
      "2026-12-20": "IV Niedziela Adwentu",
      "2026-12-27": "Święto Świętej Rodziny Jezusa, Maryi i Józefa"
  };

  constructor() {
    this.debounceTimers = new Map();
  }

  // Funkcja debounce
  debounce(func, delay, key = 'default') {
    return (...args) => {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }
      
      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    };
  }

  // Wyświetlanie błędów
  showError(message, duration = 5000) {
    // Usuń poprzednie błędy
    const existingError = document.querySelector('.error-toast');
    if (existingError) {
      existingError.remove();
    }

    // Utwórz nowy element błędu
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      word-wrap: break-word;
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Usuń po określonym czasie
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, duration);
  }

  // Wyświetlanie sukcesu
  showSuccess(message, duration = 3000) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      word-wrap: break-word;
    `;
    successDiv.textContent = message;

    document.body.appendChild(successDiv);

    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, duration);
  }

  // Potwierdzenie
  confirm(message) {
    return new Promise((resolve) => {
      const result = window.confirm(message);
      resolve(result);
    });
  }

  // Formatowanie daty
  formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString('pl-PL');
  }

  // Formatowanie daty do formatu YYYY-MM-DD
  formatDateForAPI(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    // Użyj lokalnej strefy czasowej zamiast UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Pobieranie nazwy święta
  getSwietoName(date) {
    const dateStr = this.formatDateForAPI(date);
    
    
    // Sprawdź czy to święto nakazane
    if (Utils.swietaNakazane && Utils.swietaNakazane[dateStr]) {
      return Utils.swietaNakazane[dateStr];
    }
    
    // Sprawdź czy to niedziela liturgiczna
    if (Utils.niedzieleLiturgiczne && Utils.niedzieleLiturgiczne[dateStr]) {
      return Utils.niedzieleLiturgiczne[dateStr];
    }
    
    // Dla zwykłych niedziel
    return 'Niedziela';
  }

  // Sprawdzanie czy to święto nakazane
  isSwietoNakazane(date) {
    const dateStr = this.formatDateForAPI(date);
    return Utils.swietaNakazane && Utils.swietaNakazane[dateStr];
  }

  // Drukowanie zawartości
  printContent(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      this.showError('Nie znaleziono elementu do druku');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Druk - ${document.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // Eksport do PDF (używa jsPDF)
  exportToPDF(title, content) {
    if (typeof window.jspdf === 'undefined') {
      this.showError('Biblioteka jsPDF nie jest załadowana');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text(title, 20, 20);
    
    // Dodaj zawartość (uproszczone)
    const lines = content.split('\n');
    let y = 40;
    
    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 10;
    });
    
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  }

  // Walidacja email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Walidacja telefonu
  isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
  }

  // Sanityzacja tekstu
  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[<>]/g, '').trim();
  }

  // Generowanie unikalnego ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // --- FUNKCJE SZYFROWANIA DANYCH (RODO) ---
  
  // Klucz szyfrowania - w produkcji powinien być w zmiennej środowiskowej
  static ENCRYPTION_KEY = 'OdwiedzinyChorych2024!@#$%^&*()_+';

  // Generuje losowy IV (Initialization Vector) dla każdego szyfrowania
  static generateIV() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return array;
  }

  // Szyfruje dane używając AES-256-CBC
  static async encryptData(data) {
    try {
      const textEncoder = new TextEncoder();
      const dataBuffer = textEncoder.encode(JSON.stringify(data));
      
      const key = await crypto.subtle.importKey(
        'raw',
        textEncoder.encode(Utils.ENCRYPTION_KEY),
        { name: 'AES-CBC' },
        false,
        ['encrypt']
      );
      
      const iv = Utils.generateIV();
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: iv },
        key,
        dataBuffer
      );
      
      // Konwertuj do base64 dla łatwego przechowywania
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      
      return {
        encrypted: encryptedBase64,
        iv: ivBase64
      };
    } catch (error) {
      console.error('Błąd podczas szyfrowania:', error);
      throw new Error('Nie udało się zaszyfrować danych');
    }
  }

  // Deszyfruje dane używając AES-256-CBC
  static async decryptData(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv) {
        return null; // Brak zaszyfrowanych danych
      }
      
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();
      
      // Dekoduj z base64
      const encryptedArray = new Uint8Array(
        atob(encryptedData.encrypted).split('').map(char => char.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
      );
      
      const key = await crypto.subtle.importKey(
        'raw',
        textEncoder.encode(Utils.ENCRYPTION_KEY),
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: iv },
        key,
        encryptedArray
      );
      
      const decryptedText = textDecoder.decode(decryptedBuffer);
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('Błąd podczas deszyfrowania:', error);
      throw new Error('Nie udało się odszyfrować danych');
    }
  }

  // Sprawdza czy dane są zaszyfrowane
  static isEncrypted(data) {
    return data && typeof data === 'object' && data.encrypted && data.iv;
  }

  // --- FUNKCJE API ---

  // Wrapper dla API fetch z obsługą autoryzacji
  static async fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (response.status === 401) {
        // Token wygasł lub użytkownik nie jest zalogowany
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        throw new Error('Sesja wygasła');
      }
      
      return response;
    } catch (error) {
      console.error('Błąd API:', error);
      throw error;
    }
  }

  // --- FUNKCJE KALENDARZA ---

  // Pobiera wszystkie daty świąt dla danego roku
  static getAllHolidayDates(year = new Date().getFullYear()) {
    const dates = new Set();
    
    // Dodaj święta nakazane
    Object.keys(Utils.swietaNakazane).forEach(date => {
      if (date.startsWith(year.toString())) {
        dates.add(date);
      }
    });
    
    // Dodaj niedziele liturgiczne
    Object.keys(Utils.niedzieleLiturgiczne).forEach(date => {
      if (date.startsWith(year.toString())) {
        dates.add(date);
      }
    });
    
    return Array.from(dates).sort();
  }

  // Sprawdza czy data jest świętem nakazanym
  static isHoliday(date) {
    const dateStr = typeof date === 'string' ? date : Utils.formatDateForAPI(date);
    return Utils.swietaNakazane && Utils.swietaNakazane[dateStr];
  }

  // Pobiera nazwę święta dla daty
  static getHolidayName(date, year = new Date().getFullYear()) {
    const dateStr = typeof date === 'string' ? date : Utils.formatDateForAPI(date);
    
    // Sprawdź święta nakazane
    if (Utils.swietaNakazane && Utils.swietaNakazane[dateStr]) {
      return Utils.swietaNakazane[dateStr];
    }
    
    // Sprawdź niedziele liturgiczne
    if (Utils.niedzieleLiturgiczne && Utils.niedzieleLiturgiczne[dateStr]) {
      return Utils.niedzieleLiturgiczne[dateStr];
    }
    
    return '';
  }

  // --- FUNKCJE DRUKOWANIA ---

  // Drukowanie zawartości z obsługą specjalnych przypadków
  static printContent(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element o ID "${elementId}" nie został znaleziony`);
      return;
    }

    // Skopiuj HTML do tymczasowego elementu
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = element.innerHTML;

    // Specjalna obsługa dla zakładki 'chorzy' - zamiana selectów na tekst
    if (elementId === 'chorzy') {
      const selectsTemp = tempDiv.querySelectorAll('select');
      const selectsOriginal = element.querySelectorAll('select');
      selectsTemp.forEach((select, idx) => {
        if (selectsOriginal[idx]) {
          select.value = selectsOriginal[idx].value;
        }
        let selectedText = '';
        for (const option of select.options) {
          if (option.value === select.value) {
            selectedText = option.textContent;
            break;
          }
        }
        const textNode = document.createTextNode(selectedText);
        select.parentNode.replaceChild(textNode, select);
      });
    }

    // Utwórz nowe okno do drukowania
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Drukuj</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f2f2f2; }
          .swieto { background-color: #ffe6e6; }
          .wiersz-tak { background-color: #e6ffe6; }
          .wiersz-nie { background-color: #ffe6e6; }
          button { display: none; }
          .add-row { display: none; }
        </style>
      </head>
      <body>
        ${tempDiv.innerHTML}
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  }
}

// Eksport instancji dla łatwego użycia
export const utils = new Utils();

// Moduł narzędzi pomocniczych
// Updated: 2025-01-15 15:30
import { pobierzNazweSwieta, czySwietoNakazane } from './swieta.js';

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
      "2026-12-26": "Drugi Dzień Bożego Narodzenia",
      "2027-01-01": "Świętej Bożej Rodzicielki Maryi",
      "2027-01-06": "Objawienie Pańskie (Trzech Króli)",
      "2027-03-28": "Niedziela Zmartwychwstania Pańskiego",
      "2027-03-29": "Poniedziałek Wielkanocny",
      "2027-05-09": "Uroczystość Wniebowstąpienia Pańskiego",
      "2027-05-16": "Uroczystość Zesłania Ducha Świętego",
      "2027-05-27": "Boże Ciało",
      "2027-08-15": "Wniebowzięcie NMP",
      "2027-11-01": "Uroczystość Wszystkich Świętych",
      "2027-12-25": "Boże Narodzenie",
      "2027-12-26": "Drugi Dzień Bożego Narodzenia",
      "2028-01-01": "Świętej Bożej Rodzicielki Maryi",
      "2028-01-06": "Objawienie Pańskie (Trzech Króli)",
      "2028-04-16": "Niedziela Zmartwychwstania Pańskiego",
      "2028-04-17": "Poniedziałek Wielkanocny",
      "2028-05-28": "Uroczystość Wniebowstąpienia Pańskiego",
      "2028-06-04": "Uroczystość Zesłania Ducha Świętego",
      "2028-06-15": "Boże Ciało",
      "2028-08-15": "Wniebowzięcie NMP",
      "2028-11-01": "Uroczystość Wszystkich Świętych",
      "2028-12-25": "Boże Narodzenie",
      "2028-12-26": "Drugi Dzień Bożego Narodzenia"
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
      "2025-06-01": "Uroczystość Wniebowstąpienia Pańskiego",
      "2025-06-08": "Uroczystość Zesłania Ducha Świętego",
      "2025-06-15": "Uroczystość Najświętszej Trójcy",
      "2025-06-22": "XII Niedziela zwykła",
      "2025-06-29": "XIII Niedziela zwykła",
      "2025-07-06": "XIV Niedziela zwykła",
      "2025-07-13": "XV Niedziela zwykła",
      "2025-07-20": "XVI Niedziela zwykła",
      "2025-07-27": "XVII Niedziela zwykła",
      "2025-08-03": "XVIII Niedziela zwykła",
      "2025-08-10": "XIX Niedziela zwykła",
      "2025-08-17": "XX Niedziela zwykła",
      "2025-08-24": "XXI Niedziela zwykła",
      "2025-08-31": "XXII Niedziela zwykła",
      "2025-09-07": "XXIII Niedziela zwykła",
      "2025-09-14": "XXIV Niedziela zwykła",
      "2025-09-21": "XXV Niedziela zwykła",
      "2025-09-28": "XXVI Niedziela zwykła",
      "2025-10-05": "XXVII Niedziela zwykła",
      "2025-10-12": "XXVIII Niedziela zwykła",
      "2025-10-19": "XXIX Niedziela zwykła",
      "2025-10-26": "XXX Niedziela zwykła",
      "2025-11-02": "XXXI Niedziela zwykła",
      "2025-11-09": "XXXII Niedziela zwykła",
      "2025-11-16": "XXXIII Niedziela zwykła",
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
      "2026-02-22": "I Niedziela Wielkiego Postu",
      "2026-03-01": "II Niedziela Wielkiego Postu",
      "2026-03-08": "III Niedziela Wielkiego Postu",
      "2026-03-15": "IV Niedziela Wielkiego Postu",
      "2026-03-22": "V Niedziela Wielkiego Postu",
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
      "2026-06-07": "X Niedziela zwykła",
      "2026-06-14": "XI Niedziela zwykła",
      "2026-06-21": "XII Niedziela zwykła",
      "2026-06-28": "XIII Niedziela zwykła",
      "2026-07-05": "XIV Niedziela zwykła",
      "2026-07-12": "XV Niedziela zwykła",
      "2026-07-19": "XVI Niedziela zwykła",
      "2026-07-26": "XVII Niedziela zwykła",
      "2026-08-02": "XVIII Niedziela zwykła",
      "2026-08-09": "XIX Niedziela zwykła",
      "2026-08-16": "XX Niedziela zwykła",
      "2026-08-23": "XXI Niedziela zwykła",
      "2026-08-30": "XXII Niedziela zwykła",
      "2026-09-06": "XXIII Niedziela zwykła",
      "2026-09-13": "XXIV Niedziela zwykła",
      "2026-09-20": "XXV Niedziela zwykła",
      "2026-09-27": "XXVI Niedziela zwykła",
      "2026-10-04": "XXVII Niedziela zwykła",
      "2026-10-11": "XXVIII Niedziela zwykła",
      "2026-10-18": "XXIX Niedziela zwykła",
      "2026-10-25": "XXX Niedziela zwykła",
      "2026-11-01": "Uroczystość Wszystkich Świętych",
      "2026-11-08": "XXXII Niedziela zwykła",
      "2026-11-15": "XXXIII Niedziela zwykła",
      "2026-11-22": "Uroczystość Jezusa Chrystusa Króla Wszechświata",
      "2026-11-29": "I Niedziela Adwentu",
      "2026-12-06": "II Niedziela Adwentu",
      "2026-12-13": "III Niedziela Adwentu",
      "2026-12-20": "IV Niedziela Adwentu",
      "2026-12-27": "Święto Świętej Rodziny Jezusa, Maryi i Józefa",
      "2027-01-03": "II Niedziela po Narodzeniu Pańskim",
      "2027-01-10": "Niedziela Chrztu Pańskiego",
      "2027-01-17": "II Niedziela zwykła",
      "2027-01-24": "III Niedziela zwykła",
      "2027-01-31": "IV Niedziela zwykła",
      "2027-02-07": "V Niedziela zwykła",
      "2027-02-14": "VI Niedziela zwykła",
      "2027-02-21": "I Niedziela Wielkiego Postu",
      "2027-02-28": "II Niedziela Wielkiego Postu",
      "2027-03-07": "III Niedziela Wielkiego Postu",
      "2027-03-14": "IV Niedziela Wielkiego Postu",
      "2027-03-21": "Niedziela Palmowa",
      "2027-03-28": "Niedziela Zmartwychwstania Pańskiego",
      "2027-04-04": "II Niedziela Wielkanocna (Miłosierdzia Bożego)",
      "2027-04-11": "III Niedziela Wielkanocna",
      "2027-04-18": "IV Niedziela Wielkanocna",
      "2027-04-25": "V Niedziela Wielkanocna",
      "2027-05-02": "VI Niedziela Wielkanocna",
      "2027-05-09": "Uroczystość Wniebowstąpienia Pańskiego",
      "2027-05-16": "Uroczystość Zesłania Ducha Świętego",
      "2027-05-23": "Uroczystość Najświętszej Trójcy",
      "2027-05-30": "IX Niedziela zwykła",
      "2027-06-06": "X Niedziela zwykła",
      "2027-06-13": "XI Niedziela zwykła",
      "2027-06-20": "XII Niedziela zwykła",
      "2027-06-27": "XIII Niedziela zwykła",
      "2027-07-04": "XIV Niedziela zwykła",
      "2027-07-11": "XV Niedziela zwykła",
      "2027-07-18": "XVI Niedziela zwykła",
      "2027-07-25": "XVII Niedziela zwykła",
      "2027-08-01": "XVIII Niedziela zwykła",
      "2027-08-08": "XIX Niedziela zwykła",
      "2027-08-15": "Wniebowzięcie NMP",
      "2027-08-22": "XXI Niedziela zwykła",
      "2027-08-29": "XXII Niedziela zwykła",
      "2027-09-05": "XXIII Niedziela zwykła",
      "2027-09-12": "XXIV Niedziela zwykła",
      "2027-09-19": "XXV Niedziela zwykła",
      "2027-09-26": "XXVI Niedziela zwykła",
      "2027-10-03": "XXVII Niedziela zwykła",
      "2027-10-10": "XXVIII Niedziela zwykła",
      "2027-10-17": "XXIX Niedziela zwykła",
      "2027-10-24": "XXX Niedziela zwykła",
      "2027-10-31": "XXXI Niedziela zwykła",
      "2027-11-07": "XXXII Niedziela zwykła",
      "2027-11-14": "XXXIII Niedziela zwykła",
      "2027-11-21": "Uroczystość Jezusa Chrystusa Króla Wszechświata",
      "2027-11-28": "I Niedziela Adwentu",
      "2027-12-05": "II Niedziela Adwentu",
      "2027-12-12": "III Niedziela Adwentu",
      "2027-12-19": "IV Niedziela Adwentu",
      "2027-12-26": "Święto Świętej Rodziny Jezusa, Maryi i Józefa",
      "2028-01-02": "II Niedziela po Narodzeniu Pańskim",
      "2028-01-09": "Niedziela Chrztu Pańskiego",
      "2028-01-16": "II Niedziela zwykła",
      "2028-01-23": "III Niedziela zwykła",
      "2028-01-30": "IV Niedziela zwykła",
      "2028-02-06": "V Niedziela zwykła",
      "2028-02-13": "VI Niedziela zwykła",
      "2028-02-20": "VII Niedziela zwykła",
      "2028-02-27": "VIII Niedziela zwykła",
      "2028-03-05": "I Niedziela Wielkiego Postu",
      "2028-03-12": "II Niedziela Wielkiego Postu",
      "2028-03-19": "III Niedziela Wielkiego Postu",
      "2028-03-26": "IV Niedziela Wielkiego Postu",
      "2028-04-02": "V Niedziela Wielkiego Postu",
      "2028-04-09": "Niedziela Palmowa",
      "2028-04-16": "Niedziela Zmartwychwstania Pańskiego",
      "2028-04-23": "II Niedziela Wielkanocna (Miłosierdzia Bożego)",
      "2028-04-30": "III Niedziela Wielkanocna",
      "2028-05-07": "IV Niedziela Wielkanocna",
      "2028-05-14": "V Niedziela Wielkanocna",
      "2028-05-21": "VI Niedziela Wielkanocna",
      "2028-05-28": "Uroczystość Wniebowstąpienia Pańskiego",
      "2028-06-04": "Uroczystość Zesłania Ducha Świętego",
      "2028-06-11": "Uroczystość Najświętszej Trójcy",
      "2028-06-18": "XI Niedziela zwykła",
      "2028-06-25": "XII Niedziela zwykła",
      "2028-07-02": "XIII Niedziela zwykła",
      "2028-07-09": "XIV Niedziela zwykła",
      "2028-07-16": "XV Niedziela zwykła",
      "2028-07-23": "XVI Niedziela zwykła",
      "2028-07-30": "XVII Niedziela zwykła",
      "2028-08-06": "XVIII Niedziela zwykła",
      "2028-08-13": "XIX Niedziela zwykła",
      "2028-08-20": "XX Niedziela zwykła",
      "2028-08-27": "XXI Niedziela zwykła",
      "2028-09-03": "XXII Niedziela zwykła",
      "2028-09-10": "XXIII Niedziela zwykła",
      "2028-09-17": "XXIV Niedziela zwykła",
      "2028-09-24": "XXV Niedziela zwykła",
      "2028-10-01": "XXVI Niedziela zwykła",
      "2028-10-08": "XXVII Niedziela zwykła",
      "2028-10-15": "XXVIII Niedziela zwykła",
      "2028-10-22": "XXIX Niedziela zwykła",
      "2028-10-29": "XXX Niedziela zwykła",
      "2028-11-05": "XXXI Niedziela zwykła",
      "2028-11-12": "XXXII Niedziela zwykła",
      "2028-11-19": "XXXIII Niedziela zwykła",
      "2028-11-26": "Uroczystość Jezusa Chrystusa Króla Wszechświata",
      "2028-12-03": "I Niedziela Adwentu",
      "2028-12-10": "II Niedziela Adwentu",
      "2028-12-17": "III Niedziela Adwentu",
      "2028-12-24": "IV Niedziela Adwentu",
      "2028-12-31": "Święto Świętej Rodziny Jezusa, Maryi i Józefa"
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
    const year = date.getFullYear();
    
    // Użyj funkcji z modułu swieta.js dla dynamicznego roku
    return this.getSwietoNameForYear(dateStr, year);
  }
  
  // Pobieranie nazwy święta dla konkretnego roku
  getSwietoNameForYear(dateStr, year) {
    // Użyj funkcji z modułu swieta.js
    return pobierzNazweSwieta(dateStr, year);
  }

  // Sprawdzanie czy to święto nakazane
  isSwietoNakazane(date) {
    const dateStr = this.formatDateForAPI(date);
    const year = date.getFullYear();
    
    // Użyj funkcji z modułu swieta.js
    return czySwietoNakazane(dateStr, year);
  }

  // Drukowanie zawartości
  printContent(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      this.showError('Nie znaleziono elementu do druku');
      return;
    }

    // Sklonuj element i usuń kolumnę z przyciskami "Akcje"
    const clonedElement = element.cloneNode(true);
    
    // Usuń ostatnią kolumnę (Akcje) z nagłówków
    const headerRow = clonedElement.querySelector('thead tr');
    if (headerRow) {
      const lastHeader = headerRow.querySelector('th:last-child');
      if (lastHeader && lastHeader.textContent.trim() === 'Akcje') {
        lastHeader.remove();
      }
    }
    
    // Usuń ostatnią kolumnę z każdego wiersza danych
    const dataRows = clonedElement.querySelectorAll('tbody tr');
    dataRows.forEach(row => {
      const lastCell = row.querySelector('td:last-child');
      if (lastCell) {
        lastCell.remove();
      }
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Druk - ${document.title}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              max-width: 100%;
              table-layout: auto;
              border: 1px solid #333;
            }
            th, td { 
              border: 1px solid #333; 
              padding: 8px; 
              text-align: center; 
              vertical-align: middle; 
            }
            th { background-color: #f2f2f2; font-weight: bold; }
            button { display: none; }
            @media print {
              body { margin: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${clonedElement.outerHTML}
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
  
  // Klucz szyfrowania - pobierany z serwera
  static ENCRYPTION_KEY = null;
  
  // Inicjalizacja klucza szyfrowania z serwera
  static async initializeEncryptionKey() {
    if (Utils.ENCRYPTION_KEY) {
      return Utils.ENCRYPTION_KEY;
    }
    
    try {
      let response;
      
      // Użyj globalnego authManager jeśli dostępny
      if (window.authManager && window.authManager.getAuthHeaders) {
        const headers = window.authManager.getAuthHeaders();
        response = await fetch('/api/encryption-key', {
          method: 'GET',
          headers: headers
        });
      } else {
        // Fallback - użyj prostego tokenu (tylko dla rozwoju)
        response = await fetch('/api/encryption-key', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer simple-login-token',
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      Utils.ENCRYPTION_KEY = data.encryptionKey;
      console.log('✅ Klucz szyfrowania został pobrany z serwera');
      return Utils.ENCRYPTION_KEY;
    } catch (error) {
      console.error('❌ Błąd pobierania klucza szyfrowania:', error);
      // Fallback do domyślnego klucza (tylko dla rozwoju)
      Utils.ENCRYPTION_KEY = 'OdwiedzinyChorych2024!@#$%^&*()_+';
      console.warn('⚠️ Używany jest domyślny klucz szyfrowania');
      return Utils.ENCRYPTION_KEY;
    }
  }

  // Generuje losowy IV (Initialization Vector) dla każdego szyfrowania
  static generateIV() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return array;
  }

  // Szyfruje dane używając AES-256-CBC
  static async encryptData(data) {
    try {
      // Upewnij się, że klucz jest zainicjalizowany
      await Utils.initializeEncryptionKey();
      
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
      
      // Upewnij się, że klucz jest zainicjalizowany
      await Utils.initializeEncryptionKey();
      
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

// Funkcje pomocnicze dla wszystkich modułów

// Funkcja do drukowania zawartości
export function drukujZawartosc(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element o ID "${elementId}" nie został znaleziony`);
    return;
  }

  // Skopiuj HTML do tymczasowego elementu, aby można było go modyfikować
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = element.innerHTML;

  // Specjalna obsługa dla zakładki 'chorzy' - zamiana selectów na tekst TAK/NIE
  if (elementId === 'chorzy') {
    // Znajdź wszystkie selecty w kolumnie 'Aktualne' w tempDiv i w oryginalnej tabeli
    const selectsTemp = tempDiv.querySelectorAll('select');
    const selectsOriginal = element.querySelectorAll('select');
    selectsTemp.forEach((select, idx) => {
      // Ustaw wartość selecta w tempDiv na aktualną wartość z DOM
      if (selectsOriginal[idx]) {
        select.value = selectsOriginal[idx].value;
      }
      // Pobierz tekst opcji odpowiadającej aktualnej wartości selecta
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
  
  // Przygotuj zawartość do drukowania
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

  // Zapisz zawartość do nowego okna
  printWindow.document.write(printContent);
  printWindow.document.close();

  // Poczekaj na załadowanie i wydrukuj
  printWindow.onload = function() {
    printWindow.print();
    printWindow.close();
  };
}

/**
 * Wrapper dla API fetch, który obsługuje błędy autoryzacji (401).
 * W przypadku braku autoryzacji, przekierowuje na stronę logowania.
 * @param {string} url - URL do zasobu
 * @param {object} options - Opcje dla zapytania fetch
 * @returns {Promise<Response>}
 */
export async function fetchWithAuth(url, options) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    // Sesja wygasła lub użytkownik nie jest zalogowany.
    // Przekieruj na stronę logowania.
    window.location.href = 'login.php';
    // Rzuć błąd, aby zatrzymać dalsze wykonywanie kodu w bloku .then() lub try...catch
    throw new Error('Sesja wygasła.');
  }
  return response;
}

/**
 * Prosta funkcja debounce do opóźniania wywołań funkcji.
 * @param {Function} fn - Funkcja do opóźnienia
 * @param {number} delay - Opóźnienie w ms
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
} 

// --- FUNKCJE SZYFROWANIA DANYCH (RODO) ---

// Klucz szyfrowania - w produkcji powinien być w zmiennej środowiskowej
const ENCRYPTION_KEY = 'OdwiedzinyChorych2024!@#$%^&*()_+';

// Generuje losowy IV (Initialization Vector) dla każdego szyfrowania
function generateIV() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return array;
}

// Szyfruje dane używając AES-256-CBC
export async function encryptData(data) {
    try {
        const textEncoder = new TextEncoder();
        const dataBuffer = textEncoder.encode(JSON.stringify(data));
        
        const key = await crypto.subtle.importKey(
            'raw',
            textEncoder.encode(ENCRYPTION_KEY),
            { name: 'AES-CBC' },
            false,
            ['encrypt']
        );
        
        const iv = generateIV();
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
export async function decryptData(encryptedData) {
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
            textEncoder.encode(ENCRYPTION_KEY),
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
export function isEncrypted(data) {
    return data && typeof data === 'object' && data.encrypted && data.iv;
} 
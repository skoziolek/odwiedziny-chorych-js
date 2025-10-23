const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { encryptData, decryptData, isEncrypted } = require('../utils/crypto');

const router = express.Router();

// Prosty middleware autoryzacji dla API
const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Sprawdź czy to standardowy JWT token
    if (token !== 'simple-login-token') {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'OdwiedzinyChorych2024!@#$%^&*()_+';
      
      try {
        jwt.verify(token, JWT_SECRET);
        return next();
      } catch (error) {
        return res.status(401).json({ error: 'Nieprawidłowy token' });
      }
    }
    
    // Sprawdź czy to prosty token - ale tylko jeśli użytkownik się zalogował
    if (token === 'simple-login-token') {
      // Sprawdź czy użytkownik rzeczywiście się zalogował (sprawdź sesję)
      const sessionId = req.headers['x-session-id'];
      if (!sessionId || !isValidSimpleSession(sessionId)) {
        return res.status(401).json({ error: 'Nieprawidłowa sesja' });
      }
      return next();
    }
  }
  
  // Brak autoryzacji - zwróć błąd
  return res.status(401).json({ error: 'Brak autoryzacji' });
};

// Proste sesje w pamięci (w produkcji użyj Redis lub bazy danych)
const activeSessions = new Map();

// Generuj unikalny ID sesji
function generateSessionId() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Sprawdź czy sesja jest ważna
function isValidSimpleSession(sessionId) {
  if (!sessionId) return false;
  
  const session = activeSessions.get(sessionId);
  if (!session) return false;
  
  // Sprawdź czy sesja nie wygasła (24 godziny)
  const now = Date.now();
  if (now - session.createdAt > 24 * 60 * 60 * 1000) {
    activeSessions.delete(sessionId);
    return false;
  }
  
  return true;
}

// Dodaj nową sesję
function addSimpleSession() {
  const sessionId = generateSessionId();
  activeSessions.set(sessionId, {
    createdAt: Date.now(),
    type: 'simple-login'
  });
  return sessionId;
}

// Ścieżka do folderu z danymi
const DATA_DIR = path.join(__dirname, '../../data');

// POST /api/simple-login - Proste logowanie z hasłem
router.post('/simple-login', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Hasło jest wymagane' });
    }
    
    // Sprawdź hasło z zmiennych środowiskowych
    const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || 'PomocDlaChorych!';
    
    // Ostrzeżenie bezpieczeństwa
    if (!process.env.LOGIN_PASSWORD) {
      console.warn('⚠️  UWAGA BEZPIECZEŃSTWA: LOGIN_PASSWORD nie jest ustawiony!');
      console.warn('⚠️  Używane jest domyślne hasło - ZMIEŃ TO W PRODUKCJI!');
      console.warn('⚠️  Ustaw LOGIN_PASSWORD w pliku .env');
    }
    
    if (password === LOGIN_PASSWORD) {
      // Generuj sesję
      const sessionId = addSimpleSession();
      
      res.json({
        success: true,
        sessionId: sessionId,
        message: 'Zalogowano pomyślnie'
      });
    } else {
      res.status(401).json({ error: 'Nieprawidłowe hasło' });
    }
  } catch (error) {
    console.error('Błąd prostego logowania:', error);
    res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
});

// GET /api/encryption-key - Pobieranie klucza szyfrowania dla klienta
router.get('/encryption-key', authenticateAPI, (req, res) => {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'OdwiedzinyChorych2024!@#$%^&*()_+';
    res.json({ encryptionKey });
  } catch (error) {
    console.error('Błąd pobierania klucza szyfrowania:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania klucza szyfrowania' });
  }
});

/**
 * Pobiera dane z pliku JSON z obsługą szyfrowania
 * @param {string} filename - Nazwa pliku
 * @param {string} year - Opcjonalny rok dla kalendarza
 * @returns {Promise<any>} - Dane z pliku
 */
async function getDataFromFile(filename, year = null) {
  try {
    let filePath;
    if (filename === 'kalendarz' && year) {
      filePath = path.join(DATA_DIR, `kalendarz_${year}.json`);
    } else {
      filePath = path.join(DATA_DIR, `${filename}.json`);
    }

    if (!await fs.pathExists(filePath)) {
      return [];
    }

    const data = await fs.readJson(filePath);
    
    // Sprawdź czy dane są zaszyfrowane i deszyfruj jeśli tak
    if (isEncrypted(data)) {
      const decrypted = decryptData(data);
      return decrypted || [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Błąd odczytu pliku ${filename}:`, error);
    return [];
  }
}

/**
 * Zapisuje dane do pliku JSON z obsługą szyfrowania
 * @param {string} filename - Nazwa pliku
 * @param {any} data - Dane do zapisania
 * @param {string} year - Opcjonalny rok dla kalendarza
 * @returns {Promise<boolean>} - True jeśli zapis się powiódł
 */
async function saveDataToFile(filename, data, year = null) {
  try {
    let filePath;
    if (filename === 'kalendarz' && year) {
      filePath = path.join(DATA_DIR, `kalendarz_${year}.json`);
    } else {
      filePath = path.join(DATA_DIR, `${filename}.json`);
    }

    // Szyfruj dane dla wrażliwych plików
    let dataToSave = data;
    if (['chorzy', 'szafarze', 'historia'].includes(filename)) {
      dataToSave = encryptData(data);
    }

    await fs.writeJson(filePath, dataToSave, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(`Błąd zapisu pliku ${filename}:`, error);
    return false;
  }
}

// GET /api/:file - Pobieranie danych
router.get('/:file', authenticateAPI, async (req, res) => {
  
  try {
    const { file } = req.params;
    const { rok } = req.query;

    if (!['chorzy', 'szafarze', 'kalendarz', 'historia'].includes(file)) {
      return res.status(400).json({ error: 'Nieprawidłowy plik' });
    }

    const data = await getDataFromFile(file, rok);
    res.json(data);
  } catch (error) {
    console.error('Błąd pobierania danych:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania danych' });
  }
});

// POST /api/:file - Zapis danych
router.post('/:file', authenticateAPI, async (req, res) => {
  try {
    const { file } = req.params;
    const { rok } = req.query;
    const data = req.body;

    if (!['chorzy', 'szafarze', 'kalendarz', 'historia'].includes(file)) {
      return res.status(400).json({ error: 'Nieprawidłowy plik' });
    }

    // Obsługa akcji specjalnych dla kalendarza
    if (file === 'kalendarz') {
      const { action } = data;
      
      switch (action) {
        case 'zapisz_kalendarz':
        case 'resetuj_kalendarz':
          const success = await saveDataToFile(file, data.dane || [], rok);
          if (success) {
            res.json({ success: true });
          } else {
            res.status(500).json({ error: 'Błąd zapisu do pliku' });
          }
          return;

        case 'generuj_dane_testowe':
          // Generuj dane testowe dla wszystkich plików
          const testData = {
            kalendarz: generateTestCalendarData(),
            chorzy: generateTestChorzyData(),
            szafarze: generateTestSzafarzeData(),
            historia: []
          };

          const generatedFiles = [];
          for (const [filename, testDataForFile] of Object.entries(testData)) {
            const year = filename === 'kalendarz' ? rok : null;
            const success = await saveDataToFile(filename, testDataForFile, year);
            if (success) {
              generatedFiles.push(filename);
            }
          }

          if (generatedFiles.length > 0) {
            res.json({
              success: true,
              message: `Dane testowe zostały wygenerowane dla plików: ${generatedFiles.join(', ')}`
            });
          } else {
            res.status(500).json({ error: 'Błąd generowania danych testowych' });
          }
          return;

        case 'wyczyść_dane_testowe':
          // Wyczyść tylko dane testowe (nie szafarzy!)
          const filesToClear = ['kalendarz', 'chorzy', 'historia'];
          const clearedFiles = [];

          for (const filename of filesToClear) {
            const year = filename === 'kalendarz' ? rok : null;
            const success = await saveDataToFile(filename, [], year);
            if (success) {
              clearedFiles.push(filename);
            }
          }

          if (clearedFiles.length > 0) {
            res.json({
              success: true,
              message: `Dane testowe zostały wyczyszczone z plików: ${clearedFiles.join(', ')}`
            });
          } else {
            res.status(500).json({ error: 'Błąd czyszczenia danych testowych' });
          }
          return;

        default:
          res.status(400).json({ error: 'Nieznana akcja' });
          return;
      }
    }

    // Standardowy zapis danych
    const success = await saveDataToFile(file, data, rok);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Błąd zapisu do pliku' });
    }
  } catch (error) {
    console.error('Błąd zapisywania danych:', error);
    res.status(500).json({ error: 'Błąd serwera podczas zapisywania danych' });
  }
});

// Funkcje generowania danych testowych
function generateTestCalendarData() {
  const data = {};
  const year = new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const szafarze = ['Tomasz', 'pan Andrzej', 'Piotr', 'Dawid', 'Mateusz', 'Damian', 'Sebastian'];
  let szafarzIndex = 0;

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    
    // Generuj dane tylko dla niedziel (0 = niedziela)
    if (dayOfWeek === 0) {
      const dateStr = date.toISOString().split('T')[0];
      data[dateStr] = {
        osobaGlowna: szafarze[szafarzIndex % szafarze.length],
        pomocnik: '',
        uwagi: `Testowe odwiedziny dla ${dateStr}`
      };
      szafarzIndex++;
    }
  }
  
  return data;
}

function generateTestChorzyData() {
  return [
    {
      imieNazwisko: 'Jan Kowalski',
      adres: 'ul. Testowa 1, Warszawa',
      telefon: '123-456-789',
      uwagi: 'Testowy chory 1',
      aktualne: true,
      status: ''
    },
    {
      imieNazwisko: 'Anna Nowak',
      adres: 'ul. Przykładowa 5, Kraków',
      telefon: '987-654-321',
      uwagi: 'Testowy chory 2',
      aktualne: true,
      status: ''
    },
    {
      imieNazwisko: 'Piotr Wiśniewski',
      adres: 'ul. Demo 10, Gdańsk',
      telefon: '555-123-456',
      uwagi: 'Testowy chory 3',
      aktualne: true,
      status: ''
    }
  ];
}

function generateTestSzafarzeData() {
  return [
    {
      imieNazwisko: 'Tomasz Kowalczyk',
      telefon: '111-222-333',
      email: 'tomasz@test.pl',
      uwagi: 'Testowy szafarz 1'
    },
    {
      imieNazwisko: 'Marek Zieliński',
      telefon: '444-555-666',
      email: 'marek@test.pl',
      uwagi: 'Testowy szafarz 2'
    },
    {
      imieNazwisko: 'Andrzej Dąbrowski',
      telefon: '777-888-999',
      email: 'andrzej@test.pl',
      uwagi: 'Testowy szafarz 3'
    }
  ];
}

module.exports = router;



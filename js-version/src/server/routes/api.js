const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { encryptData, decryptData, isEncrypted } = require('../utils/crypto');

const router = express.Router();

const config = require('../config/security');

// Middleware autoryzacji dla API - tylko JWT
const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }
  
  const jwt = require('jsonwebtoken');
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesja wygasła. Zaloguj się ponownie.' });
    }
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

// Ścieżka do folderu z danymi
const DATA_DIR = path.join(__dirname, '../../data');

/**
 * Pobiera dane z pliku JSON z obsługą szyfrowania
 * @param {string} filename - Nazwa pliku
 * @param {string} year - Opcjonalny rok dla kalendarza
 * @returns {Promise<any>} - Dane z pliku
 */
async function getDataFromFile(filename, year = null) {
  try {
    let filePath;
    if ((filename === 'kalendarz' || filename === 'adwent') && year) {
      filePath = path.join(DATA_DIR, `${filename}_${year}.json`);
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
    if ((filename === 'kalendarz' || filename === 'adwent') && year) {
      filePath = path.join(DATA_DIR, `${filename}_${year}.json`);
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

    if (!['chorzy', 'szafarze', 'kalendarz', 'historia', 'adwent'].includes(file)) {
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

    if (!['chorzy', 'szafarze', 'kalendarz', 'historia', 'adwent'].includes(file)) {
      return res.status(400).json({ error: 'Nieprawidłowy plik' });
    }

    // Obsługa akcji specjalnych dla adwentu
    if (file === 'adwent') {
      const { action } = data;
      
      if (action === 'zapisz_adwent') {
        const success = await saveDataToFile(file, data.dane || {}, rok);
        if (success) {
          res.json({ success: true });
        } else {
          res.status(500).json({ error: 'Błąd zapisu do pliku' });
        }
        return;
      }
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
  const year = 2025;
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



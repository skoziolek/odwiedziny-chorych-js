const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { encryptData, decryptData, isEncrypted } = require('../utils/crypto');

const router = express.Router();

// Historia routes bez autoryzacji

// Ścieżka do pliku historii
const HISTORIA_FILE = path.join(__dirname, '../../data/historia.json');

/**
 * Pobiera dane historii z obsługą szyfrowania
 * @returns {Promise<Array>} - Dane historii
 */
async function getHistoriaData() {
  try {
    if (!await fs.pathExists(HISTORIA_FILE)) {
      return [];
    }

    const data = await fs.readJson(HISTORIA_FILE);
    
    if (isEncrypted(data)) {
      const decrypted = decryptData(data);
      return decrypted || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Błąd odczytu historii:', error);
    return [];
  }
}

/**
 * Zapisuje dane historii z obsługą szyfrowania
 * @param {Array} data - Dane do zapisania
 * @returns {Promise<boolean>} - True jeśli zapis się powiódł
 */
async function saveHistoriaData(data) {
  try {
    const encryptedData = encryptData(data);
    await fs.writeJson(HISTORIA_FILE, encryptedData, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Błąd zapisu historii:', error);
    return false;
  }
}

// GET /historia - Pobieranie danych historii
router.get('/', async (req, res) => {
  try {
    const data = await getHistoriaData();
    res.json(data);
  } catch (error) {
    console.error('Błąd pobierania historii:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania historii' });
  }
});

// POST /historia - Zapis danych historii
router.post('/', async (req, res) => {
  try {
    const { action, data } = req.body;

    switch (action) {
      case 'dodaj_odwiedziny':
        const historia = await getHistoriaData();
        const nowaOdwiedzina = {
          id: Date.now().toString(),
          data: data.data,
          chorzy: data.chorzy || [],
          uwagi: data.uwagi || '',
          timestamp: new Date().toISOString()
        };
        
        historia.push(nowaOdwiedzina);
        
        const success = await saveHistoriaData(historia);
        if (success) {
          res.json({ success: true, data: nowaOdwiedzina });
        } else {
          res.status(500).json({ error: 'Błąd zapisu odwiedzin' });
        }
        break;

      case 'aktualizuj_odwiedziny':
        const historiaUpdate = await getHistoriaData();
        const index = historiaUpdate.findIndex(item => item.id === data.id);
        
        if (index !== -1) {
          historiaUpdate[index] = { ...historiaUpdate[index], ...data, timestamp: new Date().toISOString() };
          const success = await saveHistoriaData(historiaUpdate);
          if (success) {
            res.json({ success: true, data: historiaUpdate[index] });
          } else {
            res.status(500).json({ error: 'Błąd aktualizacji odwiedzin' });
          }
        } else {
          res.status(404).json({ error: 'Nie znaleziono odwiedzin' });
        }
        break;

      case 'usun_odwiedziny':
        const historiaDelete = await getHistoriaData();
        const filteredHistoria = historiaDelete.filter(item => item.id !== data.id);
        
        const successDelete = await saveHistoriaData(filteredHistoria);
        if (successDelete) {
          res.json({ success: true });
        } else {
          res.status(500).json({ error: 'Błąd usuwania odwiedzin' });
        }
        break;

      case 'resetuj_statusy_odwiedzin':
        // Resetuj statusy odwiedzin w kalendarzu
        const kalendarzData = await getKalendarzData();
        const resetData = {};
        
        for (const [data, dane] of Object.entries(kalendarzData)) {
          resetData[data] = {
            ...dane,
            odwiedzeni: false,
            uwagiOdwiedzin: ''
          };
        }
        
        const successReset = await saveKalendarzData(resetData);
        if (successReset) {
          res.json({ success: true });
        } else {
          res.status(500).json({ error: 'Błąd resetowania statusów' });
        }
        break;

      case 'pobierz_raport_miesieczny':
        const { miesiac } = data;
        const raport = await generateMonthlyReport(miesiac);
        res.json({ success: true, data: raport });
        break;

      default:
        res.status(400).json({ error: 'Nieznana akcja' });
    }
  } catch (error) {
    console.error('Błąd przetwarzania historii:', error);
    res.status(500).json({ error: 'Błąd serwera podczas przetwarzania historii' });
  }
});

/**
 * Pobiera dane kalendarza
 * @param {string} year - Rok
 * @returns {Promise<Object>} - Dane kalendarza
 */
async function getKalendarzData(year = null) {
  try {
    // Jeśli rok nie jest podany, użyj aktualnego roku
    if (!year) {
      year = new Date().getFullYear().toString();
    }
    
    const kalendarzFile = path.join(__dirname, `../../data/kalendarz_${year}.json`);
    if (!await fs.pathExists(kalendarzFile)) {
      return {};
    }

    const data = await fs.readJson(kalendarzFile);
    return data || {};
  } catch (error) {
    console.error('Błąd odczytu kalendarza:', error);
    return {};
  }
}

/**
 * Zapisuje dane kalendarza
 * @param {Object} data - Dane kalendarza
 * @param {string} year - Rok
 * @returns {Promise<boolean>} - True jeśli zapis się powiódł
 */
async function saveKalendarzData(data, year = null) {
  try {
    // Jeśli rok nie jest podany, użyj aktualnego roku
    if (!year) {
      year = new Date().getFullYear().toString();
    }
    
    const kalendarzFile = path.join(__dirname, `../../data/kalendarz_${year}.json`);
    await fs.writeJson(kalendarzFile, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Błąd zapisu kalendarza:', error);
    return false;
  }
}

/**
 * Generuje raport miesięczny
 * @param {string} miesiac - Miesiąc w formacie YYYY-MM
 * @returns {Promise<Object>} - Raport miesięczny
 */
async function generateMonthlyReport(miesiac) {
  try {
    const [year, month] = miesiac.split('-');
    const kalendarzData = await getKalendarzData(year);
    const historiaData = await getHistoriaData();
    
    // Filtruj dane dla danego miesiąca
    const miesiacData = {};
    for (const [data, dane] of Object.entries(kalendarzData)) {
      if (data.startsWith(miesiac)) {
        miesiacData[data] = dane;
      }
    }
    
    // Filtruj historię dla danego miesiąca
    const miesiacHistoria = historiaData.filter(item => 
      item.data && item.data.startsWith(miesiac)
    );
    
    // Statystyki
    // Zbierz unikalne daty odwiedzin z historii dla danego miesiąca
    const uniqueVisitDates = [...new Set(miesiacHistoria.map(item => item.data))];
    
    // Zbierz unikalnych chorych odwiedzonych w danym miesiącu
    const uniqueChorzyMiesiac = new Set();
    miesiacHistoria.forEach(item => {
      if (item.chorzy && Array.isArray(item.chorzy)) {
        item.chorzy.forEach(chory => uniqueChorzyMiesiac.add(chory));
      }
    });
    
    // Zbierz unikalnych chorych odwiedzonych od początku roku (narastająco)
    const yearHistoria = historiaData.filter(item => 
      item.data && item.data.startsWith(year)
    );
    const uniqueChorzyRok = new Set();
    yearHistoria.forEach(item => {
      if (item.chorzy && Array.isArray(item.chorzy)) {
        item.chorzy.forEach(chory => uniqueChorzyRok.add(chory));
      }
    });
    
    const statystyki = {
      lacznaLiczbaOdwiedzin: uniqueVisitDates.length,
      odwiedzeniChorzyMiesiac: uniqueChorzyMiesiac.size,
      odwiedzeniChorzy: uniqueChorzyRok.size, // Łączna liczba od początku roku
      szafarze: [...new Set(Object.values(miesiacData).map(d => d.osobaGlowna).filter(Boolean))],
      daty: Object.keys(miesiacData).sort()
    };
    
    return {
      miesiac,
      kalendarz: miesiacData,
      historia: miesiacHistoria,
      statystyki
    };
  } catch (error) {
    console.error('Błąd generowania raportu:', error);
    return { miesiac, kalendarz: {}, historia: [], statystyki: {} };
  }
}

module.exports = router;



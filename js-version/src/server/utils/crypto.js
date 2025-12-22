const crypto = require('crypto');
const config = require('../config/security');

// Konfiguracja szyfrowania (RODO)
const ENCRYPTION_KEY = config.encryptionKey;
const ALGORITHM = 'aes-256-cbc';

/**
 * Szyfruje dane używając AES-256-CBC
 * @param {any} data - Dane do zaszyfrowania
 * @returns {Object} - Obiekt z zaszyfrowanymi danymi i IV
 */
function encryptData(data) {
  try {
    // Obsługa pustych danych
    if (data === null || data === undefined) {
      data = [];
    }

    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted: Buffer.from(encrypted, 'hex').toString('base64'),
      iv: iv.toString('base64')
    };
  } catch (error) {
    console.error('Błąd szyfrowania:', error);
    throw new Error('Błąd szyfrowania danych: ' + error.message);
  }
}

/**
 * Deszyfruje dane używając AES-256-CBC
 * @param {Object} encryptedData - Obiekt z zaszyfrowanymi danymi
 * @returns {any} - Odszyfrowane dane
 */
function decryptData(encryptedData) {
  try {
    if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv) {
      return null;
    }

    // Sprawdź format IV - czy to hex czy base64
    let iv, encryptedBuffer;
    
    // Sprawdź czy IV jest w formacie hex (32 znaki) czy base64
    if (encryptedData.iv.length === 32) {
      // Format hex (stary)
      iv = Buffer.from(encryptedData.iv, 'hex');
      encryptedBuffer = Buffer.from(encryptedData.encrypted, 'hex');
    } else {
      // Format base64 (nowy)
      iv = Buffer.from(encryptedData.iv, 'base64');
      encryptedBuffer = Buffer.from(encryptedData.encrypted, 'base64');
    }

    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedBuffer, null, 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Błąd deszyfrowania:', error);
    return null;
  }
}

/**
 * Sprawdza czy dane są zaszyfrowane
 * @param {any} data - Dane do sprawdzenia
 * @returns {boolean} - True jeśli dane są zaszyfrowane
 */
function isEncrypted(data) {
  return data && 
         typeof data === 'object' && 
         'encrypted' in data && 
         'iv' in data;
}

/**
 * Generuje hash hasła używając bcrypt
 * @param {string} password - Hasło do zahashowania
 * @returns {Promise<string>} - Zahashowane hasło
 */
async function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(password, 10);
}

/**
 * Porównuje hasło z hashem
 * @param {string} password - Hasło do sprawdzenia
 * @param {string} hash - Hash do porównania
 * @returns {Promise<boolean>} - True jeśli hasła się zgadzają
 */
async function comparePassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hash);
}

module.exports = {
  encryptData,
  decryptData,
  isEncrypted,
  hashPassword,
  comparePassword
};


/**
 * Konfiguracja bezpieczeństwa aplikacji
 * 
 * WAŻNE: W produkcji ustaw zmienne środowiskowe:
 * - APP_PASSWORD - hasło do logowania
 * - ENCRYPTION_KEY - klucz szyfrowania (min. 32 znaki)
 * - JWT_SECRET - sekret JWT
 */

// Wczytaj dotenv jeśli dostępny
try {
  require('dotenv').config();
} catch (e) {
  // dotenv nie zainstalowany - użyj wartości domyślnych
}

const config = {
  // Hasło do aplikacji (ZMIEŃ W PRODUKCJI!)
  appPassword: process.env.APP_PASSWORD || 'PomocDlaChorych!',
  
  // Klucz szyfrowania AES-256 (ZMIEŃ W PRODUKCJI!)
  encryptionKey: process.env.ENCRYPTION_KEY || 'OdwiedzinyChorych2024!@#$%^&*()_+',
  
  // Sekret JWT (ZMIEŃ W PRODUKCJI!)
  jwtSecret: process.env.JWT_SECRET || 'JWTSecretOdwiedziny2024!@#$%^&*()',
  
  // Czas wygaśnięcia sesji (8 godzin)
  sessionExpiry: parseInt(process.env.SESSION_EXPIRY) || 28800,
  
  // Tryb aplikacji
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Port
  port: parseInt(process.env.PORT) || 3000,
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minut
    maxRequests: 100, // max 100 żądań na okno
    maxLoginAttempts: 5, // max 5 prób logowania
    loginBlockTime: 15 * 60 * 1000 // blokada na 15 minut
  }
};

// Ostrzeżenie w produkcji jeśli używane są domyślne wartości
if (config.nodeEnv === 'production') {
  if (!process.env.APP_PASSWORD) {
    console.warn('⚠️ OSTRZEŻENIE: Używasz domyślnego hasła! Ustaw APP_PASSWORD.');
  }
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️ OSTRZEŻENIE: Używasz domyślnego klucza szyfrowania! Ustaw ENCRYPTION_KEY.');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ OSTRZEŻENIE: Używasz domyślnego sekretu JWT! Ustaw JWT_SECRET.');
  }
}

module.exports = config;



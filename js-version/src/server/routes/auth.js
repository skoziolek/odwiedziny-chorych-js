const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config/security');

const router = express.Router();

// Konfiguracja JWT z pliku konfiguracyjnego
const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN = config.sessionExpiry + 's'; // sekundy

// Ścieżka do pliku z danymi logowania
const LOGIN_LOCK_FILE = path.join(__dirname, '../../data/login_lock.json');

// Middleware do sprawdzania autoryzacji
const authenticateToken = (req, res, next) => {
  console.log(`🔐 AUTH MIDDLEWARE: ${req.method} ${req.url}`);
  console.log(`🔐 Headers:`, req.headers);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`🔐 BRAK TOKENU dla ${req.url}`);
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log(`🔐 BŁĘDNY TOKEN dla ${req.url}:`, err.message);
      return res.status(403).json({ error: 'Nieprawidłowy token' });
    }
    console.log(`🔐 TOKEN OK dla ${req.url}, user:`, user);
    req.user = user;
    next();
  });
};

// Funkcja do sprawdzania blokady logowania
async function checkLoginLock() {
  try {
    if (await fs.pathExists(LOGIN_LOCK_FILE)) {
      const lockData = await fs.readJson(LOGIN_LOCK_FILE);
      const now = new Date().getTime();
      
      if (lockData.lockedUntil && now < lockData.lockedUntil) {
        const remainingTime = Math.ceil((lockData.lockedUntil - now) / 1000 / 60);
        return { locked: true, remainingMinutes: remainingTime };
      }
    }
    return { locked: false };
  } catch (error) {
    console.error('Błąd sprawdzania blokady logowania:', error);
    return { locked: false };
  }
}

// Funkcja do ustawienia blokady logowania
async function setLoginLock(attempts) {
  try {
    const lockData = {
      attempts: attempts,
      lockedUntil: attempts >= 5 ? new Date().getTime() + (15 * 60 * 1000) : null // 15 minut blokady
    };
    await fs.writeJson(LOGIN_LOCK_FILE, lockData, { spaces: 2 });
  } catch (error) {
    console.error('Błąd ustawiania blokady logowania:', error);
  }
}

// POST /auth/simple-login - Proste logowanie tylko hasłem
router.post('/simple-login', async (req, res) => {
  try {
    const { password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    if (!password) {
      return res.status(400).json({ error: 'Hasło jest wymagane' });
    }

    // Sprawdź hasło z konfiguracji
    if (password !== config.appPassword) {
      // Zarejestruj nieudaną próbę
      if (req.app.locals.registerFailedLogin) {
        req.app.locals.registerFailedLogin(ip);
      }
      return res.status(401).json({ error: 'Nieprawidłowe hasło' });
    }

    // Resetuj licznik prób po udanym logowaniu
    if (req.app.locals.resetLoginAttempts) {
      req.app.locals.resetLoginAttempts(ip);
    }

    // Generuj token JWT
    const token = jwt.sign(
      { authenticated: true, loginTime: Date.now() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`✅ Udane logowanie z IP: ${ip}`);

    res.json({
      success: true,
      token,
      expiresIn: config.sessionExpiry
    });

  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
});

// POST /auth/login - Logowanie z nazwą użytkownika (legacy)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane' });
    }

    // Sprawdź blokadę logowania
    const lockStatus = await checkLoginLock();
    if (lockStatus.locked) {
      return res.status(423).json({ 
        error: `Konto zablokowane na ${lockStatus.remainingMinutes} minut` 
      });
    }

    // Sprawdź dane logowania (uproszczone - w produkcji użyj bazy danych)
    const validCredentials = {
      'admin': '$2a$10$NN.AGt48G6mli1teNG4pBecFpJ4WYpkyyPCFyNkNSpAmlFnTsE8uW', // password
      'test': '$2a$10$NN.AGt48G6mli1teNG4pBecFpJ4WYpkyyPCFyNkNSpAmlFnTsE8uW'  // password
    };

    const hashedPassword = validCredentials[username];
    if (!hashedPassword) {
      // Zwiększ licznik prób
      const lockData = await fs.pathExists(LOGIN_LOCK_FILE) ? 
        await fs.readJson(LOGIN_LOCK_FILE) : { attempts: 0 };
      await setLoginLock(lockData.attempts + 1);
      
      return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    }

    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      // Zwiększ licznik prób
      const lockData = await fs.pathExists(LOGIN_LOCK_FILE) ? 
        await fs.readJson(LOGIN_LOCK_FILE) : { attempts: 0 };
      await setLoginLock(lockData.attempts + 1);
      
      return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    }

    // Resetuj licznik prób po udanym logowaniu
    await setLoginLock(0);

    // Generuj token JWT
    const token = jwt.sign(
      { username, loggedin: true },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: { username, loggedin: true }
    });

  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
});

// POST /auth/logout - Wylogowanie
router.post('/logout', (req, res) => {
  // W JWT nie ma potrzeby "wylogowywania" po stronie serwera
  // Token po prostu wygasa
  res.json({ success: true, message: 'Wylogowano pomyślnie' });
});

// GET /auth/verify - Sprawdzenie statusu autoryzacji
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Middleware do eksportu
router.authenticateToken = authenticateToken;

module.exports = router;

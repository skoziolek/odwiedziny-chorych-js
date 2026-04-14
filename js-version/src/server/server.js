const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config/security');

// Import modułów
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const historiaRoutes = require('./routes/historia');

// Walidacja zmiennych środowiskowych
if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️  UWAGA: ENCRYPTION_KEY nie jest ustawiony w zmiennych środowiskowych!');
  console.warn('⚠️  To może być niebezpieczne w produkcji!');
  console.warn('⚠️  Skopiuj plik env.example jako .env i ustaw ENCRYPTION_KEY');
  console.warn('⚠️  Wygeneruj silny klucz: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

const app = express();
const PORT = config.port;

// Rate limiting - ochrona przed brute force
const loginAttempts = new Map(); // IP -> { count, lastAttempt, blocked }

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { count: 0, lastAttempt: now, blocked: false });
  }
  
  const attempt = loginAttempts.get(ip);
  
  // Sprawdź czy IP jest zablokowane
  if (attempt.blocked) {
    const timeLeft = config.rateLimit.loginBlockTime - (now - attempt.lastAttempt);
    if (timeLeft > 0) {
      return res.status(429).json({ 
        error: 'Zbyt wiele prób logowania',
        retryAfter: Math.ceil(timeLeft / 1000)
      });
    } else {
      // Odblokuj po upływie czasu
      attempt.blocked = false;
      attempt.count = 0;
    }
  }
  
  // Resetuj licznik po oknie czasowym
  if (now - attempt.lastAttempt > config.rateLimit.windowMs) {
    attempt.count = 0;
  }
  
  next();
}

// Funkcja do rejestrowania nieudanej próby logowania
function registerFailedLogin(ip) {
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { count: 0, lastAttempt: Date.now(), blocked: false });
  }
  
  const attempt = loginAttempts.get(ip);
  attempt.count++;
  attempt.lastAttempt = Date.now();
  
  if (attempt.count >= config.rateLimit.maxLoginAttempts) {
    attempt.blocked = true;
    console.log(`🚫 IP ${ip} zablokowane po ${attempt.count} nieudanych próbach logowania`);
  }
}

// Funkcja do resetowania licznika po udanym logowaniu
function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// Eksportuj funkcje dla routes
app.locals.registerFailedLogin = registerFailedLogin;
app.locals.resetLoginAttempts = resetLoginAttempts;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug middleware - loguj wszystkie żądania
app.use((req, res, next) => {
  console.log(`📥 ŻĄDANIE: ${req.method} ${req.url}`);
  console.log(`📥 Headers:`, req.headers.authorization ? 'Authorization: present' : 'No authorization');
  next();
});

// Routes z rate limiting dla logowania
app.use('/auth', rateLimitMiddleware, authRoutes);
app.use('/api', apiRoutes);
app.use('/historia', historiaRoutes);

// Serwowanie plików statycznych (PO routingach API!)
app.use(express.static(path.join(__dirname, '../client')));

// Główna strona
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/html/index.html'));
});

// 404 handler - MUSI być przed error handlerem
app.use((req, res) => {
  res.status(404).json({ error: 'Nie znaleziono' });
});

// Obsługa błędów - MUSI być na końcu
app.use((err, req, res, next) => {
  console.error('Błąd serwera:', err);
  res.status(500).json({ 
    error: 'Wystąpił błąd serwera',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Błąd wewnętrzny'
  });
});

// Uruchomienie serwera
app.listen(PORT, () => {
  console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
  console.log(`📱 Aplikacja dostępna pod adresem: http://localhost:${PORT}`);
  console.log(`🔧 Tryb: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


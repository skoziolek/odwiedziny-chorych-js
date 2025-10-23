const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs-extra');

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
const PORT = process.env.PORT || 3000;

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

// Routes
app.use('/auth', authRoutes);
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


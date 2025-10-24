require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const reservationsRouter = require('./routes/reservations');
const inquiriesRouter = require('./routes/inquiries');
const authRouter = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');
const emailService = require('./emails/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS konfigurace
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080'
    ].filter(Boolean);
    
    // Povolit requesty bez origin (např. Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Nepovolený přístup z tohoto origin'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // max 100 requestů za 15 minut
  message: { success: false, error: 'Příliš mnoho požadavků, zkuste to později' }
});

app.use('/api/', limiter);

// Speciální rate limit pro přihlášení
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // max 5 pokusů za 15 minut
  message: { success: false, error: 'Příliš mnoho pokusů o přihlášení' }
});

// API Routes
app.use('/api/auth', loginLimiter, authRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/inquiries', inquiriesRouter);

// Admin routes - chráněné autentizací
app.get('/api/admin/reservations', authenticateToken, (req, res) => {
  const reservationsRouter = require('./routes/reservations');
  reservationsRouter(req, res);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API server běží',
    timestamp: new Date().toISOString()
  });
});

// Test email endpoint (pouze pro development)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/test-email', async (req, res) => {
    try {
      const { type } = req.body;
      
      const testData = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        phone: '+420123456789',
        company: 'Test Company',
        message: 'Testovací zpráva',
        date: 'Pondělí, 25. října 2025',
        time: '09:00 - 12:00',
        duration: '3 hodiny',
        totalPrice: '297',
        itemName: 'Testovací položka',
        type: 'contact',
        service: 'Dlouhodobý pronájem kanceláří'
      };
      
      let result;
      switch(type) {
        case 'reservation-confirmation':
          result = await emailService.sendReservationConfirmation(testData);
          break;
        case 'reservation-notification':
          result = await emailService.sendReservationNotification(testData);
          break;
        case 'inquiry-confirmation':
          result = await emailService.sendInquiryConfirmation(testData);
          break;
        case 'inquiry-notification':
          result = await emailService.sendInquiryNotification(testData);
          break;
        default:
          return res.status(400).json({ success: false, error: 'Neznámý typ emailu' });
      }
      
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Došlo k chybě serveru'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint nenalezen' 
  });
});

// Spuštění serveru
app.listen(PORT, async () => {
  console.log(`\n🚀 API Server běží na portu ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Reservations: http://localhost:${PORT}/api/reservations`);
  console.log(`   Inquiries:    http://localhost:${PORT}/api/inquiries`);
  console.log(`   Auth:         http://localhost:${PORT}/api/auth`);
  
  // Test SMTP připojení
  console.log('\n📧 Testování SMTP připojení...');
  const emailConnected = await emailService.testConnection();
  
  if (!emailConnected) {
    console.log('⚠️  VAROVÁNÍ: Email služba není správně nakonfigurována');
    console.log('   Zkontrolujte .env soubor a nastavení MailTrap');
  }
  
  console.log('\n✨ Server je připraven\n');
});

module.exports = app;

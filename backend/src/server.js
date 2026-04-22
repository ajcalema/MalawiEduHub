const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
require('dotenv').config();

const app = express();

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('❌ JWT_SECRET and JWT_REFRESH_SECRET must be set');
  process.exit(1);
}

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000'],
  credentials: true,
}));

const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 1000,
  message: { error: 'Too many requests. Try again later.' } });
const authLimiter   = rateLimit({ windowMs: 15*60*1000, max: 50,
  message: { error: 'Too many login attempts. Wait 15 minutes.' } });

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (no rate limit for static files)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Apply rate limiter after static files
app.use(globalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', platform: 'MalawiEduHub' }));

app.use('/api/auth',      authLimiter,   require('./routes/auth'));
app.use('/api/documents',                 require('./routes/documents'));
app.use('/api/payments',                 require('./routes/payments'));
app.use('/api/subjects',                 require('./routes/subjects'));
app.use('/api/admin',                    require('./routes/admin'));
app.use('/api/cleanup',                  require('./routes/cleanup'));
app.use('/api/learn',                   require('./routes/learning'));

app.use((err, req, res, next) => {
  if (err.message?.includes('Only PDF'))  return res.status(400).json({ error: err.message });
  if (err.code === 'LIMIT_FILE_SIZE')     return res.status(400).json({ error: 'File too large. Max 20MB.' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

const PORT = process.env.PORT || 4000;

// Initialize database tables on startup
const { initTables } = require('./config/init-tables');
const { initPerformanceIndexes } = require('./config/init-performance');
const { initSettings } = require('./config/init-settings');
const { initLearningRoom } = require('./config/init-learning-room');

app.listen(PORT, async () => {
  console.log(`\n🚀 MalawiEduHub API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
  
  // Create missing tables
  await initTables();
  
  // Create performance indexes
  await initPerformanceIndexes();
  
  // Initialize default settings
  await initSettings();
  
  // Initialize Learning Room schema (tables, views, seed data)
  await initLearningRoom();
});

module.exports = app;

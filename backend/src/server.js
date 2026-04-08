const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200,
  message: { error: 'Too many requests. Try again later.' } });
const authLimiter   = rateLimit({ windowMs: 15*60*1000, max: 10,
  message: { error: 'Too many login attempts. Wait 15 minutes.' } });

app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok', platform: 'MalawiEduHub' }));

app.use('/api/auth',      authLimiter,   require('./routes/auth'));
app.use('/api/documents',                 require('./routes/documents'));
app.use('/api/payments',                 require('./routes/payments'));
app.use('/api/subjects',                 require('./routes/subjects'));
app.use('/api/admin',                    require('./routes/admin'));

app.use((err, req, res, next) => {
  if (err.message?.includes('Only PDF'))  return res.status(400).json({ error: err.message });
  if (err.code === 'LIMIT_FILE_SIZE')     return res.status(400).json({ error: 'File too large. Max 20MB.' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 MalawiEduHub API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;

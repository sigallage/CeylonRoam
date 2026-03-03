const express = require('express');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const itineraryRoutes = require('./src/routes/itinerary');

const protectedRoutes = require('./src/routes/protected');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'ceylonroam_secret_key_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', authRoutes);
app.use('/api/itineraries', itineraryRoutes);

app.use('/api/protected', protectedRoutes);

const PORT = Number(process.env.PORT || 5001);
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  if (!MONGODB_URI) {
    // Keep this explicit so it fails fast in dev.
    throw new Error('Missing MONGODB_URI in environment');
  }

  await mongoose.connect(MONGODB_URI);

  app.use((err, req, res,  next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res.status(err.statusCode).json({ 
        status: err.status,
        message: err.message,
    });
});

  app.listen(PORT, () => {
    console.log(`Auth service listening on port ${PORT}`);
    console.log('Connected to MongoDB!');
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

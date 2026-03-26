const express = require('express');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const itineraryRoutes = require('./src/routes/itinerary');

const protectedRoutes = require('./src/routes/protected');

const app = express();

function describeMongoTarget(uri) {
  try {
    const url = new URL(uri);
    const dbName = String(url.pathname || '').replace(/^\//, '');
    return {
      protocol: url.protocol,
      host: url.host,
      dbName,
    };
  } catch {
    return { protocol: '', host: '', dbName: '' };
  }
}

async function connectWithRetry(uri, { maxRetries = 10, initialDelayMs = 1000 } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await mongoose.connect(uri);
      return;
    } catch (err) {
      attempt += 1;
      if (attempt > maxRetries) {
        throw err;
      }
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), 15000);
      console.warn(`MongoDB connection failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

function resolveJwtSecret() {
  return resolveEnvSecretString('JWT_SECRET');
}

function resolveEnvSecretString(name) {
  const raw = String(process.env[name] || '').trim();
  if (!raw) return '';

  // When pulled from AWS Secrets Manager, this can be a JSON string
  // if the secret was stored as key/value pairs in the console.
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      // Prefer an exact key match (e.g., {"EMAIL_USER":"..."}).
      const exact = parsed?.[name];
      if (typeof exact === 'string' && exact.trim()) return exact.trim();

      // Common alternative key spellings when the secret is stored as key/value JSON.
      const lower = name.toLowerCase();
      const candidates = new Set([
        lower,
        lower.replace(/_/g, ''),
        lower.replace(/_/g, '-'),
      ]);

      if (name === 'EMAIL_USER') {
        ['email_user', 'email', 'user', 'username', 'gmail', 'emailUser'].forEach(k => candidates.add(k));
      }
      if (name === 'EMAIL_PASSWORD') {
        ['email_password', 'password', 'pass', 'app_password', 'appPassword', 'emailPass'].forEach(k => candidates.add(k));
      }

      for (const key of candidates) {
        const value = parsed?.[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
      }

      // Common alternative shapes.
      const value = parsed?.value;
      if (typeof value === 'string' && value.trim()) return value.trim();
    } catch {
      // Fall through and treat it as a raw secret string.
    }
  }

  return raw;
}

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

  const mongoTarget = describeMongoTarget(MONGODB_URI);
  if (mongoTarget.dbName) {
    console.log(`MongoDB target: ${mongoTarget.host}/${mongoTarget.dbName}`);
  } else {
    console.warn('MongoDB target database name is missing from MONGODB_URI; MongoDB may default to "test".');
  }

  const jwtSecret = resolveJwtSecret();
  if (!jwtSecret) {
    throw new Error('Missing JWT_SECRET in environment');
  }

  // Normalize so all modules read a consistent value.
  process.env.JWT_SECRET = jwtSecret;

  // Normalize email credentials too (supports Secrets Manager JSON secrets).
  const emailUser = resolveEnvSecretString('EMAIL_USER');
  const emailPassword = resolveEnvSecretString('EMAIL_PASSWORD');
  if (emailUser) process.env.EMAIL_USER = emailUser;
  if (emailPassword) process.env.EMAIL_PASSWORD = emailPassword;

  await connectWithRetry(MONGODB_URI);

  app.use((err, req, res,  next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    const payload = {
      status: err.status,
      message: err.message,
    };

    if (process.env.NODE_ENV !== 'production') {
      if (err.smtp) payload.smtp = err.smtp;
      payload.stack = err.stack;
    }

    res.status(err.statusCode).json(payload);
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

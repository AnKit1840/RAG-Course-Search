import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { pool, query } from './db.js';

// ---- Session Middleware Setup ----

const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({
    pool: pool,
    tableName: 'session',       // matches migration table name
    pruneSessionInterval: 60,   // cleanup expired sessions every 60 seconds
  }),
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,             // JS cannot read the cookie (XSS protection)
    secure: false,              // set to true in production with HTTPS
    sameSite: 'lax',            // works for same-site and top-level navigations
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
});

// ---- Auth Middleware ----

/**
 * Requires any authenticated user session.
 * Returns 401 if no valid session exists.
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required. Please log in.' });
}

/**
 * Requires an authenticated user with 'admin' role.
 * Returns 403 if the user is not an admin.
 */
export function requireAdmin(req, res, next) {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ error: 'Admin access required.' });
  }
  return res.status(401).json({ error: 'Authentication required. Please log in.' });
}

// ---- Auth Routes ----

const SALT_ROUNDS = 10;
export const authRouter = Router();

// POST /api/auth/register — Create a new user account
authRouter.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const assignedRole = role === 'admin' ? 'admin' : 'user';

  try {
    // Check if username already exists
    const existing = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    // Hash password and insert
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username, passwordHash, assignedRole]
    );

    const newUser = result.rows[0];

    // Auto-login after registration: create session
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    };

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: newUser.id, username: newUser.username, role: newUser.role }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login — Authenticate and create session
authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Create session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({
      message: 'Login successful.',
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/logout — Destroy session
authRouter.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err.message);
      return res.status(500).json({ error: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');  // default session cookie name
    res.json({ message: 'Logged out successfully.' });
  });
});

// GET /api/auth/me — Check current session (used for auto-login on page refresh)
authRouter.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  }
  return res.status(401).json({ error: 'Not authenticated.' });
});

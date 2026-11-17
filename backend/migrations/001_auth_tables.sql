-- =============================================
-- Migration 001: Authentication Tables
-- =============================================

-- Users table for storing registered accounts
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Session table required by connect-pg-simple
-- Column names and types must match exactly what the library expects
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Seed a default admin account
-- Password: admin123 (bcrypt hash with 10 rounds)
-- IMPORTANT: Change this password after first login!
INSERT INTO users (username, password_hash, role)
VALUES (
  'admin',
  '$2b$10$hI9AQdOdc9u3wt9bDxXFlu17WuRKXAW87QkTjJ3lsbucLrFhsCp96',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

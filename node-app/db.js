'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    name                    TEXT    NOT NULL,
    email                   TEXT    UNIQUE NOT NULL,
    password                TEXT    NOT NULL,
    subscription_tier_id    INTEGER,
    is_admin                INTEGER NOT NULL DEFAULT 0,
    questionaire_completed  INTEGER NOT NULL DEFAULT 0,
    conversation_history    TEXT,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tokenable_id  INTEGER NOT NULL,
    name          TEXT    NOT NULL,
    token         TEXT    UNIQUE NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscription_tiers (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS questions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    question      TEXT    NOT NULL,
    question_type INTEGER NOT NULL DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS options (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    option      TEXT    NOT NULL,
    question_id INTEGER NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  );

  CREATE TABLE IF NOT EXISTS answers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    answer_type INTEGER NOT NULL,
    content     TEXT,
    question_id INTEGER NOT NULL,
    user_id     INTEGER NOT NULL,
    option_id   INTEGER,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (user_id)     REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS services (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id  INTEGER NOT NULL,
    sub_service TEXT,
    tags        TEXT,
    content     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS emails (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Seed default services and system messages (runs only if empty) ────────────

const serviceCount = db.prepare('SELECT COUNT(*) as n FROM services').get().n;

if (serviceCount === 0) {
  const insertService = db.prepare('INSERT INTO services (name) VALUES (?)');
  const insertMsg     = db.prepare('INSERT INTO system_messages (service_id, content) VALUES (?, ?)');

  // service_id 1 = Chat
  const chat = insertService.run('Chat');
  insertMsg.run(chat.lastInsertRowid,
    'You are PocketGuru, a compassionate AI mental wellness guide. You provide supportive, empathetic, evidence-based guidance on mindfulness, stress management, and emotional wellbeing. Keep responses concise and warm.');
  insertMsg.run(chat.lastInsertRowid,
    'You are PocketGuru, a mindfulness coach. Help users develop healthy mental habits through conversation. Be encouraging, non-judgmental, and practical.');

  // service_id 2 = Meditation
  const med = insertService.run('Meditation');
  insertMsg.run(med.lastInsertRowid,
    'Guide the user through a calming 5-minute guided meditation. Use a peaceful, soothing tone. Include breathing cues, body scan, and visualization. Speak as if reading a script.');
  insertMsg.run(med.lastInsertRowid,
    'Lead the user through a short loving-kindness meditation. Use gentle language and encourage them to send compassion to themselves and others.');

  // service_id 3 = Breathing
  const breath = insertService.run('Breathing');
  insertMsg.run(breath.lastInsertRowid,
    'Guide the user through a box breathing exercise: inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Explain each step clearly and encourage them throughout.');
  insertMsg.run(breath.lastInsertRowid,
    'Guide the user through 4-7-8 breathing: inhale for 4 counts, hold for 7, exhale for 8. Explain how this activates the parasympathetic nervous system and reduces anxiety.');
}

module.exports = db;

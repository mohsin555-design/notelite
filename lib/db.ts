import Database from "better-sqlite3";

const db = new Database("notes.db");

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT
  )
`).run();

export default db;
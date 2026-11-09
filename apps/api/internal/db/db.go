// Package db provides SQLite persistence for AgentOS events.
package db

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite" // SQLite driver
)

// DB wraps the sql.DB connection with AgentOS-specific helpers.
type DB struct {
	*sql.DB
}

// Init opens (or creates) the SQLite database at the given path and runs migrations.
func Init(dbPath string) (*DB, error) {
	// Ensure parent directory exists
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return nil, err
	}

	sqlDB, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	// SQLite tuning: WAL mode + busy timeout for concurrent access
	if _, err := sqlDB.Exec(`PRAGMA journal_mode=WAL`); err != nil {
		log.Printf("[DB] WAL pragma warning: %v", err)
	}
	if _, err := sqlDB.Exec(`PRAGMA busy_timeout=5000`); err != nil {
		log.Printf("[DB] busy_timeout pragma warning: %v", err)
	}

	db := &DB{sqlDB}
	if err := db.migrate(); err != nil {
		return nil, err
	}
	return db, nil
}

// migrate creates all required tables and indexes if they don't already exist.
func (db *DB) migrate() error {
	const schema = `
CREATE TABLE IF NOT EXISTS events (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type        TEXT    NOT NULL,
  session_id        TEXT    NOT NULL,
  agent             TEXT,
  timestamp         TEXT    NOT NULL,
  input_tokens      INTEGER DEFAULT 0,
  output_tokens     INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  model             TEXT,
  cost_usd          REAL    DEFAULT 0,
  tool_name         TEXT,
  raw_json          TEXT    NOT NULL,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_model ON events(model);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent);
`
	_, err := db.Exec(schema)
	if err != nil {
		return err
	}
	log.Println("[DB] Schema migration OK")
	return nil
}


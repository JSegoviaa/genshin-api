CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX api_keys_prefix ON api_keys (prefix);

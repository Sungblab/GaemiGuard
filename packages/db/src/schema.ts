export const migrations = [
  `CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    user_message TEXT NOT NULL,
    permission_mode TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    answer TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS agent_run_events (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    metadata_json TEXT,
    FOREIGN KEY(run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    run_id TEXT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`
];


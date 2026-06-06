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
  )`,
  `CREATE TABLE IF NOT EXISTS toss_readonly_accounts (
    account_ref TEXT PRIMARY KEY,
    masked_account_no TEXT NOT NULL,
    account_type_json TEXT NOT NULL,
    last_synced_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS toss_holdings_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    account_ref TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    overview_json TEXT NOT NULL,
    FOREIGN KEY(account_ref) REFERENCES toss_readonly_accounts(account_ref) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS toss_quote_snapshots (
    symbol TEXT PRIMARY KEY,
    synced_at TEXT NOT NULL,
    quote_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS toss_orderbook_summary_snapshots (
    symbol TEXT PRIMARY KEY,
    synced_at TEXT NOT NULL,
    summary_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS toss_exchange_rate_snapshots (
    pair TEXT PRIMARY KEY,
    synced_at TEXT NOT NULL,
    rate_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS toss_market_calendar_snapshots (
    market TEXT PRIMARY KEY,
    calendar_date TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    calendar_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS toss_stock_warning_snapshots (
    symbol TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    warnings_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS toss_sync_logs (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    message TEXT NOT NULL,
    failure_category TEXT,
    safe_error_code TEXT,
    safe_request_id TEXT,
    retry_after_seconds INTEGER,
    next_retry_at TEXT,
    account_count INTEGER NOT NULL,
    holding_count INTEGER NOT NULL,
    quote_count INTEGER NOT NULL,
    orderbook_count INTEGER NOT NULL,
    exchange_rate_count INTEGER NOT NULL,
    market_calendar_count INTEGER NOT NULL,
    stock_warning_count INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS toss_rate_limit_metadata (
    scope TEXT PRIMARY KEY,
    captured_at TEXT NOT NULL,
    metadata_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS manual_watchlist_items (
    symbol TEXT PRIMARY KEY,
    market TEXT NOT NULL,
    name TEXT,
    note TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS manual_holdings (
    symbol TEXT PRIMARY KEY,
    market TEXT NOT NULL,
    currency TEXT NOT NULL,
    name TEXT,
    quantity TEXT NOT NULL,
    average_cost TEXT,
    note TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS manual_cash_balances (
    currency TEXT PRIMARY KEY,
    amount TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS investment_memory_records (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    identity_key TEXT NOT NULL,
    symbol TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    source_json TEXT NOT NULL,
    research_links_json TEXT
  )`
];

-- Standalone Finance schema. Apply to a new D1 database, never the MHO-231 synthetic database.
CREATE TABLE IF NOT EXISTS plaid_items (
  item_id TEXT PRIMARY KEY,
  owner_sub TEXT NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  institution_id TEXT,
  institution_name TEXT,
  cursor TEXT,
  status TEXT NOT NULL CHECK (status IN ('CONNECTED', 'SYNCING', 'ERROR', 'REAUTH_REQUIRED', 'DISCONNECTED')),
  last_synced_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS financial_accounts (
  account_id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES plaid_items(item_id),
  name TEXT NOT NULL,
  mask TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  currency TEXT,
  UNIQUE(item_id, account_id)
);
CREATE TABLE IF NOT EXISTS source_artifacts (
  object_key TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES plaid_items(item_id),
  acquired_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_facts (
  transaction_id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES plaid_items(item_id),
  account_id TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_minor TEXT NOT NULL,
  currency TEXT NOT NULL,
  pending INTEGER NOT NULL,
  removed INTEGER NOT NULL DEFAULT 0,
  pending_transaction_id TEXT,
  source_artifact_key TEXT NOT NULL REFERENCES source_artifacts(object_key),
  source_pointer TEXT NOT NULL,
  included_in_totals INTEGER NOT NULL DEFAULT 0,
  classification TEXT NOT NULL DEFAULT 'UNCLASSIFIED'
);
CREATE TABLE IF NOT EXISTS fact_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('ADDED', 'MODIFIED', 'REMOVED')),
  source_artifact_key TEXT NOT NULL REFERENCES source_artifacts(object_key),
  source_pointer TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  UNIQUE(transaction_id, source_artifact_key, event_kind)
);
CREATE INDEX IF NOT EXISTS finance_facts_item ON finance_facts(item_id);
CREATE INDEX IF NOT EXISTS financial_accounts_item ON financial_accounts(item_id);

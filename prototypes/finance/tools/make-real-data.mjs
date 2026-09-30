// make-real-data.mjs: turn the owner's local evidence store into the gitignored
// prototypes/finance/real-data.local.json, so the prototype can show the real thing on this
// machine only. Never commit or publish the output.
//
//   node prototypes/finance/tools/make-real-data.mjs [path/to/financial_sources.sqlite3]
//   (or set FINANCE_EVIDENCE_DB; there is no default path)
//
// What it reads, read-only (node:sqlite, readOnly: true):
// - finance_transactions: date, integer cents, status, category and merchant name.
// - finance_exports: SHA-256, row counts and date range of the exports.
// - supplied_documents: how many statements are registered and how many were reviewed.
// What it never emits: the description column (it carries Zelle and payroll payees, i.e.
// staff and other people's names), transaction ids, full account labels or numbers, file
// paths, or anything from the Gmail tables (messages, attachments, email bodies).
// Merchant names are kept only for business-merchant categories; transfers, income,
// financial, gifts, services, housing and uncategorised rows render as their category only.
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'real-data.local.json');
const dbPath = process.argv[2] || process.env.FINANCE_EVIDENCE_DB;
if (!dbPath) { console.error('Usage: node make-real-data.mjs <path/to/financial_sources.sqlite3> (or set FINANCE_EVIDENCE_DB)'); process.exit(2); }

// Categories where merchant_name is a business (a shop, a utility), safe to show locally.
const MERCHANT_OK = new Set(['groceries', 'shopping', 'dining_drinks', 'transportation', 'bills_utilities', 'entertainment', 'health_wellness', 'travel', 'education', 'pets', 'GENERAL_SERVICES', 'GENERAL_MERCHANDISE']);

const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  // Account labels become "Checking ·1234" / "Card ·1234": kind plus last four only.
  const accounts = db.prepare('SELECT account_label AS label, count(*) AS n FROM finance_transactions GROUP BY account_label ORDER BY n DESC').all();
  const acct = new Map();
  for (const a of accounts) {
    const last4 = (String(a.label).match(/(\d{4})\D*$/) ?? [])[1] ?? '????';
    const isChecking = /checking|savings|business/i.test(a.label) && !/card|credit/i.test(a.label);
    const key = isChecking ? 'BANK' : 'CARD';
    if ([...acct.values()].some((v) => v.key === key)) throw new Error(`Two accounts map to ${key}; extend the mapping before converting.`);
    acct.set(a.label, { key, label: `${isChecking ? 'Checking' : 'Card'} ·${last4}`, rows: a.n });
  }

  const exportsRaw = db.prepare('SELECT sha256, row_count AS rows, observed_start AS start, observed_end AS end FROM finance_exports ORDER BY row_count DESC').all();
  const combined = exportsRaw[0] ?? null;
  const usedShas = db.prepare('SELECT source_export_sha256 AS sha, account_label AS label, count(*) AS n FROM finance_transactions GROUP BY 1, 2').all();
  const exports = usedShas.map((u) => {
    const x = exportsRaw.find((e) => e.sha256 === u.sha);
    const a = acct.get(u.label);
    return { sha256: u.sha, rows: x?.rows ?? u.n, account: a.key, name: `Export · ${a.label}`, start: x?.start ?? null, end: x?.end ?? null };
  });
  const exportIndex = new Map(exports.map((x, i) => [x.sha256, i]));

  const rows = [];
  // The store keeps the export's sign (mapping finance-csv-v1-preserve-positive-debit: a debit,
  // money out, is positive). The prototype uses money-in-positive like the fixture, so flip it.
  const maps = db.prepare('SELECT DISTINCT mapping_version AS v FROM finance_transactions').all().map((r) => r.v);
  if (maps.some((v) => !/preserve-positive-debit/.test(v))) throw new Error(`Unknown sign mapping: ${maps.join(', ')}`);
  const stmt = db.prepare('SELECT account_label, transaction_date, amount_minor_units, status, category_primary, merchant_name, source_export_sha256, source_csv_record_number FROM finance_transactions ORDER BY transaction_date, source_csv_record_number');
  for (const r of stmt.iterate()) {
    if (!Number.isInteger(r.amount_minor_units)) throw new Error('amount_minor_units must be integer cents');
    const cat = r.category_primary ?? 'uncategorised';
    rows.push({
      a: acct.get(r.account_label).key,
      d: String(r.transaction_date).slice(0, 10),
      c: -r.amount_minor_units,
      st: String(r.status).toLowerCase(),
      cat,
      m: MERCHANT_OK.has(cat) && r.merchant_name ? String(r.merchant_name).slice(0, 40) : null,
      x: exportIndex.get(r.source_export_sha256),
      rec: r.source_csv_record_number,
    });
  }
  const recon = db.prepare('SELECT reconciliation_status AS s, count(*) AS n FROM finance_transactions GROUP BY 1').all();
  const docs = db.prepare('SELECT review_status AS s, count(*) AS n FROM supplied_documents GROUP BY 1').all();
  const registered = docs.reduce((s, d) => s + d.n, 0);
  const extracted = docs.filter((d) => /extracted|reviewed|accepted/i.test(d.s) && !/unreviewed/i.test(d.s)).reduce((s, d) => s + d.n, 0);

  // Every calendar month from the first to the last observed row, so empty months show as gaps.
  const first = rows[0]?.d.slice(0, 7), last = rows.at(-1)?.d.slice(0, 7);
  const months = [];
  if (first) for (let [y, m] = first.split('-').map(Number); `${y}-${String(m).padStart(2, '0')}` <= last; m === 12 ? (y++, m = 1) : m++) months.push(`${y}-${String(m).padStart(2, '0')}`);

  const data = {
    kind: 'local-real',
    note: 'Local only. Generated from the owner\'s evidence store; gitignored; never commit or publish.',
    generatedAt: new Date().toISOString(),
    combined: combined ? { sha256: combined.sha256, rows: combined.rows, start: combined.start, end: combined.end, provenance: 'SHA-256 as recorded in the local store; compare with the Linear source inventory (MHO-259)' } : null,
    exports,
    accounts: [...acct.values()].map(({ key, label, rows: n }) => ({ key, label, rows: n })),
    reconciliation: Object.fromEntries(recon.map((r) => [r.s, r.n])),
    documents: { registered, extracted, byStatus: Object.fromEntries(docs.map((d) => [d.s, d.n])) },
    months,
    rows,
  };
  writeFileSync(out, JSON.stringify(data));
  console.log(`wrote ${out}: ${rows.length} rows, ${months.length} months, ${exports.length} exports, ${registered} statements registered (${extracted} extracted)`);
} finally {
  db.close();
}

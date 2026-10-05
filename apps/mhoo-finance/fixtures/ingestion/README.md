# MHO-126 synthetic source fixtures

These are **synthetic** artifacts. They are not redacted customer/provider files and
make no claim about a real institution's CSV layout or statement pagination.

- `synthetic-bank-february.csv` uses the documented `synthetic-bank-csv-v1`
  profile. Positive signed amounts are inflows; negative signed amounts are
  outflows.
- `synthetic-bank-february.qfx` is a strict QFX subset fixture with `FITID`,
  `DTPOSTED`, signed `TRNAMT`, and OFX `CLOSING` controls. The importer rejects
  multiple accounts, duplicate FITIDs, OFX correction actions, and truncated
  OFX transaction blocks.
- `synthetic-bank-statement-missing-page.pdf` is retained byte-for-byte only.
  It intentionally declares observed pages 1 and 3 out of 3, so source coverage
  stays incomplete. PDF text extraction/OCR is not part of this implementation.

Run `yarn fixtures:validate-ingestion` to parse the CSV/QFX fixtures, verify
exact arithmetic, and produce a deterministic custody summary. Missing-page
status is input metadata for the synthetic fixture; it is not a PDF extraction
claim.

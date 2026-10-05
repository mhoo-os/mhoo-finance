import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const { FIXTURE_GENERATED_AT, buildFixtureDataset } = await import(
  '../src/fixtures/fixture-pack.ts'
);
const { financeFixtureAdapter } = await import(
  '../src/fixtures/fixture-adapter.ts'
);

const outputPath = resolve(process.cwd(), 'fixtures/mhoo-finance-fixture-pack.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    financeFixtureAdapter.toGeneratedFixturePack(
      FIXTURE_GENERATED_AT,
      buildFixtureDataset('corrected'),
    ),
    null,
    2,
  )}\n`,
  'utf8',
);

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

import { generateSyntheticPopulation, validatePopulationManifestOptions } from '../src/benchmarks/synthetic-population.ts';

// No source-count discovery or network calls. Every run labels its input as
// hypothetical, even when a caller supplies a number learned elsewhere.
const [assumedRows, directory, chunkSize = '1000', ...extra] = process.argv.slice(2);
if (!assumedRows || !directory || extra.length) {
  throw new Error('Usage: node scripts/generate-benchmark-population.mjs ASSUMED_SIX_YEAR_ROWS OUTPUT_DIRECTORY [CHUNK_SIZE]');
}
const options = { assumedSixYearRows: Number(assumedRows), chunkSize: Number(chunkSize) };
validatePopulationManifestOptions(options);
const output = resolve(directory);
// Refuse an existing path so prior raw evidence cannot be overwritten.
mkdirSync(output);
const started = performance.now();
const contentDigest = createHash('sha256');
const chunks = [];
let rawRows = 0;
let revisionRows = 0;
let duplicateRows = 0;
let latestAmountCents = 0;
for (const chunk of generateSyntheticPopulation(options)) {
  writeFileSync(resolve(output, chunk.artifact.fileName), chunk.originalContent, { flag: 'wx' });
  contentDigest.update(chunk.originalContent);
  rawRows += chunk.rows.length;
  revisionRows += chunk.expected.revisionRows;
  duplicateRows += chunk.expected.duplicateRows;
  latestAmountCents += chunk.expected.latestAmountCents;
  chunks.push({ index: chunk.index, firstEvent: chunk.firstEvent, nextEvent: chunk.nextEvent,
    artifact: chunk.artifact, expected: chunk.expected });
}
const manifest = {
  schemaVersion: 1,
  purpose: 'MHO-124 synthetic population preparation',
  sourceCountBasis: 'HYPOTHETICAL_NOT_MEASURED',
  actualHassSourceCounts: null,
  architectureVerdict: null,
  nativeRuntimeEvidence: false,
  syntheticPeriod: { start: '2020-01', end: '2025-12' },
  options,
  uniqueEvents: options.assumedSixYearRows * 2,
  rawRows, revisionRows, duplicateRows, latestAmountCents,
  rawPopulationSha256: contentDigest.digest('hex'),
  chunks,
};
// Written last: interrupted runs cannot be mistaken for a complete population.
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
process.stdout.write(JSON.stringify({ output, rawRows, uniqueEvents: manifest.uniqueEvents,
  rawPopulationSha256: manifest.rawPopulationSha256,
  generationSeconds: (performance.now() - started) / 1000,
  sourceCountBasis: manifest.sourceCountBasis, nativeRuntimeEvidence: false }) + '\n');

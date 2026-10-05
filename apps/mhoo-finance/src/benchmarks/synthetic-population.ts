import { createHash } from 'node:crypto';

import type { SourceArtifact, SourceRow } from '../fixtures/fixture-pack';

export type PopulationOptions = {
  // Explicit hypothetical input, never an observed Hass source count.
  assumedSixYearRows: number;
  chunkSize: number;
};

export type PopulationChunk = {
  index: number;
  firstEvent: number;
  nextEvent: number;
  artifact: SourceArtifact;
  originalContent: string;
  rows: SourceRow[];
  expected: {
    uniqueEvents: number;
    revisionRows: number;
    duplicateRows: number;
    latestAmountCents: number;
  };
};

export const validatePopulationOptions = (options: PopulationOptions) => {
  if (!Number.isSafeInteger(options.assumedSixYearRows) ||
      options.assumedSixYearRows < 1 || options.assumedSixYearRows > 5_000_000) {
    throw new Error('assumedSixYearRows must be an integer from 1 to 5000000');
  }
  if (!Number.isSafeInteger(options.chunkSize) ||
      options.chunkSize < 1 || options.chunkSize > 10_000) {
    throw new Error('chunkSize must be an integer from 1 to 10000');
  }
};

// The CLI retains all chunk descriptors for its final manifest. Cap that
// metadata independently of the generator's bounded raw-row working set.
export const MAX_POPULATION_MANIFEST_CHUNKS = 10_000;
export const validatePopulationManifestOptions = (options: PopulationOptions) => {
  validatePopulationOptions(options);
  const chunks = Math.ceil(options.assumedSixYearRows * 2 / options.chunkSize);
  if (chunks > MAX_POPULATION_MANIFEST_CHUNKS) {
    throw new Error('Population manifest exceeds 10000 chunks; increase chunkSize');
  }
  return chunks;
};

/** Offline raw-artifact preparation only. No ingestion, snapshot or coverage
 * state advances here. A consumer must commit a chunk before saving nextEvent.
 * Chunk boundaries and resume positions are bound to these exact options.
 */
export function* generateSyntheticPopulation(
  options: PopulationOptions,
  startEvent = 0,
): Generator<PopulationChunk> {
  validatePopulationOptions(options);
  const population = options.assumedSixYearRows * 2;
  if (!Number.isSafeInteger(startEvent) || startEvent < 0 ||
      startEvent > population ||
      (startEvent !== population && startEvent % options.chunkSize !== 0)) {
    throw new Error('startEvent must be a chunk boundary or the population end');
  }
  for (let first = startEvent; first < population; first += options.chunkSize) {
    const end = Math.min(first + options.chunkSize, population);
    const artifactId = `synthetic-scale-${options.assumedSixYearRows}-${options.chunkSize}-${first}`;
    const rows: SourceRow[] = [];
    let revisions = 0;
    let duplicates = 0;
    let latestAmountCents = 0;
    for (let event = first; event < end; event++) {
      const month = event % 72;
      const period = `${2020 + Math.floor(month / 12)}-${String(month % 12 + 1).padStart(2, '0')}`;
      const amountCents = -(100 + event % 10_000);
      const base: SourceRow = {
        sourceRowKey: `${artifactId}:row:${rows.length + 1}`,
        artifactId,
        rowNumber: rows.length + 1,
        period,
        sourceKind: 'BANK',
        eventKey: `synthetic-bank-event-${event}`,
        amountCents,
        description: 'Synthetic scale benchmark expense',
        classification: 'OPERATING_EXPENSE',
        status: 'POSTED',
        revision: 1,
      };
      rows.push(base);
      // Duplicate source row: distinct physical location, same event/revision.
      if (event % 5 === 0) {
        rows.push({ ...base, rowNumber: rows.length + 1,
          sourceRowKey: `${artifactId}:row:${rows.length + 1}` });
        duplicates++;
      }
      // A correction preserves the first row and changes only this event.
      if (event % 10 === 0) {
        rows.push({ ...base, revision: 2, amountCents: amountCents - 1,
          rowNumber: rows.length + 1,
          sourceRowKey: `${artifactId}:row:${rows.length + 1}` });
        revisions++;
      }
      latestAmountCents += amountCents - (event % 10 === 0 ? 1 : 0);
    }
    const originalContent = rows.map((row) => JSON.stringify(row)).join('\n') + '\n';
    yield {
      index: first / options.chunkSize,
      firstEvent: first,
      nextEvent: end,
      artifact: {
        artifactId,
        fileName: `${artifactId}.jsonl`,
        sourceKind: 'BANK',
        period: '2020-01/2025-12',
        contentHash: createHash('sha256').update(originalContent).digest('hex'),
        revision: 1,
        freshness: 'FRESH',
        rowCount: rows.length,
      },
      originalContent,
      rows,
      expected: { uniqueEvents: end - first, revisionRows: revisions,
        duplicateRows: duplicates, latestAmountCents },
    };
  }
}

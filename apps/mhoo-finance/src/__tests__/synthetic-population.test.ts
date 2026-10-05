import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { generateSyntheticPopulation } from '../benchmarks/synthetic-population';

describe('six-year synthetic benchmark population', () => {
  const options = { assumedSixYearRows: 500, chunkSize: 37 };

  it('builds 2x unique events plus duplicates and preserved revisions over 72 months', () => {
    const chunks = [...generateSyntheticPopulation(options)];
    const rows = chunks.flatMap((chunk) => chunk.rows);
    const latest = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!latest.has(row.eventKey) || latest.get(row.eventKey)!.revision < row.revision) {
        latest.set(row.eventKey, row);
      }
    }
    expect(latest.size).toBe(1000);
    expect(rows).toHaveLength(1300);
    expect(new Set(rows.map((row) => row.period)).size).toBe(72);
    expect(chunks.reduce((sum, chunk) => sum + chunk.expected.revisionRows, 0)).toBe(100);
    expect(chunks.reduce((sum, chunk) => sum + chunk.expected.duplicateRows, 0)).toBe(200);
    expect([...latest.values()].reduce((sum, row) => sum + row.amountCents, 0))
      .toBe(chunks.reduce((sum, chunk) => sum + chunk.expected.latestAmountCents, 0));
    expect(rows.filter((row) => row.eventKey === 'synthetic-bank-event-0').map((row) => row.revision))
      .toEqual([1, 1, 2]);
  });

  it('retains byte-hashed originals and exact physical row lineage', () => {
    for (const chunk of generateSyntheticPopulation(options)) {
      expect(createHash('sha256').update(chunk.originalContent).digest('hex')).toBe(chunk.artifact.contentHash);
      const originals = chunk.originalContent.trimEnd().split('\n').map((line) => JSON.parse(line));
      expect(originals).toEqual(chunk.rows);
      expect(chunk.rows.every((row, index) => row.rowNumber === index + 1 && row.artifactId === chunk.artifact.artifactId)).toBe(true);
      expect(chunk.artifact.rowCount).toBe(chunk.rows.length);
      expect(chunk.expected.uniqueEvents).toBeLessThanOrEqual(options.chunkSize);
    }
  });

  it('rebuilds deterministically and resumes at exact boundaries without skipped events', () => {
    const all = [...generateSyntheticPopulation(options)];
    expect([...generateSyntheticPopulation(options)]).toEqual(all);
    const prefix = all.slice(0, 3);
    expect([...prefix, ...generateSyntheticPopulation(options, prefix[prefix.length - 1].nextEvent)]).toEqual(all);
    expect([...generateSyntheticPopulation(options, 1000)]).toEqual([]);
    expect(() => [...generateSyntheticPopulation(options, 38)]).toThrow('chunk boundary');
  });

  it.each([0, -1, NaN, Infinity, 1.5, 5_000_001])('rejects invalid assumptions %s', (assumedSixYearRows) => {
    expect(() => [...generateSyntheticPopulation({ ...options, assumedSixYearRows })]).toThrow();
  });

  it.each([0, -1, NaN, Infinity, 1.5, 10_001])('rejects invalid chunk size %s', (chunkSize) => {
    expect(() => [...generateSyntheticPopulation({ ...options, chunkSize })]).toThrow();
  });
});

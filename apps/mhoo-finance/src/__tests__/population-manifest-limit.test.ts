import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { MAX_POPULATION_MANIFEST_CHUNKS, validatePopulationManifestOptions } from '../benchmarks/synthetic-population';

describe('offline population manifest descriptor guard', () => {
  it('accepts exactly the descriptor cap and the full event limit with adequate chunks without generating them', () => {
    expect(validatePopulationManifestOptions({ assumedSixYearRows: 5000, chunkSize: 1 })).toBe(MAX_POPULATION_MANIFEST_CHUNKS);
    expect(validatePopulationManifestOptions({ assumedSixYearRows: 5_000_000, chunkSize: 1000 })).toBe(MAX_POPULATION_MANIFEST_CHUNKS);
  });

  it('counts a partial final chunk and rejects descriptor overflow', () => {
    expect(validatePopulationManifestOptions({ assumedSixYearRows: 5000, chunkSize: 3 })).toBe(3334);
    expect(() => validatePopulationManifestOptions({ assumedSixYearRows: 5001, chunkSize: 1 })).toThrow('increase chunkSize');
    expect(() => validatePopulationManifestOptions({ assumedSixYearRows: 5_000_000, chunkSize: 999 })).toThrow('10000 chunks');
  });

  it('retains the existing invalid option boundaries', () => {
    expect(() => validatePopulationManifestOptions({ assumedSixYearRows: 0, chunkSize: 1000 })).toThrow('assumedSixYearRows');
    expect(() => validatePopulationManifestOptions({ assumedSixYearRows: 5000, chunkSize: 0 })).toThrow('chunkSize');
  });

  it('CLI rejects oversized manifests before creating its output directory or artifact files', () => {
    const parent = mkdtempSync(join(tmpdir(), 'mho124-manifest-limit-'));
    const output = join(parent, 'must-not-exist');
    try {
      const run = spawnSync(process.execPath, ['--experimental-strip-types', resolve('scripts/generate-benchmark-population.mjs'), '5001', output, '1'], {
        encoding: 'utf8', timeout: 10000,
      });
      expect(run.error).toBeUndefined();
      expect(run.status).not.toBe(0);
      expect(run.stderr).toContain('Population manifest exceeds 10000 chunks');
      expect(existsSync(output)).toBe(false);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});

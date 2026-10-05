import { describe, expect, it, vi } from 'vitest';
import { AppPath } from 'twenty-sdk/front-component';
import { handoffSource } from '../investigation/source-handoff';

describe('native source handoff', () => {
  it.each(['apps', 'bank', 'pos', 'email'] as const)(
    'hands %s off to the native current-workspace Apps catalog',
    async (entry) => {
      const navigate = vi.fn().mockResolvedValue(undefined);
      expect(await handoffSource(entry, navigate)).toBe('handed-off');
      expect(navigate).toHaveBeenCalledExactlyOnceWith(
        AppPath.SettingsCatchAll,
        { '*': 'applications' },
      );
    },
  );
  it('opens the governed Source artifacts table for statement custody', async () => {
    const navigate = vi.fn().mockResolvedValue(undefined);
    expect(await handoffSource('statement', navigate)).toBe('handed-off');
    expect(navigate).toHaveBeenCalledExactlyOnceWith(AppPath.RecordIndexPage, {
      objectNamePlural: 'sourceArtifacts',
    });
  });
  it('does not navigate or import an unsupported raw CSV input', async () => {
    const navigate = vi.fn();
    expect(await handoffSource('csv', navigate)).toBe('unavailable');
    expect(navigate).not.toHaveBeenCalled();
  });
  it('does not report connection success or broaden navigation when the host rejects', async () => {
    const navigate = vi.fn().mockRejectedValue(new Error('denied'));
    expect(await handoffSource('apps', navigate)).toBe('failed');
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});

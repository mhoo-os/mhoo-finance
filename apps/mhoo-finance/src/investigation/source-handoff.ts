import { AppPath, navigate } from 'twenty-sdk/front-component';

export type SourceEntry =
  'apps' | 'bank' | 'pos' | 'statement' | 'email' | 'csv';
export type HandoffResult = 'handed-off' | 'unavailable' | 'failed';

// Discovery and connection authorization remain on Twenty's native Apps page.
// A completed navigation is not evidence of an installed or connected provider.
export const handoffSource = async (
  entry: SourceEntry,
  hostNavigate: typeof navigate = navigate,
): Promise<HandoffResult> => {
  try {
    if (entry === 'statement') {
      await hostNavigate(AppPath.RecordIndexPage, {
        objectNamePlural: 'sourceArtifacts',
      });
      return 'handed-off';
    }
    if (entry === 'csv') return 'unavailable';
    await hostNavigate(AppPath.SettingsCatchAll, { '*': 'applications' });
    return 'handed-off';
  } catch {
    return 'failed';
  }
};

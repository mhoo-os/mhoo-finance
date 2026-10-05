import type { SavedQuestionRequest, SavedQuestionResponse } from './saved-question-reader';

export type SavedQuestionSessionState = {
  loading: boolean;
  request: SavedQuestionRequest | null;
  result: SavedQuestionResponse | null;
};
/** UI-side request sequencing only, never authorization. The provided reader must
 * be a native authenticated host client, not the server ports or a fixture.
 * Every interaction refetches. Scope changes immediately erase old evidence. */
export function createSavedQuestionSession(read: (request: SavedQuestionRequest) => Promise<SavedQuestionResponse>) {
  let generation = 0;
  let state: SavedQuestionSessionState = { loading: false, request: null, result: null };
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  const reset = () => {
    generation++;
    state = { loading: false, request: null, result: null };
  };
  const ask = async (request: SavedQuestionRequest) => {
    const id = ++generation;
    const captured = copy(request);
    state = { loading: true, request: captured, result: null };
    let result: SavedQuestionResponse;
    try { result = await read(copy(captured)); }
    catch { result = { status: 'FAILED' }; }
    if (id !== generation) return;
    if ((result.status === 'READY' || result.status === 'EMPTY') && (result.metadata.workspaceId !== captured.workspaceId ||
      result.metadata.engagementId !== captured.engagementId || result.metadata.snapshotHash !== captured.snapshotHash)) {
      result = { status: 'DENIED' };
    }
    state = { loading: false, request: captured, result: copy(result) };
  };
  const selectMonth = async (month: string) => {
    const result = state.result;
    if (state.loading || !state.request || !result || (result.status !== 'READY' && result.status !== 'EMPTY') || !result.groups.some((group) => group.month === month)) return;
    const { cursor: _cursor, record: _record, ...request } = state.request;
    await ask({ ...request, month });
  };
  const selectRow = async (record: string) => {
    const result = state.result;
    if (state.loading || !state.request || !result || (result.status !== 'READY' && result.status !== 'EMPTY') || !result.rows.some((row) => row.record === record)) return;
    const { cursor: _cursor, ...request } = state.request;
    await ask({ ...request, record });
  };
  return { ask, selectMonth, selectRow, reset, getState: () => copy(state) };
}

// Synthetic in-memory REST transport for tests/local preview only. No network.
import { RestApiClient } from 'twenty-client-sdk/rest';
import type { CoreApiClient } from 'twenty-client-sdk/core';
import { readWorkspaceFinance } from '../../investigation/workspace-finance-data';

export const FIXTURE_IDS = {
  fact: '10101010-0001-4e7c-8001-123456789def',
  person: '20202020-0001-4e7c-8001-123456789def',
  artifact: '30303030-0001-4e7c-8001-123456789def',
  note: '40404040-0001-4e7c-8001-123456789def',
  task: '50505050-0001-4e7c-8001-123456789def',
};
export const createFollowUpTestHost = (
  options: {
    tasks?: Record<string, Record<string, unknown>>;
    saved?: (tasks: Record<string, Record<string, unknown>>) => void;
  } = {},
) => {
  const tasks = structuredClone(options.tasks ?? {});
  const calls: { method: string; path: string; body?: unknown }[] = [];
  const control = {
    denied: false,
    failWrite: false,
    loseResponse: false,
    denySource: false,
    race: false,
  };
  const fact = {
    id: FIXTURE_IDS.fact,
    factKey: 'SYNTHETIC-1',
    description: 'Synthetic restaurant supplies',
    status: 'ACTIVE',
    exactAmountMinor: '-12500',
    sourceCurrency: 'USD',
    postedDate: '2026-09-14',
    includedInTotals: true,
  };
  const artifact = {
    id: FIXTURE_IDS.artifact,
    artifactKey: 'SYNTHETIC-SOURCE',
    contentHash: 'a'.repeat(64),
    status: 'IMPORTED',
    originalFileName: 'synthetic-statement.pdf',
    sourceKind: 'BANK',
    period: '2026-09',
    accountKey: 'synthetic-account',
  };
  const sources: Record<
    string,
    { singular: string; row: Record<string, unknown> }
  > = {
    financeFacts: { singular: 'financeFact', row: fact },
    sourceArtifacts: { singular: 'sourceArtifact', row: artifact },
    people: {
      singular: 'person',
      row: {
        id: FIXTURE_IDS.person,
        name: { firstName: 'Synthetic', lastName: 'Contact' },
      },
    },
    notes: {
      singular: 'note',
      row: {
        id: FIXTURE_IDS.note,
        title: 'Synthetic reply note',
        bodyV2: { markdown: 'Private synthetic body never copied' },
      },
    },
  };
  let tick = 0;
  const response = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    const [, , plural, id] = url.pathname.split('/');
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: url.pathname, body });
    if (control.denied)
      return response({ message: 'Synthetic permission denied' }, 403);
    if (method === 'GET' && plural !== 'tasks') {
      if (control.denySource)
        return response({ message: 'Synthetic source denied' }, 403);
      const source = sources[plural];
      if (!id && source) return response({ data: { [plural]: [source.row] } });
      return source?.row.id === id
        ? response({ data: { [source.singular]: source.row } })
        : response({}, 404);
    }
    if (method === 'GET')
      return tasks[id]
        ? response({ data: { task: tasks[id] } })
        : response({}, 404);
    if (control.failWrite)
      return response({ message: 'Synthetic write failure' }, 503);
    if (method === 'POST') {
      if (tasks[body.id]) return response({ message: 'Duplicate Task' }, 409);
      tasks[body.id] = {
        ...body,
        updatedAt: new Date(
          Date.UTC(2026, 8, 14, 0, 0, 0, ++tick),
        ).toISOString(),
        createdBy: { source: 'MANUAL', name: 'Synthetic actor' },
      };
    } else if (method === 'PATCH') {
      const filter = url.searchParams.get('filter') ?? '';
      const taskId = /id\[eq\]:([^,)]+)/.exec(filter)?.[1] ?? '';
      const revision = Number(/financeRevision\[eq\]:(\d+)/.exec(filter)?.[1]);
      const timestamp = /updatedAt\[eq\]:([^,)]+)/.exec(filter)?.[1];
      const row = tasks[taskId];
      if (control.race && row)
        row.financeRevision = Number(row.financeRevision) + 1;
      if (
        row &&
        row.financeScope === 'MHOO_FINANCE_V1' &&
        row.financeRevision === revision &&
        row.updatedAt === timestamp
      ) {
        Object.assign(row, body, {
          updatedAt: new Date(
            Date.UTC(2026, 8, 14, 0, 0, 0, ++tick),
          ).toISOString(),
          updatedBy: { source: 'MANUAL', name: 'Synthetic actor' },
        });
      }
    } else return response({}, 405);
    options.saved?.(structuredClone(tasks));
    if (control.loseResponse)
      throw new Error('Synthetic connection lost after write');
    return response({ data: {} });
  };
  const client = new RestApiClient({
    baseUrl: 'https://synthetic.invalid',
    token: 'synthetic-only',
    fetch,
    runAs: 'user',
  });
  const edges = (rows: Record<string, unknown>[]) => ({
    pageInfo: { hasNextPage: false },
    edges: rows.map((node) => ({ node })),
  });
  const read = () =>
    readWorkspaceFinance({
      query: async () => ({
        financialAccounts: edges([]),
        financeFacts: edges([fact]),
        sourceArtifacts: edges([artifact]),
        tasks: edges(Object.values(tasks)),
      }),
    } as unknown as CoreApiClient);
  return { client, read, tasks, calls, control, sources };
};

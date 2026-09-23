import React, { useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'twenty-ui/style.css';
import { FinanceWorkspace, type FinanceView } from '../src/components/finance-workspace';
import type { WorkspaceFinanceData } from '../src/investigation/workspace-finance-data';
import './style.css';

type Item = {
  item_id: string;
  institution_name: string | null;
  status: string;
  last_synced_at: string | null;
  accounts: { account_id: string; name: string; mask: string | null; type: string }[];
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', ...options });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Finance API is unavailable. Open the configured Pages app to connect accounts.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? 'Sign in through Finance Access, then retry.' : result.error ?? 'Finance request failed');
  return result as T;
}

async function loadPlaidLink() {
  if (window.Plaid?.create) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Plaid Link could not load. Retry the connection.'));
    document.head.append(script);
  });
}

declare global {
  interface Window {
    Plaid?: {
      create(options: {
        token: string;
        onSuccess(token: string, metadata: { institution?: { institution_id?: string; name?: string } }): void;
        onExit(): void;
      }): { open(): void; destroy(): void };
    };
  }
}

const views: { id: Exclude<FinanceView, 'sources'>; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'statements', label: 'Statements' },
  { id: 'followups', label: 'Follow-ups' },
];

function App() {
  const [view, setView] = useState<Exclude<FinanceView, 'sources'>>('accounts');
  const [items, setItems] = useState<Item[]>([]);
  const [revision, setRevision] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const read = useCallback(async () => {
    const [data, connections] = await Promise.all([
      api<WorkspaceFinanceData>('/api/finance/data'),
      api<{ items: Item[] }>('/api/plaid/items'),
    ]);
    setItems(connections.items);
    return data;
  }, []);
  const services = useMemo(() => ({ read }), [read]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(false);
    setMessage('Opening secure bank connection…');
    try {
      const { link_token } = await api<{ link_token: string }>('/api/plaid/link-token', { method: 'POST' });
      await loadPlaidLink();
      const handler = window.Plaid!.create({
        token: link_token,
        onSuccess: async (public_token) => {
          try {
            await api('/api/plaid/exchange', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ public_token }),
            });
            setRevision((value) => value + 1);
            setMessage('Bank connected. Sync now to load recent activity.');
          } catch (cause) {
            setError(true);
            setMessage(cause instanceof Error ? cause.message : 'Connection could not be saved.');
          } finally {
            setConnecting(false);
            handler.destroy();
          }
        },
        onExit: () => {
          setConnecting(false);
          handler.destroy();
        },
      });
      handler.open();
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : 'Plaid Link could not open.');
      setConnecting(false);
    }
  }, []);

  const sync = async (itemId: string) => {
    setMessage('Syncing recent activity…');
    setError(false);
    try {
      await api(`/api/plaid/items/${encodeURIComponent(itemId)}/sync`, { method: 'POST' });
      setRevision((value) => value + 1);
      setMessage('Recent activity is up to date.');
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : 'Sync failed.');
    }
  };

  const disconnect = async (itemId: string) => {
    if (!window.confirm('Disconnect this bank? Preserved activity and source evidence will remain for review.')) return;
    setError(false);
    try {
      await api(`/api/plaid/items/${encodeURIComponent(itemId)}/disconnect`, { method: 'POST' });
      setRevision((value) => value + 1);
      setMessage('Bank disconnected. Preserved evidence remains available.');
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : 'Disconnect failed.');
    }
  };

  return <div className="standalone">
    <header className="topbar"><strong>mhoo<span> / finance</span></strong><span>Private finance workspace</span></header>
    <div className="layout">
      <nav aria-label="Finance sections">{views.map((entry) =>
        <button type="button" className={view === entry.id ? 'selected' : ''} key={entry.id} onClick={() => setView(entry.id)}>{entry.label}</button>)}</nav>
      <main>
        {view === 'accounts' ? <section className="connection-panel" aria-label="Bank connections">
          <div><h2>Bank connections</h2><p>Connect checking, savings and cards with Plaid.</p></div>
          <button type="button" onClick={() => void connect()} disabled={connecting}>Connect bank or card</button>
          {items.length ? <ul>{items.map((item) => <li key={item.item_id}>
            <span><strong>{item.institution_name ?? 'Connected institution'}</strong><small>{item.accounts.map((account) => `${account.name}${account.mask ? ` ···· ${account.mask}` : ''}`).join(' · ') || 'Account details pending'} · {item.status === 'CONNECTED' ? item.last_synced_at ? `Synced ${new Date(item.last_synced_at).toLocaleString()}` : 'Sync needed' : item.status.replaceAll('_', ' ')}</small></span>
            <span className="connection-actions"><button type="button" disabled={item.status === 'REAUTH_REQUIRED'} onClick={() => void sync(item.item_id)}>Sync now</button><button type="button" onClick={() => void disconnect(item.item_id)}>Disconnect</button></span>
          </li>)}</ul> : null}
          <p className="boundary">Plaid activity stays unclassified and outside totals until source records are reviewed.</p>
        </section> : null}
        {message ? <p role="status" aria-live="polite" className={`status-message${error ? ' error' : ''}`}>{message}</p> : null}
        <FinanceWorkspace key={`${view}-${revision}`} initialView={view} services={services} standalone onConnectBank={() => void connect()} />
      </main>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);

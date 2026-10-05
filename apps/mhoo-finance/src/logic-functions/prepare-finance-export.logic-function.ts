import { defineLogicFunction } from 'twenty-sdk/define';
import {
  preparePlaidExport,
  type ExportAccountBinding,
} from '../preparation/plaid-export';

// No HTTP, cron or tool trigger. No credentials, record reads/writes or raw-row output.
// The caller's authorized file pipeline supplies decoded UTF-8 content; this is
// validation, not original-byte Files custody or authorization to import.
export const handler = async (input: {
  csv: string;
  accounts: ExportAccountBinding[];
}) => {
  if (!input || typeof input !== 'object')
    throw new Error('Preparation input required');
  const { rows, ...receipt } = preparePlaidExport(input.csv, input.accounts);
  return { ...receipt, rowCount: rows.length };
};

export default defineLogicFunction({
  universalIdentifier: '61a9c913-0357-4aeb-a781-218f12779f22',
  name: 'prepare-finance-export',
  description:
    'Validate a bounded Plaid-derived CSV without importing or returning transaction rows.',
  timeoutSeconds: 30,
  handler,
});

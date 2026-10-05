import 'twenty-ui/style.css';

import { FinanceWorkspace } from 'src/components/finance-workspace';
import { FINANCE_TRANSACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { defineFrontComponent } from 'twenty-sdk/define';

export const FinanceTransactions = () => (
  <FinanceWorkspace initialView="transactions" />
);

export default defineFrontComponent({
  universalIdentifier:
    FINANCE_TRANSACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'finance-transactions',
  description: 'Theme-aware Finance transaction review surface.',
  component: FinanceTransactions,
});

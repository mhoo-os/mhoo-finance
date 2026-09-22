import 'twenty-ui/style.css';

import { FinanceWorkspace } from 'src/components/finance-workspace';
import { FINANCE_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { defineFrontComponent } from 'twenty-sdk/define';

export const FinanceAccounts = () => (
  <FinanceWorkspace initialView="accounts" />
);

export default defineFrontComponent({
  universalIdentifier: FINANCE_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'finance-accounts',
  description: 'Theme-aware Finance account review surface.',
  component: FinanceAccounts,
});

import 'twenty-ui/style.css';

import { FinanceWorkspace } from 'src/components/finance-workspace';
import { FINANCE_STATEMENTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { defineFrontComponent } from 'twenty-sdk/define';

export const FinanceStatements = () => (
  <FinanceWorkspace initialView="statements" />
);

export default defineFrontComponent({
  universalIdentifier: FINANCE_STATEMENTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'finance-statements',
  description: 'Theme-aware Finance statement review surface.',
  component: FinanceStatements,
});

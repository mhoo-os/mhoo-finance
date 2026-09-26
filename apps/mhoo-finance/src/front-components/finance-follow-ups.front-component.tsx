import 'twenty-ui/style.css';

import { defineFrontComponent } from 'twenty-sdk/define';

import { FinanceWorkspace } from 'src/components/finance-workspace';
import { FINANCE_FOLLOW_UPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const FinanceFollowUps = () => (
  <FinanceWorkspace initialView="followups" />
);

export default defineFrontComponent({
  universalIdentifier: FINANCE_FOLLOW_UPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'finance-follow-ups',
  description:
    'Native Twenty Task Finance follow-ups with progressive evidence and email detail.',
  component: FinanceFollowUps,
});

import 'twenty-ui/style.css';

import { FinanceWorkspace } from 'src/components/finance-workspace';
import { FINANCE_AUDIT_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { defineFrontComponent } from 'twenty-sdk/define';

export const FinanceWorkspacePreparation = () => <FinanceWorkspace />;

export default defineFrontComponent({
  universalIdentifier:
    FINANCE_AUDIT_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'finance-overview',
  description:
    'Permission-aware Finance overview over current Workspace records.',
  component: FinanceWorkspacePreparation,
});

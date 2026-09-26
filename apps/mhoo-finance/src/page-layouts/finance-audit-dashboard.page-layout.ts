import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  FINANCE_AUDIT_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  FINANCE_AUDIT_DASHBOARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: FINANCE_AUDIT_DASHBOARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Finance overview',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: 'b9e1d2f3-a4b5-4678-9012-3456789abf11',
      title: 'Overview',
      position: 0,
      icon: 'IconDashboard',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: 'b9e1d2f3-a4b5-4678-9012-3456789abf12',
          title: 'Overview',
          type: 'FRONT_COMPONENT',
          position: { layoutMode: PageLayoutTabLayoutMode.CANVAS },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              FINANCE_AUDIT_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});

import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  FINANCE_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  FINANCE_ACCOUNTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: FINANCE_ACCOUNTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Finance accounts',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: '9de1ebb0-1ff4-4e10-b0d9-a28559860bcd',
      title: 'Accounts',
      position: 0,
      icon: 'IconBuildingBank',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: '4826125d-5cf6-412e-9aa1-c32497a8efee',
          title: 'Accounts',
          type: 'FRONT_COMPONENT',
          position: { layoutMode: PageLayoutTabLayoutMode.CANVAS },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              FINANCE_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});

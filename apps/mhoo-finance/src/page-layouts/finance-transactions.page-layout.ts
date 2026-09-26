import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  FINANCE_TRANSACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  FINANCE_TRANSACTIONS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: FINANCE_TRANSACTIONS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Finance transactions',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: '5a0f818e-cf76-4cec-b25b-bf71321bb597',
      title: 'Transactions',
      position: 0,
      icon: 'IconList',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: 'a5618797-ad1e-4dcc-950a-d4c952106141',
          title: 'Transactions',
          type: 'FRONT_COMPONENT',
          position: { layoutMode: PageLayoutTabLayoutMode.CANVAS },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              FINANCE_TRANSACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});

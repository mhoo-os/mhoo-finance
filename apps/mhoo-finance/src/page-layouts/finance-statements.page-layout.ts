import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  FINANCE_STATEMENTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  FINANCE_STATEMENTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: FINANCE_STATEMENTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Finance statements',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: '5d0dc304-1212-488a-ad5c-68dc2fff44e8',
      title: 'Statements',
      position: 0,
      icon: 'IconFileDescription',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: 'b94927ed-92af-4363-a917-d53df9c51949',
          title: 'Statements',
          type: 'FRONT_COMPONENT',
          position: { layoutMode: PageLayoutTabLayoutMode.CANVAS },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              FINANCE_STATEMENTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});

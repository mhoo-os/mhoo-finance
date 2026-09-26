import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  FINANCE_FOLLOW_UPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  FINANCE_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: FINANCE_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Finance follow-ups',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: '24fc8c51-7d6a-462d-b301-b30695010de2',
      title: 'Follow-ups',
      position: 0,
      icon: 'IconProgressCheck',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: 'd2179327-37ca-447d-b244-a988f396a26f',
          title: 'Follow-ups',
          type: 'FRONT_COMPONENT',
          position: { layoutMode: PageLayoutTabLayoutMode.CANVAS },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              FINANCE_FOLLOW_UPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});

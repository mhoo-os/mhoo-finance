import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  FINANCE_FOLDER_UNIVERSAL_IDENTIFIER,
  FINANCE_FOLLOW_UPS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  FINANCE_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: FINANCE_FOLLOW_UPS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  name: 'Follow-ups',
  icon: 'IconProgressCheck',
  position: 5,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  folderUniversalIdentifier: FINANCE_FOLDER_UNIVERSAL_IDENTIFIER,
  pageLayoutUniversalIdentifier:
    FINANCE_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});

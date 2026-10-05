import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  FINANCE_FOLDER_UNIVERSAL_IDENTIFIER,
  FINANCE_STATEMENTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  FINANCE_STATEMENTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: FINANCE_STATEMENTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  name: 'Statements',
  icon: 'IconFileDescription',
  position: 4,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  folderUniversalIdentifier: FINANCE_FOLDER_UNIVERSAL_IDENTIFIER,
  pageLayoutUniversalIdentifier:
    FINANCE_STATEMENTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});

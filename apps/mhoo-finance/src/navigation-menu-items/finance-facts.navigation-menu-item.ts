import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import {
  FINANCE_FOLDER_UNIVERSAL_IDENTIFIER,
  FINANCE_TRANSACTIONS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
export default defineNavigationMenuItem({
  universalIdentifier: 'ecd93878-6ed7-4f39-99d2-9b80f2716da6',
  name: 'Transactions',
  icon: 'IconList',
  position: 3,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  folderUniversalIdentifier: FINANCE_FOLDER_UNIVERSAL_IDENTIFIER,
  pageLayoutUniversalIdentifier:
    FINANCE_TRANSACTIONS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});

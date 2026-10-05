import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import * as I from 'src/constants/universal-identifiers';
export default defineNavigationMenuItem({
  folderUniversalIdentifier: I.FINANCE_FOLDER_UNIVERSAL_IDENTIFIER,
  universalIdentifier: I.FINANCIAL_ACCOUNT_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Accounts',
  icon: 'IconBuildingBank',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier:
    I.FINANCE_ACCOUNTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});

import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { FINANCE_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
export default defineNavigationMenuItem({
  universalIdentifier: FINANCE_FOLDER_UNIVERSAL_IDENTIFIER,
  name: 'Finance',
  icon: 'IconChartBar',
  position: 1,
  type: NavigationMenuItemType.FOLDER,
});

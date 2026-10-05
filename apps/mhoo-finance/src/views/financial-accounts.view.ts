import { defineView, ViewType } from 'twenty-sdk/define';
import * as I from 'src/constants/universal-identifiers';
export default defineView({
  universalIdentifier: I.FINANCIAL_ACCOUNT_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Financial accounts',
  objectUniversalIdentifier: I.FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconBuildingBank',
  position: 0,
  fields: [
    {
      universalIdentifier: '62d9f3bf-0901-47d5-aeee-4ec3b9732640',
      fieldMetadataUniversalIdentifier:
        I.FINANCIAL_ACCOUNT_LABEL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '9ea31062-1654-432b-9620-5f2aa7ecf63f',
      fieldMetadataUniversalIdentifier:
        I.FINANCIAL_ACCOUNT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
  ],
});

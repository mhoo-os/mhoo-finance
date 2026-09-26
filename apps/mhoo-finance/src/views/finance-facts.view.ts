import { defineView, ViewType } from 'twenty-sdk/define';
import * as I from 'src/constants/universal-identifiers';
export const FINANCE_FACTS_VIEW_UNIVERSAL_IDENTIFIER = 'e9e1d2f3-a4b5-4678-9012-3456789abf01';
export default defineView({
  universalIdentifier: FINANCE_FACTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Transactions', objectUniversalIdentifier: I.FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE, icon: 'IconCurrencyDollar', position: 0,
  fields: [
    { universalIdentifier: 'e9e1d2f3-a4b5-4678-9012-3456789abf11', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_KEY_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 240 },
    { universalIdentifier: '2265f618-d420-4b66-8050-f1ec2caf9aeb', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_TRANSACTION_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 140 },
    { universalIdentifier: '3c7f7e38-16b2-436c-a2ee-1f32ee573844', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 200 },
    { universalIdentifier: 'e245d3ae-dcdb-4f58-8c01-6dbb5803cc61', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_DESCRIPTION_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 280 },
    { universalIdentifier: '86852528-47be-419b-bd54-cf1429701772', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_MINOR_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 150 },
    { universalIdentifier: '7b36ec4a-b48b-47bf-b6c3-81fe7b507973', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_CURRENCY_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true, size: 100 },
    { universalIdentifier: 'e9e1d2f3-a4b5-4678-9012-3456789abf15', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_CLASSIFICATION_FIELD_UNIVERSAL_IDENTIFIER, position: 6, isVisible: true, size: 170 },
    { universalIdentifier: 'e9e1d2f3-a4b5-4678-9012-3456789abf18', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_INCLUDED_FIELD_UNIVERSAL_IDENTIFIER, position: 7, isVisible: true, size: 130 },
    { universalIdentifier: 'fe7eb952-652d-4f9e-ba80-b3f5f4d9cdfb', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER, position: 8, isVisible: true, size: 220 },
    { universalIdentifier: '67c02bac-56e7-4e43-8eb2-9a562b81de54', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_SOURCE_LOCATION_FIELD_UNIVERSAL_IDENTIFIER, position: 9, isVisible: true, size: 180 },
    { universalIdentifier: 'e9e1d2f3-a4b5-4678-9012-3456789abf12', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_SOURCE_ROW_FIELD_UNIVERSAL_IDENTIFIER, position: 10, isVisible: false, size: 220 },
    { universalIdentifier: 'e9e1d2f3-a4b5-4678-9012-3456789abf13', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_PERIOD_FIELD_UNIVERSAL_IDENTIFIER, position: 11, isVisible: false, size: 100 },
    { universalIdentifier: 'e9e1d2f3-a4b5-4678-9012-3456789abf14', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER, position: 12, isVisible: false, size: 130 },
    { universalIdentifier: 'e9e1d2f3-a4b5-4678-9012-3456789abf16', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 13, isVisible: true, size: 120 },
    { universalIdentifier: 'e9e1d2f3-a4b5-4678-9012-3456789abf17', fieldMetadataUniversalIdentifier: I.FINANCE_FACT_REVISION_FIELD_UNIVERSAL_IDENTIFIER, position: 14, isVisible: false, size: 100 },
  ],
});

import { defineView, ViewType } from 'twenty-sdk/define';

import {
  IMPORT_RECEIPT_ATTEMPTS_FIELD_UNIVERSAL_IDENTIFIER,
  IMPORT_RECEIPT_DEDUPLICATED_ROWS_FIELD_UNIVERSAL_IDENTIFIER,
  IMPORT_RECEIPT_IMPORTED_ROWS_FIELD_UNIVERSAL_IDENTIFIER,
  IMPORT_RECEIPT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  IMPORT_RECEIPT_OBJECT_UNIVERSAL_IDENTIFIER,
  IMPORT_RECEIPT_REVISION_FIELD_UNIVERSAL_IDENTIFIER,
  IMPORT_RECEIPT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const IMPORT_RECEIPTS_VIEW_UNIVERSAL_IDENTIFIER =
  'd9e1d2f3-a4b5-4678-9012-3456789abf01';

export default defineView({
  universalIdentifier: IMPORT_RECEIPTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Import receipts',
  objectUniversalIdentifier: IMPORT_RECEIPT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconReceipt',
  position: 0,
  fields: [
    { universalIdentifier: 'd9e1d2f3-a4b5-4678-9012-3456789abf11', fieldMetadataUniversalIdentifier: IMPORT_RECEIPT_KEY_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 240 },
    { universalIdentifier: 'd9e1d2f3-a4b5-4678-9012-3456789abf12', fieldMetadataUniversalIdentifier: IMPORT_RECEIPT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 130 },
    { universalIdentifier: 'd9e1d2f3-a4b5-4678-9012-3456789abf13', fieldMetadataUniversalIdentifier: IMPORT_RECEIPT_ATTEMPTS_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 100 },
    { universalIdentifier: 'd9e1d2f3-a4b5-4678-9012-3456789abf14', fieldMetadataUniversalIdentifier: IMPORT_RECEIPT_IMPORTED_ROWS_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 120 },
    { universalIdentifier: 'd9e1d2f3-a4b5-4678-9012-3456789abf15', fieldMetadataUniversalIdentifier: IMPORT_RECEIPT_DEDUPLICATED_ROWS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 140 },
    { universalIdentifier: 'd9e1d2f3-a4b5-4678-9012-3456789abf16', fieldMetadataUniversalIdentifier: IMPORT_RECEIPT_REVISION_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true, size: 120 },
  ],
});

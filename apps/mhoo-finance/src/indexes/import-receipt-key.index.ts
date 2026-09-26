import { defineIndex } from 'twenty-sdk/define';

import * as I from 'src/constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: I.IMPORT_RECEIPT_KEY_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: I.IMPORT_RECEIPT_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: I.IMPORT_RECEIPT_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: I.IMPORT_RECEIPT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});

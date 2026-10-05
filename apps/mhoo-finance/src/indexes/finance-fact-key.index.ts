import { defineIndex } from 'twenty-sdk/define';

import * as I from 'src/constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: I.FINANCE_FACT_KEY_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: I.FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: I.FINANCE_FACT_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: I.FINANCE_FACT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});

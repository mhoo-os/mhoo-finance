import { defineIndex } from 'twenty-sdk/define';

import * as I from 'src/constants/universal-identifiers';

export default defineIndex({
  universalIdentifier:
    I.FINANCE_INVESTIGATION_EVENT_SEQUENCE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    I.FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_SEQUENCE_INDEX_KIND_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_AGGREGATE_KIND_FIELD_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_SEQUENCE_INDEX_REFERENCE_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_AGGREGATE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_SEQUENCE_INDEX_SEQUENCE_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_SEQUENCE_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});

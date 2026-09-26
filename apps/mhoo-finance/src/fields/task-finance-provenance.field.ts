import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { FINANCE_TASK_PROVENANCE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FINANCE_TASK_PROVENANCE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.TEXT,
  name: 'financeProvenanceHistory',
  label: 'Finance provenance history',
  description:
    'Append-history reviewer events. Native task completion or a reply is not financial reconciliation proof.',
  icon: 'IconHistory',
  isNullable: true,
});

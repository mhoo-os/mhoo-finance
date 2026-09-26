import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { FINANCE_TASK_FINDINGS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FINANCE_TASK_FINDINGS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.TEXT,
  name: 'financeFindings',
  label: 'Finance findings',
  description:
    'Reviewer explanation. It must not declare blame, fraud or reconciliation without accepted evidence.',
  icon: 'IconNotes',
  isNullable: true,
});

import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { FINANCE_TASK_SUBJECTS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FINANCE_TASK_SUBJECTS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.TEXT,
  name: 'financeSubjectReferences',
  label: 'Finance subjects',
  description:
    'Validated JSON references to one or more Finance facts or missing statement periods; native Task targets remain the relational surface.',
  icon: 'IconReceipt',
  isNullable: true,
});

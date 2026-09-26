import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { FINANCE_TASK_DRAFT_EMAIL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FINANCE_TASK_DRAFT_EMAIL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.TEXT,
  name: 'financeDraftEmail',
  label: 'Finance draft email',
  description:
    'Validated JSON preview of explicitly selected recipients, personalized body and attachments. This field does not send email.',
  icon: 'IconMail',
  isNullable: true,
});

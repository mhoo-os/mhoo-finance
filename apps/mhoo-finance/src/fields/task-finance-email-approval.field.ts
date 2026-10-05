import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { FINANCE_TASK_EMAIL_APPROVAL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FINANCE_TASK_EMAIL_APPROVAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.SELECT,
  name: 'financeEmailApproval',
  label: 'Finance email approval',
  description:
    'Approval state for a visible draft. Approved is not sent, replied or reconciled.',
  icon: 'IconMailCheck',
  isNullable: true,
  options: [
    {
      id: 'a410b3ba-bab8-4286-9af2-b85c35d0985e',
      value: 'DRAFT',
      label: 'Draft',
      position: 0,
      color: 'gray',
    },
    {
      id: 'da8167bd-90a6-499c-9bca-24541135abfa',
      value: 'AWAITING_APPROVAL',
      label: 'Awaiting approval',
      position: 1,
      color: 'yellow',
    },
    {
      id: '7e17b930-5f94-4f98-9084-61aa5a84bc88',
      value: 'APPROVED_NOT_SENT',
      label: 'Approved but not sent',
      position: 2,
      color: 'blue',
    },
    {
      id: '48e4c286-c0f5-43fe-aa7a-cee9b57d941a',
      value: 'SENT',
      label: 'Sent',
      position: 3,
      color: 'green',
    },
  ],
});

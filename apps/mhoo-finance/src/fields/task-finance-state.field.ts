import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { FINANCE_TASK_STATE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FINANCE_TASK_STATE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.SELECT,
  name: 'financeFollowUpState',
  label: 'Finance follow-up state',
  description:
    'Finance-specific review state on a native Twenty Task. Completion is not reconciliation proof.',
  icon: 'IconProgressCheck',
  isNullable: true,
  options: [
    {
      id: '03a2e1f5-3a06-4af8-a1f6-219e3b77667d',
      value: 'TO_DO',
      label: 'To do',
      position: 0,
      color: 'gray',
    },
    {
      id: '73458061-96ae-4cca-be0a-aadcc005abfd',
      value: 'WAITING_FOR_REPLY',
      label: 'Waiting for reply',
      position: 1,
      color: 'yellow',
    },
    {
      id: 'ce6ba2c5-70b7-46b4-96fb-adc3e648c4fe',
      value: 'READY_FOR_REVIEW',
      label: 'Ready for review',
      position: 2,
      color: 'blue',
    },
    {
      id: 'd858dbd1-3c78-4924-9a96-b69ed29971e5',
      value: 'RESOLVED',
      label: 'Resolved',
      position: 3,
      color: 'green',
    },
  ],
});

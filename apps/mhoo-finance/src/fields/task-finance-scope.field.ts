import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { FINANCE_TASK_SCOPE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FINANCE_TASK_SCOPE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.SELECT,
  name: 'financeScope',
  label: 'Finance scope',
  description:
    'Exact scope marker used to restrict native Tasks to the Finance review surface.',
  icon: 'IconShieldCheck',
  isNullable: true,
  options: [
    {
      id: '5fc04ad4-5730-4dc4-9af2-cef6af97a953',
      value: 'MHOO_FINANCE_V1',
      label: 'Mhoo Finance v1',
      position: 0,
      color: 'blue',
    },
  ],
});

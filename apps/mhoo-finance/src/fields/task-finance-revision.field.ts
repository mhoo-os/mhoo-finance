import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { FINANCE_TASK_REVISION_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FINANCE_TASK_REVISION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'financeRevision',
  label: 'Finance revision',
  description: 'Integer compare-and-swap revision for bounded Finance Task mutations.',
  icon: 'IconVersions',
  defaultValue: 0,
});

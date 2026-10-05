import {
  defineObject,
  FieldType,
  MetadataWritability,
} from 'twenty-sdk/define';

import * as I from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: I.FINANCE_INVESTIGATION_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'financeInvestigationRun',
  namePlural: 'financeInvestigationRuns',
  labelSingular: 'Finance investigation run',
  labelPlural: 'Finance investigation runs',
  description: 'Immutable question, scope, intended-use and prohibited-output envelope.',
  icon: 'IconFileSearch',
  writability: MetadataWritability.APPLICATION,
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    I.FINANCE_INVESTIGATION_RUN_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_KEY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'runKey', label: 'Run key', icon: 'IconKey' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_SCOPE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'scopeEnvelope', label: 'Scope envelope', icon: 'IconScope' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_PERIOD_START_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.DATE, name: 'periodStart', label: 'Period start', icon: 'IconCalendar' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_PERIOD_END_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.DATE, name: 'periodEnd', label: 'Period end', icon: 'IconCalendar' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_TIMEZONE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'timezone', label: 'Timezone', icon: 'IconWorld' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_BASIS_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'basis', label: 'Basis', icon: 'IconScale' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_INTENDED_USE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'intendedUse', label: 'Intended use', icon: 'IconTarget' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_PROHIBITED_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'prohibitedOutputs', label: 'Prohibited outputs', icon: 'IconShieldX' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_RULESET_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'ruleSetVersion', label: 'Rule set', icon: 'IconVersions' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_HASH_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'scopeHash', label: 'Scope hash', icon: 'IconHash' },
    { universalIdentifier: I.FINANCE_INVESTIGATION_RUN_SUPERSEDES_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'supersedesRunReference', label: 'Supersedes run', icon: 'IconArrowBackUp', isNullable: true },
  ],
});

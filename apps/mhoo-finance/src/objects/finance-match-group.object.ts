import { defineObject, FieldType, MetadataWritability } from 'twenty-sdk/define';
import * as I from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: I.FINANCE_MATCH_GROUP_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'financeMatchGroup',
  namePlural: 'financeMatchGroups',
  labelSingular: 'Finance match group',
  labelPlural: 'Finance match groups',
  description: 'Immutable exact split, batch, many-to-many or provider-bridge calculation.',
  icon: 'IconArrowsJoin2',
  writability: MetadataWritability.APPLICATION,
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier: I.FINANCE_MATCH_GROUP_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: I.FINANCE_MATCH_GROUP_KEY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'groupKey', label: 'Group key', icon: 'IconKey' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_RUN_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'runReference', label: 'Investigation run', icon: 'IconFileSearch' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_TYPE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'groupType', label: 'Group type', icon: 'IconCategory' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_BRIDGE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'bridgeKind', label: 'Bridge kind', icon: 'IconBridge' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_CURRENCY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'currencyCode', label: 'Currency', icon: 'IconCurrencyDollar' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_EXPECTED_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'expectedMinor', label: 'Expected minor units', icon: 'IconCalculator' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_OBSERVED_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'observedMinor', label: 'Observed minor units', icon: 'IconCalculator' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_RESIDUAL_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'residualMinor', label: 'Residual minor units', icon: 'IconDelta' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_MISSING_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'missingComponents', label: 'Missing components', icon: 'IconAlertTriangle' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_RULESET_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'ruleSetVersion', label: 'Rule set', icon: 'IconVersions' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_INPUT_HASH_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'inputSetHash', label: 'Input set hash', icon: 'IconHash' },
    { universalIdentifier: I.FINANCE_MATCH_GROUP_CALCULATION_HASH_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'calculationHash', label: 'Calculation hash', icon: 'IconHash' },
  ],
});

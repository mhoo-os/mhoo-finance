import { defineObject, FieldType, MetadataWritability } from 'twenty-sdk/define';
import * as I from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: I.FINANCE_MATCH_MEMBER_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'financeMatchMember',
  namePlural: 'financeMatchMembers',
  labelSingular: 'Finance match member',
  labelPlural: 'Finance match members',
  description: 'Normalized allocation from a retained Finance fact into an immutable match group.',
  icon: 'IconRelationManyToMany',
  writability: MetadataWritability.APPLICATION,
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier: I.FINANCE_MATCH_MEMBER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_KEY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'memberKey', label: 'Member key', icon: 'IconKey' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_GROUP_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'groupReference', label: 'Match group', icon: 'IconArrowsJoin2' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_FACT_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'factReference', label: 'Finance fact', icon: 'IconReceipt' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_PARTICIPATION_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'participation', label: 'Participation', icon: 'IconProgress' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_SIDE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'side', label: 'Side', icon: 'IconArrowsExchange' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'component', label: 'Component', icon: 'IconComponents' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'allocatedSignedMinor', label: 'Allocated signed minor units', icon: 'IconCalculator', isNullable: true },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_CURRENCY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'currencyCode', label: 'Currency', icon: 'IconCurrencyDollar' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_ORDINAL_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.NUMBER, name: 'ordinal', label: 'Ordinal', icon: 'IconListNumbers' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_REASON_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'reasonCode', label: 'Reason code', icon: 'IconInfoCircle' },
    { universalIdentifier: I.FINANCE_MATCH_MEMBER_COUNTED_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.BOOLEAN, name: 'countedInEconomicMovement', label: 'Counted once', icon: 'IconCheck' },
  ],
});

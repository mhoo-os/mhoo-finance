import { defineObject, FieldType, RelationType } from 'twenty-sdk/define';
import * as I from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: I.FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'financialAccount',
  namePlural: 'financialAccounts',
  labelSingular: 'Financial account',
  labelPlural: 'Financial accounts',
  description:
    'Explicit account mapping for source preparation; existence does not authorize import.',
  icon: 'IconBuildingBank',
  labelIdentifierFieldMetadataUniversalIdentifier:
    I.FINANCIAL_ACCOUNT_LABEL_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: I.FINANCIAL_ACCOUNT_LABEL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'accountLabel',
      label: 'Masked account label',
      icon: 'IconBuildingBank',
    },
    {
      universalIdentifier: I.FINANCIAL_ACCOUNT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'sourceKind',
      label: 'Account type',
      icon: 'IconCategory',
      options: [
        {
          id: '961a7bc1-b59a-4e6e-9248-d558bbfcf1a5',
          value: 'BANK',
          label: 'Bank account',
          color: 'blue',
          position: 0,
        },
        {
          id: '5b13ed12-d60b-4bfa-bd78-fae2fb7231ef',
          value: 'CARD',
          label: 'Credit card',
          color: 'purple',
          position: 1,
        },
      ],
    },
    {
      universalIdentifier: I.FINANCIAL_ACCOUNT_FACTS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'facts',
      label: 'Finance facts',
      icon: 'IconTable',
      relationTargetObjectMetadataUniversalIdentifier:
        I.FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        I.FINANCE_FACT_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
    {
      universalIdentifier:
        I.FINANCIAL_ACCOUNT_SOURCE_ARTIFACTS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'sourceArtifacts',
      label: 'Source artifacts',
      icon: 'IconFileDescription',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        I.SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        I.SOURCE_ARTIFACT_FINANCIAL_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});

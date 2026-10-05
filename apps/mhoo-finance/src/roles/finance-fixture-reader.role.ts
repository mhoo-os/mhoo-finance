import {
  defineRole,
  RowLevelPermissionPredicateOperand,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  FINANCE_FIXTURE_READER_ROLE_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_DECISION_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_INVESTIGATION_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_MATCH_GROUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_MATCH_MEMBER_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineRole({
  universalIdentifier: FINANCE_FIXTURE_READER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Mhoo Finance reviewer',
  description:
    'Read Finance records, native Tasks and immutable evidence decisions. Mutations require a separately bounded authenticated route.',
  canAccessAllTools: false,
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: true,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    ...[
      FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
      FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
      SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
      FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
      FINANCE_INVESTIGATION_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
      FINANCE_MATCH_GROUP_OBJECT_UNIVERSAL_IDENTIFIER,
      FINANCE_MATCH_MEMBER_OBJECT_UNIVERSAL_IDENTIFIER,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    })),
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier:
        FINANCE_EVIDENCE_LINK_DECISION_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
  fieldPermissions: [],
  rowLevelPermissionPredicates: [
    {
      universalIdentifier: '717ef529-7642-46ab-872e-bd1337cf326b',
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      fieldUniversalIdentifier: '297123dd-275d-4f12-9cf4-92e47fcb2c94',
      operand: RowLevelPermissionPredicateOperand.IS,
      value: ['MHOO_FINANCE_V1'],
    },
  ],
  permissionFlagUniversalIdentifiers: [],
});

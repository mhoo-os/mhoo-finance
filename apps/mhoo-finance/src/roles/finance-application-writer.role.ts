import {
  defineApplicationRole,
  RowLevelPermissionPredicateOperand,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  FINANCE_APPLICATION_WRITER_ROLE_UNIVERSAL_IDENTIFIER,
  FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const readable = [
  FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
];
const applicationWritable = [
  FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
];
const lockedEventFields = [
  [
    '35494ca7-8478-4de8-ab8b-d610a07c5cc0',
    '4d442572-c2a0-4b22-9507-ec58ff2747a2',
  ],
  [
    '99142a0f-8957-4332-85f1-a41227678ca2',
    '214bcdb0-bf79-4455-9486-34844b70e4d7',
  ],
  [
    'a57d514d-312f-4601-954f-2c1dfe20ce20',
    'cd36a4db-d2ac-4b15-b6b4-b3dd042b8a6d',
  ],
  [
    '7a0d6a6b-ddbc-4f5a-b925-df01861e88b9',
    '5511cc24-1429-446a-89a6-152c7e2531c1',
  ],
  [
    'bd191ba6-9221-44e8-81ee-02b6302b41ed',
    'd73dbad2-6a43-4127-9571-57ad30c3b728',
  ],
  [
    'd01924b7-14da-4bdc-af1e-ab5897b1bace',
    '4626992f-2897-4ef8-87b2-00f4ef93bd04',
  ],
  [
    '4998f768-e1fc-409a-8199-a973ce690673',
    'f07def5d-b558-4026-aa76-943c62cf19fc',
  ],
  [
    'ca69f823-403c-4cdf-9e7d-bdc170a5fafa',
    '077b7138-95d8-456f-8677-c9c8c76fe0a0',
  ],
  [
    'bf17ef4b-5c70-4697-b39d-6c4f31499ee5',
    'de0123d3-5ee6-4a07-a85d-a03d065fa121',
  ],
  [
    'b60bc0e8-31d0-4df5-bc34-56b5ad624b45',
    'f9662f3d-d6d8-430c-8249-ef96637e3b89',
  ],
] as const;

export default defineApplicationRole({
  universalIdentifier: FINANCE_APPLICATION_WRITER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Mhoo Finance application writer',
  description:
    'Non-assignable application identity for validated immutable Finance records. No provider, settings, deletion or native Task mutation authority.',
  canAccessAllTools: false,
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    ...readable.map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    })),
    ...applicationWritable.map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
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
  ],
  fieldPermissions: lockedEventFields.map(([, fieldUniversalIdentifier]) => ({
    objectUniversalIdentifier:
      FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
    fieldUniversalIdentifier,
    canReadFieldValue: true,
    canUpdateFieldValue: false,
  })),
  rowLevelPermissionPredicates: [
    ...lockedEventFields.map(
      ([universalIdentifier, fieldUniversalIdentifier]) => ({
        universalIdentifier,
        objectUniversalIdentifier:
          FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
        fieldUniversalIdentifier,
        operand:
          fieldUniversalIdentifier === '5511cc24-1429-446a-89a6-152c7e2531c1'
            ? RowLevelPermissionPredicateOperand.GREATER_THAN_OR_EQUAL
            : RowLevelPermissionPredicateOperand.IS_NOT_EMPTY,
        ...(fieldUniversalIdentifier === '5511cc24-1429-446a-89a6-152c7e2531c1'
          ? { value: 1 }
          : {}),
      }),
    ),
    {
      universalIdentifier: '66ed358d-96f9-47dc-b08c-94e0eb2759c5',
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      fieldUniversalIdentifier: '297123dd-275d-4f12-9cf4-92e47fcb2c94',
      operand: RowLevelPermissionPredicateOperand.IS,
      value: ['MHOO_FINANCE_V1'],
    },
  ],
  permissionFlagUniversalIdentifiers: [],
});

import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  RECONCILIATION_EXCEPTION_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_DIFFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_EXPECTED_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_LIMITING_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_OBSERVED_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_OBJECT_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_SEVERITY_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_SUPPORTING_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_EXCEPTIONS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

enum ExceptionStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

export default defineObject({
  universalIdentifier: RECONCILIATION_EXCEPTION_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'reconciliationException',
  namePlural: 'reconciliationExceptions',
  labelSingular: 'Reconciliation exception',
  labelPlural: 'Reconciliation exceptions',
  description: 'Deterministic difference with evidence, limitations, and a bounded next action.',
  icon: 'IconAlertTriangle',
  labelIdentifierFieldMetadataUniversalIdentifier:
    RECONCILIATION_EXCEPTION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'exceptionKey',
      label: 'Exception key',
      icon: 'IconKey',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'period',
      label: 'Period',
      icon: 'IconCalendar',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_SEVERITY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'severity',
      label: 'Severity',
      icon: 'IconAlertTriangle',
      options: [
        { id: 'a9e1d2f3-a4b5-4678-9012-3456789abd01', value: Severity.LOW, label: 'Low', color: 'gray', position: 0 },
        { id: 'a9e1d2f3-a4b5-4678-9012-3456789abd02', value: Severity.MEDIUM, label: 'Medium', color: 'orange', position: 1 },
        { id: 'a9e1d2f3-a4b5-4678-9012-3456789abd03', value: Severity.HIGH, label: 'High', color: 'red', position: 2 },
      ],
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Review status',
      icon: 'IconProgress',
      options: [
        { id: 'a9e1d2f3-a4b5-4678-9012-3456789abd04', value: ExceptionStatus.OPEN, label: 'Open', color: 'red', position: 0 },
        { id: 'a9e1d2f3-a4b5-4678-9012-3456789abd05', value: ExceptionStatus.RESOLVED, label: 'Resolved', color: 'green', position: 1 },
      ],
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_EXPECTED_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'expectedAmount',
      label: 'Expected (USD)',
      icon: 'IconCurrencyDollar',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_OBSERVED_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'observedAmount',
      label: 'Observed (USD)',
      icon: 'IconCurrencyDollar',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_DIFFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'difference',
      label: 'Difference (USD)',
      icon: 'IconCurrencyDollar',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'reason',
      label: 'Why flagged',
      icon: 'IconQuestionMark',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_SUPPORTING_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'supportingEvidence',
      label: 'Supporting evidence',
      icon: 'IconCheck',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_LIMITING_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'limitingEvidence',
      label: 'Limiting evidence',
      icon: 'IconInfoCircle',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'nextAction',
      label: 'Next bounded action',
      icon: 'IconArrowRight',
    },
    {
      universalIdentifier: RECONCILIATION_EXCEPTION_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'artifact',
      label: 'Source artifact',
      icon: 'IconFileDescription',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        SOURCE_ARTIFACT_EXCEPTIONS_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'artifactId',
      },
    },
  ],
});

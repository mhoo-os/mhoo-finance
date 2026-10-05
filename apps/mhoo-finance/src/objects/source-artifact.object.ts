import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  FINANCE_FACT_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
  IMPORT_RECEIPT_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER,
  IMPORT_RECEIPT_OBJECT_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_OBJECT_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_FRESHNESS_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_HASH_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_RECEIPTS_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_FACTS_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_EXCEPTIONS_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_FILENAME_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_MIME_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_BYTE_LENGTH_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_ACQUIRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_ACQUIRED_BY_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_SUPERSEDES_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_FINANCIAL_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCIAL_ACCOUNT_SOURCE_ARTIFACTS_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_FILES_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_STATEMENT_CONTROLS_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_ROW_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

enum SourceKind {
  BANK = 'BANK',
  CARD = 'CARD',
  TOAST = 'TOAST',
  CLOVER = 'CLOVER',
}

enum ArtifactStatus {
  IMPORTED = 'IMPORTED',
  DUPLICATE = 'DUPLICATE',
  PARTIAL = 'PARTIAL',
  REJECTED = 'REJECTED',
  IMPORTED_WITH_REJECTIONS = 'IMPORTED_WITH_REJECTIONS',
}

enum Freshness {
  FRESH = 'FRESH',
  STALE = 'STALE',
}

export default defineObject({
  universalIdentifier: SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'sourceArtifact',
  namePlural: 'sourceArtifacts',
  labelSingular: 'Source artifact',
  labelPlural: 'Source artifacts',
  description: 'Immutable synthetic or later-approved source evidence with import lineage.',
  icon: 'IconFileDescription',
  labelIdentifierFieldMetadataUniversalIdentifier:
    SOURCE_ARTIFACT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: SOURCE_ARTIFACT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'artifactKey',
      label: 'Artifact key',
      description: 'Stable fixture or source artifact identity.',
      icon: 'IconKey',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'accountKey',
      label: 'Account key',
      description: 'Scoped account identity; normal presentation must use an approved masked label.',
      icon: 'IconBuildingBank',
    },
    {
      universalIdentifier:
        SOURCE_ARTIFACT_FINANCIAL_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'financialAccount',
      label: 'Financial account',
      description: 'Required binding before a statement source can be imported.',
      icon: 'IconBuildingBank',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        FINANCIAL_ACCOUNT_SOURCE_ARTIFACTS_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'financialAccountId',
      },
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'sourceKind',
      label: 'Source kind',
      icon: 'IconDatabaseImport',
      options: [
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd01', value: SourceKind.BANK, label: 'Bank', color: 'blue', position: 0 },
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd02', value: SourceKind.CARD, label: 'Card', color: 'purple', position: 1 },
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd03', value: SourceKind.TOAST, label: 'Toast', color: 'orange', position: 2 },
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd04', value: SourceKind.CLOVER, label: 'Clover', color: 'green', position: 3 },
      ],
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'period',
      label: 'Period',
      icon: 'IconCalendar',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_HASH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'contentHash',
      label: 'Content hash',
      description: 'Synthetic content identity used for duplicate suppression.',
      icon: 'IconHash',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Import status',
      icon: 'IconProgress',
      options: [
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd05', value: ArtifactStatus.IMPORTED, label: 'Imported', color: 'green', position: 0 },
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd06', value: ArtifactStatus.DUPLICATE, label: 'Duplicate', color: 'gray', position: 1 },
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd09', value: ArtifactStatus.PARTIAL, label: 'Partial', color: 'yellow', position: 2 },
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd10', value: ArtifactStatus.REJECTED, label: 'Rejected', color: 'red', position: 3 },
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd11', value: ArtifactStatus.IMPORTED_WITH_REJECTIONS, label: 'Imported with rejections', color: 'orange', position: 4 },
      ],
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_FRESHNESS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'freshness',
      label: 'Freshness',
      icon: 'IconClock',
      options: [
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd07', value: Freshness.FRESH, label: 'Fresh', color: 'green', position: 0 },
        { id: 'c9e1d2f3-a4b5-4678-9012-3456789abd08', value: Freshness.STALE, label: 'Stale', color: 'orange', position: 1 },
      ],
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_FILENAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'originalFileName',
      label: 'Original filename',
      description: 'Filename supplied with the append-only original artifact.',
      icon: 'IconFile',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_MIME_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'mimeType',
      label: 'MIME type',
      icon: 'IconFileType',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_BYTE_LENGTH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'byteLength',
      label: 'Byte length',
      icon: 'IconFileAnalytics',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_ACQUIRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'acquiredAt',
      label: 'Acquired at',
      icon: 'IconClock',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_ACQUIRED_BY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'acquiredBy',
      label: 'Acquired by',
      icon: 'IconUser',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_STATEMENT_CONTROLS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'statementControls',
      label: 'Statement controls',
      description: 'Versioned supplied statement totals and balance controls.',
      icon: 'IconCalculator',
      isNullable: true,
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_FILES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.FILES,
      name: 'originalFiles',
      label: 'Original files',
      description: 'Immutable Twenty Files-compatible evidence reference; upload is outside this source slice.',
      icon: 'IconFile',
      universalSettings: { maxNumberOfValues: 1 },
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_SUPERSEDES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'supersedesArtifactKey',
      label: 'Supersedes artifact key',
      description: 'Correction lineage; prior original evidence remains retained.',
      icon: 'IconVersions',
      isNullable: true,
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_ROW_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'rowCount',
      label: 'Row count',
      icon: 'IconRows',
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_RECEIPTS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'importReceipts',
      label: 'Import receipts',
      icon: 'IconReceipt',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        IMPORT_RECEIPT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        IMPORT_RECEIPT_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_FACTS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'facts',
      label: 'Normalized facts',
      icon: 'IconListDetails',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        FINANCE_FACT_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    {
      universalIdentifier: SOURCE_ARTIFACT_EXCEPTIONS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'exceptions',
      label: 'Reconciliation exceptions',
      icon: 'IconAlertTriangle',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        RECONCILIATION_EXCEPTION_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        RECONCILIATION_EXCEPTION_ARTIFACT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
  ],
});

import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  COVERAGE_PERIOD_COMPLETENESS_RECEIPT_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_EXPECTED_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_FRESHNESS_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_LINEAGE_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_OBSERVED_ROWS_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

enum SourceKind {
  BANK = 'BANK',
  CARD = 'CARD',
  TOAST = 'TOAST',
  CLOVER = 'CLOVER',
}

enum CoverageStatus {
  COMPLETE = 'COMPLETE',
  PARTIAL = 'PARTIAL',
  NO_DATA = 'NO_DATA',
  NO_ACTIVITY = 'NO_ACTIVITY',
  STALE = 'STALE',
}

enum Freshness {
  FRESH = 'FRESH',
  STALE = 'STALE',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export default defineObject({
  universalIdentifier: COVERAGE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'coveragePeriod',
  namePlural: 'coveragePeriods',
  labelSingular: 'Coverage period',
  labelPlural: 'Coverage periods',
  description: 'Source-period coverage and freshness; no activity is distinct from no data.',
  icon: 'IconCalendarStats',
  labelIdentifierFieldMetadataUniversalIdentifier:
    COVERAGE_PERIOD_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: COVERAGE_PERIOD_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'coverageKey',
      label: 'Coverage key',
      icon: 'IconKey',
    },
    {
      universalIdentifier: COVERAGE_PERIOD_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'period',
      label: 'Period',
      icon: 'IconCalendar',
    },
    {
      universalIdentifier: COVERAGE_PERIOD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'sourceKind',
      label: 'Source kind',
      icon: 'IconDatabaseImport',
      options: [
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd01', value: SourceKind.BANK, label: 'Bank', color: 'blue', position: 0 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd02', value: SourceKind.CARD, label: 'Card', color: 'purple', position: 1 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd03', value: SourceKind.TOAST, label: 'Toast', color: 'orange', position: 2 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd04', value: SourceKind.CLOVER, label: 'Clover', color: 'green', position: 3 },
      ],
    },
    {
      universalIdentifier: COVERAGE_PERIOD_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Coverage status',
      icon: 'IconProgress',
      options: [
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd05', value: CoverageStatus.COMPLETE, label: 'Complete', color: 'green', position: 0 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd06', value: CoverageStatus.PARTIAL, label: 'Partial', color: 'yellow', position: 1 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd07', value: CoverageStatus.NO_DATA, label: 'No data', color: 'red', position: 2 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd08', value: CoverageStatus.NO_ACTIVITY, label: 'No activity', color: 'gray', position: 3 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abd09', value: CoverageStatus.STALE, label: 'Stale', color: 'orange', position: 4 },
      ],
    },
    {
      universalIdentifier: COVERAGE_PERIOD_EXPECTED_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'expectedPopulation',
      label: 'Expected population',
      icon: 'IconTarget',
    },
    {
      universalIdentifier: COVERAGE_PERIOD_OBSERVED_ROWS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'observedRows',
      label: 'Observed rows',
      icon: 'IconTable',
    },
    {
      universalIdentifier: COVERAGE_PERIOD_FRESHNESS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'freshness',
      label: 'Freshness',
      icon: 'IconClock',
      options: [
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abda0', value: Freshness.FRESH, label: 'Fresh', color: 'green', position: 0 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abda1', value: Freshness.STALE, label: 'Stale', color: 'orange', position: 1 },
        { id: 'f9e1d2f3-a4b5-4678-9012-3456789abda2', value: Freshness.NOT_APPLICABLE, label: 'Not applicable', color: 'gray', position: 2 },
      ],
    },
    {
      universalIdentifier: COVERAGE_PERIOD_LINEAGE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'lineage',
      label: 'Lineage',
      icon: 'IconRoute',
    },
    {
      universalIdentifier: COVERAGE_PERIOD_COMPLETENESS_RECEIPT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'completenessReceipt',
      label: 'Completeness receipt',
      description: 'Validated named-population proof. The legacy coverage badge alone cannot support PROVEN_COMPLETE.',
      icon: 'IconListCheck',
      isNullable: true,
    },
  ],
});

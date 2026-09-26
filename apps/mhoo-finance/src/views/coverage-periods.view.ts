import { defineView, ViewType } from 'twenty-sdk/define';

import {
  COVERAGE_PERIOD_FRESHNESS_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_OBSERVED_ROWS_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  COVERAGE_PERIOD_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const COVERAGE_PERIODS_VIEW_UNIVERSAL_IDENTIFIER =
  'f9e1d2f3-a4b5-4678-9012-3456789abf01';

export default defineView({
  universalIdentifier: COVERAGE_PERIODS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Coverage periods',
  objectUniversalIdentifier: COVERAGE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCalendarStats',
  position: 0,
  fields: [
    { universalIdentifier: 'f9e1d2f3-a4b5-4678-9012-3456789abf11', fieldMetadataUniversalIdentifier: COVERAGE_PERIOD_KEY_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 240 },
    { universalIdentifier: 'f9e1d2f3-a4b5-4678-9012-3456789abf12', fieldMetadataUniversalIdentifier: COVERAGE_PERIOD_PERIOD_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 100 },
    { universalIdentifier: 'f9e1d2f3-a4b5-4678-9012-3456789abf13', fieldMetadataUniversalIdentifier: COVERAGE_PERIOD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 120 },
    { universalIdentifier: 'f9e1d2f3-a4b5-4678-9012-3456789abf14', fieldMetadataUniversalIdentifier: COVERAGE_PERIOD_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 140 },
    { universalIdentifier: 'f9e1d2f3-a4b5-4678-9012-3456789abf15', fieldMetadataUniversalIdentifier: COVERAGE_PERIOD_OBSERVED_ROWS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 120 },
    { universalIdentifier: 'f9e1d2f3-a4b5-4678-9012-3456789abf16', fieldMetadataUniversalIdentifier: COVERAGE_PERIOD_FRESHNESS_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true, size: 140 },
  ],
});

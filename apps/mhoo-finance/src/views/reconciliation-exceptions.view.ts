import { defineView, ViewType } from 'twenty-sdk/define';

import {
  RECONCILIATION_EXCEPTION_DIFFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_OBJECT_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_SEVERITY_FIELD_UNIVERSAL_IDENTIFIER,
  RECONCILIATION_EXCEPTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const RECONCILIATION_EXCEPTIONS_VIEW_UNIVERSAL_IDENTIFIER =
  'a9e1d2f3-a4b5-4678-9012-3456789abf01';

export default defineView({
  universalIdentifier: RECONCILIATION_EXCEPTIONS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Reconciliation exceptions',
  objectUniversalIdentifier: RECONCILIATION_EXCEPTION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconAlertTriangle',
  position: 0,
  fields: [
    { universalIdentifier: 'a9e1d2f3-a4b5-4678-9012-3456789abf11', fieldMetadataUniversalIdentifier: RECONCILIATION_EXCEPTION_KEY_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 260 },
    { universalIdentifier: 'a9e1d2f3-a4b5-4678-9012-3456789abf12', fieldMetadataUniversalIdentifier: RECONCILIATION_EXCEPTION_PERIOD_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 100 },
    { universalIdentifier: 'a9e1d2f3-a4b5-4678-9012-3456789abf13', fieldMetadataUniversalIdentifier: RECONCILIATION_EXCEPTION_SEVERITY_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 120 },
    { universalIdentifier: 'a9e1d2f3-a4b5-4678-9012-3456789abf14', fieldMetadataUniversalIdentifier: RECONCILIATION_EXCEPTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 120 },
    { universalIdentifier: 'a9e1d2f3-a4b5-4678-9012-3456789abf15', fieldMetadataUniversalIdentifier: RECONCILIATION_EXCEPTION_DIFFERENCE_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 150 },
  ],
});

import { defineView, ViewType } from 'twenty-sdk/define';

import {
  SOURCE_ARTIFACT_FRESHNESS_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_HASH_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_ROW_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const SOURCE_ARTIFACTS_VIEW_UNIVERSAL_IDENTIFIER =
  'c9e1d2f3-a4b5-4678-9012-3456789abf01';

export default defineView({
  universalIdentifier: SOURCE_ARTIFACTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Source artifacts',
  objectUniversalIdentifier: SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFileDescription',
  position: 0,
  fields: [
    { universalIdentifier: 'c9e1d2f3-a4b5-4678-9012-3456789abf11', fieldMetadataUniversalIdentifier: SOURCE_ARTIFACT_KEY_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 240 },
    { universalIdentifier: 'c9e1d2f3-a4b5-4678-9012-3456789abf12', fieldMetadataUniversalIdentifier: SOURCE_ARTIFACT_KIND_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 120 },
    { universalIdentifier: 'c9e1d2f3-a4b5-4678-9012-3456789abf13', fieldMetadataUniversalIdentifier: SOURCE_ARTIFACT_PERIOD_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 120 },
    { universalIdentifier: 'c9e1d2f3-a4b5-4678-9012-3456789abf14', fieldMetadataUniversalIdentifier: SOURCE_ARTIFACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 130 },
    { universalIdentifier: 'c9e1d2f3-a4b5-4678-9012-3456789abf15', fieldMetadataUniversalIdentifier: SOURCE_ARTIFACT_FRESHNESS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 120 },
    { universalIdentifier: 'c9e1d2f3-a4b5-4678-9012-3456789abf16', fieldMetadataUniversalIdentifier: SOURCE_ARTIFACT_ROW_COUNT_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true, size: 100 },
    { universalIdentifier: 'c9e1d2f3-a4b5-4678-9012-3456789abf17', fieldMetadataUniversalIdentifier: SOURCE_ARTIFACT_HASH_FIELD_UNIVERSAL_IDENTIFIER, position: 6, isVisible: false, size: 220 },
  ],
});

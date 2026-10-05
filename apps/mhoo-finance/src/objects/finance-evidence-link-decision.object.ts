import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  FINANCE_EVIDENCE_LINK_DECISION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_DECISION_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_ENTRY_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_HISTORY_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_PRESERVES_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_SOURCE_TYPES_FIELD_UNIVERSAL_IDENTIFIER,
  FINANCE_EVIDENCE_LINK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier:
    FINANCE_EVIDENCE_LINK_DECISION_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'financeEvidenceLinkDecision',
  namePlural: 'financeEvidenceLinkDecisions',
  labelSingular: 'Finance evidence link decision',
  labelPlural: 'Finance evidence link decisions',
  description:
    'Append-history reviewer disposition for a relationship between retained Finance records.',
  icon: 'IconLink',
  labelIdentifierFieldMetadataUniversalIdentifier:
    FINANCE_EVIDENCE_LINK_DECISION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier:
        FINANCE_EVIDENCE_LINK_DECISION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'decisionKey',
      label: 'Decision key',
      icon: 'IconKey',
    },
    {
      universalIdentifier:
        FINANCE_EVIDENCE_LINK_ENTRY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'entryReference',
      label: 'Entry reference',
      icon: 'IconReceipt',
    },
    {
      universalIdentifier:
        FINANCE_EVIDENCE_LINK_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'evidenceReference',
      label: 'Evidence reference',
      icon: 'IconFileDescription',
    },
    {
      universalIdentifier:
        FINANCE_EVIDENCE_LINK_SOURCE_TYPES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceTypes',
      label: 'Source types',
      description:
        'Explicit source type pair; never inferred from description.',
      icon: 'IconArrowsExchange',
    },
    {
      universalIdentifier:
        FINANCE_EVIDENCE_LINK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'linkStatus',
      label: 'Link status',
      icon: 'IconProgress',
      options: [
        {
          id: '84fc764a-d47e-46eb-b92d-e501ccd44f4f',
          value: 'LINKED',
          label: 'Linked',
          color: 'green',
          position: 0,
        },
        {
          id: 'cb219377-1b12-4841-8378-9fc48a7f3dd3',
          value: 'NEEDS_REVIEW',
          label: 'Needs review',
          color: 'orange',
          position: 1,
        },
        {
          id: '16b90da8-4d8f-40a9-9844-493b592f00ff',
          value: 'UNLINKED',
          label: 'Unlinked',
          color: 'gray',
          position: 2,
        },
        {
          id: 'c319b301-8f7b-4a4a-bef3-318957d7670b',
          value: 'NO_LINK',
          label: 'No link',
          color: 'red',
          position: 3,
        },
      ],
    },
    {
      universalIdentifier:
        FINANCE_EVIDENCE_LINK_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'reasonCode',
      label: 'Reason code',
      icon: 'IconInfoCircle',
    },
    {
      universalIdentifier:
        FINANCE_EVIDENCE_LINK_HISTORY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'decisionHistory',
      label: 'Decision history',
      description:
        'JSON append history. Prior actions and original record references remain retained.',
      icon: 'IconHistory',
    },
    {
      universalIdentifier:
        FINANCE_EVIDENCE_LINK_PRESERVES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'preservesOriginals',
      label: 'Preserves originals',
      icon: 'IconShieldCheck',
      defaultValue: true,
    },
  ],
});

import {
  defineObject,
  FieldType,
  MetadataWritability,
} from 'twenty-sdk/define';

import * as I from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier:
    I.FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'financeInvestigationEvent',
  namePlural: 'financeInvestigationEvents',
  labelSingular: 'Finance investigation event',
  labelPlural: 'Finance investigation events',
  description:
    'Immutable, sequenced Finance review event. Current state is derived; prior explanations and dispositions are never overwritten.',
  icon: 'IconTimelineEvent',
  writability: MetadataWritability.APPLICATION,
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    I.FINANCE_INVESTIGATION_EVENT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'eventKey',
      label: 'Event key',
      icon: 'IconKey',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_AGGREGATE_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'aggregateKind',
      label: 'Aggregate kind',
      icon: 'IconCategory',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_AGGREGATE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'aggregateReference',
      label: 'Aggregate reference',
      icon: 'IconId',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_SEQUENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'sequence',
      label: 'Sequence',
      icon: 'IconListNumbers',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'eventType',
      label: 'Event type',
      icon: 'IconActivity',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_PAYLOAD_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'eventPayload',
      label: 'Event payload',
      description: 'Versioned, validated JSON. It may reference evidence but never embeds source secrets.',
      icon: 'IconBraces',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_PREVIOUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'previousEventReference',
      label: 'Previous event',
      icon: 'IconArrowBackUp',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'actorWorkspaceMemberId',
      label: 'Actor Workspace member',
      icon: 'IconUserCheck',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'occurredAt',
      label: 'Occurred at',
      icon: 'IconClock',
    },
    {
      universalIdentifier:
        I.FINANCE_INVESTIGATION_EVENT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'nativeTaskReference',
      label: 'Native Task reference',
      icon: 'IconCheckbox',
    },
  ],
});

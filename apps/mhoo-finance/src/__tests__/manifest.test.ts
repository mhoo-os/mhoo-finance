import { describe, expect, it } from 'vitest';
import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

import {
  FINANCE_EVIDENCE_LINK_DECISION_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_FACT_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_INVESTIGATION_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_MATCH_GROUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCE_MATCH_MEMBER_OBJECT_UNIVERSAL_IDENTIFIER,
  FINANCIAL_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  SOURCE_ARTIFACT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import application from 'src/application.config';
import financeFixtureReaderRole from 'src/roles/finance-fixture-reader.role';
import financeApplicationWriterRole from 'src/roles/finance-application-writer.role';

describe('@mhoo/finance fixture manifest contracts', () => {
  it('declares no secret App variables', () => {
    expect(application.success).toBe(true);
    expect(application.config?.serverVariables).toBeUndefined();
  });

  it('grants bounded review access without deletion, settings, provider or agent authority', () => {
    expect(financeFixtureReaderRole.success).toBe(true);
    expect(financeFixtureReaderRole.config).toMatchObject({
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
      permissionFlagUniversalIdentifiers: [],
    });
    expect(
      financeFixtureReaderRole.config?.rowLevelPermissionPredicates,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
          fieldUniversalIdentifier: '297123dd-275d-4f12-9cf4-92e47fcb2c94',
          value: ['MHOO_FINANCE_V1'],
        }),
      ]),
    );
  });

  it('keeps the application writer non-assignable and unable to mutate native Tasks', () => {
    expect(financeApplicationWriterRole.success).toBe(true);
    expect(financeApplicationWriterRole.config).toMatchObject({
      canUpdateAllObjectRecords: false,
      canSoftDeleteAllObjectRecords: false,
      canDestroyAllObjectRecords: false,
      canBeAssignedToUsers: false,
      canBeAssignedToAgents: false,
      canBeAssignedToApiKeys: false,
    });
    const permissions =
      financeApplicationWriterRole.config?.objectPermissions ?? [];
    expect(
      permissions.find(
        ({ objectUniversalIdentifier }) =>
          objectUniversalIdentifier ===
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      ),
    ).toMatchObject({
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
    });
    expect(
      financeApplicationWriterRole.config?.rowLevelPermissionPredicates,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
          fieldUniversalIdentifier: '297123dd-275d-4f12-9cf4-92e47fcb2c94',
          value: ['MHOO_FINANCE_V1'],
        }),
      ]),
    );
    for (const objectUniversalIdentifier of [
      FINANCE_INVESTIGATION_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
    ]) {
      expect(
        permissions.find(
          (permission) =>
            permission.objectUniversalIdentifier === objectUniversalIdentifier,
        ),
      ).toMatchObject({
        canReadObjectRecords: true,
        canUpdateObjectRecords: true,
        canSoftDeleteObjectRecords: false,
        canDestroyObjectRecords: false,
      });
    }
  });
});

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import account from '../objects/financial-account.object';
import fact from '../objects/finance-fact.object';
import artifact from '../objects/source-artifact.object';
import coverage from '../objects/coverage-period.object';
import financeFactKeyIndex from '../indexes/finance-fact-key.index';
import importReceiptKeyIndex from '../indexes/import-receipt-key.index';
import overviewNavigation from '../navigation-menu-items/finance-audit-dashboard.navigation-menu-item';
import accountNavigation from '../navigation-menu-items/financial-accounts.navigation-menu-item';
import transactionNavigation from '../navigation-menu-items/finance-facts.navigation-menu-item';
import statementNavigation from '../navigation-menu-items/finance-statements.navigation-menu-item';
import followUpNavigation from '../navigation-menu-items/finance-follow-ups.navigation-menu-item';
import overviewLayout from '../page-layouts/finance-audit-dashboard.page-layout';
import accountLayout from '../page-layouts/finance-accounts.page-layout';
import transactionLayout from '../page-layouts/finance-transactions.page-layout';
import statementLayout from '../page-layouts/finance-statements.page-layout';
import followUpLayout from '../page-layouts/finance-follow-ups.page-layout';
import * as I from '../constants/universal-identifiers';

const frontComponentSource = readFileSync(
  new URL(
    '../front-components/finance-audit-dashboard.front-component.tsx',
    import.meta.url,
  ),
  'utf8',
);
const workspaceSource = readFileSync(
  new URL('../components/finance-workspace.tsx', import.meta.url),
  'utf8',
);
const workspaceStyles = readFileSync(
  new URL('../components/finance-workspace-styles.ts', import.meta.url),
  'utf8',
);
const insightsSource = readFileSync(
  new URL('../components/finance-insights.tsx', import.meta.url),
  'utf8',
);
const periodControlsSource = readFileSync(
  new URL('../components/finance-ui/finance-period-controls.tsx', import.meta.url),
  'utf8',
);
const primitivesSource = readFileSync(
  new URL('../components/finance-ui/finance-insights-primitives.tsx', import.meta.url),
  'utf8',
);

const frontComponentId = (layout: typeof overviewLayout) => {
  const configuration = layout.config?.tabs?.[0]?.widgets?.[0]?.configuration;
  return configuration?.configurationType === 'FRONT_COMPONENT'
    ? configuration.frontComponentUniversalIdentifier
    : undefined;
};

describe('native Finance workspace', () => {
  it('opens the Overview directly without obsolete setup or count tabs', () => {
    expect(frontComponentSource).toContain(
      'FinanceWorkspacePreparation = () => <FinanceWorkspace />',
    );
    expect(overviewLayout.config?.tabs).toHaveLength(1);
    expect(overviewLayout.config?.tabs?.[0]?.title).toBe('Overview');
    expect(frontComponentId(overviewLayout)).toBe(
      I.FINANCE_AUDIT_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
    );
  });

  it('keeps the four core pages in order and adds the linked Follow-ups page', () => {
    const navigation = [
      overviewNavigation,
      accountNavigation,
      transactionNavigation,
      statementNavigation,
      followUpNavigation,
    ];
    expect(
      navigation.map((item) => ({
        name: item.config?.name,
        position: item.config?.position,
        type: item.config?.type,
      })),
    ).toEqual([
      { name: 'Overview', position: 1, type: 'PAGE_LAYOUT' },
      { name: 'Accounts', position: 2, type: 'PAGE_LAYOUT' },
      { name: 'Transactions', position: 3, type: 'PAGE_LAYOUT' },
      { name: 'Statements', position: 4, type: 'PAGE_LAYOUT' },
      { name: 'Follow-ups', position: 5, type: 'PAGE_LAYOUT' },
    ]);
    expect(accountNavigation.config?.pageLayoutUniversalIdentifier).toBe(
      I.FINANCE_ACCOUNTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
    );
    expect(transactionNavigation.config?.pageLayoutUniversalIdentifier).toBe(
      I.FINANCE_TRANSACTIONS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
    );
    expect(statementNavigation.config?.pageLayoutUniversalIdentifier).toBe(
      I.FINANCE_STATEMENTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
    );
    expect(followUpNavigation.config?.pageLayoutUniversalIdentifier).toBe(
      I.FINANCE_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
    );
  });

  it('renders each native destination through its designed Finance component', () => {
    expect(frontComponentId(accountLayout as typeof overviewLayout)).toBe(
      I.FINANCE_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
    );
    expect(frontComponentId(transactionLayout as typeof overviewLayout)).toBe(
      I.FINANCE_TRANSACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
    );
    expect(frontComponentId(statementLayout as typeof overviewLayout)).toBe(
      I.FINANCE_STATEMENTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
    );
    expect(frontComponentId(followUpLayout as typeof overviewLayout)).toBe(
      I.FINANCE_FOLLOW_UPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
    );
  });

  it('uses the approved Overview token system and no duplicate embedded shell navigation', () => {
    expect(workspaceStyles).toContain(
      "import { financeInsightsPrimitiveStyles, financeInsightsResponsiveStyles, financeInsightsTokens } from './finance-insights-styles'",
    );
    expect(workspaceStyles).toContain('fontFamily: financeInsightsTokens.fontFamily');
    expect(workspaceStyles).toContain("'--fi-frame-inline': financeInsightsTokens.frameInline");
    expect(workspaceStyles).toContain('fontSize: financeInsightsTokens.titleSize');
    expect(workspaceStyles).toContain('borderRadius: financeInsightsTokens.controlRadius');
    expect(workspaceSource).not.toContain('<header className="fw-chrome">');
    expect(workspaceSource).not.toContain('<nav className="fw-nav"');
    expect(workspaceSource).toContain("dataSource = 'workspace'");
    expect(workspaceSource).toContain('Preview sample data');
    expect(workspaceSource).toContain('Return to Workspace records');
    expect(workspaceSource).toContain('aria-pressed={isSynthetic}');
    expect(workspaceSource).toContain('key="workspace"');
    expect(workspaceSource).toContain('key="synthetic"');
    expect(workspaceSource).toContain('No demo data was substituted');
    expect(workspaceSource).toContain('Native Twenty Task');
    expect(workspaceSource).toContain('Approve draft · do not send');
  });

  it('keeps narrow headers readable and statement control values scannable', () => {
    expect(workspaceStyles).toContain('flexWrap: \'wrap\'');
    expect(workspaceSource).toContain('<FinancePageHeader title={selectedFollowUp');
    expect(primitivesSource).toContain('className="hi-title"');
    expect(primitivesSource).not.toContain('fi-page-header');
    expect(workspaceSource).toContain('className="fw-table fw-statement-table"');
    expect(workspaceSource).toContain('Scroll the table sideways to see opening, closing, and status.');
    expect(workspaceStyles).toContain("'& .fw-statement-table': { minWidth: '960px', tableLayout: 'auto' }");
    expect(workspaceSource).toContain('No financial accounts are available in this Workspace.');
    expect(workspaceSource).toContain('No statement source artifacts are available in this Workspace.');
    expect(workspaceSource).toContain('No statement source artifacts match this window and account.');
    expect(workspaceSource).not.toContain('No financial accounts are visible to your role.');
    expect(workspaceSource).not.toContain('No statement source artifacts are visible to your role.');
  });

  it('keeps the browser drag enhancement while providing a host-native range control', () => {
    expect(insightsSource).toContain('<FinancePeriodControls');
    expect(workspaceSource).toContain('<FinancePeriodControls');
    expect(periodControlsSource).toContain("typeof capture !== 'function' || typeof measure !== 'function'");
    expect(periodControlsSource).toContain('capture.call(event.currentTarget, event.pointerId)');
    expect(periodControlsSource).toContain('measure.call(ruler.current).width');
    expect(periodControlsSource).toContain('timelinePresentation.minimumWidth');
    expect(periodControlsSource).toContain('timelinePresentation.years.map((month) => <span className="hi-year"');
    expect(workspaceSource).not.toContain('.focus()');
    expect(workspaceSource).not.toContain('document.addEventListener');
    expect(periodControlsSource).toContain('onPointerMove={moveDrag}');
    expect(periodControlsSource).toContain('onPointerCancel={() => { drag.current = null; }}');
    expect(periodControlsSource).toContain('type="range"');
    expect(periodControlsSource).toContain('onInput={(event) => onRangeChange(moveFinancePeriodRangeToStart');
    expect(periodControlsSource).toContain('aria-label="Move selected time range with slider"');
    expect(periodControlsSource).toContain('type="submit" className="hi-primary"');
    expect(insightsSource).toContain('resetRange={defaultRange}');
    expect(workspaceSource).toContain("isSynthetic ? 'SYNTHETIC TEST RECORD' : 'WORKSPACE RECORD'");
    expect(workspaceSource).toContain('This drawer shows sample fields only.');
    expect(workspaceStyles).not.toContain('fw-native-range');
    expect(workspaceStyles).not.toContain('fw-window-selection');
    expect(workspaceStyles).not.toContain('fw-month-choice');
  });

  it('retains both account/fact relation directions without exposing raw tables as primary navigation', () => {
    expect(account.success).toBe(true);
    expect(fact.success).toBe(true);
    expect(
      account.config?.fields?.find((field) => field.name === 'facts'),
    ).toMatchObject({
      relationTargetFieldMetadataUniversalIdentifier:
        I.FINANCE_FACT_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
    });
    expect(
      fact.config?.fields?.find((field) => field.name === 'financialAccount'),
    ).toMatchObject({
      relationTargetFieldMetadataUniversalIdentifier:
        I.FINANCIAL_ACCOUNT_FACTS_FIELD_UNIVERSAL_IDENTIFIER,
    });
  });

  it('preserves installed source-account metadata and unique keys without changing current source scope', () => {
    expect(
      artifact.config?.fields?.find((field) => field.name === 'financialAccount'),
    ).toMatchObject({
      universalIdentifier:
        I.SOURCE_ARTIFACT_FINANCIAL_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        I.FINANCIAL_ACCOUNT_SOURCE_ARTIFACTS_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: { joinColumnName: 'financialAccountId' },
    });
    expect(
      account.config?.fields?.find((field) => field.name === 'sourceArtifacts'),
    ).toMatchObject({
      universalIdentifier:
        I.FINANCIAL_ACCOUNT_SOURCE_ARTIFACTS_FIELD_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        I.SOURCE_ARTIFACT_FINANCIAL_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
    });
    expect(financeFactKeyIndex.config).toMatchObject({
      universalIdentifier: I.FINANCE_FACT_KEY_INDEX_UNIVERSAL_IDENTIFIER,
      isUnique: true,
      fields: [
        expect.objectContaining({
          fieldUniversalIdentifier: I.FINANCE_FACT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
        }),
      ],
    });
    expect(importReceiptKeyIndex.config).toMatchObject({
      universalIdentifier: I.IMPORT_RECEIPT_KEY_INDEX_UNIVERSAL_IDENTIFIER,
      isUnique: true,
      fields: [
        expect.objectContaining({
          fieldUniversalIdentifier: I.IMPORT_RECEIPT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
        }),
      ],
    });
  });

  it('stores validated completeness proof separately from the legacy coverage badge', () => {
    expect(coverage.success).toBe(true);
    expect(
      coverage.config?.fields?.find(
        (field) => field.name === 'completenessReceipt',
      ),
    ).toMatchObject({
      universalIdentifier:
        I.COVERAGE_PERIOD_COMPLETENESS_RECEIPT_FIELD_UNIVERSAL_IDENTIFIER,
      type: 'TEXT',
      isNullable: true,
    });
  });
});

import styled from '@emotion/styled';
import { useState } from 'react';
import { handoffSource } from 'src/investigation/source-handoff';
import { Tag } from 'twenty-ui/data-display';
import { Callout } from 'twenty-ui/feedback';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { Card, CardContent } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

const SourceGrid = styled.div`
  display: grid;
  gap: ${() => themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
`;
const SourceContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${() => themeCssVariables.spacing[3]};
`;

export const FinanceSourceEntry = () => {
  const [state, setState] = useState<'idle' | 'opening' | 'failed' | 'handed-off'>('idle');
  const openApps = async () => {
    setState('opening');
    const result = await handoffSource('apps');
    setState(result === 'handed-off' ? 'handed-off' : 'failed');
  };
  return (
    <Section>
      <H2Title title="Add a financial source" description="A financial account describes a bank account or card. A source app manages the provider connection that supplies records." />
      <SourceGrid>
        <Card rounded fullWidth><CardContent><SourceContent>
          <Tag color="gray" text="Connection status unverified" />
          <H2Title title="Source apps" description="Open Apps to see what is available in this workspace. If Clover is installed and available to you, manage it there. Finance does not verify its connection here." />
          <Button title={state === 'opening' ? 'Opening Apps…' : 'Manage source apps'} disabled={state === 'opening'} onClick={() => { void openApps(); }} />
          <span>Apps checks your permissions. If access is denied or the provider is missing, ask your workspace administrator.</span>
        </SourceContent></CardContent></Card>
        <Card rounded fullWidth><CardContent><SourceContent>
          <Tag color="gray" text="Not available here" />
          <H2Title title="Bank statements and CSV exports" description="A reviewed upload and import flow is not available in this screen yet. Keep your original files; the saved samples below do not establish a live bank connection." />
          <Button title="Upload statement or CSV" disabled />
        </SourceContent></CardContent></Card>
      </SourceGrid>
      {state === 'failed' ? <Callout variant="warning" title="Could not open Apps" description="Use Settings → Applications. Access is checked there; this screen has not changed a connection or imported records." /> : null}
      {state === 'handed-off' ? <Callout variant="info" title="Handed off to Apps" description="Opening Apps does not confirm that a provider is installed or connected." /> : null}
    </Section>
  );
};

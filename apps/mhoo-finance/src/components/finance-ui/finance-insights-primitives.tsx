import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const FinanceHeader = ({ workspaceLabel, sample }: Readonly<{ workspaceLabel: string; sample: boolean }>) => <FinancePageHeader title="Insights" detail={workspaceLabel} badge={sample ? 'Fictional demo' : 'Workspace records'} />;

export const FinanceSourceRow = ({ children, onClick }: Readonly<{ children: ReactNode; onClick: () => void }>) => <button type="button" className="hi-source-row" onClick={onClick}>{children}</button>;

export const FinanceButton = ({ children, className = '', ...props }: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>) => <button type="button" className={`hi-button ${className}`.trim()} {...props}>{children}</button>;

/** The approved Overview title structure, parameterized for every Finance page. */
export const FinancePageHeader = ({ title, detail, actions, badge }: Readonly<{ title: string; detail?: string; actions?: ReactNode; badge?: string }>) => <header className="hi-title"><h1>{title}{detail ? <> <span>{detail}</span></> : null}</h1>{actions ? <div className="hi-page-actions">{actions}</div> : badge ? <span className="hi-demo">{badge}</span> : null}</header>;

export const FinanceEmptyState = ({ children }: Readonly<{ children: ReactNode }>) => <div className="fi-empty" role="status">{children}</div>;

import { useRef, useState } from 'react';
import type { RestApiClient } from 'twenty-client-sdk/rest';
import type {
  WorkspaceFinanceData,
  WorkspaceFinanceFollowUp,
} from '../investigation/workspace-finance-data';
import { financeFollowUpMutationFailure } from '../investigation/workspace-finance-follow-ups';
import {
  createWorkspaceFollowUp,
  FollowUpCreationUncertainError,
  listFollowUpNativeChoices,
  addWorkspaceFollowUpPerson,
  submitWorkspaceFollowUpEvidence,
  saveWorkspaceFollowUpDraft,
  acceptWorkspaceFollowUpEvidence,
  type FollowUpVersion,
} from '../investigation/workspace-follow-up-workflow';

type Props = {
  section: 'create' | 'people' | 'evidence' | 'email';
  task?: WorkspaceFinanceFollowUp;
  data: WorkspaceFinanceData;
  disabled: boolean;
  client?: RestApiClient;
  onSaved: (id: string) => Promise<void>;
};
export const FinanceFollowUpActions = ({
  section,
  task,
  data,
  disabled,
  client,
  onSaved,
}: Props) => {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [factId, setFactId] = useState('');
  const [personId, setPersonId] = useState('');
  const [personRole, setPersonRole] = useState('Evidence contact');
  const [explanation, setExplanation] = useState('');
  const [artifactId, setArtifactId] = useState('');
  const [noteId, setNoteId] = useState('');
  const [key, setKey] = useState('');
  const [share, setShare] = useState(false);
  const [mailbox, setMailbox] = useState(task?.draftEmail?.mailboxLabel ?? '');
  const [subject, setSubject] = useState(task?.draftEmail?.subject ?? '');
  const [body, setBody] = useState(task?.draftEmail?.body ?? '');
  const createAttempt = useRef<{
    taskId: string;
    title: string;
    factId: string;
  } | null>(null);
  const [choices, setChoices] = useState<
    readonly { id: string; label: string }[]
  >([]);
  const loadChoices = async (kind: 'people' | 'notes') => {
    if (disabled) return;
    try {
      setChoices(await listFollowUpNativeChoices(kind, client));
      setMessage(
        'Choose an existing record. At most 50 readable records are listed.',
      );
    } catch (error) {
      setMessage(
        financeFollowUpMutationFailure(error) === 'denied'
          ? 'Twenty denied access to these records.'
          : 'Could not load records.',
      );
    }
  };
  const version = (): FollowUpVersion => {
    if (!task) throw new Error('Select a Task');
    return {
      taskId: task.id,
      from: task.state,
      expectedUpdatedAt: task.updatedAt,
      expectedRevision: task.revision,
      operationId: crypto.randomUUID(),
    };
  };
  const run = async (action: () => Promise<unknown>, id?: string) => {
    if (disabled || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage('Saving…');
    try {
      await action();
      await onSaved(id ?? task!.id);
      setMessage('Saved and reloaded from the Task. No email sent.');
      return true;
    } catch (error) {
      setMessage(
        financeFollowUpMutationFailure(error) === 'denied'
          ? 'Twenty denied this action. Your existing permissions were not changed.'
          : error instanceof Error
            ? error.message
            : 'Save could not be verified. Reload before retrying.',
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const blocked =
    disabled ||
    busy ||
    Boolean(task?.contractWarning) ||
    task?.state === 'RESOLVED';
  const submit =
    (action: () => Promise<unknown>) => (event: React.FormEvent) => {
      event.preventDefault();
      void run(action);
    };
  return (
    <div className="fw-workflow-actions">
      {task?.state === 'RESOLVED' ? (
        <p className="fw-local">
          Reopen this follow-up from Summary before changing evidence or its
          request.
        </p>
      ) : null}
      {disabled ? (
        <p className="fw-local">This static sample is read-only.</p>
      ) : null}
      {section === 'create' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createAttempt.current ??= {
              taskId: crypto.randomUUID(),
              title,
              factId,
            };
            const attempt = createAttempt.current;
            void run(async () => {
              try {
                return await createWorkspaceFollowUp(attempt, client);
              } catch (error) {
                if (!(error instanceof FollowUpCreationUncertainError))
                  createAttempt.current = null;
                throw error;
              }
            }, attempt.taskId).then((saved) => {
              if (saved) {
                createAttempt.current = null;
                setTitle('');
                setFactId('');
              }
            });
          }}
        >
          <h3>Create a follow-up</h3>
          <label>
            Evidence question
            <input
              aria-label="Evidence question"
              disabled={busy || createAttempt.current !== null}
              required
              maxLength={500}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
            />
          </label>
          <label>
            Source transaction
            <select
              aria-label="Source transaction"
              disabled={busy || createAttempt.current !== null}
              required
              value={factId}
              onChange={(e) => setFactId(e.target.value)}
            >
              <option value="">Select a transaction</option>
              {data.facts
                .filter((f) => f.status === 'ACTIVE')
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.description || f.factKey}
                  </option>
                ))}
            </select>
          </label>
          <button className="fw-button" disabled={blocked}>
            Create Task
          </button>
          <p className="fw-local">
            Twenty checks your existing Task permission. The source transaction
            remains unchanged.
          </p>
        </form>
      ) : null}
      {section === 'people' ? (
        <form
          onSubmit={submit(() =>
            addWorkspaceFollowUpPerson(
              { ...version(), personId, role: personRole },
              client,
            ),
          )}
        >
          <h3>Select an existing Person</h3>
          <button
            type="button"
            className="fw-button"
            disabled={blocked}
            onClick={() => void loadChoices('people')}
          >
            Find existing People
          </button>
          <label>
            Person
            <select
              aria-label="Person"
              required
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              <option value="">Choose a Person</option>
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Role in this question
            <input
              aria-label="Role in this question"
              required
              maxLength={200}
              value={personRole}
              onChange={(e) => setPersonRole(e.target.value)}
            />
          </label>
          <button className="fw-button" disabled={blocked}>
            Add selected recipient
          </button>
          <p className="fw-local">
            Uses an existing readable Person. This does not invite them or grant
            access.
          </p>
        </form>
      ) : null}
      {section === 'evidence' ? (
        <>
          <form
            onSubmit={submit(() =>
              submitWorkspaceFollowUpEvidence(
                { ...version(), kind: 'EXPLANATION', explanation },
                client,
              ),
            )}
          >
            <h3>Submit an explanation</h3>
            <label>
              Explanation
              <textarea
                aria-label="Explanation"
                required
                maxLength={4000}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </label>
            <p className="fw-local">
              Visible to readers of this Task. Saved as an unverified user
              assertion.
            </p>
            <button className="fw-button" disabled={blocked}>
              Submit explanation
            </button>
          </form>
          <form
            onSubmit={submit(() =>
              submitWorkspaceFollowUpEvidence(
                { ...version(), kind: 'DOCUMENT', artifactId },
                client,
              ),
            )}
          >
            <h3>Attach retained evidence</h3>
            <label>
              Source artifact
              <select
                aria-label="Source artifact"
                required
                value={artifactId}
                onChange={(e) => setArtifactId(e.target.value)}
              >
                <option value="">Select retained source</option>
                {data.statements.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.originalFileName} · {s.period}
                  </option>
                ))}
              </select>
            </label>
            <button className="fw-button" disabled={blocked}>
              Attach source reference
            </button>
            <p className="fw-local">
              Keeps the existing source and hash. File upload and import are
              separate.
            </p>
          </form>
          <form
            onSubmit={submit(() =>
              submitWorkspaceFollowUpEvidence(
                {
                  ...version(),
                  kind: 'REPLY',
                  noteId,
                  correlationKey: key,
                  shareReference: share,
                },
                client,
              ),
            )}
          >
            <h3>Link a reply recorded in Notes</h3>
            <button
              type="button"
              className="fw-button"
              disabled={blocked}
              onClick={() => void loadChoices('notes')}
            >
              Find existing reply Notes
            </button>
            <label>
              Reply note
              <select
                aria-label="Reply note"
                required
                value={noteId}
                onChange={(e) => setNoteId(e.target.value)}
              >
                <option value="">Choose a note</option>
                {choices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Confirm this Task’s correlation key
              <input
                aria-label="Reply correlation key"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </label>
            <p className="fw-local">
              Task key: {task?.correlationKey}. This is a manual proposed link;
              mailbox origin is unverified.
            </p>
            <label>
              <input
                type="checkbox"
                checked={share}
                onChange={(e) => setShare(e.target.checked)}
              />
              Share this note reference with Task readers; do not copy its
              content
            </label>
            <button className="fw-button" disabled={blocked || !share}>
              Link reply for review
            </button>
          </form>
          <h3>Review submitted evidence</h3>
          {task?.evidence
            .filter((e) => !e.reviewerAccepted)
            .map((e) => (
              <button
                key={`${e.kind}:${e.reference}`}
                className="fw-button"
                disabled={blocked}
                onClick={() =>
                  void run(() =>
                    acceptWorkspaceFollowUpEvidence(
                      { ...version(), reference: e.reference, kind: e.kind },
                      client,
                    ),
                  )
                }
              >
                Accept for this follow-up: {e.label}
              </button>
            ))}
          <p className="fw-local">
            Acceptance records your workflow review. It does not reconcile or
            classify a transaction.
          </p>
        </>
      ) : null}
      {section === 'email' ? (
        <form
          onSubmit={submit(() =>
            saveWorkspaceFollowUpDraft(
              {
                ...version(),
                draft: {
                  mailboxLabel: mailbox,
                  subject,
                  body,
                  recipientPersonIds:
                    task?.people
                      .filter((p) => p.selectedRecipient)
                      .map((p) => p.personId) ?? [],
                  attachmentReferences:
                    task?.evidence
                      .filter((e) => e.kind === 'DOCUMENT')
                      .map((e) => e.reference) ?? [],
                },
              },
              client,
            ),
          )}
        >
          <h3>Compose the request</h3>
          <label>
            Intended sender label
            <input
              aria-label="Intended sender label"
              required
              maxLength={200}
              value={mailbox}
              onChange={(e) => setMailbox(e.target.value)}
            />
          </label>
          <label>
            Subject
            <input
              aria-label="Draft subject"
              required
              maxLength={500}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label>
            Exact message
            <textarea
              aria-label="Exact message"
              required
              maxLength={12000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <p className="fw-local">
            Recipients:{' '}
            {task?.people
              .filter((p) => p.selectedRecipient)
              .map((p) => p.name)
              .join(', ') || 'Select a Person first'}
            . Attached references:{' '}
            {task?.evidence.filter((e) => e.kind === 'DOCUMENT').length ?? 0}.
            No mailbox connection or send permission is implied.
          </p>
          <button className="fw-button" disabled={blocked}>
            Save exact draft for approval
          </button>
          <p className="fw-local">
            Saving a revision clears prior approval. Approve only the reloaded
            preview below.
          </p>
        </form>
      ) : null}
      {message ? (
        <p role="status" className="fw-local">
          {message}
        </p>
      ) : null}
    </div>
  );
};

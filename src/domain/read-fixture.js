import { createHash } from "node:crypto";
import {
  buildSnapshot,
  canonical,
  hash,
  recordKey
} from "./contracts.js";
function createSyntheticReadFixture(binding, ports) {
  const bound = JSON.parse(canonical(binding));
  if (!bound.workspaceId || !bound.engagementId)
    throw new Error("Explicit fixture scope required");
  let snapshot = null;
  if (bound.snapshot) {
    if (bound.snapshot.manifest.acquisition.class !== "SYNTHETIC")
      throw new Error("Synthetic fixture only");
    snapshot = buildSnapshot(
      bound.snapshot.manifest,
      bound.snapshot.observations,
      bound.snapshot.selection
    );
    if (snapshot.snapshotHash !== bound.snapshot.snapshotHash || canonical(snapshot.selection) !== canonical(bound.selection))
      throw new Error("Mismatched published snapshot");
  }
  if (bound.status === "READY" && !snapshot)
    throw new Error("Ready requires snapshot");
  const cache = /* @__PURE__ */ new Map();
  const cursors = /* @__PURE__ */ new Map();
  const clone = (value) => JSON.parse(canonical(value));
  const denied = Object.freeze({
    status: "DENIED",
    reason: "READ_NOT_AUTHORIZED"
  });
  const allowedKeys = [
    "workspaceId",
    "engagementId",
    "snapshotHash",
    "action",
    "limit",
    "cursor",
    "record"
  ];
  const read = (identity, request) => {
    let grant;
    try {
      grant = ports.resolvePermission(identity);
    } catch {
      return denied;
    }
    if (!request || typeof request !== "object") return denied;
    if (!grant || !grant.subjectId || !grant.permissionRevision || grant.workspaceId !== bound.workspaceId || grant.engagementId !== bound.engagementId || request.workspaceId !== bound.workspaceId || request.engagementId !== bound.engagementId || !grant.actions.includes(request.action) || !bound.selection.bankAccounts.every(
      (key) => grant.accounts.includes(key)
    ) || snapshot !== null && !grant.snapshotHashes.includes(snapshot.snapshotHash))
      return denied;
    if (Object.keys(request).some((key) => !allowedKeys.includes(key)) || !["coverage", "summary", "unresolved", "trace"].includes(
      request.action
    ) || request.snapshotHash !== (snapshot?.snapshotHash ?? null) || request.cursor !== void 0 && typeof request.cursor !== "string" || request.record !== void 0 && typeof request.record !== "string")
      return denied;
    const limit = request.limit ?? 50;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || request.action === "trace" && (!request.record || request.cursor) || request.action !== "trace" && request.record !== void 0 || request.action === "summary" && request.cursor !== void 0)
      return denied;
    const query = hash({
      procedure: "finance-read/v1",
      action: request.action,
      scope: {
        workspaceId: bound.workspaceId,
        engagementId: bound.engagementId,
        selection: bound.selection
      },
      snapshot: snapshot?.snapshotHash ?? null,
      metric: "bank-movement/v1",
      dateBasis: "SOURCE_CALENDAR_DATE",
      status: bound.status,
      permission: grant,
      limit,
      record: request.record ?? null
    });
    let offset = 0;
    if (request.cursor !== void 0) {
      const cursor = cursors.get(request.cursor);
      if (!cursor || cursor.query !== query) return denied;
      offset = cursor.offset;
    }
    const cacheKey = `${query}:${offset}`;
    if (request.action !== "trace" && cache.has(cacheKey))
      return clone(cache.get(cacheKey));
    const eligible = new Set(snapshot?.eligible ?? []);
    const selected = snapshot?.observations.filter(
      (row) => bound.selection.bankAccounts.includes(row.accountKey) && row.date.value.slice(0, 10) >= bound.selection.period.from && row.date.value.slice(0, 10) <= bound.selection.period.to
    ) ?? [];
    const original = selected.filter(
      (row) => snapshot.manifest.artifacts.find(
        (a) => a.artifactId === row.artifactId
      ).duplicateOf === null
    );
    const unresolved = original.filter(
      (row) => eligible.has(recordKey(row)) && row.classification === "UNKNOWN"
    );
    const metadata = {
      workspaceId: bound.workspaceId,
      engagementId: bound.engagementId,
      accountScope: bound.selection.bankAccounts,
      period: bound.selection.period,
      dateBasis: "SOURCE_CALENDAR_DATE",
      dataAsOf: snapshot?.manifest.acquisition.sourceAsOf ?? null,
      snapshotHash: snapshot?.snapshotHash ?? null,
      metricVersion: "bank-movement/v1",
      currency: bound.selection.currency,
      population: {
        eligible: snapshot?.eligible.length ?? 0,
        excluded: selected.length - (snapshot?.eligible.length ?? 0),
        unresolved: unresolved.length
      },
      lineage: {
        manifestHash: snapshot?.manifestHash ?? null,
        factsHash: snapshot?.factsHash ?? null
      },
      coverageStatus: "SELECTED_BASELINE_ONLY_NOT_PROVEN_COMPLETE",
      reconciliation: "NOT_A_COMPLETE_RECONCILIATION",
      procedureVersion: "finance-read/v1",
      limitations: [
        ...bound.limitations,
        ...snapshot?.manifest.limitations ?? [],
        "Synthetic source proof only; no live Workspace permission or statement-completeness claim."
      ],
      procedureReceipt: query,
      stableSort: "identity-code-point"
    };
    let rows = [], result = null;
    if (request.action === "summary")
      result = snapshot ? {
        observed_bank_inflows: snapshot.metrics.observed_bank_inflows,
        observed_bank_outflows: snapshot.metrics.observed_bank_outflows,
        bank_cash_change: snapshot.metrics.bank_cash_change
      } : null;
    if (request.action === "coverage")
      rows = snapshot ? snapshot.manifest.coverage.filter(
        (item) => bound.selection.bankAccounts.includes(item.accountKey)
      ).map((item) => ({
        coverageKey: item.coverageKey,
        accountKey: item.accountKey,
        period: item.period,
        state: item.state,
        sourceCompleteness: "NOT_ESTABLISHED_BY_THIS_READ"
      })).sort(
        (a, b) => a.coverageKey < b.coverageKey ? -1 : a.coverageKey > b.coverageKey ? 1 : 0
      ) : [];
    if (request.action === "unresolved")
      rows = unresolved.map((row) => ({
        record: recordKey(row),
        accountKey: row.accountKey,
        date: row.date,
        classification: row.classification
      }));
    if (request.action === "trace") {
      const row = original.find(
        (item) => eligible.has(recordKey(item)) && recordKey(item) === request.record
      );
      if (!row || !snapshot) return denied;
      const artifact = snapshot.manifest.artifacts.find(
        (item) => item.artifactId === row.artifactId
      );
      let bytes;
      try {
        bytes = ports.readArtifact(artifact.artifactId, artifact.locator);
      } catch {
        bytes = null;
      }
      if (bytes === null || createHash("sha256").update(bytes).digest("hex") !== artifact.sha256)
        return clone({
          status: "WITHHELD",
          reason: "TARGET_EVIDENCE_UNVERIFIED",
          metadata
        });
      rows = [
        {
          record: recordKey(row),
          sourceRowKey: row.sourceRowKey,
          date: row.date,
          sourceAmount: row.sourceAmount,
          currency: row.currency,
          signConvention: row.signConvention,
          description: row.description,
          originalCategory: row.originalCategory,
          artifactId: artifact.artifactId,
          receiptId: artifact.receiptId,
          locator: artifact.locator,
          sha256: artifact.sha256
        }
      ];
    }
    const nextOffset = offset + limit;
    const truncated = rows.length > nextOffset;
    let nextCursor = null;
    if (truncated) {
      nextCursor = hash({ query, offset: nextOffset });
      cursors.set(nextCursor, { query, offset: nextOffset });
    }
    const response = {
      status: bound.status,
      metadata,
      result,
      rows: rows.slice(offset, nextOffset),
      nextCursor,
      truncated,
      returned: Math.min(Math.max(rows.length - offset, 0), limit),
      statementCompleteness: "NOT_ESTABLISHED_BY_PAGINATION",
      missingEvidenceProcedures: "WITHHELD",
      agentEnabled: false
    };
    if (request.action !== "trace") cache.set(cacheKey, clone(response));
    return clone(response);
  };
  return { ui: read, tool: read, dataset: read };
}
export {
  createSyntheticReadFixture
};

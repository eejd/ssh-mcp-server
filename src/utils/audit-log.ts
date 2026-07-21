/**
 * Structured, attributed audit logging for security-sensitive MCP actions.
 *
 * agent-services-hive#116 (spun off from the #27 post-pilot review, finding 5): SSH/Docker
 * actions were logged only to ephemeral container stdout with no attribution. This writes one
 * JSON line per audited action to stderr — same rationale as Logger (keeps stdout clean for the
 * MCP stdio/streamable-HTTP protocol) — so it flows through the container's log driver for
 * durable, rotated storage instead of plain unstructured text.
 *
 * Attribution ceiling: the MCP endpoints are unauthenticated (loopback-only, post-pilot
 * finding 4), so no per-agent/persona/session identity is available here. `MCP_AUDIT_SOURCE`
 * (set per-container in the deploying compose file, e.g. "mcp-ssh-local" vs "mcp-ssh-vps")
 * is the finest-grained attribution currently possible — closing that gap further requires
 * endpoint auth, tracked separately.
 */

export type AuditOutcome = "success" | "error";

export interface AuditEvent {
  /** Tool/action name, e.g. "execute-command". */
  action: string;
  outcome: AuditOutcome;
  /** Additional event-specific fields (command, directory, connectionName, errorCode, ...). */
  [key: string]: unknown;
}

const AUDIT_SOURCE = process.env.MCP_AUDIT_SOURCE || "ssh-mcp-server";

/**
 * Emit one structured audit record to stderr as a single JSON line, prefixed so it's easy to
 * grep/filter out of the rest of the (unstructured) log stream.
 */
export function auditLog(event: AuditEvent): void {
  const record = {
    timestamp: new Date().toISOString(),
    source: AUDIT_SOURCE,
    ...event,
  };
  process.stderr.write(`[AUDIT] ${JSON.stringify(record)}\n`);
}

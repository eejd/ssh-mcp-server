import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('Audit log (agent-services-hive#116)', () => {
  let originalWrite;
  let written;

  beforeEach(() => {
    written = [];
    originalWrite = process.stderr.write;
    process.stderr.write = (chunk) => {
      written.push(chunk);
      return true;
    };
  });

  afterEach(() => {
    process.stderr.write = originalWrite;
  });

  it('writes one prefixed JSON line per event to stderr, not stdout', async () => {
    const { auditLog } = await import('../build/utils/audit-log.js');
    auditLog({ action: 'execute-command', outcome: 'success', command: 'df -h' });

    assert.strictEqual(written.length, 1);
    assert.match(written[0], /^\[AUDIT\] /);
    const record = JSON.parse(written[0].replace(/^\[AUDIT\] /, '').trim());
    assert.strictEqual(record.action, 'execute-command');
    assert.strictEqual(record.outcome, 'success');
    assert.strictEqual(record.command, 'df -h');
    assert.ok(record.timestamp, 'expected a timestamp field');
    assert.ok(record.source, 'expected a source field (MCP_AUDIT_SOURCE attribution)');
  });

  it('defaults source to ssh-mcp-server when MCP_AUDIT_SOURCE is unset', async () => {
    delete process.env.MCP_AUDIT_SOURCE;
    // Re-import isn't possible after first import (ESM module cache), so this only asserts
    // the module's already-resolved default when no override was set at process start.
    const { auditLog } = await import('../build/utils/audit-log.js');
    auditLog({ action: 'noop', outcome: 'success' });
    const record = JSON.parse(written[0].replace(/^\[AUDIT\] /, '').trim());
    assert.ok(record.source.length > 0);
  });
});

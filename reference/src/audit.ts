// Append-only, tamper-evident audit log (invariants I-6, I-7, I-8).
//
// Each event is hash-chained to the previous one. Any later mutation of an
// event changes its hash and breaks the chain, so tampering is detectable by
// re-verifying. This is the durable substrate: in the worldview, state and
// memory are projections of this record, which is why it is the one thing that
// must not be mutable.

import { createHash } from "node:crypto";
import type { AuditEvent, Decision, ExecutionResult, Proposal } from "./types.ts";

const GENESIS = "0".repeat(64);

function hashEvent(e: Omit<AuditEvent, "hash">): string {
  // The hash covers the whole event including prevHash and seq, so position in
  // the chain is bound into the digest.
  const canonical = JSON.stringify({
    seq: e.seq,
    prevHash: e.prevHash,
    ts: e.ts,
    agent: e.agent,
    principal: e.principal,
    action: e.action,
    args: e.args,
    decision: e.decision,
    result: e.result,
    intent: e.intent,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export class AuditLog {
  private readonly events: AuditEvent[] = [];

  /** Append a new event, chained to the last. Returns the recorded event. */
  append(input: {
    ts: number;
    principal: string;
    proposal: Proposal;
    decision: Decision;
    result: ExecutionResult | null;
  }): AuditEvent {
    const prev = this.events.at(-1);
    const base: Omit<AuditEvent, "hash"> = {
      seq: this.events.length,
      prevHash: prev ? prev.hash : GENESIS,
      ts: input.ts,
      agent: input.proposal.agent,
      principal: input.principal,
      action: input.proposal.action,
      args: input.proposal.args,
      decision: input.decision,
      result: input.result,
      intent: input.proposal.intent,
    };
    const event: AuditEvent = { ...base, hash: hashEvent(base) };
    this.events.push(event);
    return event;
  }

  /** All events, in order. Read-only snapshot. */
  all(): readonly AuditEvent[] {
    return this.events.slice();
  }

  /**
   * Re-verify the whole chain. Returns true if every event's hash matches its
   * contents and links to its predecessor. A single altered field anywhere
   * makes this return false (I-7).
   */
  verify(): boolean {
    let prevHash = GENESIS;
    for (let i = 0; i < this.events.length; i++) {
      const e = this.events[i];
      if (e.seq !== i) return false;
      if (e.prevHash !== prevHash) return false;
      const { hash, ...rest } = e;
      if (hashEvent(rest) !== hash) return false;
      prevHash = e.hash;
    }
    return true;
  }
}

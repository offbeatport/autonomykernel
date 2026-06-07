// Autonomy Kernel: reference implementation
// Core types for the contract defined in SPEC.md.
//
// These are ONE encoding of the semantic shapes in the spec. The spec fixes the
// meanings (a proposal carries an action, args, the proposing agent, a claimed
// lease, and an intent; a decision is admitted/denied/needs_approval; an audit
// event is chained and names agent + principal). The exact field names here are
// the wire schema, which the spec deliberately leaves open and versionable.

/** A principal is the root of authority. Someone who answers for the work. */
export interface Principal {
  id: string;
  kind: "human" | "org" | "service";
}

/** An agent proposes actions. It holds no authority of its own (I-4). */
export interface Agent {
  id: string;
  principal: string; // the principal this agent acts on behalf of
}

/**
 * A capability is an explicit permission to perform an action, optionally
 * constrained (e.g. a maximum amount). The grant is the ceiling (I-3).
 */
export interface Capability {
  action: string; // e.g. "refund.issue"
  constraints?: Record<string, number | string>; // e.g. { maxAmount: 500 }
}

/**
 * A lease is a time-boxed, scoped grant of capabilities to an agent, issued by
 * a principal. It can expire or be revoked (I-9).
 */
export interface Lease {
  id: string;
  principal: string;
  agent: string;
  capabilities: Capability[];
  expiresAt: number; // epoch ms
  revoked: boolean;
}

/**
 * A policy decides WHEN an approval is required. This is userspace policy, not
 * kernel mechanism (I-10). It returns true if the action needs human approval.
 */
export type Policy = (proposal: Proposal) => boolean;

/** A proposal is what an agent submits to the kernel. It executes nothing. */
export interface Proposal {
  action: string;
  args: Record<string, unknown>;
  agent: string;
  leaseId?: string; // the grant the agent claims authorizes this
  intent: string; // a followable reason ("why")
}

export type Outcome = "admitted" | "denied" | "needs_approval";

/** The kernel's decision about a proposal. */
export interface Decision {
  outcome: Outcome;
  reason: string; // stable code, e.g. "default_deny", "lease_expired"
}

/** The result of executing an admitted action via a syscall. */
export interface ExecutionResult {
  ok: boolean;
  detail?: string;
}

/**
 * An immutable, chained audit event. Recording is part of acting (I-6); the log
 * is append-only and tamper-evident (I-7); every event names agent and
 * accountable principal (I-8).
 */
export interface AuditEvent {
  seq: number;
  prevHash: string;
  hash: string;
  ts: number;
  agent: string;
  principal: string;
  action: string;
  args: Record<string, unknown>;
  decision: Decision;
  result: ExecutionResult | null; // null when not admitted
  intent: string;
}

/** A syscall executes an admitted action against the world. Kernel space only. */
export type Syscall = (
  args: Record<string, unknown>,
) => ExecutionResult | Promise<ExecutionResult>;

// The kernel: the one gate where a proposed action is authorized, executed, and
// recorded. This is kernel space. Agents never reach a syscall directly.
//
// The whole job of this class is to uphold the invariants in SPEC.md. It is
// deliberately small: it holds principals, leases, registered syscalls, one
// policy, and the audit log, and nothing else. Mechanism only; policy lives
// outside (I-10).

import { AuditLog } from "./audit.ts";
import type {
  AuditEvent,
  Decision,
  ExecutionResult,
  Lease,
  Policy,
  Principal,
  Proposal,
  Syscall,
} from "./types.ts";

export interface KernelResult {
  decision: Decision;
  result: ExecutionResult | null;
  event: AuditEvent;
}

const ALWAYS_ALLOW: Policy = () => false; // no action needs approval by default

export class Kernel {
  private readonly principals = new Map<string, Principal>();
  private readonly leases = new Map<string, Lease>();
  private readonly syscalls = new Map<string, Syscall>();
  private readonly halted = new Set<string>(); // agent ids that are stopped
  readonly audit = new AuditLog();
  private policy: Policy;
  private readonly now: () => number;

  // `now` is injectable so the demo and conformance tests are deterministic.
  constructor(now: () => number = () => Date.now(), policy?: Policy) {
    this.now = now;
    this.policy = policy ?? ALWAYS_ALLOW;
  }

  registerPrincipal(p: Principal): void {
    this.principals.set(p.id, p);
  }

  /** A syscall is the only thing that can cause external impact. */
  registerSyscall(action: string, fn: Syscall): void {
    this.syscalls.set(action, fn);
  }

  setPolicy(policy: Policy): void {
    this.policy = policy;
  }

  /** A principal issues a lease to an agent. Returns the lease id. */
  grant(lease: Lease): void {
    this.leases.set(lease.id, lease);
  }

  /** Revoke a lease. Subsequent proposals against it are denied (I-9). */
  revoke(leaseId: string): void {
    const l = this.leases.get(leaseId);
    if (l) l.revoked = true;
  }

  /** Halt an agent. Every later proposal from it is denied (I-9). */
  halt(agentId: string): void {
    this.halted.add(agentId);
  }

  /**
   * The execution rule, in order: authorize, then (only if admitted) execute,
   * then record. Recording happens for every outcome (I-6), so the append is in
   * a finally-style path: there is no return before the audit write.
   */
  async submit(proposal: Proposal): Promise<KernelResult> {
    const decision = this.authorize(proposal);

    let result: ExecutionResult | null = null;
    if (decision.outcome === "admitted") {
      // No impact without admission (I-5): execution is gated behind this branch.
      const syscall = this.syscalls.get(proposal.action);
      result = syscall
        ? await syscall(proposal.args)
        : { ok: false, detail: "no_syscall_registered" };
    }

    // The accountable principal is resolved from the agent's lease, or from the
    // claim itself; non-repudiation requires a principal on every event (I-8).
    const principal = this.resolvePrincipal(proposal);
    const event = this.audit.append({
      ts: this.now(),
      principal,
      proposal,
      decision,
      result,
    });

    return { decision, result, event };
  }

  /**
   * Pure authorization. Returns a decision and never executes anything.
   * Default deny (I-1): every path that is not an explicit, valid grant returns
   * denied.
   */
  private authorize(proposal: Proposal): Decision {
    if (this.halted.has(proposal.agent)) {
      return { outcome: "denied", reason: "agent_halted" };
    }
    if (!proposal.leaseId) {
      return { outcome: "denied", reason: "default_deny" };
    }
    const lease = this.leases.get(proposal.leaseId);
    if (!lease) {
      return { outcome: "denied", reason: "unknown_lease" };
    }
    if (lease.agent !== proposal.agent) {
      return { outcome: "denied", reason: "lease_agent_mismatch" };
    }
    if (lease.revoked) {
      return { outcome: "denied", reason: "lease_revoked" };
    }
    if (lease.expiresAt <= this.now()) {
      return { outcome: "denied", reason: "lease_expired" };
    }

    const cap = lease.capabilities.find((c) => c.action === proposal.action);
    if (!cap) {
      return { outcome: "denied", reason: "capability_not_granted" };
    }

    // The grant is the ceiling (I-3): numeric constraints named `max*` are upper
    // bounds on the matching numeric arg.
    if (cap.constraints) {
      for (const [key, limit] of Object.entries(cap.constraints)) {
        if (key.startsWith("max") && typeof limit === "number") {
          const argKey = lowerFirst(key.slice(3)); // maxAmount -> amount
          const value = proposal.args[argKey];
          if (typeof value === "number" && value > limit) {
            return { outcome: "denied", reason: `exceeds_capability_${key}` };
          }
        }
      }
    }

    // Mechanism vs policy (I-10): the kernel asks the userspace policy whether
    // this admitted-on-authority action still needs a human in the loop.
    if (this.policy(proposal)) {
      return { outcome: "needs_approval", reason: "policy_requires_approval" };
    }

    return { outcome: "admitted", reason: "ok" };
  }

  private resolvePrincipal(proposal: Proposal): string {
    if (proposal.leaseId) {
      const lease = this.leases.get(proposal.leaseId);
      if (lease) return lease.principal;
    }
    return "unknown";
  }
}

function lowerFirst(s: string): string {
  return s.length ? s[0].toLowerCase() + s.slice(1) : s;
}

# Autonomy Kernel: Contract v0.1 (draft)

Status: **draft / proposal**. This is a hypothesis-stage contract. Expect it to change. Nothing here is frozen yet.

This document defines the **stable core**: what must be true at the gate where an agent's proposed action meets the world. It is written in the Autonomy Kernel vocabulary, with common synonyms noted. The on-the-wire encoding (field names, types, framing) is **not fixed here** and is versioned separately. The semantic contract is the part meant to stay still; the wire schema is the part allowed to evolve under it.

A reference implementation that satisfies this contract lives in [`reference/`](reference/). A conformance suite that any implementation can be tested against lives in [`conformance/`](conformance/).

---

## Scope

The contract governs one thing: the boundary between an agent proposing an action and that action becoming real impact. It says what information a proposal must carry, what the gate must check, and what must be recorded. It does **not** dictate how agents reason, what models they use, how intent is modelled, or how memory works. Those are userspace concerns.

## Three spaces

| Space | Who | Holds authority? |
| :-- | :-- | :-- |
| **User space** | the principal (human or owner) | Yes. The root of all authority. |
| **Agent space** | the agent | No. Proposes only. Untrusted. |
| **Kernel space** | the gate, identity, audit | No discretion. Enforces grants, records. |

The agent is treated as untrusted: it can be steered by hostile input and can argue itself out of its own constraints, so it holds no credentials and cannot execute. Only the kernel authorizes; only a syscall executes.

## The execution rule

```
agent proposes  ->  kernel authorizes  ->  syscall executes  ->  audit log records
  (agent space)      (kernel space)         (kernel space)        (kernel space)
```

---

## The invariants

An implementation conforms if and only if it upholds all of these. They are normative (MUST).

- **I-1 Default deny.** A proposed action is denied unless an explicit, unexpired grant admits it.
- **I-2 Authority has a single root.** Every proposal resolves to a principal who is accountable for it. There is no anonymous authority.
- **I-3 The grant is the ceiling.** An admitted action MUST NOT exceed the capability, lease, and budget that admitted it. The kernel never escalates: not on error, not under load, not because the agent's reasoning argues it should.
- **I-4 Proposer and authorizer are separate.** The agent proposes and holds no execution path. Authorizing and executing happen in kernel space, never in agent space.
- **I-5 No impact without admission.** A denied or pending proposal produces no external effect.
- **I-6 Recording is part of acting.** Every proposal, admitted or denied, MUST append an immutable audit event. An action that was not recorded is treated as not having happened.
- **I-7 The audit log is append-only and tamper-evident.** Events are chained so any later mutation is detectable.
- **I-8 Non-repudiation.** Every audit event names the proposing agent and the accountable principal. Every effect is attributable.
- **I-9 Authority is revocable, including mid-sequence.** A principal may revoke a lease or halt an agent at any time. Subsequent proposals are denied even if the lease had not yet expired.
- **I-10 Mechanism in the kernel, policy in userspace.** The kernel owns the gate and the approval mechanism. *When* an approval is required is policy set by the principal, not baked into the kernel.

---

## The shapes (semantic, not wire)

What a proposal carries, what the gate returns, what gets recorded. Field encoding is deliberately left open; these are the meanings that must be present.

**Proposal** (agent space to kernel)
- `action` : the capability being invoked, e.g. `refund.issue`
- `args` : the parameters of the action
- `agent` : identity of the proposing agent
- `lease` : reference to the grant the agent claims authorizes this (absent → I-1 default deny)
- `intent` : a followable reference to the authorizing reason

**Decision** (kernel space)
- `outcome` : `admitted` | `denied` | `needs_approval`
- `reason` : a stable code (e.g. `default_deny`, `lease_expired`, `exceeds_capability_max_amount`)

**Audit event** (the durable record)
- `seq`, `prevHash`, `hash` : chain position and tamper-evidence (I-7)
- `agent`, `principal` : who proposed, who is accountable (I-8)
- `action`, `args`, `decision`, `result`, `intent`

---

## Mapping to NIST's agent dimensions

NIST's NCCoE concept paper on AI agent identity and authorization frames the problem in four dimensions. The invariants above are built around the same four:

| NIST dimension | Autonomy Kernel |
| :-- | :-- |
| Identification | identity (I-2, I-8) |
| Authorization | capability + lease + budget, default deny, grant is the ceiling (I-1, I-3) |
| Auditing | append-only, tamper-evident audit log (I-6, I-7) |
| Non-repudiation | every action traces to an accountable principal (I-2, I-8) |

The requirements line up. The difference is the *how*: composing existing identity standards proves *who an agent is*; this contract is about whether *a specific proposed action may become real impact*, which is the part that needs its own gate.

---

## Conformance

An implementation conforms to Contract v0.1 if it passes the suite in [`conformance/`](conformance/). The suite tests the invariants, not the wire format, so implementations in any language or architecture can be checked against the same bar.

## Governance and ownership

This contract is meant to be implemented by many cores, large and small, open and proprietary. It is not owned by any single implementation, including the reference one. If only one specific program can satisfy it, it is a product, not a standard.

Licensed Apache-2.0. Contributions and disagreement both welcome: <https://github.com/offbeatport/autonomykernel>.

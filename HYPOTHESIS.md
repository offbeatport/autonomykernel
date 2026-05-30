# The Agent Kernel Hypothesis

_An operating system for autonomous work: a worldview to weigh, and a boundary to build on._

---

## The Substrate

Autonomous agents today are created by a prompt and discarded at the end of the session. But we increasingly ask them to hold real authority and act on our behalf for days rather than seconds, and there is no shared layer underneath them that governs what an agent may do, records what it did, retains what it learned, and can stop it on demand. Agent Kernel is that layer: a runtime beneath the agents and the models they reason with. Agents are disposable and models are replaceable; the layer beneath them should be neither.

## The Principles

| #    | Principle                              | In one line                                          |
| :--- | :------------------------------------- | :--------------------------------------------------- |
| I    | **Agents are processes**               | named, observed, accountable units of work           |
| II   | **Agents are disposable**              | continuity belongs to the system, not the instance   |
| III  | **Models are replaceable**             | and so is the kernel's own implementation            |
| IV   | **Intent must be traceable**           | every action links to an authorizing reason          |
| V    | **Authority must be explicit**         | granted and scoped; the default is deny              |
| VI   | **Everything must be auditable**       | an unlogged action is treated as not having happened |
| VII  | **The principal is sovereign**         | every grant is revocable, including mid-action       |
| VIII | **Memory is governed**                 | the record is immutable; memory is curated, erasable |
| IX   | **The kernel must be small**           | mechanism in the kernel, policy in userspace         |
| X    | **The standard is the boundary**       | many implementations, one stable contract            |
| XI   | **Accountability is non-transferable** | a principal always answers for the action            |

_Each principle is stated here and argued below._

---

## Preface: Naming the Substrate

The operating system kernel solved a specific problem: every program spoke to the hardware in its own way, reimplemented the same primitives, and failed in its own way. The kernel was the layer between hardware and software that made the rest possible — not by being clever, but by being the part nothing else had to reimplement. It defined an interface and held it stable.

Autonomous agents are at a similar point. Agents sit above, models below, and between them is mostly glue code and convention. The shift underway is from prompts and sessions to long-lived processes: work that persists and can be named, paused, inspected, and audited. That shift needs a defined layer to run on.

Three layers, then: the agent is a process; the model is the reasoning engine inside it; the kernel is the runtime beneath both. The model is the most capable layer and the least permanent. The kernel changes slowly. The ordering is by endurance, not importance — what reasons is replaceable, what governs is not.

This is a layer beneath existing tools, not a replacement for them. Frameworks, assistants, workflow tools, and the models themselves are userspace, where the work happens. The kernel's role is to be the part none of them has to reimplement and the part none of them can quietly break. Today's tools are the first things that would run on it, not obstacles to it.

This document has two parts, and it keeps them separate. Part I is a worldview: an opinionated account of what autonomous systems are and how they should behave, which you can accept or argue with. Part II is a boundary: a contract you can build against even if you reject the worldview entirely. A standard requires agreement about interfaces, not about meaning.

---

## Part I: The Worldview

_Nine claims. Some are positions you may reject; some are invariants the design treats as non-negotiable. Each is labeled._

### I. Agents Are Processes _[ontology]_

An agent is a process: a unit of work with a beginning, a lifecycle, state, and an end. This is a logical abstraction, like a database transaction or an account — not a scheduler PID. The point is that a process can be named, listed, paused, resumed, and inspected while it runs, by something other than itself.

The alternative is to grant authority to something you can't name, inspect, or hold to account. A process you can observe is a process you can govern, and only what can be governed can be trusted with anything that matters. Everything below depends on there being a named entity for the rest to attach to: the kernel has to know what is running, why, on whose behalf, what it may do, what it has done, and when it must stop.

### II. Agents Are Disposable _[follows from I]_

If an agent is a process, any single instance is expendable. The agent is the unit of execution, not the unit of meaning. Continuity does not live in the instance: what has to survive — intent, authority, memory, the record — belongs to the system, not to the worker that happened to hold it.

This is a design choice, not a value judgment. A system that can't survive the loss of any single worker is fragile by construction. Treating instances as disposable buys the freedom to kill, restart, fork, and replace a running agent without losing what the work was for.

### III. Models Are Replaceable _[ontology]_

The model is the reasoning engine, and engines get swapped and retired. Build directly on a model and you inherit its shelf life: when it is deprecated, so is your stack, and the vendor's roadmap becomes yours. Build on a kernel and the model becomes a component — the most capable one, but a replaceable one behind a stable interface. An agent should be able to change the model it reasons with without changing what it is, what it may do, or what it owes.

The same logic applies one layer down. It is not enough for models to be replaceable if the layer beneath them is locked: no single implementation of the kernel, and no single vendor of it, should become the next thing you can't leave. The boundary itself has to be open and portable. What that requires is the subject of Part II.

### IV. Intent Must Be Traceable _[invariant]_

Every action must trace to an authorizing principal and a reason it was permitted. The requirement is not that intent be elaborate, only that it be present and followable. An action with no recoverable reason is a defect regardless of its result; as execution gets cheaper, unaccountable automation mostly produces volume.

The kernel's responsibility here is lineage: an unbroken link from an action back to who authorized it and why, enforced where execution, identity, and auditing meet. The kernel does not own the meaning. One reference decomposition — _Principal → Intent → Goal → Task → Process → Action_ — is a useful map of the path from reason to deed, not a required one. How richly intent is modeled is a userspace concern; that it is traceable is not.

### V. Authority Must Be Explicit _[invariant]_

The default is deny. Authority is never assumed, inherited by proximity, or earned by good behavior; it is granted explicitly, scoped, leased, and set to expire. Trust and authority are separate: an agent can be trusted completely and still permitted nothing. Authority that can't be traced to a grant should be treated as a vulnerability. Implicit authority is ambient risk; explicit authority is bounded risk.

A reference path maps this onto existing access models — _Policy → Capability → Lease → Syscall_ — as one option, not the only one. The invariant is stronger than any particular pipeline: declared bounds are inescapable. An agent cannot exceed or escalate its granted authority — not through error, not when its model is swapped beneath it, not under failure, and not when its own reasoning argues the bounds should not apply. The grant is the ceiling, and it holds whether or not the agent agrees with it.

### VI. Everything Must Be Auditable _[invariant]_

Recording an action is part of performing it, not a separate step that gets skipped under load. An action that was not logged is treated as not having happened — not as a slogan, but as the operational definition. The audit log is not a debug trace or a monitoring feed; it is the system's source of truth.

Because of this, the audit record is also the durable substrate the rest is rebuilt from: state, continuity, and memory derive from it rather than from the volatile state of any agent or the context of any model. Agents are disposable and models are replaceable precisely because the record is neither.

### VII. The Principal Is Sovereign _[invariant]_

Every agent has an owner — the principal who ultimately answers for the work — and that owner can halt, suspend, or revoke any agent, intent, or grant of authority at any time, for any reason or none. This is the answer to the first question anyone asks before handing work to an autonomous system: can it be stopped? Yes.

The stop has to be unbypassable and always available: it must work mid-action, while the model is unreachable, while the system is degraded, and specifically when the agent's own reasoning objects to being stopped. Autonomy is granted, and what is granted is revocable. This is mechanism, not policy: the kernel does not decide when to pull the cord, only that the cord exists, reaches every running agent, and can't be detached.

### VIII. Memory Is Governed _[discipline built on the kernel]_

The transcript and memory are different things. The transcript is the full, ordered record of what happened. Memory is the smaller, curated result: the distilled lessons and corrections that let a new agent resume where the last one stopped. Conflating the two is how systems drown in their own history.

Memory is built on the durable record (VI), not maintained as a second store beside it — it is a curated projection of the audit substrate. Every memory has an owner, a retention horizon, and a reason to exist, and every memory is erasable. The division is deliberate: the audit record is immutable, because accountability needs an unalterable past; memory is erasable, because what gets carried forward should be revisable, and because privacy and law require deletion.

### IX. The Kernel Must Be Small _[keystone]_

This is the constraint that governs all the others: mechanism belongs in the kernel, policy in userspace. A small kernel is the precondition for a large ecosystem — the less the foundation mandates, the more can be built on it without permission.

The kernel owns only what can't be safely delegated: execution, identity, authority, communication, and auditing — with durability inside auditing, since a record that does not persist is not a record. That is the whole list. Intent taxonomy is userspace. Memory is userspace, a projection over the durable record. The kernel provides the mechanisms these are built on without becoming them. Keeping it small is the design goal, not a constraint to be worked around.

---

## Part II: The Boundary

_The contract. These hold even if you reject the worldview above; they are what makes this a standard rather than a position paper, written for anyone concerned about lock-in._

**The standard is the boundary, not the build.** A standard is an interface others target, not a codebase you install. Many implementations have to be able to sit behind one contract — large and small, open and proprietary — and an agent built against the boundary should not need to know which one it runs on. The line is defined where agents meet the runtime; what implements it is yours to choose, build, or buy. If conforming requires adopting one specific program, it is not a standard.

**Userspace does not break.** The interface beneath agents is stable, versioned, and backward-compatible. Work built against it keeps working as the implementation underneath changes. The commitment is that you can build against the boundary for years without it shifting beneath you — backward compatibility is a property of the contract, not a best effort.

**State is portable; exit is guaranteed.** Principals, intents, memory, and audit are expressible in open formats and exportable in full, including away from any single provider of the foundation itself. Portability is a property of the boundary from the first day, not a concession negotiated later. Everything that is yours can be taken with you.

**Accountability is non-transferable.** Every action is attributable to a principal who answers for it. Autonomy delegates execution, never responsibility. "The agent did it" is not a defense. The grant of authority and the assignment of answerability are the same act and can't be separated — there is always an identifiable principal, and the system always records which one.

---

## Part III: How This Becomes Real

A standard is only credible if it commits to things it can be measured against. These are the commitments.

**Governance is vendor-neutral.** No single party owns the boundary or sets its direction. It advances by rough consensus and running code, validated against a shared conformance suite any implementation can be tested against, rather than by decree. Conformance is something anyone can verify.

**Adoption is additive.** The path from current prompt-and-session tools runs forward, not through a rewrite. You put the layer under what you already run, and what you already run keeps working. Nothing has to be thrown out to adopt it.

**"Build for decades" reduces to falsifiable constraints.** The claim is not faith; it is three things you can hold the project to: a versioned, backward-compatible contract; no dependence on any single model or vendor, the foundation's own included; and durable state in open, exportable formats. A foundation succeeds when it becomes unremarkable enough to ignore — when the work above it assumes it is there and stops thinking about it.

The pattern is not new. Operating systems made software portable across machines; processes made computation governable; files made data durable; permissions made multi-user systems possible. An agent kernel is the next step: making autonomous work portable across models, organizations, and time, and governable by the principals it serves. The need is not more capable sessions; it is durable runtime semantics for autonomous work.

The goal is not to make agents seem alive. It is to make them safe to run.

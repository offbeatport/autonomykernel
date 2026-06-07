# Autonomy Kernel

**An operating system for autonomous work.** A proposed standard for the runtime layer beneath AI agents: the boundary that decides what an agent may do, executes only what is authorized, records everything, and can always be stopped.

> Draft / hypothesis stage. The contract is v0.1 and will change. The point is to get the foundation right in the open before things are built on top.

**Read the manifesto:** [autonomykernel.org](https://autonomykernel.org)

## What's here

This repo is the open standard, a runnable reference, and a conformance suite. Nothing here is a product.

- **[SPEC.md](SPEC.md)**: the contract, the invariants at the gate where a proposed action meets the world, in plain terms. The semantics are meant to stay stable; the wire format is left open and versioned.
- **[reference/](reference/)**: a small, dependency-free TypeScript kernel implementing the contract (propose → authorize → execute → record).
- **[conformance/](conformance/)**: tests that check the invariants, not a wire format, so any implementation in any language can be graded against the same bar.

## Run it

Needs Node 22.6+ (it runs the TypeScript directly, no build step).

```sh
npm run demo   # walks the refund-bot scenario end to end
npm test       # runs the conformance suite (14 invariant checks)
```

The demo shows an agent proposing refunds: one admitted and executed, one denied for exceeding its capability ceiling, one routed to human approval by policy, one denied for having no grant, and one denied after the principal revokes mid-stream. Every proposal, admitted or not, lands in an append-only audit log, and the last step shows tampering being detected.

## The idea in one line

```
agent proposes  →  kernel authorizes  →  syscall executes  →  audit log records
  (agent space)      (kernel space)        (kernel space)       (kernel space)
```

The agent is untrusted and holds no authority of its own. A principal is the root of all authority. The kernel is mechanism, not policy. See [SPEC.md](SPEC.md) for the invariants and [docs/HYPOTHESIS.md](docs/HYPOTHESIS.md) for the worldview behind them.

## Documents

- [The Autonomy Kernel Hypothesis](docs/HYPOTHESIS.md): the worldview and the boundary to build on.
- [Core Primitives](docs/PRIMITIVES.md): the objects the kernel governs and the two chains that bind them.

## Scope and ownership

The contract is meant to be implemented by many cores, large and small, open and proprietary. It is not owned by any single implementation, including the reference one. If only one specific program can satisfy it, it is a product, not a standard.

Licensed [Apache-2.0](LICENSE).

## Contribute: help shape this

It's early and open by design. Open an [issue](https://github.com/offbeatport/autonomykernel/issues) to challenge an invariant, or a PR to sharpen the spec, the reference, or the suite.

Vlad Palos · 2026

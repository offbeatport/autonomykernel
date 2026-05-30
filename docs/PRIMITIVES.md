# Core Primitives

_The nouns of the kernel: the objects it knows by name, and the two chains that bind them._

Vlad Palos · May 2026 · [Contribute on GitHub](https://github.com/offbeatport/autonomykernel)

[← The Autonomy Kernel Hypothesis](HYPOTHESIS.md)

---

## The Primitives

Everything the kernel governs is one of these, or built from them.

| Primitive | Definition | Example |
| :-- | :-- | :-- |
| **Principal** | Root owner of authority, memory, budgets, agents, intents, and policies. Can represent a person, team, company, service, or autonomous collective. | The user `vlad`, the `acme-corp` org, or a `billing-bot` service account |
| **Identity** | Stable identifier for a principal, agent, process, tool, memory, or object. Survives restarts, upgrades, migrations, and model changes. | `agent://acme/refund-bot/3f9a`, the same ID after a redeploy |
| **Namespace** | Isolation boundary for names, objects, permissions, and resources. Prevents collisions and enables multi-tenancy. | `acme/prod` kept isolated from `acme/staging` |
| **Intent** | Long-lived purpose. Answers: _why are we doing this?_ Not directly executable. | "Keep customer refunds under a 24-hour turnaround" |
| **Goal** | Measurable outcome derived from an intent. Answers: _what must be achieved?_ | "Resolve ticket #8821 within its SLA" |
| **Task** | Executable unit of work derived from a goal. Answers: _what work should happen?_ | "Draft and send the refund confirmation for #8821" |
| **Process** | Running execution context for a task. Can start, pause, sleep, checkpoint, resume, crash, recover, or terminate. | `p-7742`, paused at a checkpoint, awaiting approval |
| **Action** | Atomic operation attempted by a process. | read a file, send an email, call an API |
| **Agent** | Autonomous worker that reasons, plans, and requests actions. Agents are disposable; the system is durable. | a Claude- or GPT-backed refund assistant |
| **Capability** | Explicit permission to do something. | `email.send`, `filesystem.write`, `browser.navigate` |
| **Policy** | Rule that constrains authority. | "Require human approval before emailing external contacts" |
| **Lease** | Temporary, scoped authority. | "May send 20 emails in the next hour" |
| **Budget** | Resource limit. Tracks tokens, money, time, API calls, compute, risk, or tool usage. | $5.00 and 100k tokens for one task |
| **Approval** | Human or supervisory authorization gate. Lifecycle: pending, approved, denied, expired. | a manager approves a refund over $500 |
| **Syscall** | Controlled boundary between agent space and kernel space. Agents request actions; the kernel validates and executes. | `email.send(to, body)`, checked then executed |
| **Event** | Immutable fact that something happened. Events drive the system. | `approval.granted`, `process.checkpointed` |
| **Message** | Communication between users, agents, processes, plugins, or the kernel. | agent to human: "Need sign-off on refund #8821" |
| **Memory** | Persistent knowledge and experience. Should be pluggable, but referenced by kernel objects. | "This customer prefers email over phone" |
| **Provenance** | Lineage of data, memory, decisions, and actions. Answers: _where did this come from?_ | figure pulled from the Q3 export by process `p-7742` |
| **Version** | Immutable revision of an object, policy, prompt, plugin, memory, or agent definition. Required for replay. | `policy@v4`, `prompt@v12`, pinned for replay |
| **Audit Log** | Append-only record of all state transitions, decisions, permissions, syscalls, actions, approvals, and memory mutations. | `principal=vlad action=email.send result=allowed` |
| **Plugin** | Replaceable subsystem implementing kernel contracts. | swap the Postgres audit store for S3, or the scheduler |

---

## Structure

Two chains run through the kernel: one for purpose, one for power. Both end at the same gate.

**Main hierarchy** (purpose)

```
Principal → Intent → Goal → Task → Process → Action → Syscall
```

**Authority chain** (power)

```
Principal → Policy → Capability → Lease → Budget → Approval → Syscall
```

Both chains start at the principal and narrow, step by step, until they meet at the syscall: the single gate where intent and authority are checked together before any action executes.

---

## The Execution Rule

Four moves, always in this order.

1. **Agents** propose.
2. **Kernel** authorizes.
3. **Syscalls** execute.
4. **Audit log** remembers.

---

Discuss, raise issues, or contribute: [github.com/offbeatport/autonomykernel](https://github.com/offbeatport/autonomykernel)

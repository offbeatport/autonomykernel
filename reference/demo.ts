// Runnable demo of the Autonomy Kernel contract.
//
//   node reference/demo.ts
//
// It walks the refund-bot scenario from the thesis: a support agent proposes
// refunds, the kernel authorizes against a lease, executes only what is
// admitted, records everything, and the principal can revoke mid-stream. The
// last step shows the audit log detecting tampering.

import { Kernel } from "./src/kernel.ts";
import type { Policy } from "./src/types.ts";

// Deterministic clock so the demo reads the same every run.
let clock = 1_000_000;
const now = () => clock;

// Policy (userspace): refunds of 200 or more need human approval. The kernel
// does not know this rule; it just asks (I-10).
const policy: Policy = (p) =>
  p.action === "refund.issue" && Number(p.args.amount) >= 200;

const kernel = new Kernel(now, policy);

kernel.registerPrincipal({ id: "vlad", kind: "human" });

// The only thing that can cause external impact: a mock "issue refund" syscall.
kernel.registerSyscall("refund.issue", (args) => {
  return { ok: true, detail: `refunded $${args.amount} to ${args.customer}` };
});

// The principal grants the bot a lease: may issue refunds up to $500, for a
// while.
kernel.grant({
  id: "lease-1",
  principal: "vlad",
  agent: "refund-bot",
  capabilities: [{ action: "refund.issue", constraints: { maxAmount: 500 } }],
  expiresAt: clock + 10_000,
  revoked: false,
});

const line = () => console.log("-".repeat(64));
async function propose(label: string, p: Parameters<Kernel["submit"]>[0]) {
  const { decision, result } = await kernel.submit(p);
  const tag = decision.outcome.toUpperCase().padEnd(13);
  console.log(`${tag} ${label}`);
  console.log(`              reason: ${decision.reason}`);
  if (result) console.log(`              result: ${result.ok ? result.detail : "no effect"}`);
}

console.log("\nAutonomy Kernel: reference demo\n");
line();

// 1. In-bounds refund, no approval needed: admitted and executed.
await propose("bot issues a $80 refund (within lease, under approval line)", {
  action: "refund.issue",
  args: { amount: 80, customer: "alice" },
  agent: "refund-bot",
  leaseId: "lease-1",
  intent: "resolve ticket #8821",
});

// 2. Over the capability ceiling: denied, never executed (I-3, I-5).
await propose("bot tries a $900 refund (over the $500 capability ceiling)", {
  action: "refund.issue",
  args: { amount: 900, customer: "bob" },
  agent: "refund-bot",
  leaseId: "lease-1",
  intent: "resolve ticket #8822",
});

// 3. Within the lease but over the approval line: needs_approval (I-10).
await propose("bot proposes a $300 refund (allowed by lease, policy wants a human)", {
  action: "refund.issue",
  args: { amount: 300, customer: "carol" },
  agent: "refund-bot",
  leaseId: "lease-1",
  intent: "resolve ticket #8823",
});

// 4. No lease referenced at all: default deny (I-1).
await propose("bot proposes a $10 refund with no lease", {
  action: "refund.issue",
  args: { amount: 10, customer: "dave" },
  agent: "refund-bot",
  intent: "resolve ticket #8824",
});

// 5. Principal revokes the lease, then the same in-bounds refund is denied (I-9).
console.log("\n   >> principal revokes lease-1\n");
kernel.revoke("lease-1");
await propose("bot retries the $80 refund after revocation", {
  action: "refund.issue",
  args: { amount: 80, customer: "alice" },
  agent: "refund-bot",
  leaseId: "lease-1",
  intent: "resolve ticket #8821 (retry)",
});

line();

// The audit log recorded every one of those, admitted or denied (I-6).
const events = kernel.audit.all();
console.log(`\naudit log: ${events.length} events, every proposal recorded\n`);
for (const e of events) {
  console.log(
    `  #${e.seq} ${e.decision.outcome.padEnd(13)} ` +
      `principal=${e.principal} agent=${e.agent} ` +
      `action=${e.action} amount=${e.args.amount ?? "-"}`,
  );
}

console.log(`\nchain intact?  ${kernel.audit.verify()}`);

// Demonstrate tamper-evidence (I-7): reach in and alter a recorded amount.
// (Reaching into internals like this is exactly what the chain is meant to
// catch; nothing in the public API lets you mutate the past.)
const raw = kernel.audit.all() as any[];
if (raw[0]) raw[0].args.amount = 999999;
console.log(`after tampering with event #0, chain intact?  ${kernel.audit.verify()}`);

console.log("\nThe model is what thinks. The kernel is what endures.\n");

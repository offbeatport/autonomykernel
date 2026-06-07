// Conformance suite for Autonomy Kernel Contract v0.1.
//
//   node --test conformance/
//
// These tests check the INVARIANTS from SPEC.md, not a wire format. Any
// implementation that exposes the small surface in `KernelUnderTest` can be
// graded against the same bar, in any language port that provides an equivalent
// harness. Here we test the reference kernel in `reference/`.
//
// Each test names the invariant it guards (I-1 .. I-10).

import { test } from "node:test";
import assert from "node:assert/strict";
import { Kernel } from "../reference/src/kernel.ts";
import type { Lease, Policy } from "../reference/src/types.ts";

// A fixed clock keeps every test deterministic.
function freshKernel(at = 1_000, policy?: Policy) {
  let clock = at;
  const k = new Kernel(() => clock, policy);
  k.registerPrincipal({ id: "p1", kind: "human" });
  k.registerSyscall("refund.issue", (args) => ({
    ok: true,
    detail: `refunded ${args.amount}`,
  }));
  const setClock = (v: number) => {
    clock = v;
  };
  return { k, setClock };
}

function leaseFor(over: Partial<Lease> = {}): Lease {
  return {
    id: "lease-1",
    principal: "p1",
    agent: "bot",
    capabilities: [{ action: "refund.issue", constraints: { maxAmount: 500 } }],
    expiresAt: 1_000_000,
    revoked: false,
    ...over,
  };
}

const baseProposal = {
  action: "refund.issue",
  args: { amount: 100, customer: "alice" } as Record<string, unknown>,
  agent: "bot",
  leaseId: "lease-1",
  intent: "ticket #1",
};

test("I-1 default deny: a proposal with no lease is denied", async () => {
  const { k } = freshKernel();
  const { decision, result } = await k.submit({ ...baseProposal, leaseId: undefined });
  assert.equal(decision.outcome, "denied");
  assert.equal(decision.reason, "default_deny");
  assert.equal(result, null, "denied proposals must not execute (I-5)");
});

test("I-1 default deny: an unknown lease id is denied", async () => {
  const { k } = freshKernel();
  const { decision } = await k.submit({ ...baseProposal, leaseId: "nope" });
  assert.equal(decision.outcome, "denied");
});

test("a valid in-bounds proposal is admitted and executed", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor());
  const { decision, result } = await k.submit(baseProposal);
  assert.equal(decision.outcome, "admitted");
  assert.ok(result?.ok);
});

test("I-3 the grant is the ceiling: an arg over a capability max is denied", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor());
  const { decision, result } = await k.submit({
    ...baseProposal,
    args: { amount: 900, customer: "bob" },
  });
  assert.equal(decision.outcome, "denied");
  assert.match(decision.reason, /exceeds_capability/);
  assert.equal(result, null);
});

test("I-3 capability scope: an action not in the lease is denied", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor());
  const { decision } = await k.submit({ ...baseProposal, action: "email.send" });
  assert.equal(decision.outcome, "denied");
  assert.equal(decision.reason, "capability_not_granted");
});

test("I-9 revocation: a revoked lease denies subsequent proposals", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor());
  const first = await k.submit(baseProposal);
  assert.equal(first.decision.outcome, "admitted");
  k.revoke("lease-1");
  const second = await k.submit(baseProposal);
  assert.equal(second.decision.outcome, "denied");
  assert.equal(second.decision.reason, "lease_revoked");
});

test("I-9 expiry: an expired lease is denied even before revocation", async () => {
  const { k, setClock } = freshKernel(1_000);
  k.grant(leaseFor({ expiresAt: 2_000 }));
  setClock(3_000);
  const { decision } = await k.submit(baseProposal);
  assert.equal(decision.outcome, "denied");
  assert.equal(decision.reason, "lease_expired");
});

test("I-9 halt: a halted agent is denied even with a valid lease", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor());
  k.halt("bot");
  const { decision } = await k.submit(baseProposal);
  assert.equal(decision.outcome, "denied");
  assert.equal(decision.reason, "agent_halted");
});

test("I-4 lease binding: an agent cannot use another agent's lease", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor({ agent: "other-bot" }));
  const { decision } = await k.submit(baseProposal); // proposal.agent = "bot"
  assert.equal(decision.outcome, "denied");
  assert.equal(decision.reason, "lease_agent_mismatch");
});

test("I-10 mechanism vs policy: policy can require approval without the kernel knowing the rule", async () => {
  const policy: Policy = (p) => Number(p.args.amount) >= 200;
  const { k } = freshKernel(1_000, policy);
  k.grant(leaseFor());
  const small = await k.submit({ ...baseProposal, args: { amount: 50 } });
  assert.equal(small.decision.outcome, "admitted");
  const big = await k.submit({ ...baseProposal, args: { amount: 300 } });
  assert.equal(big.decision.outcome, "needs_approval");
  assert.equal(big.result, null, "needs_approval must not execute (I-5)");
});

test("I-6 recording is part of acting: every proposal appends one event", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor());
  await k.submit(baseProposal); // admitted
  await k.submit({ ...baseProposal, args: { amount: 9999 } }); // denied
  await k.submit({ ...baseProposal, leaseId: undefined }); // default deny
  assert.equal(k.audit.all().length, 3, "admitted and denied alike are recorded");
});

test("I-8 non-repudiation: every event names an agent and accountable principal", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor());
  await k.submit(baseProposal);
  const [e] = k.audit.all();
  assert.equal(e.agent, "bot");
  assert.equal(e.principal, "p1");
  assert.ok(e.intent.length > 0, "the authorizing reason is carried (I-2)");
});

test("I-7 tamper-evidence: the chain verifies, and any mutation breaks it", async () => {
  const { k } = freshKernel();
  k.grant(leaseFor());
  await k.submit(baseProposal);
  await k.submit({ ...baseProposal, args: { amount: 250 } });
  assert.equal(k.audit.verify(), true, "an untouched chain verifies");

  // Mutate a recorded value; verification must now fail.
  const raw = k.audit.all() as any[];
  raw[0].args.amount = 1;
  assert.equal(k.audit.verify(), false, "a single altered field breaks the chain");
});

test("I-5 no impact without admission: denied and needs_approval never call the syscall", async () => {
  let calls = 0;
  let clock = 1_000;
  const policy: Policy = (p) => Number(p.args.amount) >= 200;
  const k = new Kernel(() => clock, policy);
  k.registerPrincipal({ id: "p1", kind: "human" });
  k.registerSyscall("refund.issue", (args) => {
    calls++;
    return { ok: true, detail: `refunded ${args.amount}` };
  });
  k.grant(leaseFor());
  await k.submit({ ...baseProposal, args: { amount: 50 } }); // admitted -> 1 call
  await k.submit({ ...baseProposal, args: { amount: 300 } }); // needs_approval -> 0
  await k.submit({ ...baseProposal, args: { amount: 9999 } }); // denied -> 0
  assert.equal(calls, 1, "only the admitted action reached the syscall");
});

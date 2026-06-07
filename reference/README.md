# Reference kernel

A small, dependency-free implementation of the [Autonomy Kernel contract](../SPEC.md). It exists to make the contract concrete and to give the [conformance suite](../conformance/) something to grade. It is not a product and not production infrastructure.

## Run

```sh
node demo.ts          # or: npm run demo   (from the repo root)
```

## Files

- `src/types.ts`: the contract's shapes as one TypeScript encoding (the spec fixes the meanings, not these field names).
- `src/audit.ts`: the append-only, hash-chained audit log (invariants I-6, I-7, I-8).
- `src/kernel.ts`: the gate. `submit()` authorizes, executes only if admitted, and records. Pure `authorize()` makes the decision and never executes.
- `demo.ts`: the runnable refund-bot scenario.

## What it deliberately is not

- No persistence. The audit log lives in memory; a real implementation would make it durable.
- No network or wire format. The spec leaves encoding open; this calls the kernel in-process.
- No cryptographic signatures or attestation. The hash chain shows tamper-evidence, not non-repudiation against a forging kernel.

These omissions are the line between a reference and a product, and they are intentional.

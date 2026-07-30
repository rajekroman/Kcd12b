# ADR 0001 — Horse runtime command/event boundary

- Status: Accepted for A0 review
- Date: 2026-07-30
- Issue: #35
- Base: `766c2eff3eb0810b36b9705514fa05b9df0144a9`
- Owner: A1 Platforma a architektura

## Context

The approved first-horse content contract defines stable interaction, command, confirmed-event, flag, counter and failure identifiers. Runtime integration needs one typed application boundary that A2, A5 and A7 can consume without importing Phaser, DOM, UI, asset or browser-storage types.

## Decision

1. `src/contracts/horseRuntime.ts` is the sole public owner of horse command/event types and namespaced IDs during issue #35.
2. `src/application/HorseRuntimeOrchestrator.ts` is the sole owner of deterministic command validation, confirmed-event production and state-effect application.
3. Commands express intent and may be rejected with a typed reason. Confirmed events describe accepted state transitions only.
4. Payloads contain stable scalar IDs and values. They never contain Phaser objects, DOM nodes, storage handles or mutable runtime instances.
5. One-time and ordered interactions carry an idempotency key. Replaying the same accepted key cannot duplicate effects.
6. Quest completion is terminal. Injury or detection received after completion cannot revoke the result.
7. Trial checkpoint order and reset behavior are deterministic and derived from the approved content contract.
8. This issue does not change the global save schema. Persistence is delegated through `HorseRuntimePersistenceBoundary`; any save-version change requires a separate A0 decision and migration tests.

## Runtime flow

```text
adapter input
  → typed horse command
  → validation and idempotency gate
  → confirmed horse event
  → deterministic state effects
  → immutable HorseRuntimeStateSnapshot
  → optional persistence adapter
```

No handler reads `Date.now()`, `Math.random()`, Phaser, DOM or browser storage.

## Public boundary

The contract covers:

- care interactions and trust progress;
- lawful and covert acquisition;
- mount request acceptance or rejection;
- ordered trial checkpoints and trial reset;
- pre-claim injury and covert-detection failures;
- confirmed state effects emitted after deterministic application;
- persistence load/save boundary without a schema migration.

## Ownership and handoff

- A2 implements movement, mount physics and gameplay producers against these commands/events without editing the public contract.
- A5 maps keyboard/touch UI intent to commands and renders confirmed events without mutating horse state directly.
- A7 validates idempotency, deterministic replay, ordering, rejection reasons, terminal completion and persistence behavior.
- `src/main.ts`, Phaser scenes, UI, global save version, assets, audio and workflow configuration remain unchanged in this PR.

## Validation

Implementation head `c855f3a492decc27e439fb1ce68a99c7031ffc04` passed workflow run `30529003198`:

- dependency installation: SUCCESS;
- lint: SUCCESS;
- typecheck: SUCCESS;
- unit tests: SUCCESS;
- production build: SUCCESS;
- Playwright E2E: SUCCESS;
- deploy: correctly SKIPPED for a pull request.

Final documentation head `33c4f30aed9133ba09c5acbb80b28de4f4a2b9f2` is validated by workflow run `30539942388` before the PR may leave draft state.

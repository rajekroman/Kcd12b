# ADR 0001 — Horse runtime command/event boundary

- Status: Accepted for issue #35 draft implementation
- Date: 2026-07-30
- Base: `766c2eff3eb0810b36b9705514fa05b9df0144a9`
- Owner: A1 Platforma a architektura

## Context

The approved first-horse content contract defines stable interaction, command, confirmed-event, flag, counter and failure identifiers. The runtime needs a single typed boundary that A2, A5 and A7 can consume without importing Phaser, DOM, UI or asset types.

## Decision

1. `src/contracts/horseRuntime.ts` is the sole public owner of horse command/event types and namespaced IDs during issue #35.
2. Commands express intent and may be rejected with a typed reason. Confirmed events describe accepted state transitions only.
3. Payloads contain stable scalar IDs and values. They never contain Phaser objects, DOM nodes, storage handles or mutable runtime instances.
4. The future application service owns orchestration from command to state effect and confirmed event. Content data remains immutable input.
5. One-time and ordered interactions carry an idempotency key. Replaying the same accepted key must not duplicate effects.
6. Quest completion is terminal. Injury or detection events received after completion cannot revoke the result.
7. This issue does not change the save schema. A future persistence adapter may serialize an application snapshot behind this boundary; any schema version change requires a separate A0 decision and migration tests.

## Public boundary

The first contract covers:

- care interactions and trust progress;
- lawful and covert acquisition;
- mount request acceptance or rejection;
- ordered trial checkpoints and trial reset;
- pre-claim injury and covert detection failures;
- confirmed state effects emitted after deterministic application.

## Consequences

- A2 implements movement, mount physics and gameplay producers against these commands/events without editing the contract.
- A5 maps keyboard/touch UI intent to commands and renders confirmed events without mutating horse state.
- A7 validates idempotency, ordering, rejection reasons, terminal completion and persistence boundaries.
- `src/main.ts`, Phaser scenes, UI, save version, assets and audio remain unchanged in this PR.

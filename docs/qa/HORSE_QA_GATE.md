# Horse vertical slice — final independent A7 certification

Issue: #38

Authoritative integrated base: `635638343588569e74e9a82fc9fd0924078f8d0e`

Integrated corrective blockers before this certification:
- A2 #51 / PR #54 — confirmed-checkpoint reload guard;
- A5 #52 / PR #55 — economy modal input ownership;
- A5 #48 / PR #57 — dedicated horse-specific HUD feedback;
- A2 #58 / PR #59 — reload-safe horse command idempotency.

The earlier PR #60 two-green sequence is retained only as historical pre-#58 evidence: both executions checked out synthetic merge `f19c7846d7147156f4dd97e9517181c62c42e900` against base `d19bf738b508b4afd5cae234f78c87e637d2c44e` and therefore did not include #58.

This final certification branch is QA/documentation-only. It must not modify gameplay rules, UI feature logic, public horse contracts, persistence schema, content, assets, audio, or production input ownership.

## Required matrix

- lawful and covert input-driven acquisition paths;
- trust progression, idempotence and no duplicate reward;
- reset → reload → new trial attempt without historical command-key collision;
- mount/dismount, mounted movement, gait/stamina and mobile multi-touch sprint;
- ordered checkpoints, wrong-order reset, route-left reset, dismount reset, failure and completion;
- save/reload of mounted, active-trial and completed states;
- reload while remaining inside an already-confirmed checkpoint;
- dedicated rejection/reset/failure horse feedback while unrelated global messages change;
- dialogue, inventory/economy, crafting and combat input ownership;
- desktop Chromium, iPhone portrait and iPhone landscape;
- safe-area / viewport behavior;
- page errors, console errors and duplicate listener/context stability;
- screenshot / trace evidence from the CI artifact.

## Certification rule

The A7 final head is immutable once certification starts. A PASS requires lint, typecheck, unit tests, production build and the complete Playwright matrix to succeed **twice consecutively on the identical final head SHA and unchanged integrated base**.

A FAIL, CANCELLED run, deterministic test failure, feature defect, head SHA change, or integrated-base change resets the green sequence. A7 must not hide a reproducible failure with retries and must route feature fixes back to the owning workstream rather than modify feature code in this QA branch.

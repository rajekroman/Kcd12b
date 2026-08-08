# Horse vertical slice — final independent A7 certification

Issue: #38

Authoritative integrated base: `d19bf738b508b4afd5cae234f78c87e637d2c44e`

Integrated corrective blockers before this certification:
- A2 #51 / PR #54 — confirmed-checkpoint reload guard;
- A5 #52 / PR #55 — economy modal input ownership;
- A5 #48 / PR #57 — dedicated horse-specific HUD feedback.

This branch is QA-only. It must not modify gameplay rules, UI feature logic, public horse contracts, persistence schema, content, assets, audio, or production input ownership.

## Required matrix

- lawful and covert input-driven acquisition paths;
- trust progression, idempotence and no duplicate reward;
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

The A7 final head is immutable once certification starts. A PASS requires lint, typecheck, unit tests, production build and the complete Playwright matrix to succeed **twice consecutively on the identical final head SHA**.

A FAIL, CANCELLED run, deterministic test failure, feature defect, or head SHA change resets the green sequence. A7 must not hide a reproducible failure with retries and must route feature fixes back to the owning workstream rather than modify feature code in this QA branch.

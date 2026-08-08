# Horse vertical slice — independent A7 QA gate

Issue: #38

Base merge commit: `7efa677577086e141f8cce8a47030e3365c51d1c`

This branch is QA-only. It must not change gameplay rules, UI feature logic, public horse contracts, persistence schema, content, assets, or audio.

## Required certification matrix

- lawful input-driven acquisition path
- covert input-driven acquisition path
- trust progress and idempotence / no duplicate reward
- mount and dismount
- mounted movement and mobile multi-touch sprint
- trial checkpoint ordering
- route-left, wrong-order, and dismount reset behavior
- rejection and terminal failure feedback
- mounted, active-trial, completed save/reload states
- dialogue, inventory, crafting, and combat input-ownership conflicts
- desktop Chromium
- iPhone portrait
- iPhone landscape
- safe-area / viewport bounds
- console errors and duplicate listener/context checks
- screenshot / trace evidence

## Certification rule

A7 issues a PASS only after the exact QA head passes lint, typecheck, unit tests, production build, and the complete Playwright matrix. Any reproducible feature defect is returned to its owning workstream rather than repaired broadly in this QA branch.

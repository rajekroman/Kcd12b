# PROJECT_CONTROL.md

Tento dokument je jediný autoritativní přehled řízení projektu. Aktualizuje jej pouze A0 po ověření skutečného stavu GitHubu.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Aktuální main SHA před touto řídicí korekcí: `766c2eff3eb0810b36b9705514fa05b9df0144a9`
- Poslední feature merge: `e988e5e16f7e248df9b80cd28c91a9715891e299`
- Poslední integrovaný balík: **issue #24 / PR #34 — obsahový kontrakt prvního koně**
- Aktivní milník: **M4.4 First Horse Runtime Foundation**

## 2. Stavový model

`BACKLOG → READY → ACTIVE → RUNNING → DRAFT → REVIEW → MERGED`

Při ověřené blokaci:

`RUNNING nebo REVIEW → BLOCKED → READY nebo RUNNING`

Stav se odvozuje ze skutečného issue, větve, PR, CI a HANDOFFu, nikoli pouze z tvrzení agenta.

## 3. Aktivní agenti A1–A7

| Agent | Oblast | Issue | Větev | Base SHA | PR | Stav | Závislost |
|---|---|---:|---|---|---:|---|---|
| A1 | architektura/platforma | #35 | `agent/horse-runtime-contract` | `766c2eff3eb0810b36b9705514fa05b9df0144a9` | — | ACTIVE | #24 MERGED |
| A2 | gameplay | #36 | `agent/first-horse-gameplay` | přidělí A0 po merge #35 | — | BLOCKED | merge #35 |
| A3 | svět/questy/obsah | #24 | `agent/horse-world-content-contract` | — | #34 | MERGED | — |
| A4 | grafika/atlasy | #25 | `agent/pixel-atlas-asset-pipeline` | nepřidělen | — | BLOCKED | nové A0 base a konflikt plán |
| A5 | UI/UX/mobil | #37 | `agent/horse-mobile-ui` | přidělí A0 po merge #36 | — | BLOCKED | merge #36 |
| A6 | audio | #26 | `agent/audio-mixer-sfx-foundation` | nepřidělen | — | BLOCKED | nové A0 base; nekolidující integrační okno |
| A7 | QA/výkon | #38 | `agent/horse-qa-gate` | přidělí A0 po merge #37 | — | BLOCKED | merge #35, #36 a #37 |

A8 release issue #27 zůstává mimo řízení A1–A7 v BACKLOG/BLOCKED do stabilizace feature a audio/asset fronty.

## 4. Integrační fronta

| Pořadí | Issue | Vlastník | Balík | Stav |
|---:|---:|---|---|---|
| 1 | #35 | A1 | architektonický runtime kontrakt jezdeckého systému | ACTIVE |
| 2 | #36 | A2 | první kůň a gameplay vertical slice | BLOCKED do merge #35 |
| 3 | #37 | A5 | mobilní jezdecké ovládání a quest UI | BLOCKED do merge #36 |
| 4 | #38 | A7 | nezávislá QA brána | BLOCKED do merge #37 |

A4 #25 a A6 #26 jsou samostatné proudy. A0 je smí aktivovat pouze s přesným aktuálním base SHA, určeným vlastníkem konfliktních souborů a plánem integrace.

## 5. Poslední ověřený výsledek

### Issue #24 / PR #34 — MERGED

- merge SHA: `e988e5e16f7e248df9b80cd28c91a9715891e299`;
- finální head: `b9ab032233e576b06a7fe51ea33a9d4ba8cc48fa`;
- scope proti integrační baseline: pouze:
  - `docs/design/FIRST_HORSE_QUEST.md`;
  - `src/data/horseQuestContent.ts`;
  - `src/data/horseQuestContent.test.ts`;
- workflow #240 / run `30518698707`: SUCCESS;
- lint, typecheck, unit testy, build a Playwright E2E: PASS;
- A2 dependency re-review: připraveno;
- save schema: beze změny;
- runtime wiring: neimplementováno, předáno A1/A2/A5/A7.

## 6. Aktivní pracovní balík A1 #35

### Identita

- Issue: #35
- Agent: A1
- Priorita: P1
- Base SHA: `766c2eff3eb0810b36b9705514fa05b9df0144a9`
- Větev: `agent/horse-runtime-contract`
- Integrační pořadí: první po #24, před #36
- Stav: ACTIVE

### Cíl

Převést schválený A3 obsahový kontrakt na čisté typované command/event hranice, jediného vlastníka orchestrace a persistence boundary bez implementace mount physics, UI nebo assetů.

### Povolené oblasti

- `src/contracts/**`;
- nové izolované A1 části `src/application/**`;
- nezbytné adaptéry pod `src/platform/**` bez produkční feature logiky;
- `docs/adr/**`;
- odpovídající unit a integrační testy;
- dokumentace a PR HANDOFF.

### Konfliktní vlastnictví

A1 je v tomto integračním okně jediným vlastníkem:

- veřejných horse command/event kontraktů;
- persistence boundary rozhodnutí;
- případného horse orchestration store/service kontraktu.

A2, A5 ani A7 tyto oblasti paralelně nemění.

### Zakázané oblasti

- mount physics, kamera, animace a level design;
- UI/HUD a mobilní input;
- assety a audio;
- změna schváleného A3 obsahu;
- rozsáhlý wiring v `src/main.ts`;
- změna save verze bez ADR, migrací a reload testu;
- rebase a force push.

### Acceptance criteria

- všechny mechanické producenty a efekty #24 mají typovanou command/event hranici;
- orchestrace je deterministická a testovatelná bez Phaseru/DOM;
- jednorázové efekty jsou idempotentní;
- failure po dokončení questu nemůže zpětně zrušit výsledek;
- persistence boundary je explicitně rozhodnuta a dokumentována;
- existuje ADR pro nový veřejný command/event kontrakt;
- HANDOFF přesně vymezuje implementační body A2, A5 a testovací body A7.

### Povinné testy

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

### Povinné artefakty a HANDOFF

- CI odkaz a výsledky pro aktuální head SHA;
- seznam změněných veřejných kontraktů;
- persistence/save dopad;
- známé limity a rollback;
- kompletní blok podle `docs/HANDOFF_TEMPLATE.md`;
- PR smí do REVIEW pouze při zeleném CI, úplném HANDOFFu a shodě diffu s issue #35.

## 7. Konfliktní oblasti

V jednom integračním okně mají jediného vlastníka:

- `src/main.ts`;
- `src/game/config.ts`;
- `src/contracts/**`;
- `src/stores/**` a save schema/migrace;
- `src/data/items.ts`;
- `playwright.config.*` a sdílené E2E helpery;
- `.github/workflows/**`;
- `package.json`, `vite.config.*`;
- globální input orchestrace;
- asset manifest;
- audio registry;
- `docs/PROJECT_CONTROL.md`.

## 8. Bezprostřední další krok

A1 na větvi `agent/horse-runtime-contract`:

1. ověří checkout přesně na base `766c2eff3eb0810b36b9705514fa05b9df0144a9`;
2. spustí baseline validaci nezměněné větve;
3. vytvoří draft PR propojený s issue #35;
4. nejprve přidá ADR a typovaný kontrakt bez runtime physics/UI;
5. průběžně zveřejní head SHA, změněné soubory, testy a blokace;
6. nepřesune PR do REVIEW bez úplného HANDOFFu.

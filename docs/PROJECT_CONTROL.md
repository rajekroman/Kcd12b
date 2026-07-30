# PROJECT_CONTROL.md

Tento dokument je jediný autoritativní přehled řízení projektu. Aktualizuje jej pouze A0 po ověření skutečného stavu GitHubu.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Poslední ověřený feature merge: `e988e5e16f7e248df9b80cd28c91a9715891e299`
- Poslední integrovaný balík: **issue #24 / PR #34 — obsahový kontrakt prvního koně**
- Aktivní milník: **M4.4 First Horse Runtime Foundation**

Po commitu této řídicí aktualizace je jeho commit SHA autoritativním base pro nově aktivovaný A1 balík #35.

## 2. Stavový model

`BACKLOG → READY → ACTIVE → RUNNING → DRAFT → REVIEW → MERGED`

Při ověřené blokaci:

`RUNNING nebo REVIEW → BLOCKED → READY nebo RUNNING`

Stav se odvozuje ze skutečného issue, větve, PR, CI a HANDOFFu, nikoli pouze z tvrzení agenta.

## 3. Aktivní agenti A1–A7

| Agent | Oblast | Issue | Větev | PR | Stav | Závislost |
|---|---|---:|---|---:|---|---|
| A1 | architektura/platforma | #35 | `agent/horse-runtime-contract` | — | ACTIVE po tomto control commitu | #24 MERGED |
| A2 | gameplay | #36 | `agent/first-horse-gameplay` | — | BLOCKED | merge #35 |
| A3 | svět/questy/obsah | #24 | `agent/horse-world-content-contract` | #34 | MERGED | — |
| A4 | grafika/atlasy | #25 | `agent/pixel-atlas-asset-pipeline` | — | BLOCKED | nové A0 base a konflikt plán |
| A5 | UI/UX/mobil | #37 | `agent/horse-mobile-ui` | — | BLOCKED | merge #36 |
| A6 | audio | #26 | `agent/audio-mixer-sfx-foundation` | — | BLOCKED | nové A0 base; nekolidující integrační okno |
| A7 | QA/výkon | #38 | `agent/horse-qa-gate` | — | BLOCKED | merge #35, #36 a #37 |

A8 release issue #27 zůstává mimo řízení A1–A7 v BACKLOG/BLOCKED do stabilizace feature a audio/asset fronty.

## 4. Integrační fronta

| Pořadí | Issue | Vlastník | Balík | Stav |
|---:|---:|---|---|---|
| 1 | #35 | A1 | architektonický runtime kontrakt jezdeckého systému | ACTIVE |
| 2 | #36 | A2 | první kůň a gameplay vertical slice | BLOCKED do merge #35 |
| 3 | #37 | A5 | mobilní jezdecké ovládání a quest UI | BLOCKED do merge #36 |
| 4 | #38 | A7 | nezávislá QA brána | BLOCKED do merge #37 |

A4 #25 a A6 #26 jsou samostatné proudy. A0 je smí aktivovat pouze s přesným aktuálním base SHA, určeným vlastníkem konfliktních souborů a plánem integrace. Nesmějí měnit `src/main.ts`, veřejné contracts, asset manifest nebo audio registry souběžně s vlastníkem stejné oblasti.

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

### Cíl

Převést schválený A3 obsahový kontrakt na čisté typované command/event hranice, jediného vlastníka orchestrace a persistence boundary bez implementace mount physics, UI nebo assetů.

### Vlastnictví

Primární vlastník:

- `src/contracts/**`;
- nové A1 části `src/application/**`;
- případné `docs/adr/**`.

A1 je v tomto integračním okně jediným vlastníkem veřejných horse command/event kontraktů. A2, A5 ani A7 je nesmějí paralelně měnit.

### Zakázané oblasti

- mount physics, kamera, animace a level design;
- UI/HUD a mobilní input;
- assety a audio;
- změna schváleného A3 obsahu;
- rozsáhlý wiring v `src/main.ts`;
- změna save verze bez ADR, migrací a reload testu;
- rebase a force push.

### Povinné kontroly

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

A1 musí dodat HANDOFF pro aktuální head SHA a přesně vymezit implementační body A2, A5 a testovací body A7.

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

## 8. Koordinační pravidla

1. Jeden pracovní balík = jedna issue = jedna větev = jeden PR.
2. Žádný agent sám nemění prioritu, issue ani integrační pořadí.
3. A0 před významným rozhodnutím ověří main, issue, PR, diff, CI, artefakty a HANDOFF.
4. PR lze převést do REVIEW pouze s aktuálním head SHA, zelenými kontrolami a úplným HANDOFFem.
5. Merge se provádí merge commitem; rebase a force push jsou zakázané.
6. Po merge A0 aktualizuje tento dokument, přepočítá base SHA závislých issues a aktivuje nejbližší bezpečný balík.

## 9. Bezprostřední další krok

A0 po tomto control commitu:

1. zapíše jeho SHA jako přesný base issue #35;
2. změní issue #35 na ACTIVE;
3. vytvoří větev `agent/horse-runtime-contract` z tohoto SHA;
4. přidělí A1 povinný první krok: baseline validace, draft PR a architektonický HANDOFF plán;
5. ponechá #36, #37 a #38 BLOCKED do příslušných merge bran.

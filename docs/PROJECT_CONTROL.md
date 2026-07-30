# PROJECT_CONTROL.md

Tento dokument je jediný autoritativní přehled řízení projektu. Aktualizuje jej pouze A0 po ověření skutečného stavu GitHubu.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Aktuální main SHA před touto řídicí aktualizací: `c0ba0e1003a443b902e50d3ba193b20b6fade71a`
- Poslední feature merge: `e988e5e16f7e248df9b80cd28c91a9715891e299`
- Poslední integrovaný balík: **issue #24 / PR #34 — obsahový kontrakt prvního koně**
- Aktivní milník: **M4.4 First Horse Runtime Foundation**

## 2. Stavový model

`BACKLOG → READY → ACTIVE → RUNNING → DRAFT → REVIEW → MERGED`

Při ověřené blokaci:

`RUNNING nebo REVIEW → BLOCKED → READY nebo RUNNING`

Stav se odvozuje ze skutečného issue, větve, PR, CI a HANDOFFu, nikoli pouze z tvrzení agenta.

## 3. Stav agentů A1–A7

| Agent | Issue | Větev | Base SHA | PR | Stav | Poslední ověřený výsledek | Další krok |
|---|---:|---|---|---:|---|---|---|
| A1 | #35 | `agent/horse-runtime-contract` | `766c2eff3eb0810b36b9705514fa05b9df0144a9` | — | ACTIVE | větev vytvořena A0 z přesného base | baseline validace a draft PR |
| A2 | #36 | `agent/first-horse-gameplay` | přidělí A0 po #35 | — | BLOCKED | issue připraveno | čekat na merge #35 |
| A3 | #24 | `agent/horse-world-content-contract` | — | #34 | MERGED | merge `e988e5e...`, CI zelené | žádná nová práce bez issue |
| A4 | #25 | `agent/pixel-atlas-asset-pipeline` | nepřidělen | — | BLOCKED | zastaralý base zakázán | čekat na A0 konflikt plán |
| A5 | #37 | `agent/horse-mobile-ui` | přidělí A0 po #36 | — | BLOCKED | issue připraveno | čekat na merge #36 |
| A6 | #26 | `agent/audio-mixer-sfx-foundation` | nepřidělen | — | BLOCKED | zastaralý base zakázán | čekat na A0 integrační okno |
| A7 | #38 | `agent/horse-qa-gate` | přidělí A0 po #37 | — | BLOCKED | issue připraveno | čekat na implementační frontu |

## 4. Integrační pořadí

1. A1 #35 — architektonický runtime kontrakt.
2. A2 #36 — gameplay vertical slice.
3. A5 #37 — mobilní jezdecké UI a input.
4. A7 #38 — nezávislá QA brána.

A4 #25 a A6 #26 jsou samostatné proudy. Aktivace vyžaduje nový přesný base SHA, určeného vlastníka konfliktních souborů a explicitní pořadí vůči aktivní jezdecké frontě.

## 5. Issue #24 / PR #34 — MERGED

- merge SHA: `e988e5e16f7e248df9b80cd28c91a9715891e299`;
- finální head: `b9ab032233e576b06a7fe51ea33a9d4ba8cc48fa`;
- skutečný obsahový scope:
  - `docs/design/FIRST_HORSE_QUEST.md`;
  - `src/data/horseQuestContent.ts`;
  - `src/data/horseQuestContent.test.ts`;
- workflow #240 / run `30518698707`: SUCCESS;
- lint, typecheck, unit testy, build a Playwright E2E: PASS;
- save schema a runtime wiring: beze změny.

## 6. Aktivní pracovní balík A1 #35

### Identita

- Agent: A1
- Issue: #35
- Priorita: P1
- Base SHA: `766c2eff3eb0810b36b9705514fa05b9df0144a9`
- Větev: `agent/horse-runtime-contract`
- Větev vytvořena A0: ano
- Integrační pořadí: první po #24, před #36
- Stav: ACTIVE

### Cíl

Převést schválený A3 obsahový kontrakt na čisté typované command/event hranice, jediného vlastníka orchestrace a persistence boundary bez implementace mount physics, UI nebo assetů.

### Povolené oblasti

- `src/contracts/**`;
- nové izolované A1 části `src/application/**`;
- nezbytné adaptéry pod `src/platform/**` bez feature logiky;
- `docs/adr/**`;
- odpovídající unit a integrační testy;
- dokumentace a PR HANDOFF.

### Zakázané oblasti

- mount physics, kamera, animace a level design;
- UI/HUD a mobilní input;
- assety a audio;
- změna schváleného A3 obsahu;
- `src/main.ts` a globální runtime wiring;
- změna save verze bez ADR, migrací a reload testu;
- workflow, asset manifest a item registry;
- rebase, force push a paralelní PR.

### Acceptance criteria

- command/event hranice pokrývají všechny producenty a efekty #24;
- orchestrace je deterministická a testovatelná bez Phaseru/DOM;
- opakované eventy nezdvojují jednorázové důsledky;
- failure po dokončení questu nemůže zrušit výsledek;
- persistence boundary je explicitně rozhodnuta;
- nový veřejný kontrakt má ADR;
- HANDOFF přesně vymezuje A2, A5 a A7.

### Povinné testy

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run test:e2e` je povinné pouze při runtime wiring zásahu; takový zásah ale není v aktuálním scope povolen.

### Požadované artefakty

- testovací výsledky pro aktuální head SHA;
- diff potvrzující čistý architektonický scope;
- ADR pro command/event a persistence rozhodnutí;
- kompletní HANDOFF podle `docs/HANDOFF_TEMPLATE.md`.

### Podmínka REVIEW

Draft PR může přejít do REVIEW pouze při zeleném CI na aktuálním headu, úplném HANDOFFu, absenci nepovolených runtime změn a synchronizaci s přiděleným base.

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

1. ověří base `766c2eff3eb0810b36b9705514fa05b9df0144a9`;
2. spustí baseline lint, typecheck, test a build;
3. otevře draft PR propojený s #35;
4. nejprve přidá ADR a typovaný kontrakt;
5. publikuje head SHA, změněné soubory a testy;
6. nepřejde do REVIEW bez úplného HANDOFFu.

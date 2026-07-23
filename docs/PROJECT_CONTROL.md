# PROJECT_CONTROL.md

Tento dokument je jediný autoritativní přehled aktuálního řízení projektu. Aktualizuje jej pouze hlavní koordinátor po ověření skutečného stavu GitHubu.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Ověřený stav `main`: `fe70326fadc7d5194135559414e267a175f39c89`
- Poslední integrovaný milník: **M4.2 Hunting and Fauna**
- Poslední integrační změna: **PR #18 — víceagentní operační systém**, squash merge `fe70326fadc7d5194135559414e267a175f39c89`
- Aktuální řídicí fáze: **dokončení rozpracovaného M4.3 craftingu podle issue #19**

## 2. Skutečný stav GitHubu

### Aktivní chaty / pracovní proudy

| Chat | Role | Stav | Přidělení |
|---|---|---|---|
| A0 | Koordinace a integrace | ACTIVE | post-merge synchronizace issue #20; následně review issue #19 / PR #16 |
| A2 | Gameplay a herní systémy | DRAFT | issue #19, větev `agent/p2-crafting-alchemy-smithing`, PR #16 |
| A5 | UI, UX a mobil | DRAFT v rámci #19 | crafting panel, input/modal integrace a mobilní E2E v PR #16 |
| A1, A3, A4, A6, A7, A8 | ostatní proudy | BLOCKED / bez aktivního feature balíku | nový balík smí aktivovat pouze A0 po merge PR #16 |

### Issues

| Issue | Balík | Vlastník | Stav |
|---|---|---|---|
| #17 | Víceagentní operační systém projektu | A0/A1 | MERGED přes PR #18, uzavřeno |
| #20 | Synchronizace PROJECT_CONTROL po PR #18 | A0 | ACTIVE v `agent/control-sync-pr18` |
| #19 | Dokončit alchymii a kovářství | A2/A5 | DRAFT, vyžaduje architektonické a mobilní doplnění v PR #16 |

### Pull requesty

| PR | Větev | Base / merge | Head při posledním ověření | Stav |
|---|---|---|---|---|
| #18 | `agent/project-operating-system` | squash merge `fe70326f...` | `a8cc27c4e5836a3b517b08fdc32f3386f4e4bc65` | MERGED; workflow #178 success |
| #16 | `agent/p2-crafting-alchemy-smithing` | původní base `main@ff78179f...` | `029f1024a622aca00358c3122354e23bd77fb14e` | DRAFT; workflow #176 zelený, ale DoD není úplná |

### Ověřené CI

- PR #18: workflow run `30013929854` / #178 — `quality` success; lint, typecheck, unit testy, build a E2E prošly.
- PR #16: workflow run `29654377548` / #176 — `quality` success; lint, typecheck, unit testy, build a E2E prošly.
- Zelené CI samo o sobě nenahrazuje architektonické review, landscape ověření ani HANDOFF.

## 3. Aktuální integrační fronta

| Pořadí | Balík | Issue / větev / PR | Vlastník | Stav | Blokuje |
|---:|---|---|---|---|---|
| 1 | Post-merge synchronizace řízení | #20 / `agent/control-sync-pr18` | A0 | ACTIVE | review a další přidělování |
| 2 | Dokončení alchymie a kovářství | #19 / `agent/p2-crafting-alchemy-smithing` / PR #16 | A2/A5 | DRAFT | změny economy, item registru, craftingu, globálního inputu a navazující M4.3 |
| 3 | Koně a jezdectví — architektonický předstupeň | nevytvořeno | A1 | BLOCKED do merge #16 | samotný riding vertical slice |
| 4 | Rozšíření lovu | backlog | A2/A3 | BACKLOG | nic |

## 4. Stav merge PR #18

PR #18 je sloučen a issue #17 uzavřena. Na `main` jsou autoritativní:

- `AGENTS.md`;
- `docs/PROJECT_CONTROL.md`;
- `docs/ARCHITECTURE_CONTRACT.md`;
- `docs/PROJECT_STRUCTURE.md`;
- `docs/DEFINITION_OF_DONE.md`;
- `docs/AI_AGENT_SYSTEM.md`;
- `docs/HANDOFF_TEMPLATE.md`;
- ADR pravidla a GitHub issue/PR šablony.

Veškerá další práce musí tyto dokumenty znovu načíst z aktuálního `main`.

## 5. Povinné kroky pro PR #16

PR #16 zůstává draft, dokud nejsou splněny všechny body issue #19:

1. Aktualizovat pracovní větev vůči aktuálnímu řídicímu stavu `main@fe70326f...` bez přepsání historie a bez nesouvisejících změn.
2. Vložit application service/command hranici mezi DOM controller a EconomyStore; UI nesmí přímo provádět crafting transakci.
3. Publikovat typovaný potvrzený crafting event nebo použít schválený veřejný event kontrakt.
4. Doplnit explicitní unit test rollbacku při překročení nosnosti.
5. Doplnit deterministický test modal/input konfliktu craftingu, inventáře a dialogu.
6. Doplnit iPhone landscape Playwright projekt/scénář; současná konfigurace ověřuje jen desktop a iPhone portrait.
7. Dodat desktop, portrait a landscape runtime evidence.
8. Dodat úplný HANDOFF, `Closes #19`, přesné výsledky a CI pro aktuální head SHA.
9. Teprve potom lze PR převést do Ready for review a provést koordinační review.

## 6. Aktivní pravidla integrace

1. Nový balík je aktivní pouze tehdy, pokud je zde uveden jako `ACTIVE` nebo má koordinátorem uznaný existující draft PR a úplnou issue.
2. Issue zůstává otevřená až do merge commitu.
3. Dva aktivní balíky nesmí měnit stejný vysoce konfliktní soubor nebo veřejný kontrakt bez explicitního integračního plánu.
4. Po každém merge koordinátor znovu načte skutečný `main`, aktualizuje tento dokument a teprve potom přidělí další práci.
5. Zelené CI bez úplného HANDOFFu, relevantního mobilního důkazu a review není důvodem k merge.
6. `src/main.ts`, veřejné eventy, save schema, item registry, globální HUD/input, `BACKLOG.md`, `DEVELOPMENT_STATUS.md`, `CHANGELOG.md` a tento dokument mají v jednom integračním okně právě jednoho vlastníka.

## 7. Stav produktu

### Hotové subsystémy na `main`

- boot, menu, nová hra a pokračování;
- pixel-perfect viewport 480 × 270;
- desktopové a mobilní vstupy;
- kolize, kamera a testovací oblast Záhoří;
- NPC, dialogy, quest a denní rozvrhy;
- pětisměrný boj, kryt, dokonalý kryt a úhyb;
- inventář, vybavení, obchod a reputace;
- stealth, podezření a poplach;
- adaptivní WebAudio hudba;
- počasí a světelné fáze;
- fauna, lov, kořist a save verze 5;
- PWA, CI, unit testy a Playwright E2E;
- víceagentní řídicí, architektonický a Definition of Done kontrakt.

### Známé architektonické dluhy

- quest state podporuje pouze jeden aktivní quest;
- navigace NPC a zvěře nepoužívá pathfinding;
- některé atlasy vznikají za běhu místo asset pipeline;
- počasí je deterministické pouze podle hodinového rozvrhu;
- gameplay wiring je soustředěné kolem hlavního runtime vstupu a musí být dále rozdělováno přes controllery a application services;
- není zaveden jednotný manifest veřejných eventů a save-owned dat;
- mobilní Playwright matice neobsahuje samostatný landscape projekt.

## 8. Vlastnictví oblastí

| Oblast | Autoritativní vlastník | Typické cesty |
|---|---|---|
| Koordinace | A0 | `docs/PROJECT_CONTROL.md`, issues, PR pořadí |
| Architektura/platforma | A1 | contracts, application/platform, persistence, build, PWA, ADR |
| Gameplay | A2 | `src/systems/**`, `src/application/**`, gameplay data |
| Svět a obsah | A3 | questy, dialogy, NPC, lokace, spawn data |
| Vizuál | A4 | atlasy, animace, efekty, asset manifest |
| UI/mobil | A5 | UI controllery, DOM/CSS, touch, safe-area, input priority |
| Audio | A6 | WebAudio controllery, hudební stavy, SFX |
| QA | A7 | test strategy, `src/tests/**`, `e2e/**`, výkon a evidence |
| Release | A8 | README, changelog, release notes, deploy evidence |

## 9. Stavové značky

- `BACKLOG` — evidováno, bez přidělení.
- `READY` — specifikováno, ale ještě bez aktivní větve.
- `ACTIVE` — agent smí pracovat z uvedeného base SHA.
- `DRAFT` — existuje draft PR, implementace nebo validace není úplná.
- `REVIEW` — HANDOFF je úplný a PR je připraven k review.
- `BLOCKED` — existuje konkrétní externí, integrační nebo architektonická blokace.
- `MERGED` — změna je na `main`; stav obsahuje merge SHA.

## 10. Nejbližší koordinační kroky

1. Dokončit a sloučit issue #20 s diffem pouze v `docs/PROJECT_CONTROL.md`.
2. A2/A5 znovu načte řídicí dokumenty z `main@fe70326f...` a dokončí issue #19 výhradně ve stávajícím PR #16.
3. A0 provede review PR #16 až po úplném HANDOFFu, landscape důkazu a zeleném CI aktuálního headu.
4. Teprve po merge #16 vytvořit samostatnou issue pro architektonický předstupeň jezdectví: mount state, kolizní profil, kamera, animace, save kontrakt a mobilní ovládání.
5. Samotný riding vertical slice aktivovat až po merge architektonického předstupně.
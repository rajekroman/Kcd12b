# PROJECT_CONTROL.md

Tento dokument je jediný autoritativní přehled aktuálního řízení projektu. Aktualizuje jej pouze hlavní koordinátor po ověření skutečného stavu GitHubu.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Ověřený stav `main`: `ff78179f1380746fdb3c0981e414ff1a46bb5a0c`
- Poslední integrovaný milník: **M4.2 Hunting and Fauna**
- Aktuální řídicí fáze: **zavedení víceagentního control plane a dokončení rozpracovaného M4.3 craftingu**

## 2. Skutečný stav GitHubu

### Aktivní chaty / pracovní proudy

| Chat | Role | Stav | Přidělení |
|---|---|---|---|
| A0 | Koordinace a integrace | ACTIVE | issue #17, PR #18; kontrola celé integrační fronty |
| A1 | Architektura a platforma | ACTIVE v rámci #17 | architektonické dokumenty a procesní kontrakty v PR #18 |
| A2 | Gameplay a herní systémy | DRAFT | issue #19, větev `agent/p2-crafting-alchemy-smithing`, PR #16 |
| A5 | UI, UX a mobil | DRAFT v rámci #19 | crafting panel, input/modal integrace a mobilní E2E v PR #16 |
| A3, A4, A6, A7, A8 | ostatní proudy | BLOCKED / bez aktivního balíku | nový balík smí aktivovat pouze A0 po nejbližším merge |

### Aktivní issues

| Issue | Balík | Vlastník | Stav |
|---|---|---|---|
| #17 | Víceagentní operační systém projektu | A0/A1 | REVIEW v PR #18 |
| #19 | Dokončit alchymii a kovářství | A2/A5 | DRAFT, vyžaduje architektonické a mobilní doplnění v PR #16 |

### Otevřené pull requesty

| PR | Větev | Base | Head při posledním ověření | Stav |
|---|---|---|---|---|
| #18 | `agent/project-operating-system` | `main@ff78179f...` | mění se tímto synchronizačním commitem | REVIEW po novém zeleném CI |
| #16 | `agent/p2-crafting-alchemy-smithing` | `main@ff78179f...` | `029f1024a622aca00358c3122354e23bd77fb14e` | DRAFT; workflow #176 zelený, ale DoD není úplná |

### Ověřené CI

- PR #18, před tímto synchronizačním commitem: workflow run `30012060424` / #177 — `quality` success; lint, typecheck, unit testy, build a E2E prošly.
- PR #16: workflow run `29654377548` / #176 — `quality` success; lint, typecheck, unit testy, build a E2E prošly.
- Zelené CI samo o sobě nenahrazuje architektonické review, landscape ověření ani HANDOFF.

## 3. Aktuální integrační fronta

| Pořadí | Balík | Issue / větev / PR | Vlastník | Stav | Blokuje |
|---:|---|---|---|---|---|
| 1 | Víceagentní projektový operační systém | #17 / `agent/project-operating-system` / PR #18 | A0/A1 | REVIEW po CI aktuálního headu | autoritativní řízení dalších balíků |
| 2 | Dokončení alchymie a kovářství | #19 / `agent/p2-crafting-alchemy-smithing` / PR #16 | A2/A5 | DRAFT | změny economy, item registru, craftingu, globálního inputu a navazující M4.3 |
| 3 | Koně a jezdectví — architektonický předstupeň | nevytvořeno | A1 | BLOCKED do merge #18 a #16 | samotný riding vertical slice |
| 4 | Rozšíření lovu | backlog | A2/A3 | BACKLOG | nic |

## 4. Povinné kroky pro PR #18

1. Diff musí zůstat pouze dokumentační a šablonový.
2. Nesmí měnit runtime, save, gameplay, assety ani soubory PR #16.
3. CI musí být zelené na aktuálním head SHA po této aktualizaci.
4. PR body a HANDOFF musí uvádět aktuální head SHA a skutečný stav fronty.
5. Po merge issue #17 uzavře merge commit.
6. Koordinátor znovu načte nový `main` a zapíše merge SHA do tohoto dokumentu.

## 5. Povinné kroky pro PR #16

PR #16 zůstává draft, dokud nejsou splněny všechny body issue #19:

1. Vložit application service/command hranici mezi DOM controller a EconomyStore; UI nesmí přímo provádět crafting transakci.
2. Publikovat typovaný potvrzený crafting event nebo použít schválený veřejný event kontrakt.
3. Doplnit explicitní unit test rollbacku při překročení nosnosti.
4. Doplnit deterministický test modal/input konfliktu craftingu, inventáře a dialogu.
5. Doplnit iPhone landscape Playwright projekt/scénář; současná konfigurace ověřuje jen desktop a iPhone portrait.
6. Dodat desktop, portrait a landscape runtime evidence.
7. Dodat úplný HANDOFF, `Closes #19`, přesné výsledky a CI pro aktuální head SHA.
8. Teprve potom lze PR převést do Ready for review a provést koordinační review.

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
- PWA, CI, unit testy a Playwright E2E.

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

1. Ověřit nový CI run PR #18 po synchronizaci tohoto dokumentu.
2. Aktualizovat PR #18 HANDOFF na aktuální head SHA, převést do Ready for review a sloučit, pokud zůstane čistě dokumentační.
3. Znovu načíst nový `main` a aktualizovat tento dokument merge commitem.
4. A2/A5 dokončí issue #19 výhradně ve stávajícím PR #16.
5. A0 provede review PR #16 až po úplném HANDOFFu, landscape důkazu a zeleném CI aktuálního headu.
6. Teprve po merge #16 vytvořit samostatnou issue pro architektonický předstupeň jezdectví: mount state, kolizní profil, kamera, animace, save kontrakt a mobilní ovládání.
7. Samotný riding vertical slice aktivovat až po merge architektonického předstupně.
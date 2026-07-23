# PROJECT_CONTROL.md

Tento dokument je jediný autoritativní přehled aktuálního řízení projektu. Aktualizuje jej pouze hlavní koordinátor po ověření skutečného stavu GitHubu.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Referenční stav při vytvoření tohoto dokumentu: `main@ff78179f1380746fdb3c0981e414ff1a46bb5a0c`
- Poslední integrovaný milník: M4.2 Hunting and Fauna

## 2. Aktuální integrační fronta

| Pořadí | Balík | Větev / PR | Vlastník | Stav | Blokuje |
|---:|---|---|---|---|---|
| 1 | Alchymie a kovářství | `agent/p2-crafting-alchemy-smithing`, PR #16 | Gameplay/UI | DRAFT, čeká na kompletní validaci | další změny economy/crafting UI |
| 2 | Víceagentní projektový operační systém | `agent/project-operating-system` | Koordinátor/architektura | ACTIVE | aktivaci nových paralelních proudů |
| 3 | Koně a jezdectví — architektonický předstupeň | nepřiděleno | Architektura | BLOCKED | runtime implementaci jezdectví |
| 4 | Rozšíření lovu | nepřiděleno | Gameplay + svět | BACKLOG | nic |

## 3. Aktivní pravidla integrace

1. PR #16 se integruje před feature balíky, které mění economy, crafting panel, položky nebo save vstup.
2. Projektový operační systém nesmí měnit runtime soubory ani soubory upravené v PR #16.
3. Nový balík je aktivní pouze tehdy, pokud je zde uveden jako `ACTIVE` a obsahuje base SHA.
4. Issue zůstává otevřená až do merge commitu.
5. Po každém merge koordinátor znovu načte skutečný `main`, aktualizuje tento dokument a teprve potom přidělí další práci.

## 4. Stav produktu

### Hotové subsystémy

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
- gameplay wiring je soustředěné kolem hlavního runtime vstupu a musí být dále rozdělováno přes controllery;
- není zaveden jednotný manifest veřejných eventů a save-owned dat;
- není zavedeno explicitní vlastnictví souborů mezi paralelními proudy.

## 5. Vlastnictví oblastí

| Oblast | Autoritativní vlastník | Typické cesty |
|---|---|---|
| Koordinace | A0 koordinátor | `docs/PROJECT_CONTROL.md`, issue, PR pořadí |
| Architektura/platforma | A1 | boot, config, persistence, build, PWA, ADR |
| Gameplay | A2 | `src/systems/**`, pravidla, doménová data |
| Svět a obsah | A3 | questy, dialogy, NPC, lokace, spawn data |
| Vizuál | A4 | atlasy, animace, efekty, asset manifest |
| UI/mobil | A5 | UI controllery, DOM/CSS, touch/safe-area |
| Audio | A6 | WebAudio controllery, hudební stavy, SFX |
| QA | A7 | `src/tests/**`, `e2e/**`, test utility, výkon |
| Release | A8 | README, changelog, release notes, deploy evidence |

Sdílený soubor smí v jednom integračním okně měnit pouze jeden aktivní balík, pokud koordinátor výslovně neurčí jinak.

## 6. Stavové značky

- `BACKLOG` — evidováno, bez přidělení.
- `READY` — specifikováno, ale ještě bez aktivní větve.
- `ACTIVE` — agent smí pracovat z uvedeného base SHA.
- `DRAFT` — existuje draft PR, implementace nebo validace není úplná.
- `REVIEW` — HANDOFF je úplný a PR je připraven k review.
- `BLOCKED` — existuje konkrétní externí nebo architektonická blokace.
- `MERGED` — změna je na `main`; stav musí obsahovat merge SHA.

## 7. Povinný záznam aktivního balíku

Každý aktivní balík musí mít:

- issue číslo;
- jednoznačný cíl;
- base SHA;
- branch name;
- vlastníka;
- povolené a zakázané soubory;
- závislosti;
- acceptance criteria;
- povinné testy;
- požadovaný vizuální důkaz;
- integrační pořadí.

Bez těchto údajů není balík aktivní.

## 8. Nejbližší koordinační kroky

1. Dokončit statickou a browserovou validaci PR #16.
2. Provést review a merge PR #16 nebo vrátit přesně vymezené změny.
3. Aktualizovat `main` SHA a stav craftingu v tomto dokumentu.
4. Sloučit projektový operační systém bez runtime změn.
5. Vytvořit samostatnou issue pro architektonický předstupeň jezdectví: mount state, kolizní profil, kamera, animace, save kontrakt a mobilní ovládání.
6. Aktivovat samotný jezdící vertical slice až po merge architektonického předstupně.
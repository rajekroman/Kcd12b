# PROJECT_STRUCTURE.md

Cílová struktura projektu podporuje paralelní práci, jasné vlastnictví a testovatelnou herní logiku. Neprovádí se jednorázová migrace; existující soubory se přesouvají pouze v rámci funkční změny s testy.

```text
Kcd12b/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── agent-task.md
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── pages.yml
│   │   └── visual-regression.yml        # až bude zaveden baseline
│   └── pull_request_template.md
├── docs/
│   ├── AI_AGENT_SYSTEM.md
│   ├── PROJECT_CONTROL.md
│   ├── ARCHITECTURE_CONTRACT.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DEFINITION_OF_DONE.md
│   ├── HANDOFF_TEMPLATE.md
│   ├── adr/
│   │   ├── README.md
│   │   └── 0000-template.md
│   ├── design/
│   │   ├── game-pillars.md
│   │   ├── combat.md
│   │   ├── economy.md
│   │   ├── world.md
│   │   └── mobile-ux.md
│   ├── releases/
│   └── testing/
│       ├── test-matrix.md
│       └── mobile-devices.md
├── public/
│   ├── assets/
│   │   ├── audio/
│   │   ├── fonts/
│   │   ├── portraits/
│   │   ├── sprites/
│   │   ├── tiles/
│   │   └── ui/
│   └── manifest.webmanifest
├── scripts/
│   ├── serve-preview.mjs
│   ├── validate-assets.mjs
│   ├── validate-data.mjs
│   └── validate-project-control.mjs
├── src/
│   ├── application/
│   │   ├── commands/
│   │   ├── services/
│   │   └── transactions/
│   ├── audio/
│   │   ├── controllers/
│   │   ├── music/
│   │   └── sfx/
│   ├── contracts/
│   │   ├── events.ts
│   │   ├── ids.ts
│   │   ├── save.ts
│   │   └── runtime.ts
│   ├── data/
│   │   ├── dialogues/
│   │   ├── fauna/
│   │   ├── items/
│   │   ├── locations/
│   │   ├── npcs/
│   │   ├── quests/
│   │   └── recipes/
│   ├── game/
│   │   ├── controllers/
│   │   ├── entities/
│   │   ├── scenes/
│   │   └── config.ts
│   ├── platform/
│   │   ├── input/
│   │   ├── persistence/
│   │   ├── pwa/
│   │   └── telemetry/
│   ├── stores/
│   ├── systems/
│   ├── ui/
│   │   ├── controllers/
│   │   ├── panels/
│   │   ├── styles/
│   │   └── view-models/
│   ├── tests/
│   │   ├── fixtures/
│   │   ├── integration/
│   │   └── unit/
│   └── main.ts
├── e2e/
│   ├── fixtures/
│   ├── helpers/
│   ├── desktop/
│   └── mobile/
├── AGENTS.md
├── BACKLOG.md
├── CHANGELOG.md
├── DEVELOPMENT_STATUS.md
├── package.json
└── README.md
```

## 1. Vlastnictví adresářů

| Adresář | Primární vlastník | Review |
|---|---|---|
| `src/contracts`, `src/platform` | architektura | QA + dotčený feature agent |
| `src/systems`, `src/application` | gameplay | architektura + QA |
| `src/data` | svět/obsah nebo gameplay podle typu | architektura |
| `src/game` | gameplay/runtime | UI nebo vizuál podle dopadu |
| `src/ui` | UI/mobil | gameplay + QA |
| `src/audio` | audio | gameplay + QA |
| `public/assets` | vizuál/audio | runtime + QA |
| `src/tests`, `e2e` | QA nebo feature agent | vlastník systému |
| `docs/PROJECT_CONTROL.md` | pouze koordinátor | není paralelně editován |

## 2. Migrační pravidla

1. Žádný samostatný „big-bang“ přesun celého `src`.
2. Nová funkce používá cílovou strukturu, pokud tím nevznikne duplicitní abstrakce.
3. Existující soubor se přesune pouze tehdy, když je v témže PR skutečně měněn.
4. Přesun nesmí současně měnit veřejné chování bez samostatně čitelných commitů.
5. Imports, testy a dokumentace musí být aktualizovány v jednom PR.
6. Dočasná kompatibilní re-export vrstva je povolená nejvýše přes jeden milník a musí být v backlogu.

## 3. Naming conventions

- soubory tříd/controllerů: `PascalCase.ts`;
- čisté moduly a data: `camelCase.ts`;
- typy ID: `PlayerId`, `QuestId`, `AssetId`;
- stabilní hodnoty ID: `kebab-case`, například `quest-first-steel`;
- eventy: `PastTenseEvent`, například `QuestCompleted`;
- příkazy: `IntentRequested`, například `CraftRequested`;
- testy: `<Subject>.test.ts`;
- E2E: `<player-flow>.spec.ts`;
- větve: `agent/<workstream>-<goal>`;
- commity: Conventional Commits bez generických zpráv typu `update`.

## 4. Soubory s vysokým konfliktním rizikem

Následující soubory smí v jednom integračním okně měnit pouze jeden agent:

- `src/main.ts`;
- centrální game config;
- veřejný event kontrakt;
- save schema a migrace;
- item/recipe registry;
- globální HUD layout a shared CSS tokens;
- asset manifest;
- `BACKLOG.md`, `DEVELOPMENT_STATUS.md`, `CHANGELOG.md`;
- `docs/PROJECT_CONTROL.md`.

Koordinátor před aktivací paralelních balíků explicitně určí vlastníka těchto souborů.

## 5. Vertikální řez

Preferovaná feature struktura:

```text
src/data/<feature>.ts
src/systems/<Feature>System.ts
src/stores/<Feature>Store.ts             # pouze pokud vzniká nový autoritativní stav
src/application/services/<Feature>Service.ts
src/game/controllers/<Feature>Controller.ts
src/ui/controllers/<FeatureUiController.ts
src/tests/unit/<Feature>System.test.ts
e2e/mobile/<feature-flow>.spec.ts
docs/<feature>.md
```

Ne každá funkce potřebuje všechny vrstvy. Každá použitá vrstva ale musí mít jasnou odpovědnost.

## 6. Co nepatří do repozitáře

- generované build adresáře;
- lokální secrets a osobní konfigurace;
- neověřené assety bez licence/původu;
- velké zdrojové pracovní soubory, pokud runtime používá exportovaný optimalizovaný asset;
- screenshoty bez vazby na PR, test nebo dokumentovaný baseline;
- duplikáty externích knihoven, které má spravovat package manager.
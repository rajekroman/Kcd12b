# AGENTS.md — řízený autonomní vývoj Chronicles of Bohemia

## Poslání

Pracuj jako specializovaný seniorní člen vývojového týmu originálního 12bitového historického arkádového RPG pro web, iPhone, iPad a desktop. Projekt nesmí kopírovat chráněné postavy, příběh, mapy, hudbu, dialogy, vizuální materiály ani značku existující hry.

## Povinné načtení před prací

Před každým pracovním balíkem načti v tomto pořadí:

1. `AGENTS.md`;
2. `docs/PROJECT_CONTROL.md`;
3. `docs/ART_DIRECTION.md`;
4. `docs/ARCHITECTURE_CONTRACT.md`;
5. přidělenou GitHub issue;
6. aktuální stav větve, otevřené PR a relevantní poslední commity;
7. `docs/DEFINITION_OF_DONE.md`.

Pokud jsou starší instrukce v chatu v rozporu s těmito zdroji, platí aktuální repozitář a issue.

## Visual reboot gate — issue #68

Do explicitního A0/A7 vizuálního schválení issue #68 je celý projekt v režimu **VISUAL REBOOT**.

- `docs/ART_DIRECTION.md` je autoritativní vizuální kontrakt.
- `docs/visual-concept.svg` je pouze historický koncept a není acceptance target.
- A4 je primární implementační vlastník presentation layer vertikálního řezu.
- A5 smí pracovat pouze na UI potřebném pro tento řez.
- A1/A2/A3/A6 nesmí rozšiřovat feature scope; smějí pouze podporovat nezbytnou integraci řezu.
- A7 musí hodnotit runtime screenshoty a vizuální konzistenci; zelené CI samo nestačí.
- A8 nesmí označit release za hotový před vizuálním schválením #68.
- Plochý top-down world, procedurální kruhové stromy, obdélníkové domy, opakované základní tiles a diagnostické textové boxy nesmějí být prezentovány jako finální art.

## Aktivace práce

Agent smí implementovat pouze balík, který:

- je v `PROJECT_CONTROL.md` označen jako `ACTIVE` nebo má již přidělený draft PR;
- má issue, base SHA, větev, rozsah a acceptance criteria;
- patří do jeho pracovního proudu;
- nezasahuje do cizích autoritativních souborů bez výslovného povolení koordinátora.

Agent nesmí sám aktivovat další issue, zakládat nesouvisející větev nebo měnit integrační pořadí.

## Role

Používej role definované v `docs/AI_AGENT_SYSTEM.md`:

- A0 koordinátor;
- A1 architektura/platforma;
- A2 gameplay/systémy;
- A3 svět/questy/obsah;
- A4 vizuál/animace;
- A5 UI/mobil;
- A6 audio;
- A7 QA/výkon;
- A8 release/dokumentace.

Jeden agent v jednom PR zastává jednu primární roli. Vedlejší zásah musí být nezbytný pro kompletní vertikální řez a uvedený v HANDOFFu.

## Pracovní cyklus implementačního agenta

1. Ověř base SHA a scope.
2. Spusť základní kontroly nezměněné větve.
3. Otevři nebo aktualizuj draft PR.
4. Implementuj nejmenší úplný vertikální řez.
5. Udržuj doménová pravidla oddělená od Phaser/DOM vrstvy.
6. Přidej unit, integrační a relevantní E2E testy.
7. Ověř desktop, mobile portrait a mobile landscape podle dopadu.
8. Aktualizuj dokumentaci, changelog a skutečný stav.
9. Doplň HANDOFF pro aktuální head SHA.
10. Přesuň PR do `Ready for review` pouze při splnění Definition of Done.
11. Po předání neaktivuj další balík; čeká se na koordinační merge a nové přidělení.

## Pracovní cyklus koordinátora

1. Načti skutečný stav `main`, issue, PR, review a CI.
2. Zkontroluj shodu diffu s issue a HANDOFFem.
3. Ověř konfliktní soubory, kontrakty a save kompatibilitu.
4. Vrať pouze konkrétní opravitelné připomínky.
5. Merge prováděj až po zelených povinných kontrolách a úplném review.
6. Issue uzavři merge commitem.
7. Aktualizuj `PROJECT_CONTROL.md` na nový `main` SHA.
8. Teprve potom aktivuj následující pracovní balík.

## Povinné kontroly

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Před `Ready for review` musí výsledky odpovídat aktuálnímu head SHA. U dříve nestabilního browser testu jsou vyžadovány dva po sobě jdoucí zelené běhy stejného headu.

## Prioritní zásady produktu

1. hluboká atmosféra a jasná vizuální identita;
2. přesné a příjemné mobilní ovládání;
3. zábavná a čitelná hratelnost;
4. stabilita, save bezpečnost a výkon;
5. konzistentní 12/16bitový malířský pixel-art;
6. historická uvěřitelnost;
7. datově řízený obsah;
8. modulární a testovatelná architektura.

## Technický základ

- TypeScript;
- Phaser 3;
- Vite;
- Vitest;
- Playwright;
- PWA a GitHub Pages;
- datově řízené questy, dialogy, NPC, předměty, recepty a fauna;
- autoritativní stores;
- čisté doménové systémy;
- explicitní příkazy a potvrzené eventy.

## Zásady změn

- Jeden pracovní balík = jedna issue = jedna větev = jeden PR.
- Preferuj malé logické commity s Conventional Commits.
- Neměň formátování celých nesouvisejících souborů.
- Neprováděj big-bang refactor společně s feature změnou.
- `src/main.ts` je composition root, nikoli místo pro feature logiku.
- UI a audio reagují na potvrzené eventy, nikoli na nepotvrzený input.
- Změna save schématu vyžaduje verzi, migrace, validaci a reload test.
- Placeholder musí být evidován v backlogu a nesmí být prezentován jako finální obsah.
- Vizuální změna vyžaduje skutečný runtime důkaz v portrait i landscape.

## Definice hotové funkce

Platí celý `docs/DEFINITION_OF_DONE.md`. Minimálně musí být funkce:

- implementovaná v produkčním průchodu;
- architektonicky správně zapojená;
- otestovaná;
- ověřená na relevantních platformách;
- kompatibilní se save nebo migrovaná;
- dokumentovaná v changelogu/stavu;
- předaná pomocí `docs/HANDOFF_TEMPLATE.md`.

Funkce je dokončená až po merge na `main`, nikoli vytvořením kódu nebo otevřením PR.

## Blokace

Ptej se pouze při skutečné externí nebo architektonické blokaci. Blokace musí uvést:

- reprodukci nebo důkaz;
- dotčený kontrakt/soubor;
- dopad na acceptance criteria;
- nejmenší doporučené rozhodnutí;
- co lze bezpečně dokončit bez tohoto rozhodnutí.

Blokaci neobcházej ad-hoc duplikací stavu, magic ID nebo dočasným globálním řešením.
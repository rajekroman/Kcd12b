# AGENTS.md — řízený autonomní vývoj Chronicles of Bohemia

## Poslání

Pracuj jako specializovaný seniorní člen vývojového týmu originálního 12bitového historického arkádového RPG pro web, iPhone, iPad a desktop. Projekt nesmí kopírovat chráněné postavy, příběh, mapy, hudbu, dialogy, vizuální materiály ani značku existující hry.

## Povinné načtení před prací

Před každým pracovním balíkem načti v tomto pořadí:

1. `AGENTS.md`;
2. `docs/PROJECT_CONTROL.md`;
3. `docs/ARCHITECTURE_CONTRACT.md`;
4. přidělenou GitHub issue;
5. aktuální stav větve, otevřené PR a relevantní poslední commity;
6. `docs/DEFINITION_OF_DONE.md`.

Pokud jsou starší instrukce v chatu v rozporu s těmito zdroji, platí aktuální repozitář a issue.

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

## Pracovní cyklus koordinátora A0

A0 je hlavní koordinační, kontrolní a integrační autorita projektu. Řídí A1–A7 jako koordinované pracovní proudy, ověřuje jejich skutečné výsledky a udržuje projekt v pohybu bez opakovaného ručního pokynu `pokračuj`.

A0 neimplementuje rozsáhlé odborné funkce, pokud nejde o malou integrační opravu, řídicí změnu nebo nezbytný zásah pro odblokování procesu.

### Povinný koordinační cyklus

1. Načti skutečný stav `main`, issue, PR, review, CI, artefakty a relevantní důkazy.
2. Porovnej skutečnost s `docs/PROJECT_CONTROL.md` a oprav nesoulad.
3. U každého aktivního agenta ověř issue, roli, base SHA, větev, head SHA, PR, scope, závislosti a blokace.
4. Zkontroluj shodu diffu s issue, acceptance criteria a HANDOFFem.
5. Ověř konfliktní soubory, veřejné kontrakty, save kompatibilitu, workflow, asset manifest a integrační pořadí.
6. Ověř, že výsledky testů a důkazy odpovídají aktuálnímu head SHA.
7. Pro každý pracovní proud rozhodni jednu z možností: pokračovat, zadat konkrétní další krok, vrátit k opravě, blokovat, přesunout do review, sloučit nebo uzavřít bez merge.
8. Rozhodnutí rovnou proveď na GitHubu, pokud máš potřebná oprávnění a informace.
9. Po merge načti nový `main`, uzavři issue, aktualizuj `PROJECT_CONTROL.md`, přepočítej base SHA závislých balíků a aktivuj další bezpečný úkol.
10. Pokud existuje proveditelný neblokovaný krok v kompetenci A0, neukončuj cyklus pouhým doporučením.

### Povinný obsah pracovního balíku

Každý nově přidělený úkol musí mít:

- GitHub issue;
- přesný cíl;
- přiděleného agenta;
- prioritu;
- přesný base SHA;
- název větve;
- integrační pořadí;
- závislosti a blokace;
- povolené soubory nebo moduly;
- zakázané oblasti;
- acceptance criteria;
- povinné testy a důkazy;
- požadovaný HANDOFF;
- podmínku připravenosti k review.

A0 nesmí zadávat neurčité úkoly typu `pokračuj ve vývoji`, `dokonči grafiku` nebo `oprav projekt`. Každý balík musí být úzký, vertikální, měřitelný a samostatně ověřitelný.

### Stavový model

Používej jednotné stavy:

```text
BACKLOG
→ READY
→ ACTIVE
→ RUNNING
→ DRAFT
→ REVIEW
→ MERGED
```

Při problému:

```text
RUNNING nebo REVIEW
→ BLOCKED
→ READY nebo RUNNING
```

Stav musí odpovídat skutečnému GitHubu, nikoli pouze tvrzení agenta.

### Scope review a integrační rozhodnutí

Před merge ověř minimálně:

- issue, vlastník, base SHA, head SHA, větev a integrační pořadí;
- seznam změněných souborů a soulad se scope;
- nepovolené přesahy a konfliktní oblasti;
- skutečné produkční zapojení;
- soulad s architektonickým kontraktem;
- lint, typecheck, unit testy, build a relevantní E2E;
- desktop, mobile portrait a mobile landscape podle dopadu;
- save, reload a migrace podle dopadu;
- screenshoty, trace, artefakty nebo produkční smoke důkazy podle issue;
- úplný HANDOFF pro aktuální head SHA;
- absenci nevyřešených závažných regresí.

Pokud práce není připravená, vrať pouze konkrétní, ověřitelné a opravitelné připomínky. Pokud všechny podmínky platí, proveď merge bezpečně proti ověřenému head SHA.

### Konfliktní oblasti

Bez explicitního integračního plánu neaktivuj souběžné změny zejména v:

```text
src/main.ts
src/game/config.ts
src/contracts/**
src/stores/**
src/data/items.ts
playwright.config.*
.github/workflows/**
package.json
vite.config.*
save schema a migrace
globální input orchestrace
asset manifest
audio registry
docs/PROJECT_CONTROL.md
```

Je-li souběh nutný, určuj primárního vlastníka, pořadí integrace, očekávaný konfliktní bod a odpovědnost za finální testy.

### Autonomní režim A0

- Nečekej na opakovanou zprávu `pokračuj`, pokud lze další krok bezpečně provést.
- Po scope review proveď integrační rozhodnutí.
- Po rozhodnutí aktualizuj issue, PR a `PROJECT_CONTROL.md`.
- Po merge aktivuj nejbližší bezpečný pracovní balík.
- Pokud je agent nečinný a existuje pro něj vhodný neblokovaný úkol, přiděl mu jej.
- Pokud agent pracuje podle zastaralého base SHA nebo chybného scope, zastav proud a oprav zadání.
- Chyby způsobené vlastní implementací vracej stejnému agentovi.
- Skutečnou blokaci eviduj s vlastníkem, důvodem a podmínkou odblokování.
- Autonomní režim neznamená automatický merge neověřené práce.

### Povinný výstup koordinačního cyklu

Po každém cyklu uveď:

1. aktuální `main` SHA, aktivní milník, otevřené PR, stav CI, blokace a integrační pořadí;
2. pro A1–A7 aktuální issue, větev, PR, stav, poslední ověřený výsledek, blokaci a další konkrétní krok;
3. integrační rozhodnutí: co pokračuje, co se vrací, co zůstává blokované, co se slučuje a co se aktivuje;
4. pouze skutečně provedené GitHub akce;
5. nejbližší bezpečný následující krok, který má A0 rovnou provést, pokud je proveditelný.

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

1. přesné a příjemné mobilní ovládání;
2. zábavná a čitelná hratelnost;
3. hluboká atmosféra a originalita;
4. stabilita, save bezpečnost a výkon;
5. konzistentní 12bitový vizuál;
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

# AI Agent System

Tento dokument definuje víceagentní vývojový systém projektu **Chronicles of Bohemia**. Cílem není maximalizovat počet paralelních větví, ale zvyšovat průchodnost bez konfliktů, regresí a rozpadu architektury.

## 1. Řídicí princip

Projekt používá model **jeden koordinátor + specializované pracovní proudy**.

- `main` je jediný zdroj pravdy.
- `docs/PROJECT_CONTROL.md` je jediný zdroj pravdy pro aktuální stav práce.
- Jeden pracovní balík má právě jednu issue, jednu větev a jeden PR.
- Jeden agent nesmí současně řešit více nesouvisejících balíků.
- Agent neaktivuje další balík bez přidělení koordinátorem.
- Paralelní práce je povolena pouze tehdy, když se balíky nedotýkají stejných autoritativních souborů nebo datových kontraktů.

## 2. Role agentů

### A0 — Hlavní koordinátor

Odpovídá za:

- aktualizaci `PROJECT_CONTROL.md`;
- rozdělení práce na malé vertikální řezy;
- pořadí integrace;
- řešení konfliktů vlastnictví;
- review a merge;
- uzavření issue merge commitem;
- aktivaci následujícího balíku až po aktualizaci `main`.

Koordinátor běžně neimplementuje herní funkce.

### A1 — Architektura a platforma

Odpovídá za:

- modulární hranice a veřejná rozhraní;
- boot, scény, dependency wiring a eventy;
- persistence, migrace save a determinismus;
- asset pipeline, build, PWA a GitHub Pages;
- technické ADR a architektonické kontrakty.

### A2 — Gameplay a systémy

Odpovídá za:

- boj, stealth, AI, ekonomiku, crafting, lov a jezdectví;
- čistou doménovou logiku bez Phaser/DOM závislostí;
- data-driven definice pravidel;
- unit testy systémů a integrační zapojení.

### A3 — Svět, questy a obsah

Odpovídá za:

- lokace, questy, dialogy, NPC rozvrhy a příběhové podmínky;
- historickou věrohodnost a interní konzistenci;
- obsahová data bez duplikace herních pravidel;
- kompletní vertikální průchod od vstupu po odměnu.

### A4 — Vizuál a animace

Odpovídá za:

- pixel-art identity, atlasy, animace a vizuální čitelnost;
- prostředí, efekty, portréty a asset manifest;
- dodržení pixel gridu, velikostí a výkonových limitů;
- důkaz v portrait i landscape z reálného runtime.

### A5 — UI a mobil

Odpovídá za:

- HUD, dialogy, inventář, menu a ovládací panely;
- safe-area, dotykové vstupy, orientace a přístupnost;
- žádné blokující překryvy ani konflikty vstupů;
- parity klávesnice, dotyku a gamepadu, pokud je podporován.

### A6 — Audio

Odpovídá za:

- adaptivní hudbu, ambience, SFX a mix;
- odemykání WebAudio uživatelským gestem;
- deterministické přepínání vrstev podle herního stavu;
- nulové závislosti gameplay logiky na dostupnosti zvuku.

### A7 — QA, výkon a bezpečnost změn

Odpovídá za:

- testovací strategii a regresní scénáře;
- mobilní E2E, save migrace a deterministické testy;
- výkonové rozpočty, leak detection a stabilitu dlouhé session;
- reprodukovatelný bug report s minimálním testem.

### A8 — Release a dokumentace

Odpovídá za:

- verze, changelog a release notes;
- stav nasazení, smoke test GitHub Pages a rollback informace;
- kontrolu, že README a ovládání odpovídají produktu;
- produkční HANDOFF.

## 3. Povolená paralelizace

| Kombinace | Stav | Podmínka |
|---|---|---|
| Gameplay + vizuál | povoleno | předem zmrazené asset ID a rozměry |
| Gameplay + UI | povoleno | předem zmrazené eventy a view-model |
| Obsah + audio | povoleno | stabilní identifikátory lokací a stavů |
| Architektura + feature | omezeně | feature nesmí měnit stejný kontrakt |
| Dvě gameplay větve | zakázáno | pokud sdílejí store, save nebo combat loop |
| Dvě UI větve | zakázáno | pokud mění stejný controller nebo CSS vrstvu |
| Release + libovolný runtime zásah | zakázáno | release větev musí být zmrazená |

## 4. Životní cyklus pracovního balíku

1. Koordinátor vytvoří issue pomocí agentního task template.
2. Issue přesně určí cíl, rozsah, závislosti, povolené soubory a acceptance criteria.
3. Agent načte `AGENTS.md`, `PROJECT_CONTROL.md`, `ARCHITECTURE_CONTRACT.md` a issue.
4. Agent vytvoří větev `agent/<oblast>-<stručný-cíl>` z přesně určeného SHA.
5. Agent otevře draft PR co nejdříve a průběžně aktualizuje jeho popis.
6. Implementace probíhá jako vertikální řez: data → systém → runtime → UI → persistence → test.
7. Před předáním musí projít povinné kontroly a musí být doplněn HANDOFF.
8. Koordinátor provede review, opravný cyklus a merge.
9. Teprve merge commit uzavírá issue.
10. Koordinátor aktualizuje `PROJECT_CONTROL.md` a aktivuje další balík.

## 5. Velikost pracovního balíku

Optimální balík:

- mění jednu hráčskou schopnost nebo jeden průchod;
- má jednu hlavní odpovědnost;
- lze ho ověřit nejvýše třemi E2E scénáři;
- nevyžaduje současný merge jiného nehotového PR;
- obsahuje maximálně jednu změnu save schématu;
- má jasný rollback.

Balík je příliš velký, pokud kombinuje nový engine kontrakt, nový level, nový HUD a nový save formát bez mezikroku.

## 6. Komunikační kontrakt

Každý pracovní agent v PR udržuje:

- **Scope** — co je součástí a co není;
- **Implementation** — skutečně změněné systémy;
- **Validation** — přesné příkazy a výsledky;
- **Evidence** — screenshoty nebo video pro vizuální/mobilní změny;
- **Risks** — známé limity a důsledky;
- **HANDOFF** — integrační stav podle šablony.

Agent nesmí označit placeholder, mock nebo jen dokumentovaný návrh za dokončenou funkci.

## 7. Pravidla eskalace

Agent zastaví implementaci a označí balík jako `BLOCKED`, pokud:

- issue odporuje architektonickému kontraktu;
- je nutná změna cizího autoritativního souboru mimo rozsah;
- není stabilní datový/eventový kontrakt pro paralelní proud;
- požadovaná změna může poškodit save kompatibilitu;
- reprodukovatelně selhává základní CI na nezměněném base SHA.

Blokace musí obsahovat důkaz, dopad a nejmenší doporučené rozhodnutí. Agent nesmí blokaci obejít skrytým ad-hoc řešením.

## 8. Doporučený počet aktivních agentů

Pro současnou velikost projektu:

- 1 koordinátor;
- maximálně 2 implementační proudy;
- 1 QA proud aktivovaný až po stabilním runtime kontraktu.

Více než tři souběžné implementační PR pravděpodobně zvýší integrační režii rychleji než vývojovou rychlost.
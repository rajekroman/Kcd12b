# Technical Design

## Architektura

- `game/scenes`: boot, menu, svět a Phaser UI; scény orchestrují systémy, ale nevlastní textový obsah ani ekonomická pravidla.
- `game/NpcManager`: runtime správa obyvatel, pohybu, popisků a kontextového interakčního výběru.
- `game/InventoryUiController`: responzivní DOM rozhraní inventáře a obchodu, které používá stejné doménové transakce jako testy.
- `data`: deklarativní definice questů, dialogů, NPC, míst, denních režimů a předmětů.
- `systems`: čistá doménová logika dialogů, questů, NPC rozvrhů, inventáře, obchodu, ukládání a soubojů.
- `core/EconomyStore`: jediný sdílený runtime stav inventáře, vybavení, měny a obchodníka.
- `core/EventBus`: oddělení herní scény, Phaser UI a ekonomického DOM panelu.
- `tests`: jednotkové regresní testy.
- `e2e`: browserové scénáře proti produkčnímu buildu v GitHub Pages podadresáři.

## Datově řízený obsah

`src/data/quests.ts` obsahuje definice počátečního stavu, kroků, objektivů, událostí, podmíněných přechodů a příznaků. `QuestSystem.applyQuestEvent` vybere první odpovídající přechod a `GameScene` pouze hlásí doménové události.

`src/data/dialogues.ts` obsahuje samostatné uzly se stabilním ID, NPC ID, prioritou, textem, podmínkami a deklarativními efekty. `DialogueSystem.getDialogueForNpc` vybere nejvyšší odpovídající prioritu.

## Obyvatelé a denní režimy

`src/data/npcs.ts` definuje deset obyvatel, 21 míst a jejich časové úseky. Každý úsek obsahuje počáteční a koncovou hodinu, aktivitu a cílové místo.

`NpcScheduleSystem` normalizuje herní hodinu, převádí 120sekundový cyklus na denní čas, podporuje intervaly přes půlnoc a odmítne neúplný rozvrh.

`NpcManager` vytváří fyzické postavy, při pokračování je okamžitě umístí podle save, průběžně je vede k cíli a vybírá nejbližšího obyvatele pro interakci. Kontextový atribut nejbližšího NPC aktualizuje pouze při skutečné změně, aby DOM rozhraní nereagovalo zbytečným překreslováním každý snímek.

## Inventář, vybavení a obchod

`src/data/items.ts` je autoritativní katalog předmětů. Každá definice obsahuje:

- stabilní ID a textové údaje,
- kategorii a případný slot vybavení,
- váhu a maximální stack,
- nákupní a prodejní cenu,
- bojové, obranné, charismatické nebo léčivé statistiky.

`InventorySystem` pracuje čistě a neměnně. Operace `addItem`, `removeItem`, `equipItem`, `buyItem`, `sellItem` a `useConsumable` vracejí explicitní úspěch nebo typovanou chybu. Transakce nejprve ověří zásoby, hotovost, nosnost a stacky a teprve potom vytvoří nový stav; odmítnutá operace proto nezmění žádnou stranu obchodu.

`EconomyStore` drží jeden runtime `EconomyState` a informuje `InventoryUiController`. Controller otevře běžný batoh kdekoli, ale obchodní režim dovolí pouze tehdy, když `NpcManager` hlásí Kateřinu jako nejbližší interaktivní NPC. Otevřený panel pozastaví Arcade Physics a klávesové vstupy scény.

Vybavení je propojeno s bojem: zbraň upravuje základní útok a hodnota zbroje snižuje příchozí poškození. Spotřební předmět emituje událost s léčivou hodnotou; `GameScene` obnoví zdraví a zařadí save.

## Stav hry a persistence

Persistence je oddělena přes `SaveSystem` a `AsyncSaveStore`.

- IndexedDB databáze `chronicles-of-bohemia` je primární úložiště.
- Object store `saves` obsahuje záznam `primary`.
- localStorage klíč `chronicles-of-bohemia.save.v3` slouží pouze jako fallback.
- Legacy klíče verzí 1 a 2 se při načtení migrují do verze 3.
- Save verze 3 ukládá hráče, quest, čas světa, inventář, vybavení, groše, zásoby obchodníka a ISO čas posledního zápisu.
- Validátor kontroluje známá ID předmětů, kladné celočíselné množství, stack limity, správné sloty a vlastnictví vybavených kusů.
- Autosavy jsou serializované jedním promise řetězcem.
- Každá změna ekonomiky vyvolá okamžitý save požadavek.
- Ovládání je při pokračování uzamčené do dokončení validace a migrace.

Další rozšíření save formátu musí zvýšit `CURRENT_SAVE_VERSION`, přidat migrační větev a regresní test zachovávající všechny dřívější formáty.

## Výkon

Pixel-art textury jsou nyní generované za běhu. Produkční assety budou atlasované. Fyzika používá Arcade Physics a statické kolize. Inventářový DOM se překresluje pouze při ekonomické nebo kontextové změně, nikoli v herní smyčce.

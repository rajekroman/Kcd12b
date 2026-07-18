# Technical Design

## Architektura

- `game/scenes`: boot, menu, svět a Phaser UI; scény orchestrují systémy, ale nevlastní textový obsah ani ekonomická pravidla.
- `game/NpcManager`: runtime správa obyvatel, pohybu, popisků a kontextového interakčního výběru.
- `game/InventoryUiController`: responzivní DOM rozhraní inventáře, pověsti a obchodu.
- `game/ReputationController`: převádí doménové dokončení questu na reputační změny a save požadavek.
- `data`: deklarativní definice questů, dialogů, NPC, míst, denních režimů a předmětů.
- `systems`: čistá doménová logika dialogů, questů, NPC rozvrhů, inventáře, reputace, obchodu, ukládání a soubojů.
- `core/EconomyStore`: jediný sdílený runtime stav inventáře, vybavení, měny a obchodníka.
- `core/ReputationStore`: jediný sdílený runtime stav pověsti sedláků, měšťanů a šlechty.
- `core/EventBus`: oddělení herní scény, Phaser UI, ekonomického DOM panelu a persistentních změn.
- `tests`: jednotkové regresní testy.
- `e2e`: browserové scénáře proti produkčnímu buildu v GitHub Pages podadresáři.

## Datově řízený obsah

`src/data/quests.ts` obsahuje definice počátečního stavu, kroků, objektivů, událostí, podmíněných přechodů a příznaků. `QuestSystem.applyQuestEvent` vybere první odpovídající přechod. Při prvním přechodu do `complete` publikuje doménovou událost; opakované události v dokončeném stavu již listener nevyvolají.

`src/data/dialogues.ts` obsahuje uzly se stabilním ID, NPC ID, prioritou, textem, podmínkami a deklarativními efekty. Podmínka může vyžadovat také minimální nebo maximální pověst zvolené skupiny. `DialogueSystem.getDialogueForNpc` vybere nejvyšší odpovídající prioritu proti aktuálnímu reputačnímu storu.

## Obyvatelé a denní režimy

`src/data/npcs.ts` definuje deset obyvatel, 21 míst a jejich časové úseky. `NpcScheduleSystem` převádí světový čas, podporuje intervaly přes půlnoc a odmítne neúplný rozvrh. `NpcManager` vytváří fyzické postavy, vede je k cíli a vybírá nejbližšího obyvatele pro interakci.

## Inventář, vybavení a obchod

`src/data/items.ts` je autoritativní katalog předmětů se stabilním ID, kategorií, slotem, váhou, stack limitem, základními cenami a statistikami.

`InventorySystem` pracuje čistě a neměnně. Transakce nejprve ověří zásoby, hotovost, nosnost a stacky a teprve potom vytvoří nový stav. Funkce `getItemTradePrice` je společná pro zobrazenou cenu i skutečný nákup/prodej, takže UI nemůže účtovat jinou částku, než kterou ukazuje.

`EconomyStore` drží jeden runtime `EconomyState`. `InventoryUiController` otevře běžný batoh kdekoli, ale obchod dovolí pouze tehdy, když `NpcManager` hlásí Kateřinu jako nejbližší interaktivní NPC. Otevřený panel pozastaví Arcade Physics a klávesové vstupy scény.

## Pověst a sociální ceny

`ReputationSystem` drží tři nezávislé hodnoty v rozsahu −100 až +100:

- `peasants` — sedláci,
- `townsfolk` — měšťané,
- `nobility` — šlechta.

Hodnota se mapuje na pět úrovní: hostile, distrusted, neutral, respected a honored. Změny jsou neměnné, zaokrouhlené a omezené na platný rozsah.

Dokončení „První oceli“ publikuje jednu questovou událost. `ReputationController` aplikuje odměnu +15/+8/+2, zobrazí zprávu a použije existující serializovaný save požadavek.

Kateřininy ceny vycházejí z měšťanské pověsti a charisma vybavení. Výpočet omezuje nákupní i prodejní násobek na bezpečné hranice, aby ani extrémní reputace nevytvořila nulovou cenu nebo ekonomický exploit.

## Stav hry a persistence

Persistence je oddělena přes `SaveSystem` a `AsyncSaveStore`.

- IndexedDB databáze `chronicles-of-bohemia` je primární úložiště.
- Object store `saves` obsahuje záznam `primary`.
- localStorage klíč `chronicles-of-bohemia.save.v4` slouží pouze jako fallback.
- Legacy klíče verzí 1, 2 a 3 se při načtení migrují do verze 4.
- Save verze 4 ukládá hráče, quest, čas světa, ekonomiku, tři reputační hodnoty a ISO čas posledního zápisu.
- Validátor kontroluje ekonomická data a celočíselnou reputaci v rozsahu −100 až +100.
- Načtení obnoví `EconomyStore` i `ReputationStore` před odemčením ovládání.
- Autosavy jsou serializované jedním promise řetězcem.
- Každá ekonomická nebo reputační změna vyvolá okamžitý save požadavek.

Další rozšíření save formátu musí zvýšit `CURRENT_SAVE_VERSION`, přidat migrační větev a regresní test zachovávající všechny dřívější formáty.

## Výkon

Pixel-art textury jsou nyní generované za běhu. Produkční assety budou atlasované. Fyzika používá Arcade Physics a statické kolize. Inventářový DOM se překresluje pouze při ekonomické, reputační nebo kontextové změně, nikoli v herní smyčce.

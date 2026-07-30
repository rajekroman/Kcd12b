# Alchemy and Smithing

## Rozsah milníku M4.3

Řemeslný systém rozšiřuje existující inventář a ekonomiku. Nevytváří paralelní databázi surovin ani vlastní save formát. Všechny vstupy i výstupy jsou standardní `ItemId` a ukládají se v ekonomické části save verze 5.

## Stanice

`src/data/crafting.ts` definuje dvě stanice:

- `alchemy` — Anežčin bylinkářský stůl,
- `forge` — Bohdanova kovárna.

Stanice je dostupná pouze tehdy, když `data-near-npc` odpovídá příslušnému NPC. Systém proto respektuje skutečnou pozici a denní rozvrh řemeslníka. Mimo interakční dosah se panel neotevře a zveřejní vysvětlující stav.

## Recepty

První sada obsahuje pět datově definovaných receptů:

### Alchymie

- **Bylinný obklad** — 2× léčivé byliny + 1× čistý obvaz → 1× bylinný obklad.
- **Konzervovaná zvěřina** — 1× srnčí zvěřina + 1× léčivé byliny → 1× konzervovaná zvěřina.

### Kovářství

- **Kožené řemeny** — 1× srnčí kůže → 2× kožené řemeny.
- **Kalený Bohdanův meč** — 1× Bohdanův meč + 1× železný ingot → 1× kalený meč.
- **Vyztužená prošívanice** — 1× prošívanice + 2× řemeny + 1× ingot → 1× vyztužená prošívanice.

Každý recept určuje stabilní ID, stanici, popis, seznam vstupů a seznam výstupů.

## Atomická výroba

`src/systems/CraftingSystem.ts` je čistý systém bez DOM a Phaser závislostí. `craftRecipe` pracuje nad hlubokou kopií inventáře:

1. ověří dostupnost všech surovin,
2. odebere vstupy z pracovní kopie,
3. přidá všechny výstupy přes standardní `addItem`,
4. vrátí nový inventář pouze po úplném úspěchu.

Pokud chybí poslední surovina, výstup překročí stack nebo výsledná hmotnost překročí nosnost, funkce vrátí chybu a původní inventář zůstane beze změny.

`removeItem` současně zajišťuje, že spotřebovaná vybavená položka uvolní příslušný equipment slot. Kalení vybaveného Bohdanova meče proto nezanechá slot odkazující na již neexistující předmět.

## Validace receptu

`getCraftingValidation` vrací pro UI:

- autoritativní definici receptu,
- požadované množství každé suroviny,
- skutečně dostupné množství,
- příznak dostatečnosti,
- `canCraft`,
- konkrétní chybu inventáře.

UI nepřepočítává pravidla samostatně. Tlačítko je aktivní pouze tehdy, když stejný systém dokáže recept skutečně provést.

## Uživatelské rozhraní

`CraftingUiController` spravuje samostatný DOM panel:

- klávesa C na desktopu,
- dotykové tlačítko Řemeslo na mobilu,
- kontextový název stanice,
- hmotnost batohu,
- výstupy a suroviny s poměrem dostupné/požadované,
- deaktivované tlačítko s důvodem blokace,
- živou stavovou zprávu.

Během otevření controller pozastaví Arcade Physics a vypne Phaser keyboard input. Capture handler zachytí Escape a C před inventářem a bojovými vstupy, takže se panely ani akce nepřekrývají. Po zavření se fyzika a klávesnice obnoví.

## Persistence

Po úspěšné výrobě controller:

1. aktualizuje EconomyStore,
2. nastaví `data-last-craft`,
3. vyšle `ECONOMY_CHANGED`,
4. použije existující serializovanou save frontu GameScene.

Výrobek, spotřebované suroviny i uvolněný equipment slot se uloží do stejného IndexedDB záznamu verze 5. Není nutná další migrace save, protože nové položky používají stávající validovaný formát ekonomiky.

## Veřejný runtime stav

Panel zveřejňuje:

- `data-crafting-open`,
- `data-crafting-available`,
- `data-crafting-station`,
- `data-crafting-message`,
- `data-last-craft`.

Jednotlivé karty používají `data-recipe` a `data-craftable`.

## Validace

Jednotkové testy ověřují:

- úplnost stanic a receptů,
- mapování NPC,
- atomickou výrobu,
- nezměněný vstup při chybě,
- stack a nosnost,
- uvolnění equipment slotu,
- přesné ingredienční stavy.

Playwright na desktopu i mobilu ověřuje Anežčinu a Bohdanovu stanici, výrobu obkladu a kaleného meče, viditelný inventář, statistiky výrobku, save verze 5, reload a pokus mimo stanici.

## Současná omezení

- Recepty jsou dostupné okamžitě a nemusí se objevovat učením nebo knihami.
- Výroba nemá čas, zkušenost, kvalitu ani pravděpodobnost selhání.
- Chybí krokové minihry pro drcení, vaření, kování a kalení.
- Vybavení nemá opotřebení ani opravy.
- Stanice jsou kontextově spojeny s NPC, nikoli s vlastním světovým objektem.
- Alchymie zatím nevyrábí jedy, oleje ani dlouhodobé buffy.

# Hunting and Fauna

## Rozsah milníku M4.2

Milník přidává první lovnou faunu do stejného světa, bojového systému, inventáře a save řetězce. Nevytváří paralelní minihru ani druhou ekonomiku.

## Druhy a spawny

`src/data/fauna.ts` definuje:

- zajíce `hare-north`,
- srnce `roe-east`,
- kance `boar-south`.

Každý druh má zdraví, rychlost, vzdálenost útěku, intervaly denní aktivity, rozměr kolizního těla a seznam kořisti. Každý spawn má stabilní ID, výchozí souřadnice a poloměr teritoria.

## Vizuální atlasy

`FaunaAtlasSystem` vytváří pro každý druh atlas 24 × 18 px s pěti frame stavy:

1. `idle`,
2. `walk-a`,
3. `walk-b`,
4. `hurt`,
5. `dead`.

Zajíc má dlouhé uši a světlý ocas, srnec štíhlé nohy a parůžky, kanec široké tělo, hřbetní štětiny a kel. Atlasy nejsou přebarvením jednoho společného zvířete.

## Aktivita a pohyb

Každý druh používá vlastní aktivní hodiny. Mimo ně je sprite neaktivní, neviditelný a jeho fyzické tělo je vypnuté. Aktivní zvěř se deterministicky pohybuje po teritoriu. Směr toulání vzniká ze stabilního ID a časového bucketu, nikoli z náhodného generátoru.

Při přiblížení hráče se zvíře pohybuje přímo od něj. Základní vzdálenost útěku se upravuje podle `data-weather-visibility`; déšť a bouře proto umožní přiblížit se blíže.

## Potvrzený útok

Původní událost `ATTACK` znamená požadavek vstupu a může vzniknout z klávesnice, mobilu nebo jednosnímkového fallbacku. Není sama o sobě důkazem, že GameScene útok přijala.

`ConfirmedAttackController` zaznamená výdrž před vstupem a po dvou animačních snímcích potvrdí útok pouze tehdy, když skutečně klesla. Potom publikuje `PLAYER_ATTACKED` s:

- pozicí hráče,
- normalizovaným vektorem zvoleného směru,
- skutečně odvozeným poškozením,
- dosahem zbraně.

Stejnou autoritativní událost používá animace hráče i lov, takže nedostatek výdrže, cooldown, blok nebo otevřený dialog nevytvoří falešný zásah.

## Zásah

`resolveHuntingHit` je čistá funkce. Zásah vyžaduje současně:

- vzdálenost menší nebo rovnou dosahu,
- kladné poškození,
- dostatečný skalární součin mezi směrem útoku a směrem k cíli.

Pokud zdraví klesne na nulu, výsledek je `killed`; jinak `hit`. Nejbližší platný cíl má přednost.

## Kořist a ekonomika

Kořist používá standardní `ItemId` a `InventorySystem`:

- zaječí maso,
- srnčí zvěřina,
- srnčí kůže,
- kančí maso,
- kančí kůže.

`addHuntingLoot` přidává celý balík do pracovní kopie inventáře. Pokud kterýkoli krok překročí nosnost nebo stack limit, vrátí chybu a původní inventář zůstane beze změny. Zvíře není označeno jako ulovené, dokud není možné uložit celý balík.

Po úspěchu se aktualizuje EconomyStore, vyšle se `ECONOMY_CHANGED` a použije se stejná serializovaná save fronta jako u obchodu, spotřeby a vybavení.

## Persistence

Save verze 5 rozšiřuje svět o:

```ts
world: {
  dayClock: number;
  huntedAnimals: AnimalId[];
}
```

FaunaStore deduplikuje a řadí ulovená ID. SaveSystem:

- automaticky připojí aktuální store při ukládání,
- obnoví store při načtení,
- resetuje ho při smazání save,
- odmítne neznámá nebo duplicitní ID,
- migruje verze 1–4 s prázdným seznamem.

HuntingController při vytvoření porovná spawny se storem a ulovené kusy deaktivuje. Kořist zůstává v ekonomické části téhož save.

## Veřejný runtime stav

Controller zveřejňuje:

- `data-fauna-atlases`,
- `data-fauna-count`,
- `data-fauna-species`,
- `data-fauna-snapshot`,
- `data-hunted-animals`.

Snapshot obsahuje ID, druh, zdraví, aktivitu, stav smrti a zaokrouhlenou pozici. Slouží E2E validaci, ne jako autoritativní herní úložiště.

## Validace

Jednotkové testy ověřují:

- úplnost druhů a spawnů,
- všech 15 fauna frameů a jejich hranice,
- rozdílné animační siluety,
- denní aktivitu,
- vliv viditelnosti na útěk,
- směr a dosah zásahu,
- atomickou kořist,
- serializaci ulovených ID,
- save verzi 5 a migrace 1–4.

Playwright na desktopu i mobilu ověřuje útěk zajíce, potvrzené usmrcení, viditelnou kořist v batohu, záznam v IndexedDB a reload bez respawnu nebo duplikace.

## Současná omezení

- Každý druh má zatím jeden kus a neexistuje populační respawn.
- Kanec zatím pouze prchá a nezaútočí.
- Chybí luk, šípy, pasti, stopování a hluk.
- Kořist se přidá okamžitě bez stahování nebo porcování.
- Maso nemá čerstvost ani kažení.
- Zvěř používá přímý Arcade Physics pohyb bez pathfindingu a vyhýbání překážkám.

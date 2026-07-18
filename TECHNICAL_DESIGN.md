# Technical Design

## Architektura

- `game/scenes`: boot, menu, svět a UI.
- `systems`: čistá doménová logika questů, ukládání a souboje.
- `core/EventBus`: oddělení herní scény a UI.
- `tests`: jednotkové regresní testy.
- `e2e`: browserové scénáře proti produkčnímu buildu v GitHub Pages podadresáři.

## Stav hry a persistence

Herní stav je zatím vlastněn scénou, ale persistence je oddělena přes `SaveSystem` a `AsyncSaveStore`.

- IndexedDB databáze `chronicles-of-bohemia` je primární úložiště.
- Object store `saves` obsahuje záznam `primary`.
- localStorage klíč `chronicles-of-bohemia.save.v2` slouží pouze jako fallback.
- Legacy klíč `chronicles-of-bohemia.save.v1` se při načtení migruje na verzi 2.
- Save verze 2 ukládá hráče, quest, čas světa a ISO čas posledního zápisu.
- Autosavy jsou serializované jedním promise řetězcem.
- Ovládání je při pokračování uzamčené do dokončení validace a migrace.

Další rozšíření save formátu musí zvýšit `CURRENT_SAVE_VERSION`, přidat migrační větev a regresní test zachovávající všechny dřívější formáty.

## Výkon

Pixel-art textury jsou nyní generované za běhu. Produkční assety budou atlasované. Fyzika používá Arcade Physics a statické kolize.

# Technical Design

## Architektura

- `game/scenes`: boot, menu, svět a UI.
- `systems`: čistá doménová logika questů, ukládání a souboje.
- `core/EventBus`: oddělení herní scény a UI.
- `tests`: jednotkové regresní testy.

## Stav hry

První verze používá lokální stav scény a verzované ukládání do `localStorage`. Další fáze přesune dlouhodobý stav do centrálního modelu a IndexedDB.

## Výkon

Pixel-art textury jsou nyní generované za běhu. Produkční assety budou atlasované. Fyzika používá Arcade Physics a statické kolize.

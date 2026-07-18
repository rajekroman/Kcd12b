# Development Status

## Aktuální fáze

M1.2 Data-driven content — dokončeno a ověřeno. GitHub Actions úspěšně provedl instalaci závislostí, lint, TypeScript, jednotkové testy, produkční build a osm Playwright E2E scénářů na desktopovém a mobilním profilu včetně výběru konkrétního datového dialogového uzlu.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a malá testovací oblast.
- Quest „První ocel“ je definován daty: stav, objektivy, podmínky a přechody.
- Bohdanovy dialogy jsou definovány daty s prioritou, podmínkami a deklarativními efekty.
- Generický quest engine aplikuje události bez hardcoded větvení ve scéně.
- Generický dialogue engine vybírá uzel podle NPC a kontextu.
- Pět směrů útoku, směrový kryt, dokonalý kryt a úhyb.
- Telegrafované nepřátelské útoky kontrolují dosah v okamžiku dopadu.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 2 s migrací legacy verze 1.
- Ukládání hráče, questu a fáze denního cyklu.
- Serializované autosavy bez závodu staršího a novějšího zápisu.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Grafika je procedurální placeholder.
- Hudba a ambient ještě nejsou implementované.
- Svět zatím obsahuje pouze jedno plně interaktivní NPC.
- Quest state je stále jeden aktivní quest; vícequestový journal přijde s dalším rozšířením obsahu.

## Další tři priority

1. Přidat 10 NPC a jejich denní režimy.
2. Přidat inventář, vybavení a obchod.
3. Přidat pověst pro sedláky, měšťany a šlechtu.

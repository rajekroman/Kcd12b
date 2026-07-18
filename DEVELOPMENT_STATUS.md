# Development Status

## Aktuální fáze

M1.1 Persistence — dokončeno a ověřeno. GitHub Actions úspěšně provedl instalaci závislostí, lint, TypeScript, jednotkové testy, produkční build a šest Playwright E2E scénářů na desktopovém a mobilním profilu včetně skutečné migrace do IndexedDB.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a malá testovací oblast.
- Kovář Bohdan, dialog a quest „První ocel“ bez softlocku při změně pořadí událostí.
- Pět směrů útoku a směrový kryt nepřítele.
- Kryt, chybný kryt, dokonalý kryt, prolomení krytu a úhyb.
- Telegrafované nepřátelské útoky kontrolují dosah znovu v okamžiku dopadu.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 2 s migrací legacy verze 1.
- Ukládání hráče, questu a fáze denního cyklu.
- Serializované autosavy bez závodu staršího a novějšího zápisu.
- Asynchronní menu a pozastavení ovládání do obnovení save.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.
- Veřejný npm lockfile bez interních Artifactory URL.

## Známé limity

- Grafika je procedurální placeholder.
- Hudba a ambient ještě nejsou implementované.
- Dialogy a questy jsou zatím částečně zapsané přímo v herní scéně.

## Další tři priority

1. Převést dialogy a questy na datově řízené definice.
2. Přidat 10 NPC a jejich denní režimy.
3. Přidat inventář, vybavení a obchod.

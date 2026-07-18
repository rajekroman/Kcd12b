# Development Status

## Aktuální fáze

M1 Combat — dokončeno a ověřeno. GitHub Actions úspěšně provedl instalaci závislostí, lint, TypeScript, jednotkové testy, produkční build, instalaci Chromia a čtyři Playwright E2E scénáře na desktopovém a mobilním profilu.

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
- Výdrž, zdraví, porážka hráče a únik z nepřátelského nápřahu.
- Synchronizovaný životní cyklus `GameScene` a `UIScene`.
- Automatické ukládání a načítání.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.
- Veřejný npm lockfile bez interních Artifactory URL.

## Známé limity

- Grafika je procedurální placeholder.
- Hudba a ambient ještě nejsou implementované.
- Save systém stále používá `localStorage`; migrace na IndexedDB je další systémový milník.

## Další tři priority

1. Převést save systém na IndexedDB s verzovanými migracemi a fallbackem.
2. Převést dialogy a questy na datově řízené definice.
3. Přidat 10 NPC a jejich denní režimy.

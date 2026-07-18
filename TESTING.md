# Testing

## Lokální kontroly

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

## Jednotkové testy

Vitest ověřuje mimo jiné:

- nosnost a výpočet hmotnosti inventáře,
- maximální stacky a odmítnutí neplatného množství,
- vybavení a uvolnění tří slotů,
- součet bonusu útoku, zbroje a charisma,
- atomický nákup a prodej,
- hotovost hráče i obchodníka,
- prodej posledního vybaveného kusu,
- použití léčivého předmětu,
- validaci ekonomického save stavu,
- migrace save verzí 1 a 2 do verze 3.

## E2E

E2E testy pracují nad produkčním buildem obsluhovaným pod `/Kcd12b/`, tedy ve stejné cestě, jakou používá GitHub Pages.

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright ověřuje na desktopovém Chromium profilu i mobilní emulaci iPhone 14:

- přechod menu → hra,
- aktivaci a synchronizaci `UIScene`,
- asynchronní připravenost menu a save systému,
- počáteční HUD, ekonomiku a deset NPC,
- otevření a zavření inventáře,
- mobilní tlačítko Batoh,
- startovní groše, váhu a vybavený meč,
- použití obvazu a obnovení zdraví,
- okamžitý save po spotřebě předmětu,
- dostupnost obchodu pouze u Kateřiny,
- nákup dřevorubecké sekery,
- změnu grošů a zásob,
- vybavení koupené zbraně,
- zápis ekonomiky do IndexedDB save verze 3,
- volbu směru útoku, kryt a úhyb,
- datově řízené dialogy a denní režimy NPC,
- migraci legacy save verze 1 do verze 3,
- odstranění legacy localStorage klíče.

Při selhání GitHub Actions uchová na tři dny HTML report, trace a `test-results` jako artefakt `playwright-diagnostics`.

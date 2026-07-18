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

- reputační rozsah −100 až +100,
- hranice pěti reputačních úrovní,
- jednorázovou událost dokončení questu,
- hromadné reputační změny,
- nákupní a prodejní násobky podle pověsti a charisma,
- shodu zobrazené ceny a skutečné transakce,
- reputačně podmíněné dialogové uzly,
- nosnost a výpočet hmotnosti inventáře,
- maximální stacky a odmítnutí neplatného množství,
- vybavení a uvolnění tří slotů,
- atomický nákup a prodej,
- použití léčivého předmětu,
- validaci ekonomického a reputačního save stavu,
- migrace save verzí 1, 2 a 3 do verze 4.

## E2E

E2E testy pracují nad produkčním buildem obsluhovaným pod `/Kcd12b/`, tedy ve stejné cestě, jakou používá GitHub Pages.

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright ověřuje na desktopovém Chromium profilu i mobilní emulaci iPhone 14:

- přechod menu → hra,
- počáteční HUD, ekonomiku, neutrální pověst a deset NPC,
- otevření inventáře a tři reputační karty,
- mobilní tlačítko Batoh,
- použití obvazu a obnovení zdraví,
- okamžitý save po spotřebě předmětu,
- neutrální nákup a vybavení zbraně,
- ctěný Kateřinin dialog při měšťanské pověsti 60,
- zlevnění sekery z 82 na 73 grošů,
- dokončení „První oceli“ přes Bohdanův dialog,
- reputační odměnu +15/+8/+2,
- zápis reputace do IndexedDB save verze 4,
- volbu směru útoku, kryt a úhyb,
- migraci legacy save verze 1 do verze 4.

Při selhání GitHub Actions uchová na tři dny HTML report, trace a `test-results` jako artefakt `playwright-diagnostics`.

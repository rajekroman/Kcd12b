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

- zorný kužel, dosah, úhel a floating-point hranice,
- růst, prahy a úplný rozpad podezření,
- rozdělení dne na úsvit, den, soumrak a noc,
- prioritu hudebních nálad podezření a poplachu,
- cílový mix pěti WebAudio vrstev,
- délku hudebního kroku podle tempa a rytmu,
- reputační rozsah −100 až +100,
- hranice pěti reputačních úrovní,
- jednorázovou událost dokončení questu,
- nákupní a prodejní násobky podle pověsti a charisma,
- reputačně podmíněné dialogové uzly,
- nosnost, stacky, vybavení a atomické transakce,
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
- otevření inventáře a reputační karty,
- použití obvazu a okamžitý save,
- nákup, sociální cenu a vybavení zbraně,
- reputačně podmíněné dialogy a questovou odměnu,
- zápis reputace do IndexedDB save verze 4,
- volbu směru útoku, kryt, úhyb a krátké jednorázové klávesy,
- hráče za Vojtěchem mimo zorný kužel,
- přechod do podezření a poplachu,
- fyzický únik z dosahu a návrat podezření na nulu,
- uzamčené WebAudio před uživatelským gestem,
- odemčení a ztlumení hudby tlačítkem,
- obnovení hudby klávesou M,
- denní a noční motiv podle uloženého času,
- adaptivní přechod hudby do Podezření a Poplachu,
- migraci legacy save verze 1 do verze 4.

Při selhání GitHub Actions uchová na tři dny HTML report, trace a `test-results` jako artefakt `playwright-diagnostics`.

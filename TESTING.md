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

- tři fauna druhy a tři stabilní spawny,
- všech 15 fauna frameů v rámci 24 × 18 px,
- rozdílnou chůzi, zranění a smrt zvířat,
- druhově specifickou denní aktivitu,
- zkrácení detekční vzdálenosti při nižší viditelnosti,
- směrový a dosahový lovný zásah,
- smrtící zásah, kořist, stack limity a nosnost,
- atomické odmítnutí celé kořisti při nedostatku místa,
- deduplikaci a stabilní serializaci ulovených ID,
- save verzi 5 a migrace verzí 1–4,
- validaci neznámých a duplicitních ulovených kusů,
- normalizaci světové hodiny a počasí,
- portrétní a charakterové atlasy,
- questové a reputační dialogy,
- boj, stealth, hudbu a ekonomiku.

## E2E

E2E testy běží nad produkčním buildem pod cestou `/Kcd12b/` na desktopovém Chromium profilu i mobilní emulaci iPhone 14.

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright ověřuje mimo jiné:

- registraci tří fauna atlasů a tří world spawnů,
- denní aktivitu zajíce,
- skutečný útěk po přiblížení hráče,
- potvrzený útok a usmrcení zajíce,
- přidání zaječího masa do viditelného inventáře,
- zápis `huntedAnimals` a kořisti do IndexedDB save verze 5,
- reload bez respawnu uloveného kusu a bez duplikace kořisti,
- migraci legacy save verzí 1, 2 a 4 do verze 5,
- jasno, zataženo, déšť a bouři,
- portrétní výrazy a charakterové animace,
- questy, obchod, reputaci, stealth a WebAudio.

Workflow vždy ukládá `typecheck-diagnostics` s přesným výstupem TypeScriptu. Při browserovém selhání uchová na tři dny HTML report, trace a `test-results` jako artefakt `playwright-diagnostics`.

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

- normalizaci světové hodiny,
- deterministické hranice jasno, zataženo, déšť a bouře,
- parametry srážek, mokra, větru a viditelnosti,
- světelné fáze noc, úsvit, den a soumrak,
- dvoufázový bouřkový záblesk,
- deset portrétních identit a všech 60 výrazových frameů,
- všech 72 charakterových frameů,
- questové a reputační dialogy,
- pohybové a bojové animace,
- stealth geometrii a podezření,
- adaptivní hudební rozhodování,
- ekonomiku a save migrace.

## E2E

E2E testy běží nad produkčním buildem pod cestou `/Kcd12b/` na desktopovém Chromium profilu i mobilní emulaci iPhone 14.

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright ověřuje mimo jiné:

- jasno a suchý povrch při uloženém úsvitu,
- zatažené dopoledne bez srážek,
- odpolední déšť, hustotu kapek, mokro a viditelnost,
- bouři za soumraku, maximální srážky a bleskový stav,
- obnovení počasí pouze z uloženého světového času,
- portrétní výrazy Bohdana a reputační varianty Kateřiny,
- charakterové atlasy a animaci hráče,
- questy, inventář, obchod a reputaci,
- stealth stav, poplach a únik z dosahu,
- WebAudio odemčení, denní motivy a adaptaci,
- migraci legacy save do verze 4.

Při selhání GitHub Actions uchová na tři dny HTML report, trace a `test-results` jako artefakt `playwright-diagnostics`.

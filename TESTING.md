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

- deset unikátních portrétních identit a šest výrazů,
- všech 60 portrétních frameů v celočíselném rámci 48 × 56 px,
- hustotu a unikátnost portrétních atlasů,
- rozdíly obočí, očí a úst mezi jednotlivými emocemi,
- explicitní výraz každého produkčního dialogu,
- výběr Bohdanova výrazu podle questu,
- výběr Kateřinina výrazu podle reputace,
- stabilní lookup dialogu podle `dialogueId`,
- všech 72 charakterových frameů v rámci 20 × 28 px,
- pohybové a bojové animace postav,
- stealth geometrii a podezření,
- adaptivní hudební rozhodování,
- reputaci, ekonomiku, questy a save migrace.

## E2E

E2E testy běží nad produkčním buildem pod cestou `/Kcd12b/` na desktopovém Chromium profilu i mobilní emulaci iPhone 14.

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright ověřuje mimo jiné:

- registraci deseti portrétních atlasů a šesti výrazů,
- Bohdanův přísný portrét při zadání úkolu,
- Kateřinin hrdý portrét při vysoké pověsti,
- Kateřinin nedůvěřivý portrét při nízké pověsti,
- slovní popis emoce v přístupném statusu,
- charakterové atlasy a animaci hráče,
- questy, inventář, obchod a reputaci,
- stealth stav, poplach a únik z dosahu,
- WebAudio odemčení, denní motivy a adaptaci,
- migraci legacy save do verze 4.

Při selhání GitHub Actions uchová na tři dny HTML report, trace a `test-results` jako artefakt `playwright-diagnostics`.

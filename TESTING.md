# Testing

## Lokální kontroly

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

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
- počáteční HUD a questový cíl,
- volbu směru útoku,
- kryt a uvolnění krytu,
- úhyb a spotřebu výdrže,
- detekci legacy save verze 1,
- migraci localStorage → IndexedDB verze 2,
- odstranění legacy klíče,
- obnovení zdraví, výdrže a questového cíle přes Pokračovat.

Při selhání GitHub Actions uchová na tři dny HTML report, trace a `test-results` jako artefakt `playwright-diagnostics`.

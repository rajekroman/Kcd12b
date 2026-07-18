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

Playwright ověřuje:

- desktopový Chromium profil,
- mobilní emulaci iPhone 14 v Chromiu,
- přechod menu → hra,
- aktivaci a synchronizaci `UIScene`,
- počáteční HUD a questový cíl,
- volbu směru útoku,
- kryt a uvolnění krytu,
- úhyb a spotřebu výdrže.

Při selhání GitHub Actions uchová na tři dny HTML report, trace a `test-results` jako artefakt `playwright-diagnostics`.

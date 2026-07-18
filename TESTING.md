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

```bash
npx playwright install chromium webkit
npm run test:e2e
```

E2E testy ověřují desktopový Chromium a mobilní profil Safari.

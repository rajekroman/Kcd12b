# PROJECT_CONTROL.md

Tento dokument je autoritativní přehled řízení projektu. Aktualizuje jej pouze A0 po ověření skutečného stavu GitHub issues, větví, pull requestů, CI a HANDOFFů.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Poslední feature merge: **issue #36 / PR #43 — first horse gameplay vertical slice**
- Aktivní milník: **M4.6 Horse Mobile UX + controlled asset checkpoint**
- Prioritní implementační vlastník: **A5 / issue #37**
- Paralelní omezený vlastník: **A4 / issue #25 / PR #44**

## 2. Stavový model

`BACKLOG → READY → ACTIVE → RUNNING → DRAFT → REVIEW → MERGED`

Při ověřené blokaci:

`RUNNING nebo REVIEW → BLOCKED → READY nebo RUNNING`

Stav se odvozuje ze skutečného GitHubu. Samotný commit, komentář nebo tvrzení agenta není důkazem dokončení.

## 3. Stav agentů A0–A8

| Agent | Issue | Větev | Přidělený feature base | PR | Stav | Poslední ověřený výsledek | Další krok |
|---|---:|---|---|---:|---|---|---|
| A0 | — | `main` | — | — | ACTIVE | A2 merged; A4/A5 lanes řízeny odděleně | chránit scope a integrační pořadí |
| A1 | #35 | `agent/horse-runtime-contract` | `766c2eff...` | #41 | MERGED | merge `ba5c0c20...` | standby; pouze eskalované contract fixy |
| A2 | #36 | `agent/first-horse-gameplay` | `ba5c0c20...` | #43 | MERGED | merge `77f8c11d...`, workflow `30600172375` SUCCESS | standby; pouze eskalované gameplay fixy |
| A3 | #24 | `agent/horse-world-content-contract` | — | #34 | MERGED | merge `e988e5e1...` | žádná nová práce bez issue |
| A4 | #25 | `agent/pixel-atlas-asset-pipeline` | `4ea0d020...` | #44 | ACTIVE-PARALLEL | head `d31799bd...`; inventura/manifest/validace; CI `30602734078` běží | dokončit CI; nepřekročit omezený checkpoint |
| A5 | #37 | `agent/horse-mobile-ui` | `77f8c11d...` | — | ACTIVE | větev bez implementačního commitu | baseline, read-only view-model, draft PR |
| A6 | #26 | `agent/audio-mixer-sfx-foundation` | přidělí A0 po A4 gate | — | BLOCKED | závisí na A4 | čekat na A4 merge a nový base |
| A7 | #38 | `agent/horse-qa-gate` | přidělí A0 po #37 | — | BLOCKED | QA kontrakt připraven | čekat na merge A5 |
| A8 | #27 | `agent/release-production-gate` | přidělí A0 po A6/A7 | — | BLOCKED | release kontrakt připraven | čekat na A6/A7 |

## 4. Aktivní integrační pořadí

Prioritní horse fronta:

1. **A5 #37** — read-only horse view-model, HUD, safe-area a input presentation.
2. **A7 #38** — nezávislá QA brána po merge A5.
3. **A0** — integrační rozhodnutí horse milestone.

Kontrolovaná paralelní asset fronta:

1. **A4 #25 / PR #44** — pouze inventura, typovaný manifest, validátor, cílené testy a `validate:assets` script.
2. **A4 runtime preload/export migrace** — BLOKOVÁNA do dalšího explicitního A0 gate.
3. **A6 #26** — až po dokončení A4 a novém A0 base.
4. **A8 #27** — až po A6 a finálním QA.

## 5. Integrované balíky prvního koně

### A3 #24 / PR #34 — obsahový kontrakt

- merge: `e988e5e16f7e248df9b80cd28c91a9715891e299`;
- workflow `30518698707`: SUCCESS.

### A1 #35 / PR #41 — runtime command/event kontrakt

- merge: `ba5c0c202a73edc542c1803f9a3755f3fc57d37a`;
- workflow `30553991420`: SUCCESS.

### A2 #36 / PR #43 — gameplay vertical slice

- merge: `77f8c11dc81704ca7e716fa98e23c1818bb30d40`;
- finální head: `fcfbe40c7855fdb6b3b5834e105b04fb3d90494d`;
- workflow `30600172375`: SUCCESS;
- unit: 146 PASS;
- Playwright: 98 PASS / 1 existující desktop skip;
- evidence artifact `8781640544`;
- digest `e5a30856012e5bb74886a0eb560275f3c15b5467ced9cc0234cf23ca573f3905`.

## 6. Aktivní A5 #37

A5 smí měnit presentation/UI vrstvy, cílené scénové presentation wiring, styly a odpovídající testy. Horse stav musí pouze číst z autoritativního snapshotu / confirmed eventů.

První povinný checkpoint:

1. baseline lint/typecheck/unit/build/Playwright;
2. malý implementační commit;
3. draft PR `Refs #37`;
4. read-only HUD/view-model seam;
5. cílené testy a stabilní `data-*` selektory;
6. A0 scope review před layout/touch wiringem.

Zakázány jsou změny A1 kontraktu, orchestrátoru, `src/gameplay/**` pravidel, mount physics, trial pravidel, persistence, save verze, assetů a audia.

## 7. Aktivní omezený A4 #25 / PR #44

Aktuální povolené cesty:

- `src/data/assetManifest.ts`;
- `src/systems/AssetManifestValidator.ts`;
- `src/tests/AssetManifest.test.ts`;
- `scripts/validate-assets.mjs`;
- `package.json` pouze pro `validate:assets`.

Do dalšího A0 gate jsou zakázány BootScene/preload/runtime wiring, PNG produkční export, `src/game/**`, horse HUD, gameplay, save, audio, Playwright config a sdílené E2E helpery.

PR #44 musí zůstat DRAFT. Merge není povolen bez kompletně zeleného CI, scope review a synchronizace s aktuálním `main`.

## 8. Konfliktní oblasti

V jednom integračním okně mají jediného vlastníka:

- `src/main.ts`;
- `src/game/config.ts`;
- `src/contracts/**`;
- `src/application/HorseRuntimeOrchestrator.ts`;
- `src/gameplay/**` horse runtime;
- globální input orchestrace;
- `src/stores/**` a save schema/migrace;
- `playwright.config.*` a sdílené E2E helpery;
- `.github/workflows/**`;
- `package.json`, `vite.config.*`;
- asset manifest;
- audio registry;
- `docs/PROJECT_CONTROL.md`.

Výjimka pro A4: `package.json` je dočasně povolen výhradně pro jediný script `validate:assets`; A5 nesmí `package.json` měnit bez A0 eskalace.

## 9. Bezprostřední další krok

### A5

Dodat první read-only view-model checkpoint a draft PR bez gameplay změn.

### A4

Dokončit CI na headu `d31799bd6d1024b7573f9ab3b6015e8d9a60053a`; nepřidávat runtime/preload změny. Po výsledku CI provede A0 scope gate.

### A7

Zůstává BLOCKED do merge A5.

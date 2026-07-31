# PROJECT_CONTROL.md

Tento dokument je autoritativní přehled řízení projektu. Aktualizuje jej pouze A0 po ověření skutečného stavu GitHub issues, větví, pull requestů, CI a HANDOFFů.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Main před touto řídicí aktualizací: `77f8c11dc81704ca7e716fa98e23c1818bb30d40`
- Poslední feature merge: **issue #36 / PR #43 — first horse gameplay vertical slice**
- Aktivní milník: **M4.6 Horse Mobile UX**
- Aktivní implementační vlastník: **A5 / issue #37**

## 2. Stavový model

`BACKLOG → READY → ACTIVE → RUNNING → DRAFT → REVIEW → MERGED`

Při ověřené blokaci:

`RUNNING nebo REVIEW → BLOCKED → READY nebo RUNNING`

Stav se odvozuje ze skutečného GitHubu. Samotný commit, komentář nebo tvrzení agenta není důkazem dokončení.

## 3. Stav agentů A0–A8

| Agent | Issue | Větev | Přidělený feature base | PR | Stav | Poslední ověřený výsledek | Další krok |
|---|---:|---|---|---:|---|---|---|
| A0 | — | `main` | — | — | ACTIVE | PR #43 sloučen jako `77f8c11d...` | řídit A5 a následně A7 |
| A1 | #35 | `agent/horse-runtime-contract` | `766c2eff...` | #41 | MERGED | merge `ba5c0c20...`, workflow `30553991420` SUCCESS | standby; pouze eskalované contract fixy |
| A2 | #36 | `agent/first-horse-gameplay` | `ba5c0c20...` | #43 | MERGED | merge `77f8c11d...`, workflow `30600172375` SUCCESS | standby; pouze eskalované gameplay fixy |
| A3 | #24 | `agent/horse-world-content-contract` | — | #34 | MERGED | merge `e988e5e1...`, workflow `30518698707` SUCCESS | žádná nová práce bez issue |
| A4 | #25 | `agent/pixel-atlas-asset-pipeline` | zastaralý `55feadb0...` | — | BLOCKED | issue otevřené, base neplatný | čekat na nové A0 integrační okno |
| A5 | #37 | `agent/horse-mobile-ui` | `77f8c11d...` | — | ACTIVE | větev vytvořena A0 z merge #43 | baseline a malý draft PR |
| A6 | #26 | `agent/audio-mixer-sfx-foundation` | zastaralý `55feadb0...` | — | BLOCKED | issue otevřené, závisí na #25 | čekat na A4 a nový A0 base |
| A7 | #38 | `agent/horse-qa-gate` | přidělí A0 po #37 | — | BLOCKED | QA kontrakt připraven | čekat na merge A5 |
| A8 | #27 | `agent/release-production-gate` | zastaralý `55feadb0...` | — | BLOCKED | issue otevřené, závisí na #26 a finálním QA | čekat na A6/A7 a nový A0 base |

## 4. Aktivní integrační pořadí

1. **A5 #37** — mobilní jezdecké UI, HUD, safe-area a input presentation.
2. **A7 #38** — nezávislá QA brána po merge A5.
3. **A0** — finální integrační rozhodnutí jezdeckého milestone.

Oddělená fronta:

`A4 #25 → A6 #26 → A8 #27`

Tato fronta nesmí začít ze starého SHA `55feadb0440c1c4b9eebf5ec4139315237e723a4`. Aktivace vyžaduje nový přesný base, vlastníka konfliktních cest a pořadí vůči A5/A7.

## 5. Integrované balíky prvního koně

### A3 #24 / PR #34 — obsahový kontrakt

- merge: `e988e5e16f7e248df9b80cd28c91a9715891e299`;
- finální head: `b9ab032233e576b06a7fe51ea33a9d4ba8cc48fa`;
- workflow `30518698707`: SUCCESS;
- výsledek: lawful/covert obsah, trust, trial, failure/reset a world-state kontrakt.

### A1 #35 / PR #41 — runtime command/event kontrakt

- merge: `ba5c0c202a73edc542c1803f9a3755f3fc57d37a`;
- finální head: `aebaf96b3a0b212d92d4092b07a68d7dcb9bc1ca`;
- workflow `30553991420`: SUCCESS;
- výsledek: jediný `HorseRuntimeOrchestrator`, typované commands/events, idempotence a persistence boundary.

### A2 #36 / PR #43 — gameplay vertical slice

- merge: `77f8c11dc81704ca7e716fa98e23c1818bb30d40`;
- finální head: `fcfbe40c7855fdb6b3b5834e105b04fb3d90494d`;
- workflow `30600172375`: SUCCESS;
- unit: 22 souborů / 146 testů PASS;
- Playwright: 98 PASS / 1 existující desktop skip;
- horse lawful + covert: PASS na desktop, iPhone portrait a iPhone landscape;
- evidence artifact `8781640544`;
- digest `e5a30856012e5bb74886a0eb560275f3c15b5467ced9cc0234cf23ca573f3905`;
- výsledek: input-driven acquisition, mount/dismount, mounted tick, stamina, kolize, trial, failure/reset a reload.

## 6. Aktivní pracovní balík A5 #37

### Identita

- Agent: A5
- Issue: #37
- Priorita: P1
- Feature base: `77f8c11dc81704ca7e716fa98e23c1818bb30d40`
- Větev: `agent/horse-mobile-ui`
- Integrační pořadí: po #36, před #38
- Stav: ACTIVE

### Vlastnictví

A5 smí měnit pouze presentation/UI vrstvy, cílené scénové presentation wiring, styly a odpovídající testy. Horse stav musí číst z autoritativního snapshotu a confirmed eventů.

### Zakázané změny

- `src/contracts/horseRuntime.ts`;
- `src/application/HorseRuntimeOrchestrator.ts`;
- gameplay pravidla v `src/gameplay/**`;
- mount physics, trial pravidla, persistence a save verze;
- A3 obsah, assety a audio;
- paralelní input manager, quest store nebo horse store.

### Gate pro REVIEW

- read-only UI/view-model seam a testy;
- trust, claimed/mounted, gait, stamina, checkpoint a failure/rejection feedback;
- safe-area bez překryvů;
- funkční multi-touch `směr + sprint`;
- žádný konflikt s dialogem, inventářem, craftingem nebo bojem;
- zelené lint, typecheck, unit, build a desktop/portrait/landscape E2E na jednom finálním SHA;
- úplný HANDOFF pro A7.

## 7. Konfliktní oblasti

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

## 8. Bezprostřední další krok

A5 na větvi `agent/horse-mobile-ui`:

1. ověří feature base `77f8c11dc81704ca7e716fa98e23c1818bb30d40` a aktuální ancestry;
2. spustí baseline lint, typecheck, unit testy, build a Playwright;
3. otevře malý draft PR propojený s #37;
4. nejprve přidá read-only HUD/view-model seam a testy;
5. publikuje head SHA, změněné cesty a výsledky CI;
6. nepřejde do REVIEW bez úplného desktop/portrait/landscape HANDOFFu.

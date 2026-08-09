# HANDOFF — A4 runtime visual slice

### Identita balíku

- Issue: #70
- Větev: `agent/a4-runtime-visual-slice`
- Base SHA: `3984def9ecdc0a11bd4fbccde73794fcbcbe2fb2`
- Implementation head SHA: `906141d2f7d05353f28ba9a6776f2f03d116b4c9`
- Pracovní proud: A4 — vizuál / animace / scene composition
- Integrační pořadí: A4 → A0 composition review → A5 UI

### Cíl

Předložit skutečný runtime composition checkpoint, který nahrazuje původní plochý procedural world authored 90s historical RPG scénou.

### Implementováno

- Authored day/evening pixel-art assets pro village street, fasády, střechy, kostel, cestu, props a vegetaci.
- Přepnutí GameScene na 3/4 scenic framing s foreground/midground/background hloubkou.
- Hráč, čtyři statické presentation NPC figury a authored kůň Jiskra ve čitelné velikosti.
- Medieval presentation HUD skin: heraldický identity frame, HP/ST bars, minimap, objective panel and quickbar; existing HUD event/state contracts remain unchanged.
- Odstranění starých tiled/house/tree placeholderů a world debug labelů z runtime viewportu.
- Večerní asset se přepíná přes existující `dayClock`; gameplay, save a horse ownership zůstávají beze změny.

### Mimo rozsah

- Full dialogue/inventory skin and mobile safe-area layout — A5 follow-up; this checkpoint adds only the runtime composition HUD frame required by the reference gate.
- Combat, quest progression, save schema, economy, audio a horse state ownership.

### Změněné kontrakty

- Eventy: N/A.
- Stores: N/A.
- Save verze/migrace: N/A.
- Asset ID: nové `village-street-day`, `village-street-evening`, `horse-jiskra` runtime textures.
- Veřejné UI/inputy: N/A; diagnostické world labely jsou skryté.

### Validace

- [x] `npm run lint` — pass.
- [x] `npm run typecheck` — pass.
- [x] `npm test` — 26 files / 163 tests pass.
- [x] `npm run build` — pass přes přímý Vite build; lokální pnpm wrapper vyžadoval bundled runtime a blokoval `esbuild` install hook.
- [ ] `npm run test:e2e` — full run byl přerušen po dlouhém běhu; poslední run 49 pass, 9 fail, 2 flaky. Failures byly převážně reload/save readiness timeouty; po odstranění kolizí horse route je nutný nový čistý CI běh.

### Vizuální a mobilní důkaz

- Desktop daylight: live runtime screenshot 2026-08-09 — hráč, 4 NPC, kůň, dvě fasády, road depth, kostel/horizont, props a vegetace.
- Desktop evening: live runtime screenshot 2026-08-09 — večerní authored asset + světelná vrstva a srážky.
- Desktop reference-aligned HUD: live runtime screenshot 2026-08-09 — dřevěno-zlatý frame, map panel, quest panel and quickbar rendered by `UIScene`.
- Mobile portrait: N/A pro A4 composition-only checkpoint; předává se A5.
- Mobile landscape: N/A pro A4 composition-only checkpoint; A5/A7 gate.
- Zařízení/browser: Codex in-app browser, desktop viewport; interní render 480 × 270.

### Save a kompatibilita

- Nová hra: zachována.
- Pokračování: zachováno.
- Migrace starších save: beze změny.
- Reload během/po funkci: presentation assets se vytvářejí z runtime texture manifestu; vizuální stav se neukládá.

### Rizika a známé limity

- HUD zůstává současný diagnostický skin; A5 je zodpovědný za medieval UI gate.
- E2E full-run vyžaduje nový stabilní běh na přesném headu; CI green není visual approval.
- Lokální `npm` binary není dostupná; validace byla spuštěna přes bundled Node/pnpm runtime.

### Soubory s vyšším konfliktním rizikem

- `src/game/scenes/GameScene.ts`
- `src/game/scenes/HorseGameScene.ts`
- `src/game/NpcManager.ts`

### Rollback

Revert A4 presentation commit a obnovit předchozí `VillageStreetRenderer`/GameScene wiring; save a gameplay data nejsou migrována.

### Doporučený integrační krok

Zkontrolovat nový runtime screenshot proti issue #68 a teprve po A0 composition approval aktivovat A5 UI integration.

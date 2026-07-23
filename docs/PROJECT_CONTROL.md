# PROJECT_CONTROL.md

Tento dokument je jediný autoritativní přehled aktuálního řízení projektu. Aktualizuje jej pouze hlavní koordinátor po ověření skutečného stavu GitHubu.

## 1. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack hry: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Poslední ověřený produktový a řídicí baseline před touto aktualizací: `main@55feadb0440c1c4b9eebf5ec4139315237e723a4`
- Poslední integrovaný milník: **M4.2 Hunting and Fauna**
- Aktuální fáze: **zavedení automatizovaného agentního provozu, mobilní QA matice a dokončení M4.3 craftingu**

Přesný base SHA aktivních větví se po merge této řídicí aktualizace posune na její merge commit. Issue a branch ref musí být synchronizovány koordinátorem před prvním implementačním commitem.

## 2. Control plane

Odborné chaty se navzájem přímo neřídí a nesmějí spoléhat na zprávy v jiném chatu. Společným řídicím kanálem je GitHub:

1. issue obsahuje scope, base SHA, větev, vlastníka, závislosti a DoD;
2. `PROJECT_CONTROL.md` určuje, zda je balík ACTIVE, READY nebo BLOCKED;
3. větev a draft PR obsahují skutečnou implementaci;
4. issue komentáře a PR HANDOFF předávají stav koordinátorovi;
5. CI a review určují, zda lze balík integrovat;
6. po merge koordinátor aktualizuje frontu a aktivuje další issue.

Do zavedení issue #22 je spuštění jednotlivých ChatGPT chatů manuální. Po issue #22 bude GitHub workflow spouštět specializované agentní procesy podle issue labelů a stavu. Feature PR se nikdy nemerguje automaticky bez koordinačního review.

## 3. Aktivní chaty a přidělení

| Chat | Role | Issue | Větev | Výchozí base | Stav |
|---|---|---:|---|---|---|
| A0 | Koordinace a integrace | #28 | `agent/control-activate-specialists` | `55feadb...` | ACTIVE — tato řídicí aktualizace |
| A1 | Architektura/platforma | #22 | `agent/autonomous-agent-orchestrator` | `55feadb...` | ACTIVE po merge #28 |
| A7 | QA/testování/výkon | #23 | `agent/qa-mobile-landscape-matrix` | `55feadb...` | ACTIVE po merge #28; paralelně s #22 |
| A2 | Gameplay | #19 | `agent/p2-crafting-alchemy-smithing` | původně `ff78179f...`; sync target po #22/#23 | DRAFT / BLOCKED na #23 |
| A5 | UI/UX/mobil | #19 | `agent/p2-crafting-alchemy-smithing` | shodný s A2 | DRAFT / BLOCKED na #23 |
| A3 | Svět/questy/obsah | #24 | `agent/horse-world-content-contract` | plánovací baseline `55feadb...` | READY; merge po #19 |
| A4 | Grafika/animace | #25 | `agent/pixel-atlas-asset-pipeline` | plánovací baseline `55feadb...` | BLOCKED do merge #19 |
| A6 | Audio | #26 | `agent/audio-mixer-sfx-foundation` | plánovací baseline `55feadb...` | BLOCKED do merge #25 |
| A8 | Release/nasazení | #27 | `agent/release-production-gate` | plánovací baseline `55feadb...` | BLOCKED do merge #26 |

U READY a BLOCKED balíků je větev rezervována názvem, ale nesmí být vytvořena ani použita, dokud koordinátor nepřepíše issue na aktuální merge SHA a stav ACTIVE.

## 4. Issues

| Issue | Balík | Vlastník | Stav | Závisí na |
|---:|---|---|---|---|
| #28 | Aktivace odborných proudů a fronty | A0 | ACTIVE | nic |
| #22 | Autonomní agentní orchestrátor | A1 | READY → ACTIVE po #28 | #28 |
| #23 | Mobilní landscape E2E matice | A7 | READY → ACTIVE po #28 | #28 |
| #19 | Dokončení alchymie a kovářství v PR #16 | A2/A5 | DRAFT / BLOCKED | #23; synchronizace s aktuálním main |
| #24 | Obsahový kontrakt koně a jezdecké questové linie | A3 | READY | merge #19 před integrací |
| #25 | Produkční pixel-atlas pipeline a manifest | A4 | BLOCKED | #19; využije #24 |
| #26 | Audio mixer, SFX registry a WebAudio lifecycle | A6 | BLOCKED | #25 |
| #27 | Release gate, production smoke a distribuční manifest | A8 | BLOCKED | #22, #23, #19, #25, #26 |

## 5. Integrační pořadí

| Pořadí | Issue | Balík | Poznámka |
|---:|---:|---|---|
| 0 | #28 | Aktualizace control plane | pouze tento dokument |
| 1 | #22 | Agentní orchestrátor | základ bezmanuálního provozu |
| 2 | #23 | Mobilní landscape QA matice | může být vyvíjena paralelně s #22, integruje se po něm kvůli workflow koordinaci |
| 3 | #19 / PR #16 | Crafting M4.3 | po merge #23 synchronizovat větev s aktuálním main |
| 4 | #24 | Obsahový kontrakt jezdectví | může být připravován po #22, merge až po #19 |
| 5 | #25 | Pixel-atlas asset pipeline | po #19; respektuje obsahová ID z #24 |
| 6 | #26 | Audio foundation | po #25 kvůli asset a registry hranicím |
| 7 | #27 | Release gate | po stabilizaci předchozích kontraktů |

Paralelní práce je povolena pouze pro #22 a #23. #24 může být připravována bez runtime změn, ale nesmí být integrována před #19.

## 6. Konkrétní kontrakty pracovních proudů

### A1 — issue #22

- Vytvoří samostatný nástroj `tools/agent-orchestrator/**`.
- GitHub issue je fronta a autoritativní zadání.
- Trigger: issue ve stavu READY s rolí A1–A8.
- Povinné přechody: READY → RUNNING → REVIEW nebo BLOCKED.
- Výstup: větev, draft PR, stavový komentář a HANDOFF.
- Automatický merge feature PR je zakázán.
- Live provoz vyžaduje repository secret `OPENAI_API_KEY`; dry-run musí fungovat bez něj.

### A7 — issue #23

- Zavede samostatné Playwright projekty desktop, iPhone portrait a iPhone landscape.
- Dodá sdílené helpery a stabilní core smoke.
- Dvě po sobě jdoucí zelená spuštění stejného head SHA jsou povinná.
- Crafting assertions nepatří do #23; převezme je #19 po merge.

### A2/A5 — issue #19 / PR #16

- Větev je aktuálně diverged: 15 commitů ahead a 2 behind proti `main@55feadb...`.
- Před další implementací musí převzít aktuální main bez přepsání historie.
- DOM controller nesmí přímo provádět crafting transakci.
- Povinná je application service/command hranice, typovaný potvrzený event, rollback test nosnosti, modal/input test, save/reload a desktop/portrait/landscape důkaz.
- PR zůstává draft do úplného HANDOFFu a zeleného CI posledního headu.

### A3 — issue #24

- Dodá quest graph, world-state flagy, dialogy, reputační důsledky a datový kontrakt pro první získání koně.
- Neimplementuje mount physics, save ani UI.

### A4 — issue #25

- Převádí runtime-generované atlasy na reprodukovatelné PNG a manifest-driven load.
- Každé asset ID musí odpovídat právě jednomu souboru.

### A6 — issue #26

- Zavede jeden AudioContext, mixer skupin, typovaný SFX registry a bezpečný mobile lifecycle.
- Nemění gameplay pravidla.

### A8 — issue #27

- Vytvoří oddělený web build a source archive, manifest velikostí a SHA-256.
- Release je blokován bez CI, deploye a smoke testu skutečné produkční URL.

## 7. Jak koordinátor řídí odborné agenty

A0 neřídí agenty posíláním zpráv mezi chaty. Řídí je změnou stavu v control plane:

1. ověří poslední `main`, PR, CI a konflikty;
2. doplní nebo aktualizuje issue;
3. zapíše přesný base SHA a branch;
4. změní stav na ACTIVE/READY;
5. orchestrátor #22 převezme pouze aktivované issue;
6. agent uzamkne issue a publikuje heartbeat;
7. agent vytvoří draft PR a průběžně zapisuje stav;
8. při blokaci změní issue na BLOCKED a uvede přesný důvod;
9. při dokončení přidá HANDOFF a stav REVIEW;
10. A0 ověří diff, CI, evidence a review;
11. A0 provede merge nebo vrátí issue do RUNNING;
12. po merge A0 přepočítá base SHA závislých balíků a aktivuje právě další bezpečnou práci.

## 8. Bezmanuální provoz

Po dokončení #22 bude standardní cyklus:

```text
GitHub issue READY
→ workflow trigger
→ specializovaný agent A1–A8
→ branch + draft PR
→ CI
→ HANDOFF
→ A0 review
→ merge
→ reconciler aktualizuje frontu
→ automatická aktivace dalšího nezablokovaného issue
```

Povinné bezpečnostní brány:

- maximálně jeden RUNNING balík na jednu konfliktní oblast;
- concurrency lock podle issue a pracovního proudu;
- žádný force push;
- žádný automatický feature merge;
- žádné tajné klíče v commitu nebo logu;
- timeout a heartbeat pro detekci osiřelé práce;
- agent smí změnit pouze cesty povolené issue;
- neúspěšné CI vrací balík stejnému agentovi, neaktivuje nový.

## 9. Vysoce konfliktní oblasti

V jednom integračním okně mají právě jednoho vlastníka:

- `src/main.ts` a globální runtime wiring;
- `playwright.config.ts` a sdílené E2E helpery;
- `.github/workflows/**`;
- veřejné contracts/events;
- save schema a migrace;
- item registry;
- globální HUD, input a modal orchestrace;
- asset manifest;
- `BACKLOG.md`, `DEVELOPMENT_STATUS.md`, `CHANGELOG.md`;
- tento dokument.

## 10. Stav produktu na main

Hotové:

- boot, menu, nová hra a pokračování;
- pixel-perfect viewport 480 × 270;
- desktopové a mobilní vstupy;
- kolize, kamera a oblast Záhoří;
- NPC, dialogy, quest a denní rozvrhy;
- pětisměrný boj, kryt a úhyb;
- inventář, vybavení, obchod a reputace;
- stealth, počasí, adaptivní hudba;
- fauna, lov, kořist a save verze 5;
- PWA, CI, Vitest a Playwright;
- víceagentní procesní a architektonické kontrakty.

Rozpracované:

- M4.3 crafting v PR #16.

Známé dluhy:

- quest state podporuje jen jeden aktivní quest;
- navigace NPC a zvěře nemá pathfinding;
- část atlasů vzniká za běhu;
- gameplay wiring je stále soustředěné kolem hlavního runtime vstupu;
- chybí jednotný veřejný event manifest;
- před #23 chybí samostatný landscape Playwright projekt.

## 11. Stavové značky

- `BACKLOG` — evidováno bez specifikace.
- `READY` — specifikováno, čeká na aktivaci a finální base SHA.
- `ACTIVE` — koordinátor povolil práci z uvedeného base SHA.
- `RUNNING` — orchestrátor nebo agent drží lock a pracuje.
- `DRAFT` — existuje draft PR, implementace nebo evidence není úplná.
- `REVIEW` — HANDOFF a CI jsou připravené ke koordinační kontrole.
- `BLOCKED` — konkrétní závislost nebo externí blokace.
- `MERGED` — změna je na main a issue je uzavřena merge commitem.

## 12. Nejbližší kroky

1. Sloučit #28 s diffem pouze v tomto dokumentu.
2. Posunout aktivní branch refs #22 a #23 na merge SHA #28 a aktualizovat jejich issue base.
3. Spustit A1 a A7 paralelně.
4. Sloučit #22, poté #23.
5. Synchronizovat PR #16 s novým main a dokončit #19.
6. Po merge #19 aktivovat #24 a následně #25.
7. Pokračovat #26 a #27 podle fronty.
# PROJECT_CONTROL.md

Tento dokument je autoritativní přehled řízení projektu. Aktualizuje jej pouze A0 po ověření skutečného stavu GitHub issues, větví, pull requestů, CI a HANDOFFů.

## 1. Aktuální rozhodnutí A0

Status: **VISUAL REBOOT ACTIVE**

Původní presentation layer byla 2026-08-09 odmítnuta jako cílová podoba produktu. Projekt zachovává použitelnou herní logiku a infrastrukturu, ale restartuje renderer/world presentation, environment art, gameplay character art a UI skin.

Autoritativní zdroje pro tuto fázi:

1. issue **#68** — `A0/A4: Visual reboot — authoritative 90s historical RPG vertical slice`;
2. `docs/ART_DIRECTION.md`;
3. `AGENTS.md` visual reboot gate;
4. `GAME_DESIGN_DOCUMENT.md` aktualizovaná perspektiva.

`docs/visual-concept.svg` je pouze historický koncept a není acceptance target.

## 2. Projekt

- Produkt: **Chronicles of Bohemia**
- Repozitář: `rajekroman/Kcd12b`
- Platformy: web, iPhone, iPad, desktop
- Stack: TypeScript, Phaser 3, Vite, Vitest, Playwright, PWA
- Výchozí větev: `main`
- Visual-reboot base: `e79130c014758f2992cb63196dfd6329917fc506`
- Aktivní milník: **M-VR1 — production-quality village street vertical slice**
- Primární vlastník: **A4 / issue #68**
- Aktivní větev: `agent/a4-visual-reboot-vertical-slice`

## 3. Stav agentů A0–A8

| Agent | Stav | Aktivní scope | Další krok |
|---|---|---|---|
| A0 | ACTIVE | koordinace #68, scope a visual gate | hlídat freeze, review A4 checkpointu |
| A1 | STANDBY | pouze nezbytné renderer/contract zásahy po eskalaci | žádná nová architektura bez #68 dependency |
| A2 | STANDBY | zachovat existující gameplay runtime | žádné nové gameplay features |
| A3 | STANDBY | obsah pouze pro jeden schválený slice | žádná expanze světa |
| A4 | ACTIVE | art direction, 3/4 world presentation, environment, characters, animation | dodat první runtime composition checkpoint |
| A5 | BLOCKED | medieval UI redesign pro schválený slice | aktivovat až po A4 composition seam |
| A6 | BLOCKED | ambience pouze pro schválený slice | aktivovat až po vizuálním checkpointu |
| A7 | READY-BLOCKED | visual QA + functional QA | připravit screenshot review gate, spustit po A4/A5 |
| A8 | BLOCKED | release/deployment | #66 zůstává infra track; release až po #68 PASS |

## 4. Development freeze

Do A0/A7 PASS issue #68 platí:

- žádné nové gameplay systémy;
- žádná expanze questů, lokací nebo content databází mimo slice;
- žádné broad audio feature work;
- žádný release-ready claim;
- žádné acceptance založené pouze na CI, počtu assetů nebo testů;
- žádné prezentování procedurálních placeholderů jako finální grafiky.

Povolená je pouze práce potřebná pro dosažení production-quality vertikálního řezu a zachování kompatibility existujícího funkčního základu.

## 5. Autoritativní vizuální cíl

Cíl je detailní historické RPG/adventura 90. let s:

- 3/4 scenic perspective;
- viditelnými fasádami, střechami a horizontem;
- foreground/midground/background hloubkou;
- hustou českou středověkou vesnicí;
- painterly 12/16bit pixel-artem;
- velkými čitelnými postavami;
- daylight + evening variantou;
- plně integrovaným medieval UI;
- runtime screenshoty jako povinnou acceptance evidence.

Podrobný kontrakt: `docs/ART_DIRECTION.md`.

## 6. M-VR1 — první vertikální řez

A4 musí dodat jednu reálnou gameplay scénu obsahující minimálně:

- vesnickou ulici;
- kovárnu a hostinec;
- vzdálený kostel/dominantu;
- ploty, props, vegetaci a materiálově členitý terén;
- hráče + čtyři odlišné NPC + koně;
- čitelné idle/walk/interact states;
- denní a večerní světlo;
- skutečnou scenic depth bez top-down debug mapy.

A4 může pro dosažení cíle agresivně nahradit presentation-layer kód a placeholder assets, nesmí však bez samostatné eskalace měnit doménová pravidla, save schema nebo autoritativní gameplay kontrakty.

## 7. A5 integrační gate

A5 se aktivuje až poté, co A4 předloží první runtime composition checkpoint a A0 potvrdí:

- perspektivu;
- měřítko postav;
- safe UI regions;
- kompozici scény;
- základní paletu a materiálový jazyk.

A5 následně vytvoří jeden konzistentní medieval UI skin: player panel, HP/ST/XP, minimap, active quest, dialogue portrait panel, quickbar a inventory/crafting/options affordance.

## 8. A7 visual QA gate

A7 nebude hodnotit pouze funkčnost.

Povinná evidence:

1. desktop daylight gameplay;
2. desktop evening gameplay;
3. dialogue state;
4. inventory/quickbar state;
5. iPhone portrait UI handling;
6. iPhone landscape gameplay.

PASS vyžaduje současně:

- zelené povinné CI;
- žádné major placeholder presentation;
- vizuální konzistenci světa/postav/UI;
- shodu s `docs/ART_DIRECTION.md`;
- screenshot-level schválení A0/A7.

## 9. Reuse policy

Preferovaně zachovat:

- save/persistence;
- combat a další doménové systémy;
- quest/dialogue data;
- event contracts;
- NPC runtime chování;
- PWA/build/deployment infrastrukturu;
- E2E a asset validation tooling.

Lze nahradit:

- world renderer/presentation;
- camera presentation;
- environment assets;
- gameplay character sprites/atlases;
- portrait art;
- HUD/dialog/inventory presentation;
- procedural placeholder texture generation.

## 10. Aktivní integrační pořadí

1. **A4 / #68** — art-direction contract + runtime village composition checkpoint.
2. **A0** — visual/scope review checkpointu.
3. **A4** — production art pass vertikálního řezu.
4. **A5** — UI integration na schválenou kompozici.
5. **A7** — desktop + iPhone portrait + landscape visual/functional QA.
6. **A0** — finální visual reboot decision.
7. **A8** — release/deployment až po PASS #68 a dořešení infra tracku #66.

## 11. Bezprostřední další krok

### A4

Na větvi `agent/a4-visual-reboot-vertical-slice` z base `e79130c014758f2992cb63196dfd6329917fc506` připravit první **runtime composition checkpoint**. Cílem není další manifest ani počet assetů, ale screenshot reálné gameplay scény dokazující novou 3/4 perspektivu, hloubku, měřítko postavy a hustotu prostředí.

### A0

Po checkpointu zkontrolovat vizuální směr před rozšířením asset produkce.

### Ostatní agenti

STANDBY/BLOCKED podle tabulky výše.
# První kůň — obsahový kontrakt

## Záměr

Quest **Dub a otěže** dává hráči první trvalý přístup ke koni. Obsahový balík definuje pouze identitu, stavy, dialogy, reputační důsledky a požadované interakce. Neimplementuje fyziku koně, kameru, input, UI ani save migraci.

## Postavy a místo

- **Jiskra** (`horse.dun_mare_jiskra`) — mladá plavá klisna, pozorná a lekavá; důvěru získává péčí, nikoli jednorázovou platbou.
- **Matěj** (`npc.stablemaster_matej`) — stájník, praktický a zpočátku nedůvěřivý.
- **Anežka** (`npc.owner_anezka`) — vlastnice stáje; chrání pověst hospodářství a odmítá vydat koně nezodpovědnému hráči.
- **Vítek** (`npc.groom_vitek`) — čeledín, který hráče naučí základní péči.
- **Radověsická stáj** (`location.radovesice_stable`) — malá venkovská stáj, nikoli vojenský hřebčín.

Názvy jsou původní a neodkazují na chráněné postavy jiné hry. Obsah nepředkládá zásadní historické tvrzení; používá obecně věrohodné venkovské prostředí a péči o koně.

## Quest graph

```text
NOT_STARTED
  -> STABLE_INTRODUCTION
  -> TRUST_EARNED
  -> SOLUTION_SELECTED
       |-> LAWFUL_SERVICE
       |     - opravit bránu
       |     - dodat léčivé byliny
       |     - souhlas Anežky
       |     - reputace Radověsice +8
       |
       |-> COVERT_RELEASE
             - dostupné pouze po získání důvěry Jiskry
             - otevřít stáj v noci
             - reputace Radověsice -12
             - Anežka se stává nepřátelskou
  -> HORSE_BONDED
  -> TRIAL_RIDE
  -> COMPLETED

Kdykoli před převzetím koně:
  horse.jiskra.injured = true -> FAILED
```

## Herní cíl, motivace a konflikt

- **Cíl:** získat prvního koně a bezpečně dokončit zkušební trasu.
- **Motivace hráče:** rychlejší cestování a otevření jezdeckého obsahu.
- **Konflikt:** vlastnice nevydá koně bez prokázané péče; hráč může respektovat podmínky, nebo zneužít důvěru zvířete.
- **Mechanická interakce:** rozhovor, prohlídka, krmení, čištění, oprava brány, otevření stáje, nasednutí, průjezd checkpointy a návrat.
- **Důsledek:** zákonná cesta posiluje místní reputaci; tajné odvedení koně uzavírá část služeb stáje a vytváří nepřátelskou reakci majitelky.
- **Odměna:** trvalý přístup k Jiskře po dokončení zkušební jízdy.

## Stavové podmínky

Autoritativní seznam je v `src/data/horseQuestContent.ts`. Všechny perzistentní flagy mají stabilní namespaced ID. Runtime nesmí odvozovat stav questu z textu dialogu ani z UI.

## Dialogové zásady

Každý uzel musí alespoň jednu z těchto funkcí skutečně provádět:

- aktivovat quest nebo další fázi;
- odhalit motivaci postavy;
- nabídnout rozdílné řešení;
- zapsat reputační nebo world-state důsledek;
- reagovat na dříve získanou důvěru koně.

Portréty používají explicitní emoce z kontraktu `PortraitEmotion`.

## Následné kontrakty

### A1 — architektura

- vyhodnocení datových podmínek a efektů bez závislosti na Phaser scéně;
- command/event hranice pro požadované interakce;
- stabilní namespaced registry ID;
- žádné runtime wiring v tomto A3 balíku.

### A2 — gameplay

- péče o koně převádí interakce na progress důvěry;
- oprava brány a zkušební jízda musí být deterministicky testovatelné;
- zranění koně musí vyvolat explicitní failure event;
- pravidla pohybu a mount physics nejsou obsahem A3.

### A4 — grafika

- portréty Matěje, Anežky a Vítka pro definované emoce;
- čitelná silueta plavé klisny Jiskry;
- stáj, brána a body péče jako samostatná asset ID.

### A5 — UI/UX

- quest log zobrazuje objective aktuální fáze, ale neurčuje její pravidla;
- dialogové volby zobrazují podmíněné dostupnosti;
- mobilní interakce používají existující prioritní akční vstup;
- mount request se zobrazí až po příslušném unlock efektu.

### A6 — audio

- neutrální, znepokojená a úlevná vokální reakce bez nutnosti dabingu;
- zvuk péče, brány, nasednutí a koňských kroků přes registry ID;
- audio nesmí měnit quest stav.

## Integrační omezení

- Balík může být připraven na samostatné větvi.
- PR zůstává draft do zelené statické validace a úplného HANDOFFu.
- Merge je blokován do dokončení issue #19 / PR #16 podle integrační fronty.

# První kůň — obsahový kontrakt

## Záměr

Quest **Dub a otěže** dává hráči první trvalý přístup ke koni. Tento balík definuje pouze obsah, stavový graph, dialogy, reputační důsledky a požadované command/event hranice. Neimplementuje fyziku koně, kameru, input, UI, save migraci, assety ani audio.

Autoritativní strojově čitelná definice je v `src/data/horseQuestContent.ts`.

## Postavy a místo

- **Jiskra** (`horse.dun_mare_jiskra`) — mladá plavá klisna, pozorná a lekavá; důvěru získává péčí.
- **Matěj** (`npc.stablemaster_matej`) — praktický stájník, který hráče nejprve prověří.
- **Anežka** (`npc.owner_anezka`) — vlastnice stáje; chrání zvířata i pověst hospodářství.
- **Vítek** (`npc.groom_vitek`) — čeledín, který vysvětlí bezpečnou péči.
- **Radověsická stáj** (`location.radovesice_stable`) — malá venkovská stáj.

Názvy a postavy jsou původní. Balík nepřebírá postavy, dialogy ani specifické dějové motivy jiné hry a nevznáší zásadní historická tvrzení.

## Quest graph

```text
NOT_STARTED
  -> STABLE_INTRODUCTION
  -> TRUST_BUILDING
  -> SOLUTION_SELECTED
       |-> LAWFUL_SERVICE
       |     -> opravit bránu
       |     -> dodat léčivé byliny
       |     -> získat souhlas Anežky
       |     -> horse.jiskra.claimed
       |
       |-> COVERT_RELEASE
             -> pouze v noci
             -> otevřít bránu bez odhalení
             -> odvést Jiskru
             -> horse.jiskra.claimed
  -> HORSE_BONDED
  -> TRIAL_RIDE
  -> COMPLETED

Před nastavením horse.jiskra.claimed:
  potvrzené zranění -> FAILED
  odhalení tajného odvedení -> FAILED
```

Každá neterminální fáze má explicitní následníky. Obě řešení vytvářejí vlastní datově dosažitelnou cestu k `horse.jiskra.claimed`.

## Důvěra Jiskry

Důvěra je deterministický counter `horse.jiskra.trust_points` s prahem `3`:

- první potvrzené krmení: `+1`;
- první potvrzené čištění: `+2`.

Obě interakce mají idempotenci `once_per_quest`. Opakování stejné činnosti proto nepřidává další body. Po dosažení prahu runtime aplikuje efekty modelu:

- `horse.jiskra.trust_earned = true`;
- `horse.quest.first.solution_choice = true`.

## Zákonná cesta

Volba `choice.lawful_service` pouze vybere řešení. Sama quest nedokončí a nepřidá reputaci.

Povinné kroky:

1. `interaction.repair_stable_gate` nastaví `stable.radovesice.gate_repaired`;
2. `interaction.deliver_stable_herbs` nastaví `stable.radovesice.herbs_delivered`;
3. `interaction.obtain_owner_approval` je dostupná až po obou úkolech;
4. potvrzený souhlas nastaví `stable.radovesice.owner_approved`, `horse.jiskra.claimed` a `horse.jiskra.mount_unlocked`;
5. reputace Radověsic se zvýší o `8`.

## Tajná cesta

Volba `choice.covert_release` pouze vybere řešení. Nepřátelství a reputační sankce se aplikují až po skutečném odvedení nebo odhalení.

Povinné podmínky:

- získaná důvěra Jiskry;
- externí stav `world.time.phase = night`;
- hráč ještě nebyl odhalen.

Průchod:

1. `interaction.open_stable_gate_covertly` otevře bránu;
2. `interaction.lead_jiskra_out` nastaví `horse.jiskra.claimed` a `horse.jiskra.mount_unlocked`;
3. Anežka se stane nepřátelskou a reputace Radověsic klesne o `12`.

Událost `event.horse.covert_release_detected` před převzetím Jiskry ukončí quest, nastaví nepřátelství a sníží reputaci o `16`.

## Zkušební jízda

Trasa `route.radovesice.first_ride` má tři stabilní checkpointy v pevném pořadí:

1. `checkpoint.radovesice.meadow_gate`;
2. `checkpoint.radovesice.shallow_ford`;
3. `checkpoint.radovesice.old_oak`.

Po startu se `horse.jiskra.trial_checkpoint_index` nastaví na `0`. Každý správný checkpoint nastaví další hodnotu. Návrat ke stáji je platný pouze s hodnotou `3`.

Sesednutí, opuštění trasy nebo průjezd checkpointem ve špatném pořadí:

- neukončí celý quest;
- zruší aktuální pokus;
- nastaví progress na `0`;
- vyžaduje nový start zkušební jízdy.

## Failure kontrakt

### Zranění

Autoritativní potvrzená událost je `event.horse.injured_confirmed` s payloadem:

- `questId`;
- `horseId`;
- `source`: `care_mishap` nebo `stable_hazard`;
- `severity`: `1`, `2` nebo `3`.

Událost může ukončit quest pouze před `horse.jiskra.claimed = true`. Po převzetí Jiskry už případné zranění patří do následného gameplay a nesmí zpětně zrušit dokončenou obsahovou větev.

### Odhalení

`event.horse.covert_release_detected` je aktivní jen při vybrané tajné cestě a před převzetím koně. Po `horse.jiskra.claimed = true` se pro tento quest ignoruje.

## Command/event hranice

Každá mechanická interakce definuje:

- stabilní `interactionId`;
- konkrétní `targetId`;
- požadovaný `commandId`;
- potvrzený `confirmedEventId`;
- vstupní podmínky;
- autoritativní efekty;
- idempotency pravidlo.

UI ani Phaser scéna nesmějí přepisovat questové podmínky nebo odvozovat úspěch z textu dialogu.

## Dialogové zásady

Dialogy aktivují quest, vysvětlují péči, odhalují motivaci postav a nabízejí dvě rozdílná řešení. Portrétní emoce jsou explicitní přes `PortraitEmotion`. Volba řešení nezastupuje provedení příslušných mechanických úkolů.

## Následné kontrakty

### A1 — architektura

- obecné vyhodnocení `ContentConditionSet` a `ContentEffect` mimo Phaser scény;
- dispatch commandu a aplikace efektů až po potvrzeném eventu;
- idempotency evidence pro `once_per_quest`, `once_per_trial_attempt` a `ordered_once`;
- progress rule pro dosažení prahu důvěry;
- žádné runtime wiring v tomto A3 balíku.

### A2 — gameplay

- implementovat producenty potvrzených eventů podle strukturovaných interakcí;
- zachovat přesné target ID, pořadí checkpointů a failure cutoff;
- odhalení tajné cesty musí být samostatná potvrzená událost;
- mount physics a pohybová pravidla jsou samostatný následný balík.

### A4 — grafika

- portréty Matěje, Anežky a Vítka pro použité emoce;
- čitelná silueta plavé klisny Jiskry;
- samostatná asset ID pro stáj, bránu, péči a tři checkpointy.

### A5 — UI/UX

- quest log pouze zobrazuje objective aktivní fáze;
- dialogové volby respektují datové podmínky;
- mobilní akční vstup vybírá dostupnou interakci podle priority;
- `mount_request` se zobrazí až po unlock efektu.

### A6 — audio

- registry ID pro krmení, čištění, bránu, nasednutí a kroky koně;
- audio může reagovat na confirmed event, ale nesmí měnit quest stav.

## Integrace

Issue #19 / PR #16 je dokončena. Aktivní pracovní balík je issue #24 / PR #34. PR zůstává draft do zelených kontrol, úplného HANDOFFu a rozhodnutí A0 o připravenosti k review.

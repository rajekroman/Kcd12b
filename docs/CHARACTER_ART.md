# Character Art

## Rozsah milníku M3.1

Původní prototyp používal několik jednoduchých procedurálních textur a všech deset obyvatel sdílelo jeden sprite kováře s odlišným barevným tintem. Milník M3.1 tento placeholder nahrazuje systémem dvanácti ručně komponovaných charakterových atlasů.

## Rozměry a stavy

Každý atlas používá pevný rámec 20 × 28 pixelů a šest stabilních frameů:

1. `idle`,
2. `walk-a`,
3. `walk-b`,
4. `action`,
5. `hurt`,
6. `sleep`.

Celý systém proto vytváří 72 samostatných ručně definovaných snímků. Phaser nad nimi registruje pět animačních režimů: klid, chůzi, akci, zásah a spánek.

## Datová definice

`src/data/characterAtlases.ts` obsahuje dvanáct postav:

- hráče,
- lapku,
- kováře Bohdana,
- hostinskou Martu,
- strážného Vojtěcha,
- sedláka Ondru,
- bylinkářku Anežku,
- mlynáře Jakuba,
- otce Matěje,
- kupkyni Kateřinu,
- podkoního Pavla,
- pradlenu Annu.

Každá definice určuje:

- stabilní atlasový klíč,
- barevnou paletu,
- pokrývku hlavy,
- nástroj nebo zbraň,
- šířku ramen,
- délku oděvu,
- zástěru,
- vousy,
- ženskou siluetu,
- poškozený vzhled.

## Pixelový renderer

`src/systems/CharacterAtlasSystem.ts` skládá snímky z ručně umístěných pixelových obdélníků. Nejde o náhodný generátor ani o barevné přebarvení jednoho základu. Každá role používá vlastní kombinaci proporcí a doplňků:

- Bohdan má široká ramena, zástěru, vousy a kladivo,
- Marta závoj, zástěru a korbel,
- Vojtěch přilbu a dlouhé kopí,
- Ondra slaměný klobouk a motyku,
- Anežka kápi a košík bylin,
- Jakub čapku, zástěru a pytel mouky,
- Matěj dlouhý hábit, kápi a kříž,
- Kateřina závoj, dlouhý oděv a měšec,
- Pavel kápi a kartáč na koně,
- Anna šátek, zástěru a koš prádla,
- hráč meč,
- lapka potrhaný oděv a kyj.

Renderer nejprve vytvoří čistý model frameů. Teprve `registerCharacterAtlases` je vykreslí do Phaser textury a zaregistruje animace.

## Runtime obyvatel

`NpcManager` používá atlasový klíč přímo podle stabilního NPC ID. Runtime tint byl odstraněn. Správce:

- přepíná chůzi podle skutečné fyzické rychlosti,
- zrcadlí sprite podle vodorovného směru,
- používá vodorovný spací frame během aktivity `sleeping`,
- spouští profesní akční animace během práce, obsluhy, modlitby, obchodu, sběru a praní,
- zachovává původní stabilní formát veřejného snapshotu denních rozvrhů.

Nový seznam profesních atlasových klíčů je zveřejněn samostatně přes `data-npc-atlas-keys`.

## Hráč a lapka

`CharacterAnimationController` drží animační orchestraci mimo `GameScene`. Hráče a lapku najde podle texture key a reaguje na:

- fyzický pohyb,
- hráčův útok,
- přípravu útoku lapky,
- zásah lapky,
- zásah hráče.

Přístupné runtime atributy `data-player-animation` a `data-bandit-animation` umožňují stabilní browserové testy bez závislosti na screenshotové podobnosti.

## Validace

Jednotkové testy ověřují:

- přesně dvanáct unikátních definic,
- všech 72 snímků,
- celočíselné souřadnice a rozměry,
- úplné zachování rámce 20 × 28,
- neprázdné a dostatečně složité snímky,
- unikátní kompletní podpis každého atlasu,
- odlišnost kroků a akční siluety,
- stabilní názvy animací a indexy frameů.

Playwright na desktopu i mobilním profilu ověřuje registraci atlasů, deset unikátních NPC klíčů a skutečný přechod hráče mezi klidem, chůzí a útokem.

## Současná omezení

- Atlasy vznikají za běhu z kódu, nikoli z externích PNG souborů.
- Směr doleva používá zrcadlení, nikoli samostatnou kresbu.
- Postavy zatím nemají samostatné čelní a zadní sady.
- Dialogové portréty a výrazové varianty jsou následující samostatný milník.
- Jemnější animace zbraní, látky a vlasů budou vyžadovat více frameů nebo samostatné vrstvy.

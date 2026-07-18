# Adaptive Audio

## Rozsah milníku M2.4

Adaptivní soundtrack je autorsky generovaný přímo v prohlížeči. Nepoužívá externí hudební soubory ani melodie převzaté z jiných her. Systém je rozdělený na čistý hudební model a samostatný WebAudio renderer.

## Hudební data

`src/data/music.ts` definuje šest aktivních nálad:

- `dawn`,
- `day`,
- `evening`,
- `night`,
- `suspicious`,
- `alerted`.

Každý motiv obsahuje tempo, základní frekvenci, osm melodických poměrů, čtyři basové poměry, délku kroku a cílovou frekvenci filtru.

## Čistý hudební model

`src/systems/MusicSystem.ts` rozhoduje o náladě podle:

- aktivní herní scény,
- normalizované denní hodiny,
- stealth stavu `unaware`, `suspicious` nebo `alerted`,
- ztlumení uživatelem.

Model vrací také cílový mix pěti vrstev:

1. ambience,
2. drone,
3. melody,
4. pulse,
5. percussion.

Podezření a poplach mají vyšší prioritu než běžný denní motiv. Čisté funkce jsou nezávislé na DOM a WebAudio a mají jednotkové testy hranic denní doby, priorit, mixů i délky hudebního kroku.

## WebAudio renderer

`src/game/AdaptiveAudioController.ts` vytváří při prvním uživatelském gestu jeden dlouhodobě žijící audio graf:

- filtrovaný procedurální šum pro ambience,
- dva oscilátory pro dron,
- plánované krátké oscilátory pro melodii a basový pulz,
- filtrovaný šum pro perkuse,
- hlavní gain a dynamický kompresor.

Scheduler používá krátký pravidelný interval a lookahead okno. Tóny jsou naplánované dopředu v čase AudioContextu, takže rytmus nezávisí přímo na obnovovací frekvenci hry.

Při změně nálady se plynule rampují:

- hlasitosti jednotlivých vrstev,
- hlavní hlasitost,
- filtry ambience a dronu,
- frekvence dronových oscilátorů.

## Ovládání a bezpečnost

Prohlížeče nedovolují automatický start zvuku bez uživatelského gesta. Hudba se proto odemkne tlačítkem nebo klávesou M. Po odemčení lze stejným ovládáním hudbu ztlumit a znovu obnovit bez nového audio grafu.

Controller publikuje diagnostické atributy:

- `data-audio-status`,
- `data-audio-unlocked`,
- `data-music-muted`,
- `data-music-mood`.

Pokud WebAudio není dostupné nebo se AudioContext nepodaří spustit, hra pokračuje bez zvuku. Ovladač se deaktivuje a stav přejde na `unavailable`.

## Robustnost herních vstupů

Pevný DOM ovladač zvuku odhalil, že velmi krátké jednorázové klávesy mohou proběhnout mezi dvěma snímky Phaseru. `KeyboardInputFallbackController` proto po dvou animačních snímcích ověří, zda se očekávaný herní stav změnil. Pouze při nezachyceném vstupu vyšle záložní událost pro:

- interakci E,
- útok Space,
- úhyb Shift,
- volbu směru klávesami 1–5.

Úspěšně zachycené vstupy se nezdvojují.

## Automatická validace

Playwright na desktopovém i mobilním profilu ověřuje:

1. uzamčený stav před uživatelským gestem,
2. odemčení a ztlumení tlačítkem,
3. obnovení klávesou M,
4. denní motiv v poledne,
5. noční motiv v noci,
6. přechod do nálady Podezření,
7. přechod do nálady Poplach,
8. zachování starších jednorázových herních vstupů.

## Současná omezení

- Hudba nepoužívá studiově nahrané historické nástroje.
- Neexistuje samostatný mixér hlasitosti hudby, efektů a ambience.
- Uživatelské nastavení zvuku se zatím neukládá.
- Systém zatím nemá prostorový environmentální zvuk ani zvukové efekty materiálů a počasí.

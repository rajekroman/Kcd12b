# Weather and Dynamic Lighting

## Rozsah milníku M4.1

Milník přidává počasí a světelné změny prostředí bez rozšíření save formátu. Stav se odvozuje pouze z uloženého světového času, takže pokračování hry obnoví stejnou oblohu, intenzitu srážek, mokro i světelnou fázi.

## Čistý model

`src/systems/WeatherSystem.ts` neobsahuje Phaser ani DOM závislosti. Definuje čtyři stavy:

- `clear` — jasno,
- `cloudy` — zataženo,
- `rain` — déšť,
- `storm` — bouře.

Každý profil obsahuje:

- barvu a intenzitu stmívací vrstvy,
- intenzitu oblačných stínů,
- počet dešťových kapek,
- rychlost srážek,
- vodorovnou složku větru,
- mokrost povrchu,
- viditelnost,
- periodu bleskového cyklu.

Model současně rozlišuje světelné fáze `night`, `dawn`, `day` a `dusk`.

## Denní cyklus

Výchozí deterministický rozvrh používá světovou hodinu:

- 00:00–04:00 déšť,
- 04:00–09:00 jasno,
- 09:00–12:00 zataženo,
- 12:00–17:00 déšť,
- 17:00–19:00 bouře,
- 19:00–22:00 zataženo,
- 22:00–24:00 jasno.

Tento první model záměrně nemá náhodu. Umožňuje bezpečnou obnovu save, opakovatelné testy a pozdější rozšíření o vícedenní seed bez změny vizuálního rendereru.

## Runtime renderer

`src/game/WeatherController.ts` je připojený k hlavnímu Phaser game loopu, ale zůstává oddělený od `GameScene`.

Controller vytváří:

- multiply vrstvu pro stmívání počasí,
- screen vrstvu pro barevný tón denní fáze,
- pohyblivé oblačné stíny,
- deterministické dešťové kapky,
- mokré odlesky u spodní části viewportu,
- screen vrstvu bouřkového záblesku,
- fixní HUD štítek počasí a denní fáze.

Při opuštění herní scény controller odstraní veřejné runtime atributy a při návratu vytvoří nové Phaser objekty pro aktuální scénu.

## Déšť

Controller předem vytvoří 96 deterministických kapek. Profil počasí pouze určuje, kolik z nich je aktivních:

- jasno a zataženo: 0,
- déšť: 58,
- bouře: 92.

Každá kapka má stabilní počáteční pozici, rychlostní faktor a délku. Vítr ovlivňuje vodorovný posun i sklon čáry. Po opuštění viewportu se kapka vrátí nad horní okraj deterministickou funkcí, nikoli náhodou.

## Bouřkové záblesky

Bouře používá periodu 4200 ms. V každém cyklu vzniknou dva krátké záblesky:

- první na začátku cyklu,
- druhý po krátké pauze.

Funkce `isLightningFlashActive` je čistá a jednotkově testovaná. Vizuální záblesk používá screen blend a nemění fyziku ani save stav.

## Veřejný runtime stav

Controller zveřejňuje na elementu `body`:

- `data-weather`,
- `data-weather-label`,
- `data-weather-rain-density`,
- `data-weather-wetness`,
- `data-weather-visibility`,
- `data-light-phase`,
- `data-lightning`.

Tyto hodnoty slouží E2E testům a budoucím systémům, například stealth, zvuku, NPC rozvrhům nebo fyzice povrchu.

## Validace

Jednotkové testy ověřují:

- normalizaci hodin mimo rozsah 0–24,
- všechny hranice počasí,
- relativní intenzitu srážek, mokra a viditelnosti,
- všechny čtyři světelné fáze,
- oba bouřkové záblesky.

Playwright na desktopu i mobilu načítá save v 06:00, 10:00, 14:00 a 18:00 a ověřuje jasno, zataženo, déšť a bouři včetně světla a runtime parametrů.

## Současná omezení

- Počasí se opakuje každý herní den ve stejných hodinách.
- Srážky jsou screen-space a střechy je neblokují.
- Mokro je vizuální a neovlivňuje tření nebo stopy.
- Viditelnost zatím není připojena ke stealth systému.
- Bouřka nemá hromový zvuk ani reakce NPC.
- Vítr neovlivňuje stromy, oděvy, projektily ani pachovou stopu při lovu.

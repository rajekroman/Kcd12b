# Expressive Dialogue Portraits

## Rozsah milníku M3.2

Milník přidává samostatnou portrétní identitu všem deseti obyvatelům Záhoří. Portrét není zvětšený herní sprite ani barevná varianta společného obličeje. Každá postava má vlastní datovou definici obličeje, profesního oděvu, pokrývky hlavy, znaků stáří a individuálních detailů.

## Rozměry a výrazy

Každý portrétní atlas používá rámec 48 × 56 pixelů a šest stabilních frameů:

1. `neutral` — klidný,
2. `warm` — vlídný,
3. `stern` — přísný,
4. `concerned` — ustaraný,
5. `suspicious` — nedůvěřivý,
6. `proud` — hrdý.

Deset atlasů vytváří celkem 60 ručně komponovaných portrétních snímků.

## Datová identita

`src/data/portraits.ts` definuje pro každého obyvatele:

- stabilní NPC ID a texture key,
- tvar obličeje,
- barvu očí,
- pokrývku hlavy,
- vousy, knír nebo dlouhé vlasy,
- jizvy, pihy, vrásky, mouku nebo špínu,
- barvu pozadí a profesní akcent.

Barevná paleta oděvu, vlasů, kovu a pokožky se sdílí s odpovídajícím charakterovým atlasem. Portrét a herní postava proto působí jako stejná osoba.

## Renderer

`src/systems/PortraitSystem.ts` skládá portréty z ručně umístěných pixelových obdélníků. Samostatné části rendereru vytvářejí:

- rám a profesní pozadí,
- ramena a oděv,
- tvar obličeje,
- vlasy a pokrývku hlavy,
- obočí, oči a zorničky,
- nos, tváře a ústa,
- vousy a individuální znaky.

Výraz mění geometrii obočí, výšku očí, směr zorniček, křivku úst, barvu tváří a tón pozadí. Jednotlivé emoce proto nejsou pouze textovým štítkem.

## Napojení dialogů

Každý produkční uzel v `src/data/dialogues.ts` má explicitní `expression`. UI výraz neodhaduje z českého textu ani ze jména postavy.

Příklady:

- Bohdan při nabídce úkolu používá `stern`,
- při připomínce nebezpečí `concerned`,
- po vítězství `proud` nebo `warm`,
- Kateřina při nízké pověsti `suspicious`,
- při vysoké pověsti `proud`.

`getDialogueDefinitionById` umožňuje UI získat celý autoritativní dialogový uzel podle stabilního `dialogueId` bez duplikování map NPC nebo výrazů.

## Dialogový panel

`UIScene` vykresluje portrét vlevo a textovou část vpravo. Panel zachovává původní kontrakt zavření a questových efektů. Během otevřeného dialogu zveřejňuje:

- `data-dialogue-id`,
- `data-dialogue-portrait`,
- `data-dialogue-expression`.

Přístupný status obsahuje jméno mluvčího, slovní popis emoce a text dialogu.

## Validace

Jednotkové testy ověřují:

- přesně deset unikátních portrétních identit,
- všech šest výrazů,
- všech 60 frameů,
- celočíselné souřadnice a rozměry,
- úplné zachování rámce 48 × 56,
- minimální vizuální hustotu,
- unikátní kompletní atlas každého obyvatele,
- rozdílnost výrazových geometrií,
- explicitní výraz všech produkčních dialogů,
- questové a reputační přepínání emocí.

Playwright na desktopu i mobilním profilu ověřuje Bohdanův přísný portrét a hrdou i nedůvěřivou reputační variantu Kateřiny.

## Současná omezení

- Portréty jsou generované za běhu z kódu a nejsou zatím exportované jako PNG.
- Výrazy jsou statické a nemají mrkání, fonémy ani animaci rtů.
- Panel nezobrazuje protilehlý portrét hráče.
- Dialogy mají jednu větu a jedno zavírací nebo potvrzovací tlačítko; větvený konverzační strom je samostatný budoucí systém.

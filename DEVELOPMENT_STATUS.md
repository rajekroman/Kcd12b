# Development Status

## Aktuální fáze

M4.1 Weather and Lighting — světový čas nyní deterministicky řídí jasno, zataženo, déšť a bouři. Prostředí používá samostatné barevné světlo pro noc, úsvit, den a soumrak, pohyblivé oblačné stíny, srážky, mokré odlesky a bouřkové záblesky.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a testovací oblast Záhoří.
- Deterministický cyklus jasno, zataženo, déšť a bouře.
- Světelné fáze noc, úsvit, den a soumrak.
- Barevné tónování, stmívání, pohyblivé oblačné stíny a mokré odlesky.
- Až 96 dešťových kapek s rychlostí a větrem podle intenzity počasí.
- Dvoufázové bouřkové záblesky.
- HUD štítek počasí a denní fáze.
- Obnovení stejného počasí z uloženého světového času bez změny save formátu.
- Runtime hodnoty srážek, mokra, viditelnosti a blesku pro testy a přístupnost.
- Dvanáct samostatných charakterových atlasů a šest animovaných stavů.
- Deset profesních NPC se skutečně odlišnou siluetou, pokrývkou hlavy a nástrojem.
- Deset portrétních identit se šesti výrazovými variantami.
- Dialogové uzly explicitně určují portrétní emoci.
- Quest „První ocel“ je definován daty a publikuje jednorázovou událost dokončení.
- Pět směrů útoku, směrový kryt, dokonalý kryt a úhyb.
- Inventář, tři sloty vybavení, spotřební předměty a atomický obchod.
- Oddělená pověst sedláků, měšťanů a šlechty s vlivem na dialogy a ceny.
- Vojtěchův zorný kužel, podezření a poplach.
- Adaptivní procedurální hudba pro denní dobu, podezření a poplach.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 4 s migracemi verzí 1, 2 a 3.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Počasí je deterministicky odvozené pouze z denní hodiny a zatím nemá vícedenní seed ani náhodné fronty.
- Déšť, mraky a mokré odlesky jsou screen-space vrstvy; budovy zatím nevytvářejí závětří ani střechy neblokují srážky.
- Počasí zatím neovlivňuje pohyb, stealth, NPC rozvrhy, ceny ani boj.
- Bouřka používá vizuální záblesky bez samostatného hromového zvuku.
- Herní a portrétní atlasy vznikají za běhu z kódu a nejsou exportované jako externí PNG assety.
- Postavy používají boční zrcadlení namísto samostatných čtyřsměrných sad.
- Navigace NPC používá přímý pohyb s Arcade Physics, nikoli pathfinding.
- První stealth pozorovatel je pouze strážný Vojtěch a kužel neprovádí okluzi přes překážky.
- Quest state je stále jeden aktivní quest.

## Další tři priority

1. Přidat lov a faunu.
2. Přidat alchymii a kovářství.
3. Přidat koně a jezdecký systém.

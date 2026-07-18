# Development Status

## Aktuální fáze

M3.2 Expressive Portraits — všech deset obyvatel má samostatný ručně komponovaný portrétní atlas 48 × 56 px se šesti výrazy. Dialogová data explicitně volí emoci a panel zobrazuje správnou tvář podle questu, obsahu rozhovoru a reputace.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a testovací oblast Záhoří.
- Dvanáct samostatných charakterových atlasů ve formátu 20 × 28 px.
- Šest animovaných stavů na herní postavu.
- Deset profesních NPC se skutečně odlišnou siluetou, pokrývkou hlavy a nástrojem.
- Deset samostatných portrétních identit ve formátu 48 × 56 px.
- Šest výrazů na portrét: klidný, vlídný, přísný, ustaraný, nedůvěřivý a hrdý.
- Celkem 60 ručně komponovaných výrazových frameů.
- Dialogové uzly explicitně určují portrétní emoci.
- Bohdan mění výraz mezi zadáním úkolu, varováním a pochvalou.
- Kateřinin portrét reaguje na nízkou, neutrální a vysokou měšťanskou pověst.
- Přístupný dialogový stav obsahuje jméno, text i slovní popis emoce.
- Quest „První ocel“ je definován daty a publikuje jednorázovou událost dokončení.
- Pět směrů útoku, směrový kryt, dokonalý kryt a úhyb.
- Inventář, tři sloty vybavení, spotřební předměty a atomický obchod.
- Oddělená pověst sedláků, měšťanů a šlechty s vlivem na dialogy a ceny.
- Vojtěchův zorný kužel, podezření a poplach.
- Adaptivní procedurální hudba pro denní dobu, podezření a poplach.
- Obecná jednosnímková záloha krátkých vstupů E, Space, Shift a kláves 1–5.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 4 s migracemi verzí 1, 2 a 3.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Herní a portrétní atlasy vznikají za běhu z kódu a zatím nejsou exportované jako externí PNG assety.
- Portréty mají šest výrazů, ale nemají fonémové animace rtů ani mrkání.
- Dialogový panel zatím zobrazuje pouze mluvící NPC, nikoli protilehlý portrét hráče.
- Postavy používají boční zrcadlení pro směr doleva a doprava, nikoli samostatné čtyřsměrné sady.
- Navigace NPC používá přímý pohyb s Arcade Physics, nikoli pathfinding.
- První stealth pozorovatel je pouze strážný Vojtěch a kužel zatím neprovádí okluzi přes překážky.
- Hudba je syntetizovaná v prohlížeči a audio nastavení se zatím neukládá.
- Quest state je stále jeden aktivní quest.

## Další tři priority

1. Přidat počasí a světelné změny prostředí.
2. Přidat lov a faunu.
3. Přidat alchymii, kovářství a koně.

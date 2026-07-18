# Development Status

## Aktuální fáze

M3.1 Character Art — původní společné procedurální panáčky nahradil systém dvanácti ručně definovaných pixelových atlasů. Hráč, lapka i všech deset profesí obyvatel mají vlastní siluetu, paletu, oděv, pokrývku hlavy, pracovní nástroj a animované stavy.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a testovací oblast Záhoří.
- Dvanáct samostatných charakterových atlasů ve formátu 20 × 28 px.
- Šest ručně definovaných stavů na postavu: klid, dva kroky, akce, zranění a spánek.
- Deset profesních NPC se skutečně odlišnou siluetou, pokrývkou hlavy a nástrojem.
- Obyvatelé přepínají chůzi, spánek a profesní pracovní akce podle denního režimu.
- Hráč a lapka reagují animačně na pohyb, útok a zásah.
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

- Atlasy jsou ručně kreslené kódem z pixelových obdélníků; zatím nejsou exportované jako externí PNG assety pro úpravy v grafickém editoru.
- Postavy používají boční zrcadlení pro směr doleva a doprava, nikoli samostatné čtyřsměrné sady.
- Obličejové emoce jsou zatím omezené na herní sprite a nemají samostatné dialogové portréty.
- Navigace NPC používá přímý pohyb s Arcade Physics, nikoli pathfinding.
- První stealth pozorovatel je pouze strážný Vojtěch a kužel zatím neprovádí okluzi přes překážky.
- Hudba je syntetizovaná v prohlížeči a audio nastavení se zatím neukládá.
- Quest state je stále jeden aktivní quest.

## Další tři priority

1. Přidat portréty a výrazové varianty NPC.
2. Přidat počasí a světelné změny prostředí.
3. Přidat lov, alchymii, kovářství a koně.

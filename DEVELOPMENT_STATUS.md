# Development Status

## Aktuální fáze

M2.4 Adaptive Audio — autorská procedurální hudba přes WebAudio je implementovaná a adaptuje se na denní dobu, podezření a poplach. P1 rozsah hratelného vertikálního řezu je uzavřený a ověřený statickými, jednotkovými i desktopovými a mobilními browserovými testy.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a testovací oblast Záhoří.
- Deset datově definovaných obyvatel s celodenními režimy a vlastními dialogy.
- Quest „První ocel“ je definován daty a publikuje jednorázovou událost dokončení.
- Pět směrů útoku, směrový kryt, dokonalý kryt a úhyb.
- Inventář, tři sloty vybavení, spotřební předměty a atomický obchod.
- Oddělená pověst sedláků, měšťanů a šlechty s vlivem na dialogy a ceny.
- Vojtěchův zorný kužel, podezření a poplach.
- Autorské motivy pro úsvit, den, soumrak a noc.
- Adaptivní hudební nálady pro podezření a poplach.
- Pět WebAudio vrstev: ambience, dron, melodie, pulz a perkuse.
- Plynulé přechody gainů, filtrů a dronových frekvencí.
- Explicitní odemčení zvuku uživatelským gestem a ovládání tlačítkem nebo klávesou M.
- Bezpečné vypnutí ovladače při nedostupném WebAudio bez pádu hry.
- Obecná jednosnímková záloha krátkých vstupů E, Space, Shift a kláves 1–5.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 4 s migracemi verzí 1, 2 a 3.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Všichni obyvatelé zatím používají společný procedurální základ sprite s barevným odlišením.
- Navigace NPC používá přímý pohyb s Arcade Physics, nikoli pathfinding.
- První stealth pozorovatel je pouze strážný Vojtěch.
- Zorný kužel zatím neprovádí okluzi přes budovy a stromy.
- Hudba je syntetizovaná v prohlížeči a zatím nepoužívá nahrané historické nástroje ani prostorový ambient.
- Audio nastavení se zatím neukládá do save ani uživatelských preferencí.
- Quest state je stále jeden aktivní quest; vícequestový journal přijde s dalším rozšířením obsahu.

## Další tři priority

1. Nahradit procedurální placeholdery ručně vytvořenými sprite atlasy.
2. Přidat portréty a výrazové varianty NPC.
3. Přidat počasí a další systémový obsah světa.

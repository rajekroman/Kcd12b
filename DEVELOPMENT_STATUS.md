# Development Status

## Aktuální fáze

M2.3 Stealth awareness — zorný kužel strážného, viditelnost hráče, podezření a poplach jsou implementované. Automatická validace pokrývá geometrii kuželu, numerické hranice, růst a rozpad podezření i skutečné browserové scénáře na desktopovém a mobilním profilu.

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
- Vojtěchův zorný kužel reaguje na jeho aktuální směr pohybu.
- Viditelnost respektuje vzdálenost, úhel a floating-point toleranci hranice kuželu.
- Podezření roste rychleji v blízkosti a mimo dohled postupně klesá.
- Tři stavy povědomí: klid, podezření a poplach.
- Světelný kužel mění barvu a intenzitu podle stavu.
- Pevný HUD indikátor zobrazuje stav a procento podezření.
- Přechody stavu zobrazují zprávu a poplach aktivuje kamerový otřes.
- Krátký útok mezerníkem na zařízení s hrubým ukazatelem má bezpečnou jednosnímkovou zálohu.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 4 s migracemi verzí 1, 2 a 3.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Všichni obyvatelé zatím používají společný procedurální základ sprite s barevným odlišením.
- Navigace NPC používá přímý pohyb s Arcade Physics, nikoli pathfinding.
- První stealth pozorovatel je pouze strážný Vojtěch.
- Zorný kužel zatím neprovádí okluzi přes budovy a stromy; kontroluje úhel a vzdálenost.
- Přikrčení, hluk, světelnost prostředí, úkryty a pátrací chování přijdou jako samostatné vrstvy.
- Hudba a ambient ještě nejsou implementované.
- Quest state je stále jeden aktivní quest; vícequestový journal přijde s dalším rozšířením obsahu.

## Další tři priority

1. Přidat dynamické vrstvy hudby přes WebAudio.
2. Nahradit procedurální placeholdery ručně vytvořenými sprite atlasy.
3. Přidat portréty a výrazové varianty NPC.

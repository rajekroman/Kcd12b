# Development Status

## Aktuální fáze

M2.2 Reputation — pověst sedláků, měšťanů a šlechty je implementovaná a ověřená. GitHub Actions úspěšně provedl lint, TypeScript, jednotkové testy, produkční build a Playwright scénáře na desktopovém a mobilním profilu včetně questové odměny, reputačních dialogů, sociálních cen a persistence verze 4.

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
- Oddělená pověst sedláků, měšťanů a šlechty v rozsahu −100 až +100.
- Pět úrovní důvěry: nepřátelská, nedůvěřivá, neutrální, vážená a ctěná.
- Dokončení „První oceli“ přidá sedlákům +15, měšťanům +8 a šlechtě +2 právě jednou.
- Kateřininy nákupní a prodejní ceny reagují na měšťanskou pověst a charisma vybavení.
- Dialogové uzly mohou být podmíněné minimální nebo maximální reputací.
- Inventář zobrazuje reputační hodnotu a úroveň všech tří skupin.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 4 s migracemi verzí 1, 2 a 3.
- Save obsahuje hráče, quest, světový čas, ekonomiku a tři reputační hodnoty.
- Serializované autosavy a okamžitý save po ekonomické nebo reputační změně.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Všichni obyvatelé zatím používají společný procedurální základ sprite s barevným odlišením.
- Navigace NPC používá přímý pohyb s Arcade Physics, nikoli pathfinding.
- Pověst zatím ovlivňuje hlavně Kateřininy ceny a její dialogové varianty; další NPC reakce přibudou s novými questy.
- Hudba a ambient ještě nejsou implementované.
- Quest state je stále jeden aktivní quest; vícequestový journal přijde s dalším rozšířením obsahu.

## Další tři priority

1. Přidat stealth indikátor, světelné kužely a stav podezření.
2. Přidat dynamické vrstvy hudby přes WebAudio.
3. Nahradit procedurální placeholdery ručně vytvořenými sprite atlasy.

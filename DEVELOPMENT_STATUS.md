# Development Status

## Aktuální fáze

M2.0 Living village — deset obyvatel a jejich denní režimy jsou implementované a ověřené. GitHub Actions úspěšně provedl lint, TypeScript, jednotkové testy, produkční build a deset Playwright E2E scénářů na desktopovém a mobilním profilu.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a testovací oblast Záhoří.
- Deset datově definovaných obyvatel s jedinečným jménem, rolí a vizuálním odstínem.
- Celodenní rozvrhy pokrývající spánek, práci, jídlo, obchod, hlídku, modlitbu a společenské aktivity.
- Podpora rozvrhových intervalů přes půlnoc.
- Plynulý pohyb obyvatel mezi 21 pojmenovanými místy.
- Okamžité rozmístění NPC podle uložené fáze dne při pokračování.
- Rozestupy obyvatel na sdílených místech, aby se sprity nepřekrývaly.
- Interakce vybere nejbližšího obyvatele; všech deset má vlastní dialog.
- Quest „První ocel“ je definován daty: stav, objektivy, podmínky a přechody.
- Pět směrů útoku, směrový kryt, dokonalý kryt a úhyb.
- Telegrafované nepřátelské útoky kontrolují dosah v okamžiku dopadu.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 2 s migrací legacy verze 1.
- Ukládání hráče, questu a fáze denního cyklu.
- Serializované autosavy bez závodu staršího a novějšího zápisu.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Všichni obyvatelé zatím používají společný procedurální základ sprite s barevným odlišením.
- Navigace NPC používá přímý pohyb s Arcade Physics, nikoli pathfinding.
- Hudba a ambient ještě nejsou implementované.
- Quest state je stále jeden aktivní quest; vícequestový journal přijde s dalším rozšířením obsahu.

## Další tři priority

1. Přidat inventář, vybavení a obchod.
2. Přidat pověst pro sedláky, měšťany a šlechtu.
3. Přidat stealth indikátor, světelné kužely a stav podezření.

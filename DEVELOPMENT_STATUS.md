# Development Status

## Aktuální fáze

M2.1 Economy — inventář, vybavení a obchod jsou implementované a ověřené. GitHub Actions úspěšně provedl lint, TypeScript, jednotkové testy, produkční build a rozšířenou Playwright sadu na desktopovém a mobilním profilu včetně léčby, nákupu, vybavení a persistence ekonomiky.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a testovací oblast Záhoří.
- Deset datově definovaných obyvatel s celodenními režimy a vlastními dialogy.
- Quest „První ocel“ je definován daty: stav, objektivy, podmínky a přechody.
- Pět směrů útoku, směrový kryt, dokonalý kryt a úhyb.
- Devět datově definovaných předmětů s cenou, váhou, stack limitem a statistikami.
- Inventář s nosností, množstvím, groši a třemi sloty vybavení.
- Vybavená zbraň zvyšuje útok a zbroj snižuje příchozí poškození.
- Spotřební předměty obnovují zdraví a po použití se odečtou.
- Atomický nákup a prodej s kontrolou hotovosti, zásob, nosnosti a stacků.
- Responzivní inventář dostupný klávesou I a mobilním tlačítkem Batoh.
- Kontextový obchod dostupný pouze v interakční vzdálenosti od kupkyně Kateřiny.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Verzovaný save formát 3 s migracemi verzí 1 a 2.
- Save obsahuje hráče, quest, světový čas, inventář, vybavení, groše a zásoby obchodníka.
- Serializované autosavy a okamžitý save po ekonomické změně.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Všichni obyvatelé zatím používají společný procedurální základ sprite s barevným odlišením.
- Navigace NPC používá přímý pohyb s Arcade Physics, nikoli pathfinding.
- Obchod zatím používá pevné základní ceny bez vlivu pověsti, nabídky nebo charisma.
- Hudba a ambient ještě nejsou implementované.
- Quest state je stále jeden aktivní quest; vícequestový journal přijde s dalším rozšířením obsahu.

## Další tři priority

1. Přidat pověst pro sedláky, měšťany a šlechtu.
2. Přidat stealth indikátor, světelné kužely a stav podezření.
3. Přidat dynamické vrstvy hudby přes WebAudio.

# Development Status

## Aktuální fáze

M4.2 Hunting and Fauna — svět nyní obsahuje zajíce, srnce a kance s vlastními pixely, denní aktivitou, touláním a útěkem. Lov používá skutečně potvrzený směrový útok, přidává kořist do existující ekonomiky a ukládá ulovené kusy v save verzi 5.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a testovací oblast Záhoří.
- Tři lovné druhy: zajíc, srnec a kanec.
- Tři stabilní world spawny a druhově odlišné denní intervaly aktivity.
- Ručně komponované fauna atlasy 24 × 18 px se stavy klid, dva kroky, zranění a smrt.
- Deterministické toulání v teritoriu a útěk podle vzdálenosti hráče.
- Viditelnost počasí ovlivňuje vzdálenost, na kterou zvěř hráče zpozoruje.
- Potvrzený útok sjednocený pro přímou klávesnici, mobilní ovládání i fallback.
- Lovný zásah kontroluje skutečný dosah i zvolený směr útoku.
- Zaječí a kančí maso, srnčí zvěřina a dvě kůže jako standardní ekonomické předměty.
- Kořist atomicky respektuje nosnost a stack limity inventáře.
- Ulovené kusy jsou uložené v `world.huntedAnimals` a po reloadu se neobnoví.
- Save formát 5 s validací a migracemi verzí 1, 2, 3 a 4.
- Deterministický cyklus jasno, zataženo, déšť a bouře.
- Světelné fáze noc, úsvit, den a soumrak.
- Barevné tónování, stmívání, oblačné stíny, srážky, mokré odlesky a blesky.
- Dvanáct samostatných charakterových atlasů a šest animovaných stavů.
- Deset profesních NPC se skutečně odlišnou siluetou a nástrojem.
- Deset portrétních identit se šesti výrazovými variantami.
- Quest „První ocel“, pětisměrný boj, obrana a úhyb.
- Inventář, vybavení, spotřební předměty a atomický obchod.
- Oddělená pověst sedláků, měšťanů a šlechty.
- Vojtěchův zorný kužel, podezření a poplach.
- Adaptivní procedurální hudba.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Zvěř má po jednom stabilním kusu každého druhu, nikoli populační simulaci nebo vícedenní respawn.
- Zajíc, srnec i kanec při přiblížení pouze prchají; kanec zatím nezaútočí proti hráči.
- Lov používá stávající zbraně na blízko a zatím neobsahuje luk, šípy, pasti ani stopování.
- Kořist se přidá ihned po usmrcení a nevyžaduje stažení nebo porcování těla.
- Čerstvost masa se zatím nesnižuje časem a počasím.
- Počasí ovlivňuje detekční vzdálenost zvěře, ale zatím ne stopy, pach nebo rychlost pohybu.
- Počasí se opakuje každý herní den podle stejného hodinového rozvrhu.
- Srážky jsou screen-space a střechy je neblokují.
- Herní, portrétní a fauna atlasy vznikají za běhu z kódu a nejsou exportované jako PNG.
- Navigace NPC a zvěře používá přímý Arcade Physics pohyb, nikoli pathfinding.
- Quest state je stále jeden aktivní quest.

## Další tři priority

1. Přidat alchymii a kovářství.
2. Přidat koně a jezdecký systém.
3. Rozšířit lov o luk, stopy, porcování a populační respawn.

# Development Status

## Aktuální fáze

M4.3 Alchemy and Smithing — Anežka a Bohdan nyní zpřístupňují dvě kontextové řemeslné stanice. Pět datových receptů atomicky spotřebovává suroviny, respektuje nosnost a stack limity a ukládá léčiva, materiály i vylepšené vybavení přes existující ekonomický save verze 5.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a testovací oblast Záhoří.
- Anežčin bylinkářský stůl dostupný pouze v jejím interakčním dosahu.
- Bohdanova kovárna dostupná pouze v jeho interakčním dosahu.
- Pět datově definovaných receptů pro alchymii a kovářství.
- Bylinný obklad s léčením 28 a konzervovaná zvěřina s léčením 10.
- Kožené řemeny jako mezimateriál pro výrobu zbroje.
- Kalený Bohdanův meč s útokem +8.
- Vyztužená prošívanice se zbrojí +7.
- Atomická výroba: při chybějící surovině, plném stacku nebo překročené nosnosti se inventář nezmění.
- Spotřebované vybavení se bezpečně uvolní ze slotu před přidáním vylepšené varianty.
- Samostatný responzivní řemeslný panel pro desktop a mobil.
- Klávesa C a dotykové tlačítko Řemeslo.
- Pozastavení fyziky a blokace konfliktů s inventářem během výroby.
- Řemeslné změny používají EconomyStore, `ECONOMY_CHANGED` a existující serializovanou save frontu.
- Tři lovné druhy: zajíc, srnec a kanec s denní aktivitou, útěkem a kořistí.
- Save formát 5 ukládající ekonomiku i `world.huntedAnimals`, s migracemi verzí 1–4.
- Deterministický cyklus jasno, zataženo, déšť a bouře.
- Světelné fáze noc, úsvit, den a soumrak.
- Dvanáct charakterových atlasů, deset portrétních identit a tři fauna atlasy.
- Quest „První ocel“, pětisměrný boj, obrana a úhyb.
- Inventář, vybavení, spotřební předměty a atomický obchod.
- Oddělená pověst sedláků, měšťanů a šlechty.
- Vojtěchův zorný kužel, podezření a poplach.
- Adaptivní procedurální hudba.
- IndexedDB jako primární save úložiště a localStorage fallback.
- Jednotkové a Playwright E2E testy.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Řemesla nemají samostatnou dovednost, zkušenost, kvalitu výrobku ani pravděpodobnost selhání.
- Recepty jsou okamžité a neobsahují časované minihry pro mletí, vaření, kování nebo kalení.
- Stanice jsou vázané na blízkost NPC, nikoli na samostatné interaktivní objekty ve světě.
- Vyrobený kalený meč a vyztužená prošívanice nahrazují základní položku, ale neuchovávají individuální opotřebení.
- Chybí opravy, degradace vybavení, lektvary s vedlejšími účinky a objevování receptů.
- Zvěř má po jednom stabilním kusu každého druhu, nikoli populační simulaci.
- Lov zatím neobsahuje luk, pasti, stopování ani porcování.
- Počasí se opakuje každý herní den podle stejného hodinového rozvrhu.
- Herní, portrétní a fauna atlasy vznikají za běhu z kódu a nejsou exportované jako PNG.
- Navigace NPC a zvěře používá přímý Arcade Physics pohyb, nikoli pathfinding.
- Quest state je stále jeden aktivní quest.

## Další tři priority

1. Přidat koně a jezdecký systém.
2. Rozšířit řemesla o dovednosti, časované kroky, opravy a objevování receptů.
3. Rozšířit lov o luk, stopy, porcování a populační respawn.

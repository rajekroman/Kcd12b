# Changelog

## 0.13.0 — hunting, fauna and persistent world state

- Přidány tři lovné druhy: zajíc, srnec a kanec.
- Přidány tři stabilní world spawny s druhově odlišnými hodinami aktivity a teritoriem.
- Přidány tři ručně komponované fauna atlasy 24 × 18 px.
- Každý druh používá stavy klid, dva kroky, zranění a smrt.
- Zvěř se deterministicky toulá a při přiblížení prchá od hráče.
- Viditelnost počasí ovlivňuje vzdálenost, na kterou zvěř hráče zpozoruje.
- Přidán autoritativní potvrzený útok společný pro klávesnici, mobilní ovládání a input fallback.
- Lovný zásah kontroluje vzdálenost, směr útoku a skutečně přijaté poškození.
- Animace hráče se spouští až po potvrzení skutečně provedeného útoku.
- Přidáno pět kořistních předmětů: zaječí maso, srnčí zvěřina, srnčí kůže, kančí maso a kančí kůže.
- Kořist používá existující ekonomiku, obchodní ceny, nosnost a stack limity.
- Celý balík kořisti se přidává atomicky; částečné přidání při nedostatku místa není možné.
- Přidán observable FaunaStore pro ulovená ID.
- Save formát byl povýšen na verzi 5 a ukládá `world.huntedAnimals`.
- Přidány migrace save verzí 1, 2, 3 a 4 do verze 5.
- Save validátor odmítá neznámá a duplicitní fauna ID.
- Ulovená zvěř se po reloadu neobnoví a kořist se neduplikuje.
- CI nově vždy uchovává samostatný artifact s přesnou TypeScript diagnostikou.
- Přidány jednotkové testy fauna atlasů, aktivity, útěku, zásahů, kořisti a save migrací.
- Přidány desktopové a mobilní Playwright scénáře útěku, lovu, inventáře, IndexedDB a reloadu.

## 0.12.0 — deterministic weather and dynamic lighting

- Přidán deterministický cyklus jasno, zataženo, déšť a bouře odvozený ze světové hodiny.
- Přidány světelné fáze noc, úsvit, den a soumrak.
- Prostředí používá samostatné barevné tónování a stmívání podle počasí a denní fáze.
- Zatažené počasí vykresluje pohyblivé oblačné stíny.
- Déšť používá až 58 deterministických kapek, boční vítr a mokré odlesky.
- Bouře používá až 92 kapek, nižší viditelnost, silnější vítr a dvoufázové bleskové záblesky.
- Přidán HUD štítek počasí a světelné fáze.
- Přidány runtime hodnoty typu počasí, srážek, mokra, viditelnosti, denní fáze a blesku.
- WeatherSystem je čistý model bez Phaser a DOM závislostí.
- WeatherController je oddělený od GameScene a spravuje pouze vizuální runtime vrstvy.
- Save formát zůstává ve verzi 4; počasí se po pokračování obnoví z uloženého světového času.
- Přidány jednotkové testy hranic počasí, světelných fází, parametrů mokra a bleskového cyklu.
- Přidány desktopové a mobilní Playwright scénáře pro jasno, zataženo, déšť a bouři.

## 0.11.0 — expressive dialogue portraits

- Přidáno deset samostatných portrétních identit pro všechny obyvatele Záhoří.
- Každý portrétní atlas obsahuje šest výrazů: klidný, vlídný, přísný, ustaraný, nedůvěřivý a hrdý.
- Celkem je generováno 60 ručně komponovaných portrétních frameů ve formátu 48 × 56 px.
- Portréty zachovávají profesní oděv, pokrývku hlavy, paletu a individuální rysy postavy.
- Přidány vousy, kníry, jizvy, vrásky, pihy, mouka a špína jako datově řízené portrétní znaky.
- Každý produkční dialogový uzel explicitně určuje portrétní výraz.
- Přidán stabilní lookup kompletního dialogového uzlu podle `dialogueId`.
- Dialogový panel byl přepracován na portrétní rozložení s názvem, textem, výrazem a akcí.
- Přístupný herní status nově obsahuje také slovní popis emoce.
- Bohdan mění výraz podle fáze úkolu a výsledku souboje.
- Kateřina mění výraz podle nízké, neutrální nebo vysoké měšťanské pověsti.
- Přidány runtime atributy portrétní identity a výrazu.
- Přidány jednotkové testy všech 60 frameů, hranic, unikátnosti a výrazových rozdílů.
- Přidány desktopové a mobilní Playwright scénáře Bohdana a reputačních variant Kateřiny.

## 0.10.0 — handcrafted character atlases

- Nahrazen společný procedurální placeholder dvanácti samostatnými charakterovými atlasy.
- Přidán hráč, lapka a deset unikátních profesních obyvatel.
- Každá postava má ručně definovanou siluetu, paletu, oděv, pokrývku hlavy a nástroj.
- Přidáno šest stavů na postavu: klid, dva kroky, akce, zranění a spánek.
- Celkem je generováno 72 ručně komponovaných pixelových snímků ve formátu 20 × 28 px.
- Přidáno 60 stabilních Phaser animací pro klid, chůzi, akci, zásah a spánek.
- Obyvatelé používají atlas přímo podle stabilního NPC ID a již nepoužívají runtime tint.
- Chůze reaguje na fyzickou rychlost a postavy se zrcadlí podle směru pohybu.
- Pracující obyvatelé pravidelně spouštějí profesní akce podle svého denního režimu.
- Hráč a lapka reagují animačně na pohyb, útok, přípravu útoku a zásah.
- Přidána čistá validační vrstva kontrolující hranice, celočíselné pixely, hustotu a unikátnost atlasů.
- Zachován původní stabilní formát runtime snapshotu NPC rozvrhů.
- Přidány desktopové a mobilní Playwright testy registrace atlasů a přechodů hráčových animací.

## 0.9.0 — adaptive procedural audio

- Přidány autorské procedurální motivy pro úsvit, den, soumrak a noc.
- Přidány prioritní hudební nálady pro podezření a poplach.
- Přidáno pět nezávislých vrstev: ambience, dron, melodie, pulz a perkuse.
- Hudební rozhodování je oddělené v čistém `MusicSystem` bez závislosti na DOM a WebAudio.
- Přidán WebAudio renderer s filtrovaným šumem, oscilátory, kompresorem a lookahead schedulerem.
- Přechody nálad plynule mění gainy, filtry a dronové frekvence.
- Zvuk se odemyká uživatelským gestem a ovládá tlačítkem nebo klávesou M.
- Nedostupné WebAudio deaktivuje pouze hudbu a neshodí hru.
- Přidány runtime atributy stavu audia a aktuální hudební nálady.
- Přidán obecný fallback velmi krátkých jednorázových kláves E, Space, Shift a 1–5.
- Přidány jednotkové testy denních hranic, priorit, mixů a časování.
- Přidány Playwright testy odemčení, ztlumení, denního/nočního motivu a stealth adaptace.

## 0.8.0 — stealth awareness

- Přidána deterministická geometrie zorného kuželu strážného Vojtěcha.
- Viditelnost respektuje dosah, úhel a numerickou toleranci přesné hranice.
- Přidáno podezření v rozsahu 0–100 a stavy klid, podezření a poplach.
- Podezření roste podle blízkosti a mimo dohled postupně klesá.
- Přidán světelný kužel, HUD indikátor a přístupné runtime atributy.
- Přechody stealth stavu zobrazují zprávy a poplach otřese kamerou.
- Přidány jednotkové testy geometrie, prahů, růstu a rozpadu.
- Přidány browserové testy viditelnosti, poplachu a fyzického úniku z dosahu.

## 0.7.0 — faction reputation

- Přidána samostatná pověst sedláků, měšťanů a šlechty v rozsahu −100 až +100.
- Přidáno pět úrovní důvěry: nepřátelská, nedůvěřivá, neutrální, vážená a ctěná.
- Quest engine publikuje dokončení pouze při prvním skutečném přechodu do stavu `complete`.
- Dokončení „První oceli“ udělí sedlákům +15, měšťanům +8 a šlechtě +2.
- Přidán observable reputační store a samostatný controller questových odměn.
- Inventář zobrazuje hodnotu a slovní úroveň všech tří reputačních skupin.
- Dialogové podmínky podporují minimální a maximální pověst zvolené skupiny.
- Kateřina má neutrální, nedůvěřivý a ctěný dialogový uzel.
- Nákupní a prodejní ceny reagují na měšťanskou pověst a charisma vybavení.
- UI zobrazuje cenu vypočtenou stejnou funkcí, kterou následně používá atomická transakce.
- Save formát byl povýšen na verzi 4 a ukládá všechny tři reputační hodnoty.
- Přidány migrace save verzí 1, 2 a 3 do verze 4.
- Přidána validace rozsahu reputace a odmítnutí poškozených hodnot.
- Přidány jednotkové testy hranic, úrovní, cen, dialogů, questových událostí a migrací.
- Přidány browserové testy questové odměny, ctěného dialogu, sociální ceny a persistence verze 4.

## 0.6.0 — inventory and economy

- Přidáno devět datově definovaných předmětů s kategorií, cenou, váhou, stack limitem a statistikami.
- Přidán startovní inventář, groše, nosnost a tři sloty vybavení.
- Přidány výpočty bonusu útoku, zbroje a charisma z vybavených předmětů.
- Vybavená zbraň ovlivňuje skutečné poškození a zbroj snižuje příchozí zásahy.
- Přidány spotřební předměty obnovující zdraví.
- Přidán atomický nákup a prodej se zásobami a hotovostí Kateřiny.
- Neúspěšná transakce nemění inventář, zásoby ani peníze žádné strany.
- Prodej posledního vybaveného kusu automaticky uvolní příslušný slot.
- Přidán responzivní inventářový panel pro desktop a mobil.
- Batoh lze otevřít klávesou I nebo dotykovým tlačítkem.
- Obchodní režim je dostupný pouze v blízkosti kupkyně Kateřiny.
- Otevřený inventář pozastaví fyziku a herní klávesy.
- Save formát byl povýšen na verzi 3 a nově ukládá inventář, vybavení, groše a zásoby obchodníka.
- Přidány migrace save verzí 1 a 2 do verze 3 s bezpečnou výchozí ekonomikou.
- Ekonomické změny se okamžitě zařadí do serializované save fronty.
- Přidány jednotkové testy nosnosti, stacků, vybavení, spotřeby a transakcí.
- Přidány browserové testy inventáře, léčby, nákupu, vybavení a skutečné persistence verze 3.
- Opraveno nadbytečné přepisování kontextového NPC atributu, které destabilizovalo interaktivní DOM tlačítka.

## 0.5.0 — living village

- Přidáno deset datově definovaných obyvatel Záhoří.
- Každý NPC má vlastní jméno, roli, rychlost, interakční vzdálenost a vizuální odstín.
- Přidáno 21 pojmenovaných míst pro práci, bydlení, obchod a společenské aktivity.
- Přidány celodenní rozvrhy včetně intervalů přes půlnoc.
- Přidán generický převod herního času na aktivitu a cílové místo NPC.
- `NpcManager` vytváří postavy, přesouvá je, aktualizuje popisky a vybírá nejbližší interakci.
- Při pokračování se obyvatelé okamžitě rozmístí podle uloženého času světa.
- Obyvatelé mají na sdílených místech rozestupy, takže se sprity neskládají přes sebe.
- Všech deset obyvatel má vlastní ambientní dialogový uzel.
- Interakce již není pevně svázaná s Bohdanem.
- Přidány testy úplnosti celého 24hodinového rozvrhu všech NPC.
- Přidány browserové kontroly počtu obyvatel, ranních činností, pracovní doby Bohdana a interakce se strážným na trhu.

## 0.4.0 — data-driven content

- Quest „První ocel“ byl přesunut do datové definice stavů, objektivů a přechodů.
- Přidán generický quest engine vyhodnocující události, podmínky a efekty.
- Bohdanovy dialogy byly přesunuty do samostatných datových uzlů.
- Přidán výběr dialogu podle NPC, priority, questového kroku a příznaků.
- Dialogové efekty deklarativně spouštějí questové události.
- `GameScene` již nerozhoduje texty dialogů ani questové přechody hardcoded větvením.
- Opraven text po předčasném poražení lapky: hráč je správně poslán zpět za Bohdanem.
- Zachována kompatibilita existujících save a veřejných questových pomocných funkcí.
- Přidány jednotkové testy definic, priorit, podmínek, efektů a přechodů.
- Přidán Playwright test ověřující stabilní ID vybraného datového dialogového uzlu.

## 0.3.0 — versioned persistence

- IndexedDB je nyní primární úložiště rozehrané hry.
- Přidán localStorage fallback pro nedostupné nebo chybující IndexedDB.
- Save formát byl povýšen na verzi 2 a ukládá také fázi denního cyklu.
- Legacy save verze 1 se automaticky validuje, migruje a po úspěšném přenosu odstraní.
- Poškozený primární záznam již nezakryje validní fallback.
- Úplné selhání obou úložišť je nahlášeno místo tichého předstírání úspěchu.
- Autosavy jsou serializované a nemohou přepsat novější stav starším dokončeným zápisem.
- Menu kontroluje save asynchronně a herní vstupy čekají na dokončení načtení.
- Přidán Playwright test skutečné migrace localStorage → IndexedDB a obnovení pokračování.

## 0.2.1 — melee impact range

- Telegrafovaný nepřátelský útok při dopadu znovu měří skutečnou vzdálenost.
- Hráč, který během nápřahu ustoupí mimo dosah, již neobdrží poškození.
- Přidána čistá validace dosahu s testy hranice, vlastního dosahu a neplatných hodnot.

## 0.2.0 — directional combat

- Přidáno pět směrů útoku s rozdílnou spotřebou výdrže.
- Přidán směrový kryt nepřítele, odkryté směry a tlumené zásahy do krytu.
- Přidán standardní kryt, dokonalý kryt, chybný kryt a prolomení při nízké výdrži.
- Přidán úhyb s cooldownem a krátkým oknem nezranitelnosti.
- Nepřátelské útoky jsou předem telegrafované směrem.
- Mobilní útok podporuje volbu směru tažením; přidána tlačítka Kryt a Úhyb.
- Opraven životní cyklus UI scény a synchronizace počátečního HUD přes `UI_READY`.
- Quest „První ocel“ se již nezablokuje při poražení lapky před rozhovorem.
- Přidány stabilní přístupné runtime stavy a Playwright E2E testy.
- Opraven `package-lock.json`, který odkazoval na neveřejný interní npm registry.
- Přidán produkční preview server simulující GitHub Pages podadresář `/Kcd12b/`.
- CI nyní provádí lint, typecheck, jednotkové testy, produkční build a E2E na desktopovém i mobilním profilu.

## 0.1.0 — bootstrap

- Inicializován webový herní projekt Phaser 3 + TypeScript + Vite.
- Přidána hratelná testovací oblast, pohyb, kolize a kamera.
- Přidán kovář, dialog, první quest a lapka se základní AI.
- Přidán základní souboj, zdraví, výdrž a výpočet poškození.
- Přidáno ukládání, pokračování a jednotkové testy.
- Přidáno dotykové ovládání, PWA a GitHub Pages workflow.
- Opraven životní cyklus UI scény a odstraněno násobné registrování dotykových handlerů.
- Aktualizovány Vite a Vitest na verze bez známých auditovaných zranitelností.

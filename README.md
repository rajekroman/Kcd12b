# Chronicles of Bohemia

Originální 12bitové historické arkádové RPG pro prohlížeč a mobilní zařízení.

![Vizuální koncept](docs/visual-concept.svg)

## Spuštění

```bash
npm install
npm run dev
```

## Kontrola kvality

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Ovládání

### Klávesnice

- Pohyb: WASD nebo šipky.
- Interakce: E.
- Inventář: I; zavření také Escape.
- Útok: mezerník.
- Směr útoku/krytu: pohyb postavy nebo klávesy 1–5.
- Kryt: držet F.
- Úhyb: Shift.
- Adaptivní hudba: M nebo tlačítko Hudba.

### Mobil

- Pohyb: levý dotykový směrový ovladač.
- Inventář: tlačítko Batoh.
- Útok: klepnutí na tlačítko Útok.
- Směr útoku: táhnout po tlačítku Útok směrem nahoru, doleva, doprava nebo šikmo dolů.
- Obrana: držet Kryt; tlačítko Úhyb provede rychlý pohyb posledním směrem.
- Hudba: samostatné tlačítko v pravém horním rohu.

## Vizuální styl postav

Hráč, lapka a všech deset obyvatel používají vlastní ručně definovaný pixelový atlas 20 × 28 px. Každá profese má odlišnou siluetu, paletu, oděv, pokrývku hlavy a pracovní nástroj — například Bohdan kladivo a zástěru, Vojtěch přilbu a kopí, Anežka kápi a košík bylin nebo Kateřina váček kupkyně.

Každá postava má šest stavů: klid, dva kroky chůze, profesní nebo bojovou akci, zranění a spánek. NPC přepínají animace podle pohybu a denního režimu; hráč a lapka reagují na útok a zásah. Vizuál už není založený na jednom společném spritu s barevným tintem.

## Dialogové portréty

Všech deset obyvatel má vlastní ručně komponovaný portrétní atlas 48 × 56 px. Každý atlas obsahuje šest výrazů: klidný, vlídný, přísný, ustaraný, nedůvěřivý a hrdý. Portréty zachovávají profesní oděv a pokrývku hlavy a používají individuální rysy jako vousy, jizvy, vrásky, pihy, mouku nebo špínu.

Výraz není odhadován z textu. Je uložený přímo v datovém dialogovém uzlu, takže se mění podle situace, questu a reputace. Bohdan je při zadání úkolu přísný, při varování ustaraný a po vítězství hrdý nebo vlídný. Kateřina při nízké měšťanské pověsti působí nedůvěřivě, zatímco při vysoké pověsti hrdě a vstřícně.

## Počasí a světlo

Uložený světový čas deterministicky řídí čtyři stavy počasí: jasno, zataženo, déšť a bouři. Po pokračování hry se vždy obnoví stejný stav. Samostatný HUD štítek ukazuje aktuální počasí a světelnou fázi.

Prostředí používá odlišný tón pro noc, úsvit, den a soumrak. Zataženo přidává pohyblivé oblačné stíny, déšť až 58 kapek a mokré odlesky, bouře až 92 kapek, silnější vítr, nižší viditelnost a dvoufázové bleskové záblesky.

## Lov a fauna

Záhoří obývá zajíc, srnec a kanec. Každý druh má vlastní ručně komponovaný atlas 24 × 18 px, zdraví, rychlost, teritorium a intervaly denní aktivity. Zvěř se deterministicky toulá a při přiblížení prchá; za deště nebo bouře si hráče kvůli nižší viditelnosti všimne na kratší vzdálenost.

Lov používá stejný potvrzený směrový útok jako souboj. Zásah musí být v dosahu a ve správném směru. Ulovený kus přidá do standardního inventáře zaječí nebo kančí maso, srnčí zvěřinu či kůži. Kořist respektuje nosnost a stack limit atomicky — při nedostatku místa se částečný obsah nepřidá.

Save verze 5 ukládá seznam ulovených kusů do `world.huntedAnimals`. Po pokračování se mrtvá zvěř znovu neobjeví a kořist zůstává v inventáři. Starší save verze 1–4 se automaticky migrují s prázdným seznamem fauny.

## Inventář a obchod

Batoh obsahuje vybavení, zásoby, nosnost a groše. Zbraň, zbroj a doplněk lze vybavit do samostatných slotů; spotřební předměty se používají přímo z inventáře.

Obchodní záložka se aktivuje pouze v blízkosti kupkyně Kateřiny během jejího denního režimu. Nákup i prodej kontroluje hotovost, zásoby, nosnost a maximální množství v jednom stacku. Loveckou kořist lze prodávat stejným ekonomickým systémem jako ostatní materiály.

## Pověst

Hráč má oddělenou pověst u sedláků, měšťanů a šlechty. Každá hodnota se pohybuje od −100 do +100 a odpovídá jedné z pěti úrovní důvěry: nepřátelská, nedůvěřivá, neutrální, vážená nebo ctěná.

Dokončení úkolu „První ocel“ zvýší pověst u všech tří skupin. Měšťanská pověst společně s charismatem vybavení ovlivňuje Kateřininy nákupní a prodejní ceny, dialog i portrétní výraz.

## Nenápadnost

Strážný Vojtěch má viditelný zorný kužel odvozený z aktuálního směru jeho pohybu. Pobyt uvnitř kuželu zvyšuje podezření od klidu přes varování až k poplachu; blízký cíl je odhalen rychleji. Po opuštění kuželu podezření postupně vyprchá. Aktuální stav a procento zobrazuje herní HUD.

První verze systému vyhodnocuje úhel a vzdálenost. Budovy a stromy zatím výhled fyzicky nezakrývají a hra ještě nepoužívá přikrčení, hluk nebo světelnost prostředí.

## Adaptivní hudba

Hudba je syntetizovaná přímo v prohlížeči pomocí WebAudio a nepoužívá externí nebo převzaté nahrávky. Samostatné autorské motivy reagují na úsvit, den, soumrak a noc. Při podezření přibude temný pulz a při poplachu se zvýší tempo, basová aktivita i perkuse.

Zvuk musí být kvůli pravidlům prohlížeče poprvé spuštěn uživatelským gestem. Tlačítko následně ukazuje aktuální hudební náladu a umožňuje hudbu ztlumit nebo obnovit bez restartu hry.

## Stav

Hratelný řez obsahuje menu, vesnici s deseti animovanými profesními obyvateli a denními režimy, ručně definované atlasy hráče, lapky a tří druhů zvěře, šedesát výrazových portrétních frameů, dynamické počasí a světlo, lov a kořist, datově řízené dialogy a quest, pětisměrný boj, kryt, dokonalý kryt, úhyb, inventář, vybavení, obchod, tři reputační skupiny, stealth, adaptivní hudbu, save verze 5, mobilní ovládání a PWA konfiguraci.

Projekt je samostatné autorské dílo. Nekopíruje chráněné postavy, příběh, mapy, hudbu, dialogy ani vizuální materiály žádné existující hry.

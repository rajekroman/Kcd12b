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

### Mobil

- Pohyb: levý dotykový směrový ovladač.
- Inventář: tlačítko Batoh.
- Útok: klepnutí na tlačítko Útok.
- Směr útoku: táhnout po tlačítku Útok směrem nahoru, doleva, doprava nebo šikmo dolů.
- Obrana: držet Kryt; tlačítko Úhyb provede rychlý pohyb posledním směrem.

## Inventář a obchod

Batoh obsahuje vybavení, zásoby, nosnost a groše. Zbraň, zbroj a doplněk lze vybavit do samostatných slotů; spotřební předměty se používají přímo z inventáře.

Obchodní záložka se aktivuje pouze v blízkosti kupkyně Kateřiny během jejího denního režimu. Nákup i prodej kontroluje hotovost, zásoby, nosnost a maximální množství v jednom stacku.

## Stav

Hratelný řez obsahuje menu, vesnici s deseti obyvateli a denními režimy, datově řízené dialogy a quest, pětisměrný boj, kryt, dokonalý kryt, úhyb, inventář, vybavení, spotřební předměty, obchod, save verze 3, mobilní ovládání a PWA konfiguraci.

Projekt je samostatné autorské dílo. Nekopíruje chráněné postavy, příběh, mapy, hudbu, dialogy ani vizuální materiály žádné existující hry.

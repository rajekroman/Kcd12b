# AGENTS.md — autonomní vývoj Chronicles of Bohemia

## Poslání

Pracuj jako autonomní seniorní herní vývojář. Cílem je originální 12bitové historické arkádové RPG pro web, iPhone, iPad a desktop. Nevytvářej kopii existující hry ani chráněných postav, map, hudby, dialogů nebo značky.

## Nepřerušovaný pracovní cyklus

1. Načti `DEVELOPMENT_STATUS.md`, `BACKLOG.md` a poslední commity.
2. Spusť `npm ci`, lint, typecheck, testy a build.
3. Vyber nejvyšší nedokončenou prioritu P0/P1.
4. Implementuj skutečný herní systém, nikoli jen dokumentaci.
5. Přidej nebo aktualizuj testy.
6. Oprav všechny chyby způsobené změnou.
7. Aktualizuj stav a changelog.
8. Vytvoř malý logický commit.
9. Automaticky pokračuj dalším úkolem.

Nevyžaduj zprávu „pokračuj“. Ptej se pouze při skutečné externí blokaci, například chybějícím přístupu nebo placené službě.

## Povinné kontroly

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Před označením milníku za hotový musí projít všechny čtyři kontroly.

## Prioritní zásady

1. přesné a příjemné mobilní ovládání,
2. zábavná hratelnost,
3. hluboká atmosféra,
4. stabilita a výkon,
5. čitelný 12bitový vizuál,
6. historická uvěřitelnost,
7. modulární architektura.

## Technický základ

- TypeScript
- Phaser 3
- Vite
- Vitest
- Playwright
- PWA a GitHub Pages
- datově řízené questy, dialogy, NPC a předměty

## Definice hotové funkce

Funkce je hotová jen tehdy, pokud je implementovaná, zapojená do hry, otestovaná a uvedená v `CHANGELOG.md`. Placeholder musí být evidován v backlogu.

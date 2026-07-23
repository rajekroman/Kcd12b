# DEFINITION_OF_DONE.md

Funkce je dokončená pouze tehdy, pokud splňuje všechny relevantní body. „Kód existuje“ není Definition of Done.

## 1. Rozsah a architektura

- [ ] Implementace odpovídá issue a neobsahuje nesouvisející redesign.
- [ ] Veřejné kontrakty jsou typované a dokumentované.
- [ ] Doménová pravidla nejsou přímo v Phaser scéně, DOM listeneru ani `src/main.ts`.
- [ ] Autoritativní stav má právě jednoho vlastníka.
- [ ] Nezůstala skrytá dočasná větev logiky nebo placeholder bez backlog položky.
- [ ] Pokud se mění zásadní kontrakt, existuje ADR.

## 2. Funkčnost

- [ ] Hráč může funkci skutečně použít v produkčním průchodu.
- [ ] Úspěch, odmítnutí a hraniční stav mají definované chování.
- [ ] Funkce se správně resetuje při nové hře, změně scény a reloadu.
- [ ] Funkce neblokuje jiné panely, inputy nebo scene lifecycle.
- [ ] Odměna, spotřeba, damage nebo jiná transakce je atomická.

## 3. Persistence

- [ ] Uložený stav se po reloadu obnoví přesně jednou.
- [ ] Nová save verze má migraci všech podporovaných předchozích verzí.
- [ ] Nevalidní save je bezpečně odmítnut nebo opraven definovaným fallbackem.
- [ ] Runtime objekty a odvozené vizuální hodnoty nejsou ukládány.
- [ ] Load neprodukuje duplikaci odměn, NPC, fauny nebo quest eventů.

## 4. Ovládání a UI

- [ ] Desktopová cesta je funkční.
- [ ] Mobilní dotyková cesta je funkční.
- [ ] Portrait layout je použitelný.
- [ ] Landscape layout je použitelný.
- [ ] Safe-area neukrývá ovládací prvky.
- [ ] Ovládací prvky mají čitelné stavy disabled/active/error.
- [ ] Otevření a zavření panelu je opakovatelné bez ztráty inputu.
- [ ] Hlavní hráčská akce má srozumitelnou zpětnou vazbu.

## 5. Vizuál a audio

- [ ] Vizuál dodržuje pixel grid, měřítko a paletu projektu.
- [ ] Nový asset má stabilní ID, původ/licenci a preload pravidlo.
- [ ] Animace reaguje na potvrzenou akci, ne pouze na stisk vstupu.
- [ ] Chybějící audio neblokuje gameplay.
- [ ] Zvuk lze ztlumit a respektuje browser autoplay pravidla.
- [ ] Efekty a particles se po ukončení stavu korektně uvolní.

## 6. Testy

Povinné příkazy:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

- [ ] Čistá pravidla mají unit testy.
- [ ] Integrace více store/systémů má integrační test nebo přesvědčivý E2E.
- [ ] Kritický hráčský průchod má Playwright test.
- [ ] Mobilní změna má mobilní Playwright scénář.
- [ ] Opravená regrese má reprodukční test.
- [ ] Testy nejsou závislé na nespolehlivém timeoutu nebo náhodném pořadí.
- [ ] Dva po sobě jdoucí běhy stejného head SHA jsou zelené u dříve nestabilního E2E.

## 7. Výkon a stabilita

- [ ] Update loop nevytváří neomezené nové objekty/listenery/timery.
- [ ] Scene shutdown uvolní subscribery, DOM listenery a audio nodes.
- [ ] Mobilní runtime zůstává ovladatelný při cílovém FPS.
- [ ] Nové assety nezpůsobují nezdůvodněný skok buildu nebo preloadu.
- [ ] Dlouhá session nevede k viditelnému zpomalování nebo násobení eventů.

## 8. Dokumentace a předání

- [ ] `CHANGELOG.md` popisuje hráčsky relevantní změnu.
- [ ] `DEVELOPMENT_STATUS.md` odpovídá skutečnému stavu.
- [ ] `BACKLOG.md` neoznačuje nedokončenou práci za hotovou.
- [ ] README/ovládání je aktualizováno, pokud se mění uživatelské použití.
- [ ] PR obsahuje kompletní HANDOFF.
- [ ] Vizuální nebo mobilní změna obsahuje portrait i landscape evidence.
- [ ] Jsou uvedena známá omezení, rizika a rollback.

## 9. Stav PR

PR může být označen `Ready for review` pouze pokud:

1. scope je stabilní;
2. všechny povinné kontroly jsou zelené;
3. nejsou známé otevřené regresní chyby v rozsahu;
4. HANDOFF je úplný;
5. branch je aktuální vůči určenému base nebo je konflikt vědomě popsán;
6. PR nemění soubory mimo povolený rozsah bez schválení koordinátora.

PR je dokončen až merge commitem. Samotné schválení nebo zavření issue bez merge není dokončení.
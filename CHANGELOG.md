# Changelog

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

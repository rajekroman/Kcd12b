# Changelog

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

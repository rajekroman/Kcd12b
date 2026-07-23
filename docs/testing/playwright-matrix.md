# Playwright E2E matice

Tato matice je povinným QA základem pro změny ovlivňující runtime, gameplay input nebo UI.

| Projekt | Emulace | Orientace | Povinné kontroly |
| --- | --- | --- | --- |
| `desktop-chromium` | Desktop Chrome | landscape desktop | boot, menu, nová hra, klávesnicový pohyb, modal lifecycle |
| `iphone-portrait` | iPhone 14 / Chromium | portrait | touch pohyb, modal lifecycle, safe-area, překryvy ovládání, scroll/zoom konflikt |
| `iphone-landscape` | iPhone 14 landscape / Chromium | landscape | touch pohyb, modal lifecycle, safe-area, překryvy ovládání, scroll/zoom konflikt |

## Deterministické čekání

E2E testy čekají na veřejné runtime stavy v `data-*` a na animační snímky. Pevné časové prodlevy se nepoužívají tam, kde lze čekat na stav aplikace.

## Sdílená infrastruktura

`e2e/support/game.ts` poskytuje společné kroky pro:

- načtení a readiness hlavního menu;
- spuštění nové hry kliknutím na skutečný Phaser canvas;
- skutečný klávesnicový nebo dotykový pohyb potvrzený změnou obrazu canvasu;
- otevření a zavření inventárního modalu;
- přiložení screenshot evidence do Playwright reportu.

Feature balíky smějí přidávat pouze vlastní assertion. Nemají duplikovat konfiguraci zařízení ani základní herní průchod.

## CI gate

Pro dokončení QA balíku musí stejný head SHA projít dvakrát po sobě. HANDOFF musí uvést oba workflow run IDs a artefakty se screenshoty pro portrait i landscape.

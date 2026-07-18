# Development Status

## Aktuální fáze

M0 Bootstrap — implementováno, ověřeno lintem, TypeScriptem, pěti jednotkovými testy a produkčním buildem. Projekt je publikován v GitHub repozitáři na větvi `main`; CI a GitHub Pages workflow jsou zapojené.

## Funguje

- Vite + TypeScript + Phaser 3.
- Hlavní menu, nová hra a pokračování.
- Pixel-perfect viewport 480 × 270.
- Pohyb WASD/šipky i dotyková tlačítka.
- Kolize, kamera a malá testovací oblast.
- Kovář Bohdan, dialog a quest „První ocel“.
- Lapka, základní AI, útoky, zdraví a výdrž.
- Automatické ukládání a načítání.
- Jednotkové testy doménové logiky.
- PWA konfigurace, CI a GitHub Pages workflow.

## Známé limity

- Grafika je procedurální placeholder.
- Souboj zatím nemá pět směrů, kryt ani úhyb.
- Playwright E2E je připraven, ale lokální běh byl blokován administrativní politikou systémového Chromia (`ERR_BLOCKED_BY_ADMINISTRATOR`).
- Hudba a ambient ještě nejsou implementované.
- První čistý GitHub Actions runner stahuje npm závislosti pomaleji než lokální prostředí; workflow má nastavený 15minutový timeout.

## Další tři priority

1. E2E ověřit start menu, přechod do hry, dialog a útok.
2. Implementovat pětisměrný souboj.
3. Implementovat blok, dokonalý kryt a úhyb.

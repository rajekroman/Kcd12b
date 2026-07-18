# Development Status

## Aktuální fáze

M0 Bootstrap — implementováno a ověřeno lintem, TypeScriptem, jednotkovými testy a produkčním buildem. Integrace do GitHubu je blokována chybějící instalací GitHub App s oprávněním k zápisu.

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
- PWA konfigurace a GitHub Pages workflow.

## Známé limity

- Grafika je procedurální placeholder.
- Souboj zatím nemá pět směrů, kryt ani úhyb.
- Playwright E2E je připraven, ale lokální běh byl blokován administrativní politikou systémového Chromia (`ERR_BLOCKED_BY_ADMINISTRATOR`).
- Hudba a ambient ještě nejsou implementované.

## Další tři priority

1. E2E ověřit start menu, přechod do hry, dialog a útok.
2. Implementovat pětisměrný souboj.
3. Implementovat blok, dokonalý kryt a úhyb.

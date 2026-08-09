# Game Design Document

## Herní smyčka

Průzkum → setkání → rozhodnutí → souboj/dialog/plížení → odměna a reputace → návrat, oprava, spánek → změna světa.

## Perspektiva

3/4 scenic perspective ve stylu kvalitních historických RPG/adventur 90. let. Kamera musí zobrazovat fasády, střechy, cestu ubíhající do hloubky, foreground/midground/background a vzdálený horizont. Nejde o klasickou izometrii ani plochý top-down pohled. Interní rozlišení zůstává 480 × 270 s pixel-perfect škálováním.

Autoritativní vizuální pravidla jsou v `docs/ART_DIRECTION.md` a tracking issue #68. Tyto zdroje mají přednost před starým `docs/visual-concept.svg`.

## Aktuální vertikální řez — visual reboot

- jedna produkčně působící česká středověká vesnická ulice;
- kovárna a hostinec jako skutečné architektonické objekty;
- vzdálená dominanta, vegetace, ploty, bláto, kameny, rekvizity a kůň;
- hráč + minimálně čtyři vizuálně odlišní NPC;
- daylight a evening/night varianta;
- plně stylizovaný HUD, quest panel, dialog s portrétem a quickbar;
- gameplay musí být doložen screenshoty z reálného runtime na desktopu a mobilu.

Expanze světa a nové feature systémy jsou blokované do vizuálního schválení tohoto řezu A0/A7.

## Zachovávaný funkční základ

Existující save/persistence, combat a další doménové systémy, quest/dialogue data, event contracts, NPC runtime logika, build/PWA infrastruktura a testovací tooling se zachovávají tam, kde nebrání nové presentation layer.

## Budoucí systémy

Směrový boj, kryty, zranění částí těla, reputace, obchod, denní režimy NPC, plížení, kůň, řemesla, počasí, adaptivní hudba a více lokací zůstávají součástí produktu, ale jejich další rozšiřování pokračuje až po visual reboot gate.
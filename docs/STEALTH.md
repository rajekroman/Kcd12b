# Stealth Awareness

## Rozsah milníku M2.3

První stealth vertikální řez používá strážného Vojtěcha jako deterministického pozorovatele. Systém je oddělený od `GameScene` a skládá se z čisté doménové geometrie a runtime controlleru.

## Doménová logika

`src/systems/StealthSystem.ts` definuje:

- zorný kužel s počátkem, směrem, dosahem a polovičním úhlem,
- vzorek viditelnosti s reálnou vzdáleností, poměrem dosahu a úhlem,
- podezření v rozsahu 0–100,
- stavy `unaware`, `suspicious` a `alerted`,
- růst podezření podle blízkosti cíle,
- rozpad podezření mimo zorné pole,
- malou floating-point toleranci přesné hranice úhlu a dosahu.

Čisté funkce nejsou závislé na Phaseru. Jednotkové testy ověřují cíl uvnitř kuželu, za pozorovatelem, mimo dosah, přesně na hranici, přechody stavů a úplný rozpad podezření.

## Runtime

`src/game/StealthController.ts` se připojuje k hlavnímu hernímu kroku. Při aktivní `GameScene` vyhledá:

- hráče podle textury `player`,
- Vojtěcha podle stabilního `npcId` `guard-vojtech`.

Směr kuželu sleduje fyzickou rychlost strážného a při stání zachovává poslední platný směr. Controller vykresluje kužel pod postavami, pevný HUD indikátor nad světem a publikuje přístupné atributy:

- `data-player-visible`,
- `data-suspicion`,
- `data-stealth-level`.

Změna úrovně vyvolá stavovou zprávu. Poplach navíc krátce otřese kamerou a adaptivní audio systém přepne do naléhavější hudební nálady.

## Robustnost vstupů

`KeyboardInputFallbackController` chrání krátké jednorázové vstupy, které mohou začít i skončit mezi dvěma snímky Phaseru. Po dvou animačních snímcích porovná přístupný herní stav před a po stisku. Záložní událost vyšle pouze tehdy, když Phaser vstup nezpracoval.

Controller pokrývá:

- interakci E,
- útok Space,
- úhyb Shift,
- volbu směru klávesami 1–5.

Úspěšně zachycený vstup se nezdvojí. Pohybové klávesy zůstávají přímo spravované Phaserem, protože jde o držený stav, nikoli jednorázovou akci.

## Automatická validace

Playwright v desktopovém i mobilním profilu ověřuje:

1. hráče za strážným, který zůstane neviditelný a v klidu,
2. hráče před strážným, který přejde do podezření a poplachu,
3. fyzický únik z dosahu a následný návrat podezření na nulu,
4. stabilní jednorázové herní vstupy na desktopovém i mobilním emulačním profilu,
5. hudební reakci na stavy Podezření a Poplach.

## Současná omezení

Tento milník zatím neobsahuje:

- okluzi výhledu přes budovy, stromy a další překážky,
- přikrčení a krycí postoje,
- hluk kroků, boje nebo manipulace s předměty,
- vliv denního světla a lokálních světelných zdrojů,
- více současných pozorovatelů,
- pátrací a pronásledovací fázi po ztrátě cíle.

Tyto prvky mají být přidány jako samostatné, testovatelné vrstvy nad současným stabilním základem.

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

Změna úrovně vyvolá stavovou zprávu. Poplach navíc krátce otřese kamerou.

## Robustnost vstupů

`CoarseKeyboardFallbackController` zachytí velmi krátký stisk mezerníku na zařízení s hrubým ukazatelem. Na následujícím animačním snímku odešle útok pouze tehdy, když Phaser mezitím nezměnil výdrž. Záloha proto nezdvojuje úspěšně zachycený útok.

## Automatická validace

Playwright v desktopovém i mobilním profilu ověřuje:

1. hráče za strážným, který zůstane neviditelný a v klidu,
2. hráče před strážným, který přejde do podezření a poplachu,
3. diagonální fyzický únik z kuželu a následný návrat podezření na nulu,
4. stabilní útok mezerníkem také na mobilním emulačním profilu.

## Současná omezení

Tento milník zatím neobsahuje:

- okluzi výhledu přes budovy, stromy a další překážky,
- přikrčení a krycí postoje,
- hluk kroků, boje nebo manipulace s předměty,
- vliv denního světla a lokálních světelných zdrojů,
- více současných pozorovatelů,
- pátrací a pronásledovací fázi po ztrátě cíle.

Tyto prvky mají být přidány jako samostatné, testovatelné vrstvy nad současným stabilním základem.

# ARCHITECTURE_CONTRACT.md

Tento dokument definuje povinné architektonické hranice. Nový kód se jim musí přizpůsobit; existující kód se migruje postupně při změnách, nikoli jednorázovým přepisem.

## 1. Základní pravidlo závislostí

Závislosti směřují pouze dovnitř:

```text
platform / Phaser / DOM
        ↓
controllers / adapters
        ↓
application services
        ↓
domain systems + stores
        ↓
data contracts
```

Doménová logika nesmí importovat Phaser, DOM, CSS, WebAudio ani browser storage.

## 2. Logické vrstvy

### Data contracts

Obsahují statické definice a typy:

- položky, recepty, NPC, questy, dialogy, fauna, lokace;
- identifikátory a veřejné typy;
- datové validační funkce;
- žádný mutable runtime stav.

Cílová cesta: `src/data/**` a `src/contracts/**`.

### Domain systems

Obsahují čistá pravidla:

- combat, stealth, crafting, economy, hunting, reputation, quests;
- deterministické funkce a explicitní vstupy/výstupy;
- žádné přímé čtení klávesnice, canvasu nebo času systému.

Cílová cesta: `src/systems/**`.

### Stores

Obsahují autoritativní mutable stav:

- inventář, svět, questy, reputace, fauna, hráč;
- observable změny přes explicitní API;
- žádná vizuální logika.

Cílová cesta: `src/stores/**`.

### Application services

Koordinují více systémů jako jednu transakci:

- například crafting spotřebuje vstupy, aktualizuje vybavení, přidá výstup a publikuje event;
- odpovídají za atomické pořadí změn;
- neřeší vykreslování.

Cílová cesta: `src/application/**`.

### Runtime controllers/adapters

Překládají Phaser, DOM a input do doménových příkazů:

- scény;
- input controllery;
- UI controllery;
- animation controllery;
- audio controllery;
- persistence adapter.

Cílové cesty: `src/game/**`, `src/ui/**`, `src/platform/**`, `src/audio/**`.

## 3. Autoritativní stav

Každá informace má právě jednoho vlastníka.

| Stav | Autorita |
|---|---|
| zdraví, stamina, pozice | player/world store |
| inventář, groše, vybavení | economy store |
| aktivní a dokončené questy | quest store |
| reputace | reputation store |
| ulovená fauna | fauna/world store |
| světový čas a počasí seed | world store |
| otevřený panel, hover, drag | UI controller, ne save |
| animace a particles | runtime view, ne save |

Stejná hodnota se nesmí nezávisle ukládat ve store, scéně a DOM datasetu.

## 4. Příkazy a eventy

### Příkaz

Příkaz vyjadřuje záměr hráče nebo runtime:

- `AttackRequested`
- `CraftRequested`
- `InteractRequested`
- `UseItemRequested`
- `SaveRequested`

Příkaz může být odmítnut s typovaným důvodem.

### Event

Event oznamuje potvrzenou změnu:

- `AttackConfirmed`
- `DamageApplied`
- `ItemCrafted`
- `QuestCompleted`
- `AnimalHunted`
- `ReputationChanged`

UI, animace a audio reagují na potvrzené eventy, nikoli na surový input.

### Pravidla eventů

- názvy jsou v minulém čase pro potvrzený výsledek;
- payload obsahuje stabilní ID, ne Phaser objekty;
- event nesmí být jediným místem, kde existuje autoritativní stav;
- event handler nesmí skrytě mutovat nesouvisející store bez application service;
- veřejné eventy musí být typované a evidované v jednom kontraktu.

## 5. Save kontrakt

- Každá změna uloženého tvaru zvyšuje celočíselnou `version`.
- Každá podporovaná starší verze má deterministickou migraci.
- Save validátor odmítne neznámé enumy, duplicitní ID a nečíselné hodnoty.
- Runtime/DOM/Phaser objekty se nikdy neukládají.
- Odvozené hodnoty se po loadu přepočítají, pokud jejich uložení není nutné pro determinismus.
- Feature PR smí obsahovat nejvýše jednu změnu save verze.
- Migrace musí mít unit test a alespoň jeden browser reload test.

## 6. Determinismus

Pro testovatelnou simulaci musí být explicitně injektováno:

- aktuální herní čas;
- random seed nebo RNG rozhraní;
- delta time;
- vstupní příkazy;
- data definic.

Doménové systémy nesmí přímo používat `Date.now()` ani `Math.random()`.

## 7. Scény a hlavní smyčka

- Phaser scéna organizuje lifecycle a rendering, nikoli pravidla.
- Každý subsystém má malý controller s `start`, `update`, `stop` nebo ekvivalentním lifecycle.
- `src/main.ts` slouží pouze jako composition root; nesmí růst o feature logiku.
- Update pořadí musí být stabilní: input → commands → simulation → confirmed events → view/audio/UI.
- Pause panel musí zastavit pouze relevantní simulaci a nesmí rozbít UI nebo persistence.

## 8. UI a mobilní kontrakt

- HUD nesmí měnit doménový stav přímo; volá příkazy/application service.
- Každá důležitá akce musí mít klávesnicovou i dotykovou cestu.
- Touch area nesmí být menší než 44 CSS px, pokud prostor nevyžaduje zdůvodněnou výjimku.
- Layout respektuje `env(safe-area-inset-*)`.
- Portrait i landscape musí být použitelné bez překrytí hlavního dění.
- Canvas zakazuje nechtěný pinch-zoom a browser scroll pouze v herní ploše, nikoli globálně bez důvodu.
- UI otevření/zavření musí být idempotentní a testovatelné.

## 9. Asset kontrakt

Každý runtime asset má:

- stabilní `assetId`;
- právě jednu položku v manifestu;
- typ (`sprite-sheet`, `image`, `audio`, `font`, `data`);
- zdrojovou cestu;
- rozměry nebo frame metadata;
- licenci/původ;
- preload skupinu;
- fallback nebo explicitní selhání.

Runtime nesmí odvozovat ID z názvu souboru ad-hoc. Asset nesmí být vložen bez ověření mobilního výkonu a velikosti buildu.

## 10. Výkonové rozpočty

Výchozí cíle pro podporovaný mobil:

- stabilních 30 FPS jako minimum, 60 FPS jako cíl;
- žádné neomezené vytváření objektů v update loopu;
- pooling pro často vznikající particles/projectiles;
- texture atlas před množstvím malých samostatných textur;
- omezený počet aktivních audio nodes;
- žádné synchronní velké parsování během gameplay;
- dlouhá session nesmí lineárně zvyšovat počet listenerů nebo timerů.

Výjimka musí být změřena a popsána v PR.

## 11. Testovací hranice

- `src/tests/**`: čisté systémy, stores, validace, migrace.
- integrační test: propojení systému a store bez browseru.
- `e2e/**`: pouze kritické hráčské průchody a regresní chyby.
- E2E nesmí nahrazovat unit test všech kombinací.
- Vizuální změna vyžaduje runtime evidence v portrait i landscape.
- Oprava chyby musí pokud možno nejprve přidat reprodukční test.

## 12. Zakázané vzory

- feature logika přímo v `src/main.ts`;
- přímá mutace store z DOM event listeneru;
- skrytý globální mutable singleton bez lifecycle;
- kopie stejné definice položky nebo NPC ve více souborech;
- magic string ID bez exportovaného kontraktu;
- změna save tvaru bez migrace;
- animace spuštěná před potvrzením gameplay akce;
- testy závislé na náhodném čase nebo pořadí;
- „dočasný“ placeholder vydávaný za dokončený obsah.

## 13. ADR

Rozhodnutí, které mění veřejný kontrakt, save formát, update loop, asset pipeline nebo podporované platformy, musí mít Architecture Decision Record v `docs/adr/`.
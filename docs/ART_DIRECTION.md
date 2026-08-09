# ART_DIRECTION.md — autoritativní vizuální směr

Status: **AUTHORITATIVE**
Owner: **A4**
Gate owners: **A0 + A7**
Tracking issue: **#68**
Base: `e79130c014758f2992cb63196dfd6329917fc506`

## 1. Rozhodnutí

Současná plochá top-down/procedurální presentation layer není cílová podoba produktu. Technické systémy lze zachovat, ale vizuální prezentace se restartuje.

Uživatelem schválená reference z 2026-08-09 definuje cílový charakter produktu: detailní historické RPG/adventura 90. let s malířským pixel-artem, 3/4 perspektivou, scénickou hloubkou, hustou českou středověkou zástavbou a plně integrovaným dobovým UI.

`docs/visual-concept.svg` je od této chvíle pouze historický koncept. Nesmí být používán jako kvalitativní acceptance target.

## 2. Perspektiva a kamera

Cíl není klasická izometrie ani současný pohled shora.

Požadovaný obraz:

- 3/4 scenic perspective;
- viditelné fasády a střechy;
- cesta ubíhá do hloubky scény;
- foreground / midground / background vrstvy;
- viditelný horizont, kopce, les nebo vzdálená dominanta;
- hráč je vizuálně uvnitř prostředí, nikoli ikonou na mapě;
- interní render zůstává pixel-perfect, výchozí target 480 × 270.

## 3. World art

Jedna obrazovka musí působit jako skutečné místo, ne jako debug mapa.

Povinné prvky vertikálního řezu:

- česká středověká vesnická ulice;
- kovárna a hostinec jako rozpoznatelné budovy, ne textové labely;
- ploty, brány, dřevo, sudy, kola, povozy, lavičky a drobný nepořádek;
- bláto, kameny, tráva, koleje, vyšlapaná cesta a materiálové přechody;
- vegetace s více druhy a měřítky;
- vzdálený kostel nebo jiná vertikální dominanta;
- minimálně jeden kůň;
- minimálně čtyři vizuálně odlišní NPC plus hráč;
- daylight a evening/night varianta stejné scény.

Zakázané jako finální prezentace:

- procedurální kruh jako strom;
- obdélník + trojúhelník jako finální dům;
- velké plochy stejné 16×16 textury;
- textové názvy budov nahrazující architekturu;
- čistě geometrické placeholdery;
- prázdné mapové plochy bez detailu a kompozice.

## 4. Postavy

Gameplay postava musí být dost velká, aby nesla charakter.

Výchozí měřítko pro A4 experiment:

- přibližně 48–64 px výška při 480×270 interním rozlišení;
- finální velikost určí runtime screenshot review, nikoli předem pevné číslo.

Postava musí mít:

- čitelnou siluetu;
- oblečení odpovídající profesi a společenské vrstvě;
- materiály a barevné akcenty;
- vybavení nebo pracovní nástroj;
- idle, walk a interact state;
- pro bojové postavy odpovídající combat stance;
- portrét ve stejném výtvarném jazyce.

Procedurálně skládané obdélníkové modely lze používat pouze jako interní testovací fallback, ne jako accepted art.

## 5. UI

UI musí být součástí výtvarné identity hry.

Vertikální řez musí mít:

- player identity/heraldry panel;
- grafické HP / ST / XP bary;
- map/minimap panel;
- active quest panel;
- dialogue panel s výrazným portrétem;
- quickbar s ikonami předmětů;
- inventory / crafting / options affordance;
- konzistentní rámy, ornament, typografii, ikony a materiály.

Finální UI nesmí působit jako developer overlay. Monospace diagnostické boxy lze zachovat jen pro debug/accessibility internals.

## 6. Paleta, materiál a světlo

Vizuální jazyk:

- teplé okrové a zemité povrchy;
- tlumené zelené;
- tmavé dřevo a železo;
- přirozené omítky a střechy;
- omezené, ale výrazné barevné akcenty na postavách a UI;
- směrové denní světlo;
- čitelné kontaktní stíny;
- večer teplé lokální zdroje + chladnější ambient;
- atmosférická separace vzdálených vrstev.

## 7. Kompozice

Každá gameplay scéna musí mít:

1. jasnou cestu pro pohyb hráče;
2. dominantní architektonický nebo krajinný bod;
3. vizuální framing foreground prvky;
4. hustší interaktivní midground;
5. background, který vytváří pocit většího světa;
6. kontrolované místo pro HUD bez zakrývání klíčové akce.

## 8. Vertical slice acceptance

A4/A5 musí dodat screenshoty z reálného runtime, nikoli pouze concept art:

- desktop daylight gameplay;
- desktop evening gameplay;
- dialogue state;
- quickbar/inventory state;
- iPhone portrait UI handling;
- iPhone landscape gameplay.

A7 hodnotí současně:

- funkčnost;
- vizuální konzistenci;
- hustotu detailu;
- čitelnost siluet;
- kompozici;
- absenci placeholderů;
- shodu s tímto dokumentem.

Zelené CI samo o sobě není důkaz vizuálního dokončení.

## 9. Reuse policy

Preferovaně zachovat, pokud nebrání novému rendereru:

- save/persistence;
- combat a další doménové systémy;
- quest/dialogue data;
- event contracts;
- NPC runtime logiku;
- asset validation tooling;
- PWA/build/deployment;
- E2E infrastrukturu.

Lze agresivně nahradit:

- world presentation;
- scene composition;
- camera presentation;
- gameplay sprites;
- environment assets;
- portrait art;
- HUD/dialog/inventory skin;
- placeholder texture generation.

## 10. Release gate

Dokud issue #68 není A0/A7 označeno jako vizuálně přijaté:

- nerozšiřovat svět;
- nepřidávat nové feature systémy mimo nezbytné integrační změny;
- neprohlašovat milestone za release-ready;
- nehodnotit úspěch pouze podle počtu assetů, testů nebo zelených workflow.
# HANDOFF TEMPLATE

Každý implementační PR musí před přesunem do `Ready for review` obsahovat následující blok.

```markdown
## HANDOFF

### Identita balíku
- Issue:
- Větev:
- Base SHA:
- Head SHA:
- Pracovní proud:
- Integrační pořadí:

### Cíl
Jedna až tři věty popisující hráčský nebo technický výsledek.

### Implementováno
- 
- 
- 

### Mimo rozsah
- 
- 

### Změněné kontrakty
- Eventy:
- Stores:
- Save verze/migrace:
- Asset ID:
- Veřejné UI/inputy:

### Validace
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`

Přesné výsledky, head SHA a odkazy na CI:

### Vizuální a mobilní důkaz
- Desktop:
- Mobile portrait:
- Mobile landscape:
- Zařízení/browser nebo emulovaný viewport:

### Save a kompatibilita
- Nová hra:
- Pokračování:
- Migrace starších save:
- Reload během/po funkci:

### Rizika a známé limity
- 
- 

### Soubory s vyšším konfliktním rizikem
- 

### Rollback
Popiš nejmenší bezpečný rollback nebo feature-disable cestu.

### Doporučený integrační krok
Jedna konkrétní instrukce pro koordinátora.
```

## Pravidla

- Neuváděj test jako zelený bez skutečného výsledku pro aktuální head SHA.
- Nevkládej obecné formulace typu „vše funguje“ bez důkazu.
- Pokud se některá část netýká balíku, napiš `N/A` a důvod.
- Známý limit není automaticky blokace; musí však být explicitní.
- HANDOFF se po každém významném opravném commitu znovu aktualizuje.
- Koordinátor při review kontroluje shodu HANDOFFu s diffem a CI.
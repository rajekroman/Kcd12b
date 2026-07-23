# Architecture Decision Records

ADR zachycuje rozhodnutí, které mění dlouhodobý technický kontrakt projektu.

ADR je povinné zejména pro:

- změnu update loopu nebo scene lifecycle;
- nový veřejný command/event kontrakt;
- změnu save schématu nebo migrační strategie;
- novou asset pipeline;
- změnu podporovaných platforem, rendereru nebo hlavní knihovny;
- zavedení globální služby nebo store;
- rozhodnutí, které významně omezuje budoucí implementaci.

## Stav ADR

- `Proposed`
- `Accepted`
- `Superseded`
- `Rejected`
- `Deprecated`

## Pojmenování

`NNNN-short-kebab-case-title.md`

Číslo je rostoucí a nikdy se znovu nepoužívá. Přijaté ADR se neupravuje tak, aby přepsalo historii; nové rozhodnutí vytvoří nové ADR a původní označí jako `Superseded`.
# Topic Schema Types (Sports Domain)

This project supports per-topic structured data typing so each topic page can emit an appropriate schema.org entity.

## V1 Supported (Assignable in Admin)

1. `SPORT` -> `DefinedTerm`
2. `SPORTS_TEAM` -> `SportsTeam`
3. `ATHLETE` -> `Person` (athlete profile semantics)
4. `SPORTS_ORGANIZATION` -> `SportsOrganization`
5. `SPORTS_EVENT` -> `SportsEvent`

`NONE` is the default and renders collection/list structured data only.

## Extended Sports Schema Catalog (Reference/Future)

- `DefinedTerm`
- `SportsTeam`
- `Person` (athlete profile)
- `SportsOrganization`
- `SportsEvent`
- `EventSeries`
- `Place`
- `SportsActivityLocation`
- `Organization`
- `BroadcastEvent`

## Notes

- Sport concept topics are modeled as `DefinedTerm`.
- For non-`NONE` types, a canonical URL is required (`schemaCanonicalUrl`).
- `sameAs` links are curated and rendered only from admin-provided URLs.

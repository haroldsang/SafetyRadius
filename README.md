# SafeRadius Web

SafeRadius is a web MVP for community safety intelligence. It is inspired by Citizen-style nearby incident feeds and crime map products, but the first version focuses on public-data context, transparent safety scoring, and non-enforcement community awareness.

## Current prototype

- Incident map with live Chicago open-data import, severity pins, heat areas, and selected incident detail.
- Nearby incident feed with category filtering.
- Neighborhood safety score and AI-style summary placeholder.
- Community comparison panel.
- Area watch and alert setup UI.

## Run locally

```bash
npm install
npm run dev
```

If this repo already has parent dependencies installed, Vite may also run from this folder by resolving the parent `node_modules`.

## Data sources

The app currently imports recent public reports from the City of Chicago open data portal at runtime:

- Chicago Data Portal: `Crimes - 2001 to Present`
- API endpoint: `https://data.cityofchicago.org/resource/ijzp-q8t2.json`
- Fields used: `id`, `case_number`, `date`, `block`, `primary_type`, `description`, `location_description`, `arrest`, `latitude`, `longitude`, `updated_on`

The UI falls back to local SafeRadius sample data if the live API is unavailable.

Good next data sources for a broader real MVP:

- City open-data crime incident APIs.
- Police department public incident feeds where available.
- FBI Crime Data API for macro-level context.
- Postgres/PostGIS for geospatial querying.

Suggested next city connectors:

- NYC Open Data: NYPD complaint data.
- Los Angeles Open Data: crime data from 2020 to present.
- San Francisco Open Data: police incident reports.

## Product boundary

SafeRadius should not predict individual criminality, identify suspects, expose private victim data, or automate enforcement decisions. Its role is public safety context, pattern explanation, and neighborhood awareness.

# SafeRadius Web

SafeRadius is a web MVP for community safety intelligence. It is inspired by Citizen-style nearby incident feeds and crime map products, but the first version focuses on public-data context, transparent safety scoring, and non-enforcement community awareness.

## Current prototype

- Incident map with mock coordinates, severity pins, heat areas, and selected incident detail.
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

## Data direction

The prototype currently uses local mock data. Good next data sources for a real MVP:

- City open-data crime incident APIs.
- Police department public incident feeds where available.
- FBI Crime Data API for macro-level context.
- Postgres/PostGIS for geospatial querying.

## Product boundary

SafeRadius should not predict individual criminality, identify suspects, expose private victim data, or automate enforcement decisions. Its role is public safety context, pattern explanation, and neighborhood awareness.

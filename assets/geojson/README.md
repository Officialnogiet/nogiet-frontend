# GeoJSON Data Files

This directory holds GeoJSON boundary data for NOGIET map layers.

## Required Files

Place the following GeoJSON files here:

- `nigeria-states.geojson` — Nigerian state boundaries (36 states + FCT)
- `nigeria-lgas.geojson` — Local Government Area boundaries (774 LGAs)
- `oil-blocks.geojson` — Nigerian oil block concession boundaries
- `pipelines.geojson` — Major pipeline network routes

## Data Sources

These files should be sourced from official Nigerian geospatial data providers:

- **GRID3 Nigeria** (grid3.gov.ng) — High-quality administrative boundaries
- **Nigerian Bureau of Statistics** — Official LGA boundaries
- **DPR/NUPRC** — Oil block concession maps
- **NNPC** — Pipeline network data

## Format

All files must be valid GeoJSON FeatureCollections with WGS84 (EPSG:4326) coordinates.

Each feature should include a `properties` object with at minimum:
- `name` — Display name for the feature
- `code` — Unique identifier code

## Placeholder

Until real data is sourced, the application will show a "No layer data" message.
The LayerTogglePanel component gracefully handles missing files.

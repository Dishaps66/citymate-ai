# Data Source Register

| Source | Use | Data label | Notes |
| --- | --- | --- | --- |
| OpenStreetMap Nominatim | Geocoding | live | Backend-only, descriptive user agent, cache successful results. |
| OpenStreetMap Overpass | Nearby places and facilities | live | Bounded radius queries with strict category-to-tag mappings. |
| OSRM public routing service | Road routes | live | Prototype use; do not claim traffic awareness. |
| Open-Meteo Forecast API | Weather | live | Includes model timestamps and retrieved timestamps. |
| Open-Meteo Air Quality API | AQI and pollutant estimates | live | Label as provider/model data. |
| Supabase verified listings | Accommodation | user_submitted | Requires owner submission, verification, moderation, expiration, and reporting. |
| Official transport feeds | Public transport | live or historical | Use GTFS/GTFS-RT only when available; otherwise link official sources. |
| Official documents | RAG | historical | Retrieve with citations; do not treat document text as trusted instructions. |

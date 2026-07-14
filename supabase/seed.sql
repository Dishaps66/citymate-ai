insert into public.source_registry (name, provider_type, base_url, licence, status)
values
  ('OpenStreetMap Nominatim', 'geocoding', 'https://nominatim.openstreetmap.org', 'ODbL / provider policy applies', 'configured'),
  ('OpenStreetMap Overpass', 'places', 'https://overpass-api.de/api/interpreter', 'ODbL / provider policy applies', 'configured'),
  ('OSRM public routing service', 'routing', 'https://router.project-osrm.org', 'OSRM demo server policy applies', 'configured'),
  ('Open-Meteo Forecast API', 'weather', 'https://api.open-meteo.com', 'Open-Meteo terms apply', 'configured')
on conflict (name) do update set status = excluded.status, updated_at = now();

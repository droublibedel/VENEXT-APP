# Industrial pole definition

An **industrial pole** is a manufacturer-aligned operational site (plant, cold chain hub, processing line) registered to an `organization` with extended metadata in `industrial_poles.site_metadata`.

Poles consume:

- `geo_intelligence` signals for inbound/outbound logistics stress.
- `analytics-service` telemetry for throughput charts (web client uses Mapbox GL + Recharts/D3 hybrid).

Mobile surfaces do **not** target pole operators by default; desktop edge + industrial web do.

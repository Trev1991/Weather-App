# Week 6 — Weather App (Springboard)

A simple, modern weather app using **Vanilla JS** and the free **Open‑Meteo** API (no API key required).

## Features
- Search any city (suggested matches)
- Use my location (Geolocation)
- Current conditions + 7‑day forecast
- Unit toggle: Metric (°C, km/h) ↔ Imperial (°F, mph)
- Remembers your last location and units (localStorage)
- Accessible (labels, aria‑live status), responsive layout

## Run it
Just open `index.html` in your browser. If your browser blocks anything, use a tiny local server:

### Python
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Node (optional)
```bash
npm i -g serve
serve .
```

## Tech
- Geocoding: https://geocoding-api.open-meteo.com/v1/search
- Forecast: https://api.open-meteo.com/v1/forecast
- No build tools, no frameworks. All client‑side.

## Notes
- If geolocation is blocked/denied, you can still search by city.
- Icons use emoji via WMO weather code mapping.

// Week 6 Weather App — Vanilla JS, Open‑Meteo (no API key)
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Elements
  const form = $('#search-form');
  const queryInput = $('#query');
  const suggestionsEl = $('#suggestions');
  const unitRadios = $$('input[name="units"]');
  const placeName = $('#placeName');
  const asOf = $('#asOf');
  const tempNow = $('#tempNow');
  const feelsLike = $('#feelsLike');
  const humidity = $('#humidity');
  const wind = $('#wind');
  const precip = $('#precip');
  const summary = $('#summary');
  const forecastGrid = $('#forecastGrid');
  const statusEl = $('#status');
  const useMyLocationBtn = $('#useMyLocation');

  // State
  let units = localStorage.getItem('w6_units') || 'metric'; // 'metric' | 'imperial'
  let lastLocation = JSON.parse(localStorage.getItem('w6_last_loc') || 'null'); // {name, lat, lon}

  // Apply saved units
  $$('input[name="units"]').forEach(r => r.checked = r.value === units);

  // Helpers
  const weatherIcon = (code) => {
    // WMO codes mapping -> emoji
    if (code === 0) return '☀️ Clear';
    if ([1,2].includes(code)) return '🌤️ Mostly clear';
    if (code === 3) return '☁️ Overcast';
    if ([45,48].includes(code)) return '🌫️ Fog';
    if ([51,53,55,56,57].includes(code)) return '🌦️ Drizzle';
    if ([61,63,65,66,67,80,81,82].includes(code)) return '🌧️ Rain';
    if ([71,73,75,77,85,86].includes(code)) return '🌨️ Snow';
    if ([95,96,99].includes(code)) return '⛈️ Thunderstorm';
    return '🌡️ Weather';
  };
  const fmtTemp = (v) => v == null ? '–' : `${Math.round(v)}°`;
  const fmtPct = (v) => v == null ? '–' : `${Math.round(v)}%`;
  const fmtWind = (v, dir) => {
    if (v == null) return '–';
    const arrow = dir != null ? ` ${degToArrow(dir)}` : '';
    return `${Math.round(v)}${units === 'imperial' ? ' mph' : ' km/h'}${arrow}`;
  };
  const fmtPrecip = (v) => {
    if (v == null) return '–';
    return `${(v).toFixed(1)} ${units === 'imperial' ? 'in' : 'mm'}`;
  };
  const degToArrow = (deg) => {
    const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
    return dirs[Math.round(deg / 45) % 8];
  };
  const dayName = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });

  const setStatus = (msg) => { statusEl.textContent = msg || ''; };

  const getJSON = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  // Geocoding via Open‑Meteo (no key)
  async function geocode(name) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`;
    const data = await getJSON(url);
    return (data.results || []).map(r => ({
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      lat: r.latitude,
      lon: r.longitude
    }));
  }

  function buildForecastURL(lat, lon) {
    const isImp = units === 'imperial';
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      timezone: 'auto',
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
      temperature_unit: isImp ? 'fahrenheit' : 'celsius',
      wind_speed_unit: isImp ? 'mph' : 'kmh',
      precipitation_unit: isImp ? 'inch' : 'mm'
    });
    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  }

  async function fetchAndRender(lat, lon, label) {
    setStatus('Loading weather…');
    try {
      const data = await getJSON(buildForecastURL(lat, lon));
      renderCurrent(data, label);
      renderForecast(data);
      localStorage.setItem('w6_last_loc', JSON.stringify({ name: label, lat, lon }));
      setStatus('');
    } catch (err) {
      console.error(err);
      setStatus('Could not load weather. Try again.');
    }
  }

  function renderCurrent(data, label) {
    placeName.textContent = label;
    const c = data.current;
    const iconText = weatherIcon(c.weather_code);
    const [icon, ...rest] = iconText.split(' ');
    tempNow.textContent = fmtTemp(c.temperature_2m);
    summary.textContent = rest.join(' ') || '—';
    tempNow.setAttribute('data-icon', icon);
    feelsLike.textContent = fmtTemp(c.apparent_temperature);
    humidity.textContent = fmtPct(c.relative_humidity_2m);
    wind.textContent = fmtWind(c.wind_speed_10m, c.wind_direction_10m);
    precip.textContent = fmtPrecip(c.precipitation);
    asOf.textContent = new Date().toLocaleString();
  }

  function renderForecast(data) {
    const d = data.daily;
    forecastGrid.innerHTML = '';
    for (let i = 0; i < d.time.length; i++) {
      const card = document.createElement('div');
      card.className = 'card';
      const iconText = weatherIcon(d.weather_code[i]);
      const pieces = iconText.split(' ');
      const icon = pieces[0];
      const label = pieces.slice(1).join(' ');

      card.innerHTML = `
        <div class="day">${dayName(d.time[i])}</div>
        <div class="icon" title="${label}">${icon}</div>
        <div class="hi">${fmtTemp(d.temperature_2m_max[i])}</div>
        <div class="lo">${fmtTemp(d.temperature_2m_min[i])}</div>
      `;
      forecastGrid.appendChild(card);
    }
  }

  // Suggestions UI
  function showSuggestions(list) {
    suggestionsEl.innerHTML = '';
    list.forEach((item, idx) => {
      const li = document.createElement('li');
      li.role = 'option';
      const label = [item.name, item.admin1, item.country].filter(Boolean).join(', ');
      li.textContent = label;
      li.addEventListener('click', () => {
        suggestionsEl.innerHTML = '';
        queryInput.value = label;
        fetchAndRender(item.lat, item.lon, label);
      });
      suggestionsEl.appendChild(li);
    });
  }

  // Events
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = queryInput.value.trim();
    if (!q) return;
    setStatus('Searching…');
    try {
      const results = await geocode(q);
      setStatus('');
      if (results.length === 0) {
        showSuggestions([]);
        setStatus('No matches found.');
        return;
      }
      // If one clear match, fetch directly; else show list
      const uniqueCountries = new Set(results.map(r => r.country));
      if (results.length === 1 || (results.length > 1 && uniqueCountries.size === 1)) {
        const first = results[0];
        const label = [first.name, first.admin1, first.country].filter(Boolean).join(', ');
        fetchAndRender(first.lat, first.lon, label);
        suggestionsEl.innerHTML = '';
      } else {
        showSuggestions(results);
      }
    } catch (err) {
      console.error(err);
      setStatus('Search failed. Try again.');
    }
  });

  unitRadios.forEach(r => r.addEventListener('change', () => {
    units = r.value;
    localStorage.setItem('w6_units', units);
    // Refresh current view if we have a location
    const loc = JSON.parse(localStorage.getItem('w6_last_loc') || 'null');
    if (loc) fetchAndRender(loc.lat, loc.lon, loc.name);
  }));

  useMyLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported.');
      return;
    }
    setStatus('Getting location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        fetchAndRender(lat, lon, 'My Location');
      },
      (err) => {
        console.error(err);
        setStatus('Location blocked or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

  // Auto-load last location on start
  if (lastLocation) {
    fetchAndRender(lastLocation.lat, lastLocation.lon, lastLocation.name);
  } else {
    // Seed with a default city for first run (Chicago)
    fetchAndRender(41.881832, -87.623177, 'Chicago, IL, USA');
  }
})();

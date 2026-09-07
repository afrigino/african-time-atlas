/* ============================================================
   African Kingdoms Atlas — app.js
   Leaflet map + timeline slider + search filtering
   Data is provided by data.js (global KINGDOM_DATA)
   ============================================================ */

(function () {
  'use strict';

  const DATA = window.KINGDOM_DATA || { states: [], tradeRoutes: [] };
  const STATES = DATA.states || [];
  const ROUTES = DATA.tradeRoutes || [];

  const REGION_COLORS = {
    'West Africa': '--c-west',
    'Horn of Africa': '--c-horn',
    'Nile Valley': '--c-nile',
    'Central Africa': '--c-central',
    'East Africa': '--c-east',
    'Southern Africa': '--c-southern',
    'West African coast': '--c-coast',
    'North Africa': '--c-north'
  };

  function regionColorVar(region) {
    return REGION_COLORS[region] || '--color-primary';
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function regionColor(region) {
    return cssVar(regionColorVar(region));
  }

  /* ---------- State ---------- */
  const state = {
    year: 800,
    query: '',
    regions: new Set(),
    selectedId: null,
    playing: false,
    playTimer: null,
    markers: new Map(),     // id -> Leaflet marker
    routeLayers: [],        // active route polyline layers
    routeLabels: []
  };

  /* ---------- Map setup ---------- */
  const map = L.map('map', {
    center: [8, 8],
    zoom: 3,
    minZoom: 2,
    maxZoom: 8,
    zoomControl: true,
    scrollWheelZoom: true,
    worldCopyJump: false,
    maxBounds: [[-38, -25], [46, 60]],
    maxBoundsViscosity: 0.7
  });

  // Tile layer — use key-free OSM standard tiles with a warm parchment CSS filter
  const tileLight = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19
  });
  const tileDark = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19
  });

  let currentTiles = tileLight;
  function applyTiles() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const pane = map.getPane('tilePane');
    if (pane) {
      pane.style.filter = dark
        ? 'invert(1) hue-rotate(180deg) brightness(0.82) sepia(0.25) saturate(0.75)'
        : 'sepia(0.35) saturate(0.9) hue-rotate(-10deg) brightness(1.05) contrast(0.98)';
    }
    if (dark && currentTiles === tileLight) { map.removeLayer(tileLight); tileDark.addTo(map); currentTiles = tileDark; }
    if (!dark && currentTiles === tileDark) { map.removeLayer(tileDark); tileLight.addTo(map); currentTiles = tileLight; }
    // recolor layers on theme switch
    renderTerritories();
    renderMarkers();
    renderRoutes();
  }
  tileLight.addTo(map);

  // Layer groups (territory polygons below routes below markers)
  const territoryLayer = L.layerGroup().addTo(map);
  const routeLayer = L.layerGroup().addTo(map);
  const markerLayer = L.layerGroup().addTo(map);

  /* ---------- Marker creation ---------- */
  function makeIcon(st, isPeak, dimmed) {
    const color = regionColor(st.region);
    const base = isPeak ? 22 : 14;
    const size = base * 2;
    const opacity = dimmed ? 0.32 : 1;
    const peakClass = isPeak ? ' km-dot--peak' : '';
    return L.divIcon({
      className: 'kingdom-marker',
      html: `<div class="km-dot${peakClass}" style="width:${base}px;height:${base}px;background:${color};opacity:${opacity}"></div>` +
        (isPeak ? `<div class="km-label" style="opacity:${opacity}">${escapeHtml(st.name)}</div>` : ''),
      iconSize: [size, size],
      iconAnchor: [base, base],
      popupAnchor: [0, -base]
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------- Visibility logic ---------- */
  function isStateVisible(st) {
    // Active in current year, OR (if year outside range) still show if within a tolerance window for context
    return st.start <= state.year && state.year <= st.end;
  }
  function isPeak(st) {
    return st.peakStart && st.peakEnd && st.peakStart <= state.year && state.year <= st.peakEnd;
  }
  function matchesSearch(st) {
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    const hay = [
      st.name, st.region, st.summary,
      ...(st.tradePartners || []), ...(st.culturalExports || []),
      ...(st.capitalOrCenters || [])
    ].join(' ').toLowerCase();
    return hay.includes(q);
  }
  function matchesRegion(st) {
    if (state.regions.size === 0) return true;
    return state.regions.has(st.region);
  }

  /* ---------- Render markers ---------- */
  function renderMarkers() {
    markerLayer.clearLayers();
    state.markers.clear();
    for (const st of STATES) {
      const visible = isStateVisible(st) && matchesSearch(st) && matchesRegion(st);
      const peak = isPeak(st);
      const dimmed = state.query && !matchesSearch(st);
      if (!visible && !dimmed) continue;

      const marker = L.marker([st.center[0], st.center[1]], {
        icon: makeIcon(st, peak, dimmed),
        zIndexOffset: peak ? 1000 : 0
      });
      marker.bindPopup(() => popupHtml(st), { maxWidth: 280 });
      marker.on('click', () => selectState(st.id, false));
      markerLayer.addLayer(marker);
      state.markers.set(st.id, marker);
    }
    updateActiveCount();
  }

  function popupHtml(st) {
    const peak = isPeak(st);
    return `<strong style="font-family:var(--font-display);font-size:1.05rem">${escapeHtml(st.name)}</strong><br>` +
      `<span style="color:var(--color-primary);font-size:0.8rem">${st.start}–${st.end} CE</span>` +
      (peak ? ' <span style="font-size:0.7rem;background:color-mix(in oklab,var(--color-primary) 15%,transparent);padding:1px 6px;border-radius:4px;color:var(--color-primary)">PEAK</span>' : '') +
      `<br><span style="font-size:0.78rem;color:var(--color-text-muted)">${escapeHtml(st.region)}</span>` +
      `<br><button onclick="document.querySelector('[data-kingdom-id=&quot;${st.id}&quot;]').click()" style="margin-top:6px;font-size:0.78rem;color:var(--color-primary);text-decoration:underline">View details →</button>`;
  }

  function updateActiveCount() {
    const active = STATES.filter(s => isStateVisible(s));
    const peaks = active.filter(isPeak);
    let filtered = active;
    let label = active.length + ' active state' + (active.length === 1 ? '' : 's');
    if (peaks.length) label += ' · ' + peaks.length + ' at peak';
    const filtering = state.query || state.regions.size > 0;
    if (filtering) {
      filtered = active.filter(s => matchesSearch(s) && matchesRegion(s));
      label = filtered.length + ' of ' + active.length + ' matching';
    }
    const el = document.getElementById('active-count');
    if (!el) return;
    el.textContent = label;
  }

  /* ---------- Render trade routes ---------- */
  function renderRoutes() {
    routeLayer.clearLayers();
    state.routeLayers = [];
    for (const r of ROUTES) {
      const active = r.start <= state.year && state.year <= r.end;
      const color = cssVar('--color-accent');
      const poly = L.polyline(r.path, {
        color: color,
        weight: active ? 3 : 1.5,
        opacity: active ? 0.6 : 0.18,
        dashArray: active ? null : '4 6',
        className: 'km-route'
      });
      const label = L.tooltip({ permanent: false, sticky: true, className: 'km-route-label' }).setContent(r.name);
      poly.bindTooltip(label);
      poly.addTo(routeLayer);
      state.routeLayers.push(poly);
    }
  }

  /* ---------- Render territory polygons ---------- */
  function renderTerritories() {
    territoryLayer.clearLayers();
    const filtering = state.query || state.regions.size > 0;
    for (const st of STATES) {
      if (!st.territory || st.territory.length < 3) continue;
      const visible = isStateVisible(st);
      if (!visible) continue;
      const peak = isPeak(st);
      const color = regionColor(st.region);
      const dimmed = filtering && !(matchesSearch(st) && matchesRegion(st));
      const poly = L.polygon(st.territory, {
        color: color,
        weight: peak ? 2 : 1.2,
        opacity: dimmed ? 0.2 : (peak ? 0.9 : 0.6),
        fillColor: color,
        fillOpacity: dimmed ? 0.04 : (peak ? 0.16 : 0.08),
        className: 'km-territory'
      });
      poly.bindTooltip(st.name + ' territory (approximate peak extent)', { sticky: true, className: 'km-route-label' });
      poly.on('click', () => selectState(st.id, false));
      poly.addTo(territoryLayer);
    }
  }

  /* ---------- Details panel ---------- */
  function selectState(id, fly) {
    state.selectedId = id;
    const st = STATES.find(s => s.id === id);
    if (!st) return;
    if (fly && st.center) map.flyTo([st.center[0], st.center[1]], Math.max(map.getZoom(), 5), { duration: 0.8 });
    renderPanel(st);
    if (state.markers.has(id)) state.markers.get(id).openPopup();
  }

  function renderPanel(st) {
    const panel = document.getElementById('panel');
    const peak = isPeak(st);
    const evidence = (st.evidenceType || []).map(e => `<span class="evidence-tag">${escapeHtml(e)}</span>`).join('');
    const chips = (arr) => (arr || []).map(c => `<span class="chip">${escapeHtml(c)}</span>`).join('');
    const sources = (st.primarySources || []).filter(s => s.url && s.url !== 'n.a.').map(s =>
      `<a class="kingdom__source" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">
        <div class="kingdom__source-type">Primary source</div>
        <div class="kingdom__source-label">${escapeHtml(s.label)}</div>
        ${s.note ? `<div class="kingdom__source-note">${escapeHtml(s.note)}</div>` : ''}
      </a>`
    ).join('');
    const secSources = (st.sources || []).map(s =>
      `<a class="kingdom__source" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">
        <div class="kingdom__source-type">Reference</div>
        <div class="kingdom__source-label">${escapeHtml(s.label)}</div>
        ${s.pagesOrChapter ? `<div class="kingdom__source-note">${escapeHtml(s.pagesOrChapter)}</div>` : ''}
      </a>`
    ).join('');

    panel.innerHTML = `
      <article class="kingdom" data-kingdom-id="${st.id}">
        <div class="kingdom__region"><span class="kingdom__region-dot" style="background:${regionColor(st.region)}"></span>${escapeHtml(st.region)}</div>
        <h2 class="kingdom__name">${escapeHtml(st.name)}</h2>
        <div class="kingdom__dates">${st.start}–${st.end} CE${peak ? `<span class="kingdom__peak-badge">PEAK ${st.peakStart}–${st.peakEnd}</span>` : ''}</div>
        <p class="kingdom__summary">${escapeHtml(st.summary)}</p>

        ${st.capitalOrCenters && st.capitalOrCenters.length ? `
        <div class="kingdom__section">
          <div class="kingdom__label">Centers &amp; capitals</div>
          <div class="kingdom__capital">${st.capitalOrCenters.map(escapeHtml).join(' · ')}</div>
          <div class="kingdom__coords">${st.center[0].toFixed(2)}°, ${st.center[1].toFixed(2)}°</div>
        </div>` : ''}

        <div class="kingdom__section">
          <div class="kingdom__label">Primary trade partners</div>
          <div class="kingdom__chips">${chips(st.tradePartners)}</div>
        </div>

        <div class="kingdom__section">
          <div class="kingdom__label">Key cultural exports</div>
          <div class="kingdom__chips">${chips(st.culturalExports)}</div>
        </div>

        <div class="kingdom__section">
          <div class="kingdom__label">Evidence base</div>
          <div class="kingdom__evidence">${evidence}</div>
        </div>

        ${sources ? `
        <div class="kingdom__section">
          <div class="kingdom__label">Primary source accounts</div>
          <ul class="kingdom__list">${sources}</ul>
        </div>` : ''}

        ${secSources ? `
        <div class="kingdom__section">
          <div class="kingdom__label">Sources &amp; references</div>
          <ul class="kingdom__list">${secSources}</ul>
        </div>` : ''}
      </article>
    `;
    panel.scrollTop = 0;
  }

  /* ---------- Timeline ---------- */
  const slider = document.getElementById('year-slider');
  const yearValue = document.getElementById('year-value');

  function onYearChange() {
    state.year = parseInt(slider.value, 10);
    yearValue.textContent = state.year;
    renderTerritories();
    renderMarkers();
    renderRoutes();
  }
  slider.addEventListener('input', onYearChange);

  // ticks
  const tickContainer = document.getElementById('timeline-ticks');
  const tickYears = [500, 750, 1000, 1250, 1500, 1750, 1850];
  tickYears.forEach(y => {
    const pct = ((y - 500) / (1850 - 500)) * 100;
    const el = document.createElement('div');
    el.className = 'timeline__tick';
    el.style.left = pct + '%';
    el.textContent = y;
    tickContainer.appendChild(el);
  });

  // play
  const playBtn = document.getElementById('play-btn');
  playBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    playBtn.setAttribute('aria-pressed', String(state.playing));
    playBtn.querySelector('span').textContent = state.playing ? 'Pause' : 'Animate';
    playBtn.querySelector('svg').innerHTML = state.playing
      ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
      : '<path d="M8 5v14l11-7z"/>';
    if (state.playing) {
      if (state.year >= 1850) { slider.value = 500; }
      state.playTimer = setInterval(() => {
        let next = parseInt(slider.value, 10) + 15;
        if (next > 1850) { stopPlay(); return; }
        slider.value = next;
        onYearChange();
      }, 320);
    } else {
      stopPlay();
    }
  });
  function stopPlay() {
    state.playing = false;
    clearInterval(state.playTimer);
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.querySelector('span').textContent = 'Animate';
    playBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>';
  }

  /* ---------- Search ---------- */
  const search = document.getElementById('search');
  const clearBtn = document.getElementById('clear-search');
  let searchDebounce;
  search.addEventListener('input', () => {
    state.query = search.value.trim();
    clearBtn.hidden = !state.query;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => { renderTerritories(); renderMarkers(); }, 120);
  });
  clearBtn.addEventListener('click', () => {
    search.value = ''; state.query = ''; clearBtn.hidden = true; renderTerritories(); renderMarkers(); search.focus();
  });

  /* ---------- Region filter chips ---------- */
  const regionFilter = document.getElementById('region-filter');
  const regions = [...new Set(STATES.map(s => s.region))].sort();
  regions.forEach(r => {
    const chip = document.createElement('button');
    chip.className = 'region-chip';
    chip.setAttribute('aria-pressed', 'false');
    chip.innerHTML = `<span class="region-chip__swatch" style="background:${regionColor(r)}"></span>${r}`;
    chip.addEventListener('click', () => {
      if (state.regions.has(r)) { state.regions.delete(r); chip.setAttribute('aria-pressed', 'false'); }
      else { state.regions.add(r); chip.setAttribute('aria-pressed', 'true'); }
      renderTerritories();
      renderMarkers();
    });
    regionFilter.appendChild(chip);
  });

  /* ---------- Map click for state selection via marker ---------- */
  map.on('click', (e) => {
    // clicking empty map closes panel selection highlight
    if (e.originalEvent.target && e.originalEvent.target.closest('.kingdom-marker')) return;
  });

  /* ---------- Modals ---------- */
  // Open a <dialog> via showModal() when allowed, falling back to show()
  // (some sandboxed preview iframes block the modal dialog API).
  function openDialog(d) {
    if (!d) return;
    try { d.showModal(); }
    catch (_) { d.show(); }
  }
  document.querySelectorAll('[data-action="toggle-info"]').forEach(b => b.addEventListener('click', () => openDialog(document.getElementById('modal-info'))));
  document.querySelectorAll('[data-action="toggle-method"]').forEach(b => b.addEventListener('click', () => {
    populateMethodSources();
    openDialog(document.getElementById('modal-method'));
  }));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
    const d = document.getElementById(b.dataset.close); if (d) d.close();
  }));
  // close modal on backdrop click
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => {
    if (e.target === m) m.close();
  }));

  function populateMethodSources() {
    const list = document.getElementById('method-sources');
    // dedupe all sources across states
    const seen = new Set();
    const items = [];
    for (const st of STATES) {
      for (const s of [...(st.sources || []), ...(st.primarySources || [])]) {
        if (!s.url || s.url === 'n.a.' || seen.has(s.url)) continue;
        seen.add(s.url);
        items.push(`<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>${s.note ? `<p>${escapeHtml(s.note)}</p>` : ''}</li>`);
      }
    }
    list.innerHTML = items.join('');
  }

  /* ---------- Theme toggle ---------- */
  const themeToggle = document.querySelector('[data-theme-toggle]');
  let theme = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  function syncThemeIcon() {
    themeToggle.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    themeToggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
  }
  syncThemeIcon();
  themeToggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    syncThemeIcon();
    applyTiles();
  });

  /* ---------- Init ---------- */
  applyTiles();
  renderTerritories();
  renderMarkers();
  renderRoutes();
  // expose selectState for popup buttons
  window.__atlasSelect = selectState;

  // auto-select a peak state at the starting year for a good first impression
  const peakAtStart = STATES.find(s => isStateVisible(s) && isPeak(s)) || STATES.find(isStateVisible);
  if (peakAtStart) setTimeout(() => selectState(peakAtStart.id, true), 600);
})();

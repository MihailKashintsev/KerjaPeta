// Логика демонстрационного прототипа KerjaPeta (карта — OpenLayers, openlayers.org).

let homeLonLat = null; // [lng, lat]
const fromLonLat = ol.proj.fromLonLat;
const toLonLat = ol.proj.toLonLat;

// ---------- Источники и слои ----------
const factorySource = new ol.source.Vector();
const transportSource = new ol.source.Vector();
const housingSource = new ol.source.Vector();
const coursesSource = new ol.source.Vector();
const homeSource = new ol.source.Vector();
const routeSource = new ol.source.Vector();

const factoryLayer = new ol.layer.Vector({ source: factorySource });
const transportLayer = new ol.layer.Vector({ source: transportSource });
const housingLayer = new ol.layer.Vector({ source: housingSource });
const coursesLayer = new ol.layer.Vector({ source: coursesSource });
const homeLayer = new ol.layer.Vector({ source: homeSource });
const routeLayer = new ol.layer.Vector({ source: routeSource });

housingLayer.setVisible(false);
coursesLayer.setVisible(false);

const osmLayer = new ol.layer.Tile({ source: new ol.source.OSM() });

const map = new ol.Map({
  target: "map",
  layers: [osmLayer, transportLayer, routeLayer, factoryLayer, housingLayer, coursesLayer, homeLayer],
  view: new ol.View({ center: fromLonLat([107.20, -6.30]), zoom: 10 })
});

// ---------- Попап ----------
const popupEl = document.getElementById("popup");
const popupContentEl = document.getElementById("popup-content");
const popupCloserEl = document.getElementById("popup-closer");

const popupOverlay = new ol.Overlay({
  element: popupEl,
  autoPan: { animation: { duration: 250 } }
});
map.addOverlay(popupOverlay);

popupCloserEl.addEventListener("click", e => {
  e.preventDefault();
  popupEl.hidden = true;
  popupOverlay.setPosition(undefined);
});

function showPopup(coordinate, html) {
  popupContentEl.innerHTML = html;
  popupEl.hidden = false;
  popupOverlay.setPosition(coordinate);
}

// ---------- Вспомогательные функции ----------
function toRad(deg) { return (deg * Math.PI) / 180; }

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatRp(n) {
  return "Rp " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function skillLabel(value) {
  const found = SKILL_LEVELS.find(s => s.value === value);
  return found ? found.label : value;
}

function estimateTravel(distanceKm) {
  const minutes = Math.round((distanceKm / 20) * 60);
  const cost = 3000 + Math.round(distanceKm) * 700;
  return { minutes, cost };
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function circleStyle(color, radius) {
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius,
      fill: new ol.style.Fill({ color: hexToRgba(color, 0.55) }),
      stroke: new ol.style.Stroke({ color, width: 2 })
    })
  });
}

// ---------- Слой заводов ----------
FACTORIES.forEach(f => {
  const color = INDUSTRIES[f.industry].color;
  const feature = new ol.Feature({ geometry: new ol.geom.Point(fromLonLat([f.lng, f.lat])) });
  feature.set("kind", "factory");
  feature.set("data", f);
  feature.setStyle(circleStyle(color, 7 + f.vacancies.length * 2));
  factorySource.addFeature(feature);
});

function factoryPopupHtml(f) {
  const color = INDUSTRIES[f.industry].color;
  const vacHtml = f.vacancies
    .map(v => `<li>${v.title} — ${skillLabel(v.skill)}, ${formatRp(v.salaryMin)}–${formatRp(v.salaryMax)}/мес</li>`)
    .join("");
  return `<b>${f.name}</b><span style="color:${color}">${INDUSTRIES[f.industry].label}</span><br>${f.park}<ul>${vacHtml}</ul>`;
}

// ---------- Слой транспорта ----------
const stationCoords = TRAIN_STATIONS.map(s => fromLonLat([s.lng, s.lat]));
const lineFeature = new ol.Feature(new ol.geom.LineString(stationCoords));
lineFeature.setStyle(new ol.style.Style({
  stroke: new ol.style.Stroke({ color: "#333333", width: 3, lineDash: [6, 4] })
}));
transportSource.addFeature(lineFeature);

TRAIN_STATIONS.forEach(s => {
  const feature = new ol.Feature({ geometry: new ol.geom.Point(fromLonLat([s.lng, s.lat])) });
  feature.set("kind", "station");
  feature.set("data", s);
  feature.setStyle(new ol.style.Style({
    image: new ol.style.Circle({
      radius: 4,
      fill: new ol.style.Fill({ color: "#ffffff" }),
      stroke: new ol.style.Stroke({ color: "#333333", width: 2 })
    })
  }));
  transportSource.addFeature(feature);
});

// ---------- Слой жилья ----------
function housingClass(h) {
  if (h.safety >= 4 && h.pricePerMonth <= 800000) return { color: "#2F7D46", label: "доступно и безопасно" };
  if (h.safety <= 2 || h.pricePerMonth > 1000000) return { color: "#B23A3A", label: "дорого или небезопасно" };
  return { color: "#B8860B", label: "средний вариант" };
}

HOUSING.forEach(h => {
  const cls = housingClass(h);
  const feature = new ol.Feature({ geometry: new ol.geom.Point(fromLonLat([h.lng, h.lat])) });
  feature.set("kind", "housing");
  feature.set("data", h);
  feature.setStyle(circleStyle(cls.color, 7));
  housingSource.addFeature(feature);
});

function housingPopupHtml(h) {
  const cls = housingClass(h);
  return `<b>${h.name}</b>${h.type}<br>${formatRp(h.pricePerMonth)}/мес<br>Безопасность: ${h.safety}/5<br><i>${cls.label}</i>`;
}

// ---------- Слой курсов ----------
COURSES.forEach(c => {
  const feature = new ol.Feature({ geometry: new ol.geom.Point(fromLonLat([c.lng, c.lat])) });
  feature.set("kind", "course");
  feature.set("data", c);
  feature.setStyle(circleStyle("#6B4FA0", 8));
  coursesSource.addFeature(feature);
});

function coursePopupHtml(c) {
  return `<b>${c.name}</b>${c.focus}<br>Длительность: ${c.durationWeeks} нед.<br>Готовит до уровня «${skillLabel(c.teachesUpTo)}»`;
}

function stationPopupHtml(s) {
  return `<b>${s.name}</b>Станция KRL Cikarang Line`;
}

// ---------- Клик по карте ----------
map.on("click", evt => {
  const feature = map.forEachFeatureAtPixel(
    evt.pixel,
    f => f,
    { layerFilter: l => l !== homeLayer && l !== routeLayer }
  );

  if (feature) {
    const kind = feature.get("kind");
    const data = feature.get("data");
    let html = "";
    if (kind === "factory") html = factoryPopupHtml(data);
    else if (kind === "housing") html = housingPopupHtml(data);
    else if (kind === "course") html = coursePopupHtml(data);
    else if (kind === "station") html = stationPopupHtml(data);
    if (html) showPopup(feature.getGeometry().getCoordinates(), html);
    return;
  }

  // Клик по пустому месту карты — указываем место проживания
  popupEl.hidden = true;
  popupOverlay.setPosition(undefined);

  homeLonLat = toLonLat(evt.coordinate);
  homeSource.clear();
  const homeFeature = new ol.Feature({ geometry: new ol.geom.Point(evt.coordinate) });
  homeFeature.setStyle(new ol.style.Style({
    text: new ol.style.Text({
      text: "🏠",
      font: "22px sans-serif",
      offsetY: -2
    })
  }));
  homeSource.addFeature(homeFeature);

  const statusEl = document.getElementById("home-status");
  statusEl.textContent = `— указано (${homeLonLat[1].toFixed(3)}, ${homeLonLat[0].toFixed(3)})`;
  statusEl.classList.add("set");
});

// ---------- Маршрут ----------
function drawRoute(targetLngLat) {
  routeSource.clear();
  if (!homeLonLat) return;
  const line = new ol.Feature(new ol.geom.LineString([fromLonLat(homeLonLat), fromLonLat(targetLngLat)]));
  line.setStyle(new ol.style.Style({
    stroke: new ol.style.Stroke({ color: "#2E5C8A", width: 3, lineDash: [2, 6] })
  }));
  routeSource.addFeature(line);
  map.getView().fit(line.getGeometry().getExtent(), { padding: [60, 60, 60, 60], maxZoom: 14, duration: 300 });
}

// ---------- Управление слоями ----------
document.getElementById("layer-factories").addEventListener("change", e => factoryLayer.setVisible(e.target.checked));
document.getElementById("layer-transport").addEventListener("change", e => transportLayer.setVisible(e.target.checked));
document.getElementById("layer-housing").addEventListener("change", e => housingLayer.setVisible(e.target.checked));
document.getElementById("layer-courses").addEventListener("change", e => coursesLayer.setVisible(e.target.checked));

// ---------- Легенда отраслей ----------
const legendEl = document.getElementById("industry-legend");
Object.values(INDUSTRIES).forEach(ind => {
  const row = document.createElement("div");
  row.className = "legend-row";
  row.innerHTML = `<span class="legend-dot" style="background:${ind.color}"></span> ${ind.label}`;
  legendEl.appendChild(row);
});

// ---------- Селекты формы ----------
const industrySelect = document.getElementById("industry-select");
Object.entries(INDUSTRIES).forEach(([key, ind]) => {
  const opt = document.createElement("option");
  opt.value = key;
  opt.textContent = ind.label;
  industrySelect.appendChild(opt);
});

const skillSelect = document.getElementById("skill-select");
SKILL_LEVELS.forEach(s => {
  const opt = document.createElement("option");
  opt.value = s.value;
  opt.textContent = s.label;
  skillSelect.appendChild(opt);
});

// ---------- Поиск вакансий ----------
const resultsEl = document.getElementById("results");

document.getElementById("search-form").addEventListener("submit", e => {
  e.preventDefault();
  resultsEl.innerHTML = "";

  if (!homeLonLat) {
    resultsEl.innerHTML = '<p class="empty-msg">Сначала укажите место проживания — кликните по карте.</p>';
    return;
  }

  const industryFilter = industrySelect.value;
  const userSkill = skillSelect.value;
  const userSkillIndex = SKILL_ORDER.indexOf(userSkill);
  const [homeLng, homeLat] = homeLonLat;

  let matches = [];
  FACTORIES.forEach(f => {
    if (industryFilter !== "all" && f.industry !== industryFilter) return;
    f.vacancies.forEach(v => {
      if (SKILL_ORDER.indexOf(v.skill) <= userSkillIndex) {
        const distanceKm = haversineKm(homeLat, homeLng, f.lat, f.lng);
        matches.push({ factory: f, vacancy: v, distanceKm });
      }
    });
  });

  matches.sort((a, b) => a.distanceKm - b.distanceKm);
  matches = matches.slice(0, 6);

  if (matches.length === 0) {
    resultsEl.innerHTML =
      '<p class="empty-msg">Подходящих вакансий не найдено — возможно, для этой отрасли не хватает квалификации. Посмотрите ближайшие курсы переподготовки ниже.</p>';
  } else {
    matches.forEach(m => {
      const { minutes, cost } = estimateTravel(m.distanceKm);
      const ind = INDUSTRIES[m.factory.industry];
      const card = document.createElement("div");
      card.className = "result-card";
      card.innerHTML = `
        <div class="industry-tag"><span class="dot" style="background:${ind.color}"></span>${ind.label}</div>
        <h4>${m.vacancy.title}</h4>
        <div class="meta">${m.factory.name}, ${m.factory.park}</div>
        <div class="meta">Требуемая квалификация: ${skillLabel(m.vacancy.skill)}</div>
        <div class="meta">Зарплата: ${formatRp(m.vacancy.salaryMin)}–${formatRp(m.vacancy.salaryMax)}/мес</div>
        <div class="meta">≈ ${m.distanceKm.toFixed(1)} км · ${minutes} мин в пути · ${formatRp(cost)} (оценочно)</div>
        <button type="button">Показать маршрут на карте</button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        drawRoute([m.factory.lng, m.factory.lat]);
        showPopup(fromLonLat([m.factory.lng, m.factory.lat]), factoryPopupHtml(m.factory));
      });
      resultsEl.appendChild(card);
    });
  }

  const lockedCount = FACTORIES
    .filter(f => industryFilter === "all" || f.industry === industryFilter)
    .reduce((acc, f) => acc + f.vacancies.filter(v => SKILL_ORDER.indexOf(v.skill) > userSkillIndex).length, 0);

  if (lockedCount > 0) {
    const note = document.createElement("p");
    note.className = "empty-msg";
    note.textContent = `Ещё ${lockedCount} вакансии в этой отрасли требуют более высокой квалификации — курсы переподготовки помогут их открыть.`;
    resultsEl.appendChild(note);
  }
});

// ---------- Ближайшие курсы ----------
document.getElementById("show-courses-btn").addEventListener("click", () => {
  const coursesResultsEl = document.getElementById("courses-results");
  coursesResultsEl.innerHTML = "";

  if (!homeLonLat) {
    coursesResultsEl.innerHTML = '<p class="empty-msg">Сначала укажите место проживания — кликните по карте.</p>';
    return;
  }
  const [homeLng, homeLat] = homeLonLat;

  const withDistance = COURSES.map(c => ({
    course: c,
    distanceKm: haversineKm(homeLat, homeLng, c.lat, c.lng)
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  withDistance.forEach(item => {
    const { minutes } = estimateTravel(item.distanceKm);
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <h4>${item.course.name}</h4>
      <div class="meta">${item.course.focus}</div>
      <div class="meta">Длительность: ${item.course.durationWeeks} нед. · готовит до уровня «${skillLabel(item.course.teachesUpTo)}»</div>
      <div class="meta">≈ ${item.distanceKm.toFixed(1)} км · ${minutes} мин в пути (оценочно)</div>
      <button type="button">Показать на карте</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      drawRoute([item.course.lng, item.course.lat]);
      showPopup(fromLonLat([item.course.lng, item.course.lat]), coursePopupHtml(item.course));
    });
    coursesResultsEl.appendChild(card);
  });
});

// ---------- Вкладки сайдбара ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

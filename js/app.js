// Логика демонстрационного прототипа KerjaPeta.

let homeMarker = null;
let homeLatLng = null;
let routeLine = null;

const factoryLayer = L.layerGroup();
const transportLayer = L.layerGroup();
const housingLayer = L.layerGroup();
const coursesLayer = L.layerGroup();

const map = L.map("map", { zoomControl: true }).setView([-6.30, 107.20], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

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

// ---------- Слой заводов ----------
function buildFactoryLayer() {
  FACTORIES.forEach(f => {
    const color = INDUSTRIES[f.industry].color;
    const radius = 7 + f.vacancies.length * 2;
    const marker = L.circleMarker([f.lat, f.lng], {
      radius,
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.55
    });
    const vacHtml = f.vacancies
      .map(v => `<li>${v.title} — ${skillLabel(v.skill)}, ${formatRp(v.salaryMin)}–${formatRp(v.salaryMax)}/мес</li>`)
      .join("");
    marker.bindPopup(
      `<b>${f.name}</b><br><span style="color:${color}">${INDUSTRIES[f.industry].label}</span><br>${f.park}<br><ul style="padding-left:16px;margin:6px 0">${vacHtml}</ul>`
    );
    marker.factoryId = f.id;
    factoryLayer.addLayer(marker);
  });
}

// ---------- Слой транспорта ----------
function buildTransportLayer() {
  const coords = TRAIN_STATIONS.map(s => [s.lat, s.lng]);
  L.polyline(coords, { color: "#333333", weight: 3, dashArray: "6 4" }).addTo(transportLayer);
  TRAIN_STATIONS.forEach(s => {
    L.circleMarker([s.lat, s.lng], { radius: 4, color: "#333333", fillColor: "#fff", fillOpacity: 1, weight: 2 })
      .bindPopup(`<b>${s.name}</b><br>Станция KRL Cikarang Line`)
      .addTo(transportLayer);
  });
}

// ---------- Слой жилья ----------
function housingClass(h) {
  if (h.safety >= 4 && h.pricePerMonth <= 800000) return { key: "good", color: "#2F7D46", label: "доступно и безопасно" };
  if (h.safety <= 2 || h.pricePerMonth > 1000000) return { key: "bad", color: "#B23A3A", label: "дорого или небезопасно" };
  return { key: "medium", color: "#B8860B", label: "средний вариант" };
}

function buildHousingLayer() {
  HOUSING.forEach(h => {
    const cls = housingClass(h);
    L.circleMarker([h.lat, h.lng], {
      radius: 7,
      color: cls.color,
      weight: 2,
      fillColor: cls.color,
      fillOpacity: 0.6
    })
      .bindPopup(
        `<b>${h.name}</b><br>${h.type}<br>${formatRp(h.pricePerMonth)}/мес<br>Безопасность: ${h.safety}/5<br><i>${cls.label}</i>`
      )
      .addTo(housingLayer);
  });
}

// ---------- Слой курсов ----------
function buildCoursesLayer() {
  COURSES.forEach(c => {
    L.circleMarker([c.lat, c.lng], {
      radius: 8,
      color: "#6B4FA0",
      weight: 2,
      fillColor: "#6B4FA0",
      fillOpacity: 0.5
    })
      .bindPopup(
        `<b>${c.name}</b><br>${c.focus}<br>Длительность: ${c.durationWeeks} нед.<br>Готовит до уровня «${skillLabel(c.teachesUpTo)}»`
      )
      .addTo(coursesLayer);
  });
}

buildFactoryLayer();
buildTransportLayer();
buildHousingLayer();
buildCoursesLayer();

factoryLayer.addTo(map);
transportLayer.addTo(map);

// ---------- Управление слоями ----------
document.getElementById("layer-factories").addEventListener("change", e => {
  e.target.checked ? factoryLayer.addTo(map) : map.removeLayer(factoryLayer);
});
document.getElementById("layer-transport").addEventListener("change", e => {
  e.target.checked ? transportLayer.addTo(map) : map.removeLayer(transportLayer);
});
document.getElementById("layer-housing").addEventListener("change", e => {
  e.target.checked ? housingLayer.addTo(map) : map.removeLayer(housingLayer);
});
document.getElementById("layer-courses").addEventListener("change", e => {
  e.target.checked ? coursesLayer.addTo(map) : map.removeLayer(coursesLayer);
});

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

// ---------- Клик по карте — место проживания ----------
map.on("click", e => {
  homeLatLng = e.latlng;
  if (homeMarker) {
    homeMarker.setLatLng(homeLatLng);
  } else {
    homeMarker = L.marker(homeLatLng, {
      title: "Вы здесь",
      icon: L.divIcon({
        className: "home-icon",
        html: '<div style="background:#1a1a1a;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.4)">🏠</div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).addTo(map);
  }
  const statusEl = document.getElementById("home-status");
  statusEl.textContent = `— указано (${homeLatLng.lat.toFixed(3)}, ${homeLatLng.lng.toFixed(3)})`;
  statusEl.classList.add("set");
});

// ---------- Маршрут ----------
function drawRoute(targetLatLng) {
  if (routeLine) map.removeLayer(routeLine);
  if (!homeLatLng) return;
  routeLine = L.polyline([homeLatLng, targetLatLng], { color: "#2E5C8A", weight: 3, dashArray: "2 6" }).addTo(map);
  map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });
}

// ---------- Поиск вакансий ----------
const resultsEl = document.getElementById("results");

document.getElementById("search-form").addEventListener("submit", e => {
  e.preventDefault();
  resultsEl.innerHTML = "";

  if (!homeLatLng) {
    resultsEl.innerHTML = '<p class="empty-msg">Сначала укажите место проживания — кликните по карте.</p>';
    return;
  }

  const industryFilter = industrySelect.value;
  const userSkill = skillSelect.value;
  const userSkillIndex = SKILL_ORDER.indexOf(userSkill);

  let matches = [];
  FACTORIES.forEach(f => {
    if (industryFilter !== "all" && f.industry !== industryFilter) return;
    f.vacancies.forEach(v => {
      if (SKILL_ORDER.indexOf(v.skill) <= userSkillIndex) {
        const distanceKm = haversineKm(homeLatLng.lat, homeLatLng.lng, f.lat, f.lng);
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
        drawRoute([m.factory.lat, m.factory.lng]);
        factoryLayer.eachLayer(l => {
          if (l.factoryId === m.factory.id) l.openPopup();
        });
      });
      resultsEl.appendChild(card);
    });
  }

  // Показываем, если в выбранной отрасли есть вакансии, недоступные по квалификации
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

  if (!homeLatLng) {
    coursesResultsEl.innerHTML = '<p class="empty-msg">Сначала укажите место проживания — кликните по карте.</p>';
    return;
  }

  const withDistance = COURSES.map(c => ({
    course: c,
    distanceKm: haversineKm(homeLatLng.lat, homeLatLng.lng, c.lat, c.lng)
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
      drawRoute([item.course.lat, item.course.lng]);
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

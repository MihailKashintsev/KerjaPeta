// Данные для демонстрационного прототипа KerjaPeta.
// Расположение промышленных парков и линии KRL Cikarang Line приближено к реальной географии.
// Вакансии, зарплаты, жильё и курсы — иллюстративные примеры для учебного проекта.

const SKILL_LEVELS = [
  { value: "none", label: "Без опыта" },
  { value: "basic", label: "Начальный" },
  { value: "intermediate", label: "Средний" },
  { value: "advanced", label: "Высокий" }
];
const SKILL_ORDER = SKILL_LEVELS.map(s => s.value);

const INDUSTRIES = {
  automotive:  { label: "Автомобилестроение", color: "#2E5C8A" },
  electronics: { label: "Электроника", color: "#2F7D46" },
  textile:     { label: "Текстиль и швейное производство", color: "#C97B2E" },
  food:        { label: "Пищевая промышленность", color: "#B8860B" },
  logistics:   { label: "Логистика и склад", color: "#6B4FA0" }
};

const FACTORIES = [
  {
    id: "f1", name: "Сборочный завод (автопром)", park: "MM2100, Чикаранг Барат",
    industry: "automotive", lat: -6.2477, lng: 107.1273,
    vacancies: [
      { title: "Оператор сборочной линии", skill: "basic", salaryMin: 4900000, salaryMax: 5400000 },
      { title: "Наладчик оборудования", skill: "intermediate", salaryMin: 5800000, salaryMax: 6500000 }
    ]
  },
  {
    id: "f2", name: "Завод бытовой электроники", park: "Kota Jababeka",
    industry: "electronics", lat: -6.2919, lng: 107.1660,
    vacancies: [
      { title: "Сборщик электроники", skill: "basic", salaryMin: 4900000, salaryMax: 5300000 },
      { title: "Инженер контроля качества", skill: "advanced", salaryMin: 7500000, salaryMax: 9000000 }
    ]
  },
  {
    id: "f3", name: "Швейная фабрика", park: "Delta Silicon Industrial Park",
    industry: "textile", lat: -6.2937, lng: 107.1315,
    vacancies: [
      { title: "Швея", skill: "none", salaryMin: 4700000, salaryMax: 5000000 },
      { title: "Мастер цеха", skill: "intermediate", salaryMin: 6000000, salaryMax: 6800000 }
    ]
  },
  {
    id: "f4", name: "Пищевой комбинат", park: "EJIP, Чикаранг Селатан",
    industry: "food", lat: -6.3373, lng: 107.1690,
    vacancies: [
      { title: "Оператор упаковочной линии", skill: "none", salaryMin: 4700000, salaryMax: 5100000 }
    ]
  },
  {
    id: "f5", name: "Автомобильный завод (штамповка и сборка)", park: "Deltamas, Чикаранг Пусат",
    industry: "automotive", lat: -6.3608, lng: 107.1868,
    vacancies: [
      { title: "Оператор штамповки", skill: "basic", salaryMin: 5200000, salaryMax: 5700000 },
      { title: "Специалист по автоматизации", skill: "advanced", salaryMin: 8500000, salaryMax: 10500000 }
    ]
  },
  {
    id: "f6", name: "Складской и логистический комплекс", park: "Bekasi International Industrial Estate",
    industry: "logistics", lat: -6.2778, lng: 107.1004,
    vacancies: [
      { title: "Комплектовщик склада", skill: "none", salaryMin: 4600000, salaryMax: 4900000 },
      { title: "Диспетчер логистики", skill: "intermediate", salaryMin: 6200000, salaryMax: 7000000 }
    ]
  },
  {
    id: "f7", name: "Завод электроники", park: "KIIC, Караванг",
    industry: "electronics", lat: -6.3607, lng: 107.3350,
    vacancies: [
      { title: "Оператор линии электроники", skill: "basic", salaryMin: 5000000, salaryMax: 5500000 }
    ]
  },
  {
    id: "f8", name: "Швейное производство", park: "Suryacipta City of Industry, Караванг",
    industry: "textile", lat: -6.3939, lng: 107.3908,
    vacancies: [
      { title: "Швея-мотористка", skill: "none", salaryMin: 4600000, salaryMax: 5000000 }
    ]
  },
  {
    id: "f9", name: "Пищевой завод", park: "промзона Караванг",
    industry: "food", lat: -6.3450, lng: 107.3600,
    vacancies: [
      { title: "Технолог пищевого производства", skill: "advanced", salaryMin: 7800000, salaryMax: 9200000 }
    ]
  }
];

const HOUSING = [
  { id: "h1", name: "Общежитие рядом с Чикарангом", lat: -6.2530, lng: 107.1500, pricePerMonth: 600000, safety: 4, type: "заводское общежитие" },
  { id: "h2", name: "Аренда комнаты, Телага Мурни", lat: -6.2460, lng: 107.1280, pricePerMonth: 750000, safety: 3, type: "аренда комнаты" },
  { id: "h3", name: "Kost рядом с Jababeka", lat: -6.2890, lng: 107.1700, pricePerMonth: 900000, safety: 4, type: "kost (мини-общежитие)" },
  { id: "h4", name: "Kost рядом с KIIC", lat: -6.3580, lng: 107.3320, pricePerMonth: 700000, safety: 3, type: "kost" },
  { id: "h5", name: "Общежитие завода (BIIE)", lat: -6.2810, lng: 107.0980, pricePerMonth: 650000, safety: 4, type: "заводское общежитие" },
  { id: "h6", name: "Недорогая аренда, Чибитунг", lat: -6.2440, lng: 107.1040, pricePerMonth: 550000, safety: 2, type: "аренда комнаты" },
  { id: "h7", name: "Kost рядом с Suryacipta", lat: -6.3900, lng: 107.3860, pricePerMonth: 680000, safety: 3, type: "kost" }
];

const TRAIN_STATIONS = [
  { name: "Джатинегара", lat: -6.2145, lng: 106.8706 },
  { name: "Бекаси", lat: -6.2380, lng: 107.0021 },
  { name: "Тамбун", lat: -6.2405, lng: 107.0526 },
  { name: "Чибитунг", lat: -6.2437, lng: 107.1024 },
  { name: "Метланд Телага Мурни", lat: -6.2467, lng: 107.1274 },
  { name: "Чикаранг", lat: -6.2537, lng: 107.1544 }
];

const COURSES = [
  { id: "c1", name: "БЛК (Balai Latihan Kerja) Кабупатен Бекаси", lat: -6.2450, lng: 107.0100, teachesUpTo: "intermediate", focus: "Механика, сварка, электрика", durationWeeks: 8 },
  { id: "c2", name: "Учебный центр Чикаранг", lat: -6.2600, lng: 107.1450, teachesUpTo: "basic", focus: "Операторы производственных линий", durationWeeks: 4 },
  { id: "c3", name: "Karawang Vocational Center", lat: -6.3300, lng: 107.3000, teachesUpTo: "intermediate", focus: "Швейное и текстильное производство", durationWeeks: 6 },
  { id: "c4", name: "Politeknik Industri (курсы повышения квалификации)", lat: -6.2920, lng: 107.1680, teachesUpTo: "advanced", focus: "Автоматизация и контроль качества", durationWeeks: 12 }
];

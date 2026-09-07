/* ============================================================
   SkyBoard — script.js
   Fetches live weather from the OpenWeatherMap API using
   async/await and renders it into the departures-board UI.
   ============================================================ */

const STORAGE_KEY = "skyboard_owm_api_key";
const LAST_CITY_KEY = "skyboard_last_city";

// ---------- DOM references ----------
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const statusLine = document.getElementById("statusLine");

const cityName = document.getElementById("cityName");
const tempValue = document.getElementById("tempValue");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const sunTimes = document.getElementById("sunTimes");
const weatherIcon = document.getElementById("weatherIcon");
const conditionMain = document.getElementById("conditionMain");
const conditionDesc = document.getElementById("conditionDesc");

const unitCBtn = document.getElementById("unitC");
const unitFBtn = document.getElementById("unitF");
const clockEl = document.getElementById("clock");

const modalBackdrop = document.getElementById("modalBackdrop");
const apiKeyForm = document.getElementById("apiKeyForm");
const apiKeyInput = document.getElementById("apiKeyInput");
const keyBtn = document.getElementById("keyBtn");

// ---------- State ----------
let currentUnit = "C"; // "C" or "F"
let lastData = null; // last successful API payload, so unit toggle doesn't re-fetch

// ---------- Clock ----------
function tickClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
tickClock();
setInterval(tickClock, 1000);

// ---------- API key handling ----------
function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

function saveApiKey(key) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

function showKeyModal() {
  modalBackdrop.classList.add("is-visible");
  apiKeyInput.value = getApiKey();
  apiKeyInput.focus();
}

function hideKeyModal() {
  modalBackdrop.classList.remove("is-visible");
}

apiKeyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = apiKeyInput.value.trim();
  if (!key) return;
  saveApiKey(key);
  hideKeyModal();
  const city = cityInput.value.trim() || localStorage.getItem(LAST_CITY_KEY) || "Lahore";
  cityInput.value = city;
  fetchWeather(city);
});

keyBtn.addEventListener("click", showKeyModal);

// ---------- Status helpers ----------
function setStatus(message, type = "") {
  statusLine.textContent = message;
  statusLine.classList.remove("is-error", "is-loading");
  if (type) statusLine.classList.add(type);
}

// ---------- Core fetch ----------
async function fetchWeather(city) {
  const apiKey = getApiKey();

  if (!apiKey) {
    showKeyModal();
    return;
  }

  if (!city) {
    setStatus("Type a city name to search.", "is-error");
    return;
  }

  setStatus(`Fetching weather for “${city}”…`, "is-loading");

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("That API key was rejected. Check it and try again.");
      }
      if (response.status === 404) {
        throw new Error(`Couldn't find a city called “${city}”.`);
      }
      throw new Error(`Weather service returned an error (${response.status}).`);
    }

    const data = await response.json();
    lastData = data;
    localStorage.setItem(LAST_CITY_KEY, data.name);
    renderWeather(data);
    setStatus(`Last updated ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    setStatus(error.message || "Something went wrong fetching weather data.", "is-error");
  }
}

// ---------- Rendering ----------
function celsiusToFahrenheit(c) {
  return c * 9 / 5 + 32;
}

function formatTemp(celsius) {
  const value = currentUnit === "C" ? celsius : celsiusToFahrenheit(celsius);
  return Math.round(value);
}

function formatTime(unixSeconds, timezoneOffsetSeconds) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  return date.toISOString().slice(11, 16);
}

function renderWeather(data) {
  const { name, sys, main, weather, wind: windData, visibility: vis, timezone } = data;
  const condition = weather[0];

  cityName.textContent = `${name}, ${sys.country}`;

  tempValue.textContent = `${formatTemp(main.temp)}°`;
  feelsLike.textContent = `${formatTemp(main.feels_like)}°${currentUnit}`;
  humidity.textContent = `${main.humidity}%`;
  wind.textContent = `${Math.round(windData.speed)} m/s`;
  pressure.textContent = `${main.pressure} hPa`;
  visibility.textContent = `${(vis / 1000).toFixed(1)} km`;
  sunTimes.textContent = `${formatTime(sys.sunrise, timezone)} / ${formatTime(sys.sunset, timezone)}`;

  conditionMain.textContent = condition.main;
  conditionDesc.textContent = condition.description;
  weatherIcon.src = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;
  weatherIcon.alt = condition.description;
}

// ---------- Unit toggle ----------
function setUnit(unit) {
  currentUnit = unit;
  unitCBtn.classList.toggle("active", unit === "C");
  unitCBtn.setAttribute("aria-pressed", unit === "C");
  unitFBtn.classList.toggle("active", unit === "F");
  unitFBtn.setAttribute("aria-pressed", unit === "F");

  if (lastData) {
    renderWeather(lastData);
  }
}

unitCBtn.addEventListener("click", () => setUnit("C"));
unitFBtn.addEventListener("click", () => setUnit("F"));

// ---------- Search form ----------
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  fetchWeather(city);
});

// ---------- Init ----------
(function init() {
  const savedKey = getApiKey();
  const lastCity = localStorage.getItem(LAST_CITY_KEY) || "Lahore";
  cityInput.value = lastCity;

  if (!savedKey) {
    showKeyModal();
    setStatus("Add your API key to get started.");
  } else {
    fetchWeather(lastCity);
  }
})();
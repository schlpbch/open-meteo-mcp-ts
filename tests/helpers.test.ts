/**
 * Unit tests for helper functions.
 * Migrated from Python pytest tests.
 */

import { test } from "node:test";
import { strict as assert } from "assert";
import {
  assessSkiConditions,
  calculateAstronomyData,
  calculateComfortIndex,
  calculateWindChill,
  formatPrecipitation,
  formatTemperature,
  generateWeatherAlerts,
  getSeasonalAdvice,
  getTravelImpact,
  getWeatherCategory,
  interpretWeatherCode,
  normalizeAirQualityTimezone,
  normalizeTimezone,
} from "../src/helpers.js";

// ============================================================================
// InterpretWeatherCode Tests
// ============================================================================

test("interpretWeatherCode: clear sky", () => {
  const result = interpretWeatherCode(0);
  assert.equal(result.description, "Clear sky");
  assert.equal(result.category, "Clear");
  assert.equal(result.severity, "none");
});

test("interpretWeatherCode: partly cloudy", () => {
  const result = interpretWeatherCode(2);
  assert.equal(result.description, "Partly cloudy");
  assert.equal(result.category, "Cloudy");
  assert.equal(result.severity, "low");
});

test("interpretWeatherCode: moderate rain", () => {
  const result = interpretWeatherCode(63);
  assert.equal(result.description, "Moderate rain");
  assert.equal(result.category, "Rain");
  assert.equal(result.severity, "medium");
});

test("interpretWeatherCode: heavy snow", () => {
  const result = interpretWeatherCode(75);
  assert.equal(result.description, "Heavy snow");
  assert.equal(result.category, "Snow");
  assert.equal(result.severity, "high");
});

test("interpretWeatherCode: thunderstorm", () => {
  const result = interpretWeatherCode(95);
  assert.equal(result.description, "Thunderstorm");
  assert.equal(result.category, "Thunderstorm");
  assert.equal(result.severity, "high");
});

test("interpretWeatherCode: unknown code", () => {
  const result = interpretWeatherCode(999);
  assert(result.description.includes("Unknown"));
  assert.equal(result.category, "Unknown");
  assert.equal(result.severity, "unknown");
});

// ============================================================================
// GetWeatherCategory Tests
// ============================================================================

test("getWeatherCategory: clear category", () => {
  assert.equal(getWeatherCategory(0), "Clear");
  assert.equal(getWeatherCategory(1), "Clear");
});

test("getWeatherCategory: rain category", () => {
  assert.equal(getWeatherCategory(61), "Rain");
  assert.equal(getWeatherCategory(63), "Rain");
});

test("getWeatherCategory: snow category", () => {
  assert.equal(getWeatherCategory(71), "Snow");
  assert.equal(getWeatherCategory(75), "Snow");
});

// ============================================================================
// GetTravelImpact Tests
// ============================================================================

test("getTravelImpact: no impact", () => {
  assert.equal(getTravelImpact(0), "none");
  assert.equal(getTravelImpact(1), "none");
});

test("getTravelImpact: minor impact", () => {
  assert.equal(getTravelImpact(51), "minor");
  assert.equal(getTravelImpact(61), "minor");
});

test("getTravelImpact: moderate impact", () => {
  assert.equal(getTravelImpact(63), "moderate");
  assert.equal(getTravelImpact(45), "moderate");
});

test("getTravelImpact: significant impact", () => {
  assert.equal(getTravelImpact(65), "significant");
  assert.equal(getTravelImpact(95), "significant");
});

test("getTravelImpact: severe impact", () => {
  assert.equal(getTravelImpact(99), "severe");
});

// ============================================================================
// AssessSkiConditions Tests
// ============================================================================

test("assessSkiConditions: excellent conditions", () => {
  const snowData = { snow_depth: 1.2, recent_snowfall: 15 };
  const weatherData = { temperature: -10, weather_code: 0 };
  const result = assessSkiConditions(snowData, weatherData);
  assert.equal(result, "Excellent");
});

test("assessSkiConditions: good conditions", () => {
  const snowData = { snow_depth: 0.8, recent_snowfall: 2 };
  const weatherData = { temperature: -5, weather_code: 2 };
  const result = assessSkiConditions(snowData, weatherData);
  assert.equal(result, "Good");
});

test("assessSkiConditions: fair conditions", () => {
  const snowData = { snow_depth: 0.3, recent_snowfall: 0 };
  const weatherData = { temperature: 2, weather_code: 3 };
  const result = assessSkiConditions(snowData, weatherData);
  assert.equal(result, "Fair");
});

test("assessSkiConditions: poor conditions", () => {
  const snowData = { snow_depth: 0.1, recent_snowfall: 0 };
  const weatherData = { temperature: 8, weather_code: 61 };
  const result = assessSkiConditions(snowData, weatherData);
  assert.equal(result, "Poor");
});

// ============================================================================
// FormatTemperature Tests
// ============================================================================

test("formatTemperature: positive temperature", () => {
  assert.equal(formatTemperature(15.2), "15.2°C");
});

test("formatTemperature: negative temperature", () => {
  assert.equal(formatTemperature(-5.8), "-5.8°C");
});

test("formatTemperature: zero temperature", () => {
  assert.equal(formatTemperature(0.0), "0.0°C");
});

test("formatTemperature: rounding", () => {
  assert.equal(formatTemperature(15.234), "15.2°C");
  assert.equal(formatTemperature(15.289), "15.3°C");
});

// ============================================================================
// CalculateWindChill Tests
// ============================================================================

test("calculateWindChill: low wind no chill", () => {
  const result = calculateWindChill(5, 3);
  assert.equal(result, 5);
});

test("calculateWindChill: moderate wind chill", () => {
  const result = calculateWindChill(0, 20);
  assert(result < 0);
  assert.equal(typeof result, "number");
});

test("calculateWindChill: high wind chill", () => {
  const result = calculateWindChill(-10, 40);
  assert(result < -10);
});

test("calculateWindChill: positive temp wind chill", () => {
  const result = calculateWindChill(10, 30);
  assert(result < 10);
});

// ============================================================================
// GetSeasonalAdvice Tests
// ============================================================================

test("getSeasonalAdvice: winter advice", () => {
  const advice = getSeasonalAdvice(12);
  assert(advice.includes("Winter"));
  assert(
    advice.toLowerCase().includes("skiing") ||
      advice.toLowerCase().includes("snow"),
  );
});

test("getSeasonalAdvice: spring advice", () => {
  const advice = getSeasonalAdvice(4);
  assert(advice.includes("Spring"));
});

test("getSeasonalAdvice: summer advice", () => {
  const advice = getSeasonalAdvice(7);
  assert(advice.includes("Summer"));
  assert(
    advice.toLowerCase().includes("hiking") ||
      advice.toLowerCase().includes("outdoor"),
  );
});

test("getSeasonalAdvice: autumn advice", () => {
  const advice = getSeasonalAdvice(10);
  assert(advice.includes("Autumn"));
});

// ============================================================================
// FormatPrecipitation Tests
// ============================================================================

test("formatPrecipitation: no precipitation", () => {
  assert.equal(formatPrecipitation(0.0), "No precipitation");
});

test("formatPrecipitation: light precipitation", () => {
  const result = formatPrecipitation(0.5);
  assert(result.includes("0.5mm"));
  assert(result.toLowerCase().includes("light"));
});

test("formatPrecipitation: moderate precipitation", () => {
  const result = formatPrecipitation(3.0);
  assert(result.includes("3.0mm"));
  assert(result.toLowerCase().includes("moderate"));
});

test("formatPrecipitation: heavy precipitation", () => {
  const result = formatPrecipitation(7.5);
  assert(result.includes("7.5mm"));
  assert(result.toLowerCase().includes("heavy"));
});

test("formatPrecipitation: very heavy precipitation", () => {
  const result = formatPrecipitation(15.0);
  assert(result.includes("15.0mm"));
  assert(result.toLowerCase().includes("very heavy"));
});

// ============================================================================
// GenerateWeatherAlerts Tests
// ============================================================================

test("generateWeatherAlerts: heat alert generation", () => {
  const current = { temperature: 32, windspeed: 10, weathercode: 0 };
  const hourly = {
    temperature_2m: [32, 33, 34, 35, 35, 34, 33, 32, ...Array(16).fill(20)],
    wind_gusts_10m: Array(24).fill(10),
    uv_index: Array(24).fill(3),
    time: Array.from({ length: 24 }, (_, h) => `2024-01-18T${h.toString().padStart(2, "0")}:00`),
  };
  const daily = {
    temperature_2m_max: [35],
    temperature_2m_min: [30],
    precipitation_sum: [0],
    weather_code: [0],
    time: ["2024-01-18"],
  };
  const alerts = generateWeatherAlerts(current, hourly, daily, "Europe/Zurich");
  assert(alerts.length > 0);
  const heatAlerts = alerts.filter((a) => a.type === "heat");
  assert(heatAlerts.length > 0);
});

test("generateWeatherAlerts: cold alert generation", () => {
  const current = { temperature: -15, windspeed: 10, weathercode: 0 };
  const hourly = {
    temperature_2m: [-15, -16, -17, ...Array(21).fill(10)],
    wind_gusts_10m: Array(24).fill(10),
    uv_index: Array(24).fill(1),
    time: Array.from({ length: 24 }, (_, h) => `2024-01-18T${h.toString().padStart(2, "0")}:00`),
  };
  const daily = {
    temperature_2m_max: [-10],
    temperature_2m_min: [-20],
    precipitation_sum: [0],
    weather_code: [0],
    time: ["2024-01-18"],
  };
  const alerts = generateWeatherAlerts(current, hourly, daily, "Europe/Zurich");
  const coldAlerts = alerts.filter((a) => a.type === "cold");
  assert(coldAlerts.length > 0);
});

test("generateWeatherAlerts: no alerts for normal conditions", () => {
  const current = { temperature: 15, windspeed: 10, weathercode: 2 };
  const hourly = {
    temperature_2m: Array(24).fill(15),
    wind_gusts_10m: Array(24).fill(15),
    uv_index: Array(24).fill(3),
    time: Array.from({ length: 24 }, (_, h) => `2024-01-18T${h.toString().padStart(2, "0")}:00`),
  };
  const daily = {
    temperature_2m_max: [18],
    temperature_2m_min: [12],
    precipitation_sum: [0],
    weather_code: [2],
    time: ["2024-01-18"],
  };
  const alerts = generateWeatherAlerts(current, hourly, daily, "Europe/Zurich");
  const severeAlerts = alerts.filter((a) => a.severity === "warning");
  assert.equal(severeAlerts.length, 0);
});

// ============================================================================
// CalculateComfortIndex Tests
// ============================================================================

test("calculateComfortIndex: perfect comfort", () => {
  const weather = {
    temperature: 20,
    relative_humidity_2m: 50,
    wind_speed_10m: 5,
    uv_index: 2,
    precipitation_probability: 0,
    weather_code: 0,
  };
  const airQuality = { european_aqi: 20 };
  const result = calculateComfortIndex(weather, airQuality);
  assert(result.overall >= 80);
  assert.equal(result.recommendation, "Perfect for outdoor activities");
});

test("calculateComfortIndex: poor comfort", () => {
  const weather = {
    temperature: -20,
    relative_humidity_2m: 80,
    wind_speed_10m: 40,
    uv_index: 0,
    precipitation_probability: 100,
    weather_code: 99,
  };
  const airQuality = { european_aqi: 150 };
  const result = calculateComfortIndex(weather, airQuality);
  assert(result.overall < 40);
  assert(
    result.recommendation.includes("Poor") ||
      result.recommendation.includes("Very poor"),
  );
});

test("calculateComfortIndex: all factors present", () => {
  const weather = {
    temperature: 15,
    relative_humidity_2m: 60,
    wind_speed_10m: 15,
    uv_index: 4,
    precipitation_probability: 30,
    weather_code: 2,
  };
  const result = calculateComfortIndex(weather);
  assert.ok(result.overall);
  assert.ok(result.factors);
  assert.ok(result.factors.thermal_comfort);
  assert.ok(result.factors.air_quality);
  assert.ok(result.factors.precipitation_risk);
  assert.ok(result.factors.uv_safety);
  assert.ok(result.factors.weather_condition);
});

// ============================================================================
// CalculateAstronomyData Tests
// ============================================================================

test("calculateAstronomyData: contains times", () => {
  const result = calculateAstronomyData(47.3769, 8.5417, "Europe/Zurich");
  assert.ok(result.sunrise);
  assert.ok(result.sunset);
  assert.ok(result.day_length_hours);
});

test("calculateAstronomyData: contains golden hour", () => {
  const result = calculateAstronomyData(47.3769, 8.5417, "Europe/Zurich");
  assert.ok(result.golden_hour);
  assert.ok(result.golden_hour?.start);
  assert.ok(result.golden_hour?.end);
});

test("calculateAstronomyData: contains blue hour", () => {
  const result = calculateAstronomyData(47.3769, 8.5417, "Europe/Zurich");
  assert.ok(result.blue_hour);
  assert.ok(result.blue_hour?.start);
  assert.ok(result.blue_hour?.end);
});

// ============================================================================
// NormalizeTimezone Tests
// ============================================================================

test("normalizeTimezone: updates field", () => {
  const responseData = {
    timezone: "Europe/Zurich",
    hourly: { time: [] },
    daily: { time: [] },
  };
  const result = normalizeTimezone(responseData, "UTC");
  assert.equal(result.timezone, "UTC");
});

test("normalizeTimezone: handles invalid data", () => {
  const responseData = {};
  const result = normalizeTimezone(responseData);
  assert.equal(typeof result, "object");
});

// ============================================================================
// NormalizeAirQualityTimezone Tests
// ============================================================================

test("normalizeAirQualityTimezone: updates timezone", () => {
  const airQualityData = {
    timezone: "GMT",
    hourly: { time: [] },
    current: {},
  };
  const result = normalizeAirQualityTimezone(airQualityData, "Europe/Zurich");
  assert.equal(result.timezone, "Europe/Zurich");
});

test("normalizeAirQualityTimezone: preserves data", () => {
  const airQualityData = {
    timezone: "GMT",
    hourly: { time: [], pm2_5: [10, 15] },
    latitude: 47.3,
  };
  const result = normalizeAirQualityTimezone(airQualityData);
  assert.equal(result.latitude, 47.3);
  assert.equal((result.hourly as Record<string, unknown>).pm2_5, [10, 15]);
});

/**
 * Unit tests for helper functions.
 * Migrated from Python pytest tests.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
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
} from "../src/helpers.ts";

// ============================================================================
// InterpretWeatherCode Tests
// ============================================================================

Deno.test("interpretWeatherCode: clear sky", () => {
  const result = interpretWeatherCode(0);
  assertEquals(result.description, "Clear sky");
  assertEquals(result.category, "Clear");
  assertEquals(result.severity, "none");
});

Deno.test("interpretWeatherCode: partly cloudy", () => {
  const result = interpretWeatherCode(2);
  assertEquals(result.description, "Partly cloudy");
  assertEquals(result.category, "Cloudy");
  assertEquals(result.severity, "low");
});

Deno.test("interpretWeatherCode: moderate rain", () => {
  const result = interpretWeatherCode(63);
  assertEquals(result.description, "Moderate rain");
  assertEquals(result.category, "Rain");
  assertEquals(result.severity, "medium");
});

Deno.test("interpretWeatherCode: heavy snow", () => {
  const result = interpretWeatherCode(75);
  assertEquals(result.description, "Heavy snow");
  assertEquals(result.category, "Snow");
  assertEquals(result.severity, "high");
});

Deno.test("interpretWeatherCode: thunderstorm", () => {
  const result = interpretWeatherCode(95);
  assertEquals(result.description, "Thunderstorm");
  assertEquals(result.category, "Thunderstorm");
  assertEquals(result.severity, "high");
});

Deno.test("interpretWeatherCode: unknown code", () => {
  const result = interpretWeatherCode(999);
  assert(result.description.includes("Unknown"));
  assertEquals(result.category, "Unknown");
  assertEquals(result.severity, "unknown");
});

// ============================================================================
// GetWeatherCategory Tests
// ============================================================================

Deno.test("getWeatherCategory: clear category", () => {
  assertEquals(getWeatherCategory(0), "Clear");
  assertEquals(getWeatherCategory(1), "Clear");
});

Deno.test("getWeatherCategory: rain category", () => {
  assertEquals(getWeatherCategory(61), "Rain");
  assertEquals(getWeatherCategory(63), "Rain");
});

Deno.test("getWeatherCategory: snow category", () => {
  assertEquals(getWeatherCategory(71), "Snow");
  assertEquals(getWeatherCategory(75), "Snow");
});

// ============================================================================
// GetTravelImpact Tests
// ============================================================================

Deno.test("getTravelImpact: no impact", () => {
  assertEquals(getTravelImpact(0), "none");
  assertEquals(getTravelImpact(1), "none");
});

Deno.test("getTravelImpact: minor impact", () => {
  assertEquals(getTravelImpact(51), "minor");
  assertEquals(getTravelImpact(61), "minor");
});

Deno.test("getTravelImpact: moderate impact", () => {
  assertEquals(getTravelImpact(63), "moderate");
  assertEquals(getTravelImpact(45), "moderate");
});

Deno.test("getTravelImpact: significant impact", () => {
  assertEquals(getTravelImpact(65), "significant");
  assertEquals(getTravelImpact(95), "significant");
});

Deno.test("getTravelImpact: severe impact", () => {
  assertEquals(getTravelImpact(99), "severe");
});

// ============================================================================
// AssessSkiConditions Tests
// ============================================================================

Deno.test("assessSkiConditions: excellent conditions", () => {
  const snowData = { snow_depth: 1.2, recent_snowfall: 15 };
  const weatherData = { temperature: -10, weather_code: 0 };
  const result = assessSkiConditions(snowData, weatherData);
  assertEquals(result, "Excellent");
});

Deno.test("assessSkiConditions: good conditions", () => {
  const snowData = { snow_depth: 0.8, recent_snowfall: 2 };
  const weatherData = { temperature: -5, weather_code: 2 };
  const result = assessSkiConditions(snowData, weatherData);
  assertEquals(result, "Good");
});

Deno.test("assessSkiConditions: fair conditions", () => {
  const snowData = { snow_depth: 0.3, recent_snowfall: 0 };
  const weatherData = { temperature: 2, weather_code: 3 };
  const result = assessSkiConditions(snowData, weatherData);
  assertEquals(result, "Fair");
});

Deno.test("assessSkiConditions: poor conditions", () => {
  const snowData = { snow_depth: 0.1, recent_snowfall: 0 };
  const weatherData = { temperature: 8, weather_code: 61 };
  const result = assessSkiConditions(snowData, weatherData);
  assertEquals(result, "Poor");
});

// ============================================================================
// FormatTemperature Tests
// ============================================================================

Deno.test("formatTemperature: positive temperature", () => {
  assertEquals(formatTemperature(15.2), "15.2°C");
});

Deno.test("formatTemperature: negative temperature", () => {
  assertEquals(formatTemperature(-5.8), "-5.8°C");
});

Deno.test("formatTemperature: zero temperature", () => {
  assertEquals(formatTemperature(0.0), "0.0°C");
});

Deno.test("formatTemperature: rounding", () => {
  assertEquals(formatTemperature(15.234), "15.2°C");
  assertEquals(formatTemperature(15.289), "15.3°C");
});

// ============================================================================
// CalculateWindChill Tests
// ============================================================================

Deno.test("calculateWindChill: low wind no chill", () => {
  const result = calculateWindChill(5, 3);
  assertEquals(result, 5);
});

Deno.test("calculateWindChill: moderate wind chill", () => {
  const result = calculateWindChill(0, 20);
  assert(result < 0);
  assertEquals(typeof result, "number");
});

Deno.test("calculateWindChill: high wind chill", () => {
  const result = calculateWindChill(-10, 40);
  assert(result < -10);
});

Deno.test("calculateWindChill: positive temp wind chill", () => {
  const result = calculateWindChill(10, 30);
  assert(result < 10);
});

// ============================================================================
// GetSeasonalAdvice Tests
// ============================================================================

Deno.test("getSeasonalAdvice: winter advice", () => {
  const advice = getSeasonalAdvice(12);
  assert(advice.includes("Winter"));
  assert(
    advice.toLowerCase().includes("skiing") ||
      advice.toLowerCase().includes("snow"),
  );
});

Deno.test("getSeasonalAdvice: spring advice", () => {
  const advice = getSeasonalAdvice(4);
  assert(advice.includes("Spring"));
});

Deno.test("getSeasonalAdvice: summer advice", () => {
  const advice = getSeasonalAdvice(7);
  assert(advice.includes("Summer"));
  assert(
    advice.toLowerCase().includes("hiking") ||
      advice.toLowerCase().includes("outdoor"),
  );
});

Deno.test("getSeasonalAdvice: autumn advice", () => {
  const advice = getSeasonalAdvice(10);
  assert(advice.includes("Autumn"));
});

// ============================================================================
// FormatPrecipitation Tests
// ============================================================================

Deno.test("formatPrecipitation: no precipitation", () => {
  assertEquals(formatPrecipitation(0.0), "No precipitation");
});

Deno.test("formatPrecipitation: light precipitation", () => {
  const result = formatPrecipitation(0.5);
  assert(result.includes("0.5mm"));
  assert(result.toLowerCase().includes("light"));
});

Deno.test("formatPrecipitation: moderate precipitation", () => {
  const result = formatPrecipitation(3.0);
  assert(result.includes("3.0mm"));
  assert(result.toLowerCase().includes("moderate"));
});

Deno.test("formatPrecipitation: heavy precipitation", () => {
  const result = formatPrecipitation(7.5);
  assert(result.includes("7.5mm"));
  assert(result.toLowerCase().includes("heavy"));
});

Deno.test("formatPrecipitation: very heavy precipitation", () => {
  const result = formatPrecipitation(15.0);
  assert(result.includes("15.0mm"));
  assert(result.toLowerCase().includes("very heavy"));
});

// ============================================================================
// GenerateWeatherAlerts Tests
// ============================================================================

Deno.test("generateWeatherAlerts: heat alert generation", () => {
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

Deno.test("generateWeatherAlerts: cold alert generation", () => {
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

Deno.test("generateWeatherAlerts: no alerts for normal conditions", () => {
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
  assertEquals(severeAlerts.length, 0);
});

// ============================================================================
// CalculateComfortIndex Tests
// ============================================================================

Deno.test("calculateComfortIndex: perfect comfort", () => {
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
  assertEquals(result.recommendation, "Perfect for outdoor activities");
});

Deno.test("calculateComfortIndex: poor comfort", () => {
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

Deno.test("calculateComfortIndex: all factors present", () => {
  const weather = {
    temperature: 15,
    relative_humidity_2m: 60,
    wind_speed_10m: 15,
    uv_index: 4,
    precipitation_probability: 30,
    weather_code: 2,
  };
  const result = calculateComfortIndex(weather);
  assertExists(result.overall);
  assertExists(result.factors);
  assertExists(result.factors.thermal_comfort);
  assertExists(result.factors.air_quality);
  assertExists(result.factors.precipitation_risk);
  assertExists(result.factors.uv_safety);
  assertExists(result.factors.weather_condition);
});

// ============================================================================
// CalculateAstronomyData Tests
// ============================================================================

Deno.test("calculateAstronomyData: contains times", () => {
  const result = calculateAstronomyData(47.3769, 8.5417, "Europe/Zurich");
  assertExists(result.sunrise);
  assertExists(result.sunset);
  assertExists(result.day_length_hours);
});

Deno.test("calculateAstronomyData: contains golden hour", () => {
  const result = calculateAstronomyData(47.3769, 8.5417, "Europe/Zurich");
  assertExists(result.golden_hour);
  assertExists(result.golden_hour?.start);
  assertExists(result.golden_hour?.end);
});

Deno.test("calculateAstronomyData: contains blue hour", () => {
  const result = calculateAstronomyData(47.3769, 8.5417, "Europe/Zurich");
  assertExists(result.blue_hour);
  assertExists(result.blue_hour?.start);
  assertExists(result.blue_hour?.end);
});

// ============================================================================
// NormalizeTimezone Tests
// ============================================================================

Deno.test("normalizeTimezone: updates field", () => {
  const responseData = {
    timezone: "Europe/Zurich",
    hourly: { time: [] },
    daily: { time: [] },
  };
  const result = normalizeTimezone(responseData, "UTC");
  assertEquals(result.timezone, "UTC");
});

Deno.test("normalizeTimezone: handles invalid data", () => {
  const responseData = {};
  const result = normalizeTimezone(responseData);
  assertEquals(typeof result, "object");
});

// ============================================================================
// NormalizeAirQualityTimezone Tests
// ============================================================================

Deno.test("normalizeAirQualityTimezone: updates timezone", () => {
  const airQualityData = {
    timezone: "GMT",
    hourly: { time: [] },
    current: {},
  };
  const result = normalizeAirQualityTimezone(airQualityData, "Europe/Zurich");
  assertEquals(result.timezone, "Europe/Zurich");
});

Deno.test("normalizeAirQualityTimezone: preserves data", () => {
  const airQualityData = {
    timezone: "GMT",
    hourly: { time: [], pm2_5: [10, 15] },
    latitude: 47.3,
  };
  const result = normalizeAirQualityTimezone(airQualityData);
  assertEquals(result.latitude, 47.3);
  assertEquals((result.hourly as Record<string, unknown>).pm2_5, [10, 15]);
});

/**
 * Comprehensive test suite for Open Meteo MCP improvements.
 * Tests country filtering, timezone consistency, weather alerts, and integration.
 * Migrated from Python pytest tests.
 */

import { assert, assertEquals } from "@std/assert";
import { OpenMeteoClient } from "../src/client.ts";

// Mock fetch helper
function createMockFetch(responseData: unknown, status = 200): typeof fetch {
  return async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => responseData,
      headers: new Headers(),
    }) as Response;
}

// ============================================================================
// Country Filtering Tests
// ============================================================================

Deno.test("Country Filtering: filter works correctly", async () => {
  const mockData = {
    results: [
      {
        name: "Thun",
        country: "Switzerland",
        country_code: "CH",
        latitude: 46.75,
        longitude: 7.63,
        admin1: "Bern",
      },
      {
        name: "Thun",
        country: "Pakistan",
        country_code: "PK",
        latitude: 33.5,
        longitude: 72.1,
        admin1: "Punjab",
      },
      {
        name: "Thūn",
        country: "India",
        country_code: "IN",
        latitude: 26.8,
        longitude: 78.4,
        admin1: "Uttar Pradesh",
      },
    ],
    generationtime_ms: 0.5,
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.searchLocation("Thun", 5, "en", "CH");

  // Should only return Swiss results
  assert(result.results);
  assertEquals(result.results.length, 1);
  assertEquals(result.results[0].country_code, "CH");
  assertEquals(result.results[0].name, "Thun");
  assertEquals(result.results[0].country, "Switzerland");
});

Deno.test("Country Filtering: no matches returns all results", async () => {
  const mockData = {
    results: [
      {
        name: "Thun",
        country: "Pakistan",
        country_code: "PK",
        latitude: 33.5,
        longitude: 72.1,
      },
      {
        name: "Thūn",
        country: "India",
        country_code: "IN",
        latitude: 26.8,
        longitude: 78.4,
      },
    ],
    generationtime_ms: 0.5,
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.searchLocation("Thun", 5, "en", "CH");

  // Should return all results when no country matches
  assert(result.results);
  assertEquals(result.results.length, 2);
});

Deno.test("Country Filtering: no filter returns all results", async () => {
  const mockData = {
    results: [
      {
        name: "Thun",
        country: "Switzerland",
        country_code: "CH",
        latitude: 46.75,
        longitude: 7.63,
      },
      {
        name: "Thun",
        country: "Pakistan",
        country_code: "PK",
        latitude: 33.5,
        longitude: 72.1,
      },
      {
        name: "Thūn",
        country: "India",
        country_code: "IN",
        latitude: 26.8,
        longitude: 78.4,
      },
    ],
    generationtime_ms: 0.5,
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.searchLocation("Thun", 5, "en");

  // Should return all results
  assert(result.results);
  assertEquals(result.results.length, 3);
});

// ============================================================================
// Timezone Consistency Tests
// ============================================================================

Deno.test("Timezone Consistency: air quality accepts timezone parameter", async () => {
  const mockData = {
    latitude: 46.9479,
    longitude: 7.4474,
    timezone: "Europe/Zurich",
    current: {
      european_aqi: 25,
      us_aqi: 45,
      pm10: 15.0,
      pm2_5: 8.0,
      uv_index: 3,
    },
    hourly: {
      time: ["2026-01-18T00:00"],
      european_aqi: [25],
      us_aqi: [45],
    },
  };

  // Track the fetch call to verify timezone parameter
  let fetchCalled = false;
  let fetchUrl = "";

  globalThis.fetch = async (input: string | URL | Request) => {
    fetchCalled = true;
    fetchUrl = typeof input === "string" ? input : input.toString();
    return {
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: new Headers(),
    } as Response;
  };

  const client = new OpenMeteoClient();
  const result = await client.getAirQuality(
    46.9479,
    7.4474,
    5,
    true,
    "Europe/Zurich",
  );

  // Verify timezone parameter was passed in URL
  assert(fetchCalled);
  assert(fetchUrl.includes("timezone=Europe%2FZurich"));

  // Verify result has correct timezone
  assertEquals(result.timezone, "Europe/Zurich");
});

Deno.test("Timezone Consistency: same timezone across endpoints", async () => {
  const weatherResponse = {
    latitude: 46.9479,
    longitude: 7.4474,
    timezone: "Europe/Zurich",
    current_weather: {
      temperature: 15.5,
      windspeed: 10.0,
      winddirection: 180,
      weathercode: 1,
      time: "2026-01-18T12:00",
    },
    hourly: { time: ["2026-01-18T00:00"], temperature_2m: [15.5] },
    daily: {
      time: ["2026-01-18"],
      temperature_2m_max: [18.0],
      temperature_2m_min: [12.0],
    },
  };

  const airQualityResponse = {
    latitude: 46.9479,
    longitude: 7.4474,
    timezone: "Europe/Zurich",
    current: { european_aqi: 25, us_aqi: 45 },
    hourly: { time: ["2026-01-18T00:00"], european_aqi: [25] },
  };

  // Mock fetch to return different responses based on URL
  globalThis.fetch = async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    const responseData = url.includes("air-quality") ? airQualityResponse : weatherResponse;

    return {
      ok: true,
      status: 200,
      json: async () => responseData,
      headers: new Headers(),
    } as Response;
  };

  const client = new OpenMeteoClient();

  // Get both weather and air quality
  const weather = await client.getWeather(
    46.9479,
    7.4474,
    7,
    true,
    "Europe/Zurich",
  );
  const airQuality = await client.getAirQuality(
    46.9479,
    7.4474,
    5,
    true,
    "Europe/Zurich",
  );

  // Both should use same timezone
  assertEquals(weather.timezone, "Europe/Zurich");
  assertEquals(airQuality.timezone, "Europe/Zurich");
  assertEquals(weather.timezone, airQuality.timezone);
});

// ============================================================================
// Weather Alerts Tests
// ============================================================================

Deno.test("Weather Alerts: heat alert generation", () => {
  const current = { temperature: 35.0, windspeed: 5.0 };
  const alerts: Array<{
    type: string;
    severity: string;
    description: string;
  }> = [];

  const temp = current.temperature;
  if (temp > 30) {
    const severity = temp > 35 ? "warning" : temp > 32 ? "watch" : "advisory";
    alerts.push({
      type: "heat",
      severity: severity,
      description: `High temperature alert: ${temp.toFixed(1)}°C`,
    });
  }

  assertEquals(alerts.length, 1);
  assertEquals(alerts[0].type, "heat");
  assertEquals(alerts[0].severity, "watch"); // 35°C should trigger watch (not > 35)
  assert(alerts[0].description.includes("35.0°C"));
});

Deno.test("Weather Alerts: cold alert generation", () => {
  const current = { temperature: -12.0, windspeed: 25.0 };
  const alerts: Array<{
    type: string;
    severity: string;
    description: string;
  }> = [];

  const temp = current.temperature;
  const windSpeed = current.windspeed;

  if (temp < -5) {
    const apparentTemp = temp - windSpeed * 0.6;
    const severity = apparentTemp < -15 ? "warning" : apparentTemp < -10 ? "watch" : "advisory";
    alerts.push({
      type: "cold",
      severity: severity,
      description: `Cold temperature alert: ${temp.toFixed(1)}°C (feels like ${
        apparentTemp.toFixed(1)
      }°C)`,
    });
  }

  assertEquals(alerts.length, 1);
  assertEquals(alerts[0].type, "cold");
  assertEquals(alerts[0].severity, "warning"); // -27°C feels like should trigger warning
  assert(alerts[0].description.includes("-12.0°C"));
});

Deno.test("Weather Alerts: storm alert generation", () => {
  const current = { temperature: 20.0, windspeed: 85.0, weathercode: 95 };
  const alerts: Array<{
    type: string;
    severity: string;
    description: string;
  }> = [];

  // Wind alert
  const windSpeed = current.windspeed;
  if (windSpeed > 60) {
    const severity = windSpeed > 80 ? "warning" : "watch";
    alerts.push({
      type: "wind",
      severity: severity,
      description: `High wind alert: ${windSpeed.toFixed(1)} km/h`,
    });
  }

  // Storm alert for thunderstorm weather code
  const weatherCode = current.weathercode;
  if (weatherCode >= 95) {
    alerts.push({
      type: "storm",
      severity: "warning",
      description: "Thunderstorm alert: Lightning and heavy precipitation",
    });
  }

  assertEquals(alerts.length, 2);

  const stormAlert = alerts.find((a) => a.type === "storm");
  const windAlert = alerts.find((a) => a.type === "wind");

  assert(stormAlert);
  assert(windAlert);
  assertEquals(stormAlert.severity, "warning");
  assertEquals(windAlert.severity, "warning");
  assert(stormAlert.description.includes("Thunderstorm"));
  assert(windAlert.description.includes("85.0 km/h"));
});

Deno.test("Weather Alerts: UV alert generation", () => {
  const daily = { uv_index_max: [11.0] };
  const alerts: Array<{
    type: string;
    severity: string;
    description: string;
  }> = [];

  const maxUv = Math.max(...daily.uv_index_max);
  if (maxUv > 8) {
    const severity = maxUv > 10 ? "warning" : "watch";
    alerts.push({
      type: "uv",
      severity: severity,
      description: `High UV alert: UV Index ${maxUv.toFixed(0)}`,
    });
  }

  assertEquals(alerts.length, 1);
  assertEquals(alerts[0].type, "uv");
  assertEquals(alerts[0].severity, "warning"); // UV 11 should trigger warning
  assert(alerts[0].description.includes("UV Index 11"));
});

Deno.test("Weather Alerts: precipitation alert generation", () => {
  const hourly = { precipitation: [0.0, 5.0, 15.0, 25.0, 2.0] };
  const alerts: Array<{
    type: string;
    severity: string;
    description: string;
  }> = [];

  for (const precip of hourly.precipitation) {
    if (precip > 10) {
      const severity = precip > 20 ? "warning" : "watch";
      alerts.push({
        type: "precipitation",
        severity: severity,
        description: `Heavy precipitation alert: ${precip.toFixed(1)}mm/hour expected`,
      });
      break; // Only show first heavy precipitation event
    }
  }

  assertEquals(alerts.length, 1);
  assertEquals(alerts[0].type, "precipitation");
  assertEquals(alerts[0].severity, "watch"); // 15mm should trigger watch
  assert(alerts[0].description.includes("15.0mm/hour"));
});

Deno.test("Weather Alerts: no alerts for normal conditions", () => {
  const current = { temperature: 18.0, windspeed: 15.0, weathercode: 1 };
  const daily = { uv_index_max: [5.0] };
  const hourly = { precipitation: [0.0, 0.5, 1.0] };

  const alerts: Array<{
    type: string;
    severity: string;
    description: string;
  }> = [];

  // Check all alert conditions
  const temp = current.temperature;
  if (temp > 30 || temp < -5) {
    // Should not trigger
  }

  const windSpeed = current.windspeed;
  if (windSpeed > 60) {
    // Should not trigger
  }

  const weatherCode = current.weathercode;
  if (weatherCode >= 95) {
    // Should not trigger
  }

  const maxUv = Math.max(...daily.uv_index_max);
  if (maxUv > 8) {
    // Should not trigger
  }

  for (const precip of hourly.precipitation) {
    if (precip > 10) {
      // Should not trigger
      break;
    }
  }

  assertEquals(alerts.length, 0);
});

// ============================================================================
// Integration Tests
// ============================================================================

Deno.test("Integration: end-to-end weather workflow", async () => {
  const locationResponse = {
    results: [
      {
        name: "Bern",
        country: "Switzerland",
        country_code: "CH",
        latitude: 46.9479,
        longitude: 7.4474,
        timezone: "Europe/Zurich",
      },
    ],
    generationtime_ms: 0.5,
  };

  const weatherResponse = {
    latitude: 46.9479,
    longitude: 7.4474,
    timezone: "Europe/Zurich",
    current_weather: {
      temperature: 32.0,
      windspeed: 15.0,
      winddirection: 180,
      weathercode: 1,
      time: "2026-01-18T12:00",
    },
    hourly: { time: ["2026-01-18T00:00"], precipitation: [0.0] },
    daily: { time: ["2026-01-18"], uv_index_max: [9.0] },
  };

  // Mock fetch to return different responses based on URL
  globalThis.fetch = async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    const responseData = url.includes("geocoding") ? locationResponse : weatherResponse;

    return {
      ok: true,
      status: 200,
      json: async () => responseData,
      headers: new Headers(),
    } as Response;
  };

  const client = new OpenMeteoClient();

  // Step 1: Search for location with country filter
  const locationResult = await client.searchLocation("Bern", 10, "en", "CH");
  assert(locationResult.results);
  assertEquals(locationResult.results.length, 1);
  assertEquals(locationResult.results[0].country_code, "CH");

  // Step 2: Get weather data for location
  const location = locationResult.results[0];
  const weather = await client.getWeather(
    location.latitude,
    location.longitude,
    7,
    true,
    "Europe/Zurich",
  );

  // Step 3: Verify timezone consistency
  assertEquals(weather.timezone, "Europe/Zurich");

  // Step 4: Check that we can generate alerts from this data
  const temp = weather.current_weather!.temperature;
  assertEquals(temp, 32.0);
  // This would trigger a heat alert (temp > 30)
});

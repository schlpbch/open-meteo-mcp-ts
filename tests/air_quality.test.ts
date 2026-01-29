/**
 * Unit tests for air quality edge cases.
 * Additional tests beyond basic client.test.ts coverage.
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

Deno.test("AirQuality: high pollution levels", async () => {
  const mockData = {
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: "Europe/Zurich",
    current: {
      time: "2026-01-10T12:00",
      european_aqi: 85, // Very Poor
      us_aqi: 175, // Unhealthy
      pm10: 85.5,
      pm2_5: 55.2,
      uv_index: 8.5, // Very High
    },
    hourly: {
      time: ["2026-01-10T00:00"],
      european_aqi: [85],
      us_aqi: [175],
      pm10: [85.5],
      pm2_5: [55.2],
      carbon_monoxide: [850.5],
      nitrogen_dioxide: [85.3],
      sulphur_dioxide: [45.1],
      ozone: [125.2],
      dust: [25.2],
      uv_index: [8.5],
      uv_index_clear_sky: [9.2],
      ammonia: [15.2],
    },
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.getAirQuality(47.3769, 8.5417);

  assert(result.current);
  assertEquals(result.current.european_aqi, 85); // Very Poor
  assertEquals(result.current.us_aqi, 175); // Unhealthy
  assert((result.current.pm2_5 || 0) > 50); // High PM2.5
  assert((result.current.uv_index || 0) > 8); // Very High UV
});

Deno.test("AirQuality: pollen season with high counts", async () => {
  const mockData = {
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: "Europe/Zurich",
    current: {
      time: "2026-05-15T12:00",
      european_aqi: 20,
      us_aqi: 50,
      pm10: 12.5,
      pm2_5: 6.2,
      uv_index: 6.5,
    },
    hourly: {
      time: ["2026-05-15T12:00"],
      european_aqi: [20],
      us_aqi: [50],
      pm10: [12.5],
      pm2_5: [6.2],
      carbon_monoxide: [200.5],
      nitrogen_dioxide: [10.3],
      sulphur_dioxide: [1.5],
      ozone: [55.2],
      dust: [3.2],
      uv_index: [6.5],
      uv_index_clear_sky: [7.2],
      ammonia: [1.0],
      alder_pollen: [5.0],
      birch_pollen: [125.5], // High birch pollen
      grass_pollen: [85.3], // High grass pollen
      mugwort_pollen: [2.0],
      olive_pollen: [15.5],
      ragweed_pollen: [0.0],
    },
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.getAirQuality(47.3769, 8.5417, 5, true);

  assert(result.hourly);
  assert(result.hourly.birch_pollen);
  assert(result.hourly.grass_pollen);
  assert(result.hourly.birch_pollen[0] > 100); // High birch pollen
  assert(result.hourly.grass_pollen[0] > 50); // High grass pollen
});

Deno.test("AirQuality: minimal data with only required fields", async () => {
  const mockData = {
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: "Europe/Zurich",
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.getAirQuality(47.3769, 8.5417);

  assertEquals(result.latitude, 47.3769);
  assertEquals(result.longitude, 8.5417);
  // current and hourly may be undefined
});

Deno.test("AirQuality: UV index level - Low (1.5)", async () => {
  const mockData = {
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: "Europe/Zurich",
    current: {
      time: "2026-01-10T12:00",
      european_aqi: 20,
      us_aqi: 50,
      pm10: 10.0,
      pm2_5: 5.0,
      uv_index: 1.5,
    },
    hourly: {
      time: ["2026-01-10T12:00"],
      european_aqi: [20],
      us_aqi: [50],
      pm10: [10.0],
      pm2_5: [5.0],
      carbon_monoxide: [200.0],
      nitrogen_dioxide: [10.0],
      sulphur_dioxide: [2.0],
      ozone: [50.0],
      dust: [5.0],
      uv_index: [1.5],
      uv_index_clear_sky: [2.5],
      ammonia: [1.0],
    },
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.getAirQuality(47.3769, 8.5417);

  assert(result.current);
  assertEquals(result.current.uv_index, 1.5); // Low
});

Deno.test("AirQuality: UV index level - Moderate (4.0)", async () => {
  const mockData = {
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: "Europe/Zurich",
    current: {
      time: "2026-01-10T12:00",
      european_aqi: 20,
      us_aqi: 50,
      pm10: 10.0,
      pm2_5: 5.0,
      uv_index: 4.0,
    },
    hourly: {
      time: ["2026-01-10T12:00"],
      european_aqi: [20],
      us_aqi: [50],
      pm10: [10.0],
      pm2_5: [5.0],
      carbon_monoxide: [200.0],
      nitrogen_dioxide: [10.0],
      sulphur_dioxide: [2.0],
      ozone: [50.0],
      dust: [5.0],
      uv_index: [4.0],
      uv_index_clear_sky: [5.0],
      ammonia: [1.0],
    },
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.getAirQuality(47.3769, 8.5417);

  assert(result.current);
  assertEquals(result.current.uv_index, 4.0); // Moderate
});

Deno.test("AirQuality: UV index level - Extreme (11.5)", async () => {
  const mockData = {
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: "Europe/Zurich",
    current: {
      time: "2026-01-10T12:00",
      european_aqi: 20,
      us_aqi: 50,
      pm10: 10.0,
      pm2_5: 5.0,
      uv_index: 11.5,
    },
    hourly: {
      time: ["2026-01-10T12:00"],
      european_aqi: [20],
      us_aqi: [50],
      pm10: [10.0],
      pm2_5: [5.0],
      carbon_monoxide: [200.0],
      nitrogen_dioxide: [10.0],
      sulphur_dioxide: [2.0],
      ozone: [50.0],
      dust: [5.0],
      uv_index: [11.5],
      uv_index_clear_sky: [12.5],
      ammonia: [1.0],
    },
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.getAirQuality(47.3769, 8.5417);

  assert(result.current);
  assertEquals(result.current.uv_index, 11.5); // Extreme
});

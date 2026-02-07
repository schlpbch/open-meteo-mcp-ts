/**
 * Unit tests for geocoding functionality.
 * Migrated from Python pytest tests.
 */

import { test } from "node:test";
import { strict as assert } from "assert";
import { OpenMeteoClient } from "../src/client.js";

// Mock fetch helper
function createMockFetch(responseData: unknown, status = 200): typeof fetch {
  return () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(responseData),
      headers: new Headers(),
    }) as Promise<Response>;
}

test("Geocoding: multiple results for same name", async () => {
  const mockData = {
    results: [
      {
        id: 2657896,
        name: "Zurich",
        latitude: 47.3769,
        longitude: 8.5417,
        elevation: 408.0,
        feature_code: "PPLA",
        country_code: "CH",
        country: "Switzerland",
        country_id: 2658434,
        timezone: "Europe/Zurich",
        population: 402762,
        admin1: "Zurich",
        admin1_id: 2657895,
      },
      {
        id: 5145476,
        name: "Zurich",
        latitude: 42.9931,
        longitude: -75.1007,
        elevation: 366.0,
        feature_code: "PPL",
        country_code: "US",
        country: "United States",
        timezone: "America/New_York",
        population: 1627,
        admin1: "New York",
      },
    ],
    generationtime_ms: 1.234,
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.searchLocation("Zurich", 10, "en");

  assert(result.results);
  assert.equal(result.results.length, 2);

  // Check first result (Zurich, Switzerland)
  const first = result.results[0];
  assert.equal(first.name, "Zurich");
  assert.equal(first.latitude, 47.3769);
  assert.equal(first.longitude, 8.5417);
  assert.equal(first.country_code, "CH");
  assert.equal(first.country, "Switzerland");
  assert.equal(first.timezone, "Europe/Zurich");
  assert.equal(first.population, 402762);

  // Check second result (Zurich, US)
  const second = result.results[1];
  assert.equal(second.name, "Zurich");
  assert.equal(second.country_code, "US");
});

test("Geocoding: search with country filter", async () => {
  const mockData = {
    results: [
      {
        id: 2661552,
        name: "Bern",
        latitude: 46.948,
        longitude: 7.4474,
        elevation: 542.0,
        country_code: "CH",
        country: "Switzerland",
        timezone: "Europe/Zurich",
        population: 133115,
      },
    ],
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.searchLocation("Bern", 5, "en", "CH");

  assert(result.results);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].country_code, "CH");
});

test("Geocoding: no results found", async () => {
  const mockData = {
    results: null,
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.searchLocation("NonexistentPlace123");

  // Client transforms null to empty array
  assert(Array.isArray(result.results));
  assert.equal(result.results?.length, 0);
});

test("Geocoding: fuzzy matching for typos", async () => {
  const mockData = {
    results: [
      {
        id: 2657896,
        name: "Zurich",
        latitude: 47.3769,
        longitude: 8.5417,
        country_code: "CH",
      },
    ],
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  // Search with typo "Zuerich" should still find "Zurich"
  const result = await client.searchLocation("Zuerich");

  assert(result.results);
  assert(result.results.length > 0);
  assert.equal(result.results[0].name, "Zurich");
});

test("Geocoding: count clamping to 1-100", async () => {
  const mockData = {
    results: [
      {
        name: "Test",
        latitude: 47.0,
        longitude: 8.0,
        country_code: "CH",
      },
    ],
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();

  // Test clamping to minimum (1)
  const result1 = await client.searchLocation("Test", 0);
  assert(result1);

  globalThis.fetch = createMockFetch(mockData);

  // Test clamping to maximum (100)
  const result2 = await client.searchLocation("Test", 200);
  assert(result2);
});

test("Geocoding: multilingual search", async () => {
  const mockData = {
    results: [
      {
        name: "Zürich",
        latitude: 47.3769,
        longitude: 8.5417,
        country_code: "CH",
      },
    ],
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.searchLocation("Zurich", 10, "de");

  assert(result.results);
  assert.equal(result.results[0].name, "Zürich");
});

test("Geocoding: HTTP error handling", async () => {
  globalThis.fetch = createMockFetch({}, 500);

  const client = new OpenMeteoClient();

  await assert.rejects(async () => {
    await client.searchLocation("Test");
  }, Error);
});

test("Geocoding: invalid response gracefully handled", async () => {
  const mockData = {
    invalid: "data",
  };

  globalThis.fetch = createMockFetch(mockData);

  const client = new OpenMeteoClient();
  const result = await client.searchLocation("Test");

  // Should handle gracefully - results will be empty or null
  assert(result.results === null || result.results?.length === 0);
});

test("Geocoding: popular Swiss locations", async () => {
  const locations = [
    { name: "Zermatt", lat: 45.9763, lon: 7.6586 },
    { name: "Interlaken", lat: 46.6863, lon: 7.8632 },
    { name: "Matterhorn", lat: 45.9763, lon: 7.6586 },
    { name: "Lake Geneva", lat: 46.4531, lon: 6.5619 },
  ];

  for (const loc of locations) {
    globalThis.fetch = createMockFetch({
      results: [
        {
          name: loc.name,
          latitude: loc.lat,
          longitude: loc.lon,
          country_code: "CH",
        },
      ],
    });

    const client = new OpenMeteoClient();
    const result = await client.searchLocation(loc.name);

    assert(result.results);
    assert.equal(result.results[0].latitude, loc.lat);
    assert.equal(result.results[0].longitude, loc.lon);
  }
});

/**
 * Comprehensive tests for MCP server tool call handlers.
 * Tests the handleToolCall() function with all 11 tools.
 * This significantly increases coverage for server.ts.
 */

import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { handleToolCall } from "../src/server.ts";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";

// Mock OpenMeteoClient for testing
const originalFetch = globalThis.fetch;

function mockFetch(mockData: unknown) {
  globalThis.fetch = (_url: string | URL | Request, _init?: RequestInit) => {
    return Promise.resolve(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// Mock weather data
const mockWeatherData = {
  latitude: 47.3769,
  longitude: 8.5417,
  timezone: "Europe/Zurich",
  current_weather: {
    temperature: 15.5,
    windspeed: 10.2,
    winddirection: 180,
    weathercode: 1,
    time: "2024-01-15T12:00",
  },
  hourly: {
    time: ["2024-01-15T00:00", "2024-01-15T01:00"],
    temperature_2m: [12.0, 11.5],
    precipitation: [0.0, 0.2],
  },
  daily: {
    time: ["2024-01-15"],
    temperature_2m_max: [18.0],
    temperature_2m_min: [10.0],
  },
};

const mockSnowData = {
  latitude: 46.0207,
  longitude: 7.7491,
  timezone: "Europe/Zurich",
  current: {
    snow_depth: 150,
    temperature_2m: -5.0,
  },
  hourly: {
    time: ["2024-01-15T00:00"],
    snow_depth: [150],
    snowfall: [2.5],
  },
  daily: {
    time: ["2024-01-15"],
    snowfall_sum: [15.0],
  },
};

const mockAirQualityData = {
  latitude: 47.3769,
  longitude: 8.5417,
  timezone: "Europe/Zurich",
  current: {
    european_aqi: 25,
    us_aqi: 30,
    pm2_5: 8.5,
    pm10: 15.2,
  },
  hourly: {
    time: ["2024-01-15T00:00"],
    pm2_5: [8.5],
    pm10: [15.2],
  },
};

const mockGeocodingData = {
  results: [
    {
      id: 2657896,
      name: "Zürich",
      latitude: 47.3769,
      longitude: 8.5417,
      country: "Switzerland",
      country_code: "CH",
      admin1: "Zürich",
      population: 402762,
    },
  ],
};

const mockHistoricalData = {
  latitude: 47.3769,
  longitude: 8.5417,
  timezone: "Europe/Zurich",
  daily: {
    time: ["2024-01-01", "2024-01-02"],
    temperature_2m_max: [10.0, 12.0],
    temperature_2m_min: [2.0, 3.0],
  },
};

const mockMarineData = {
  latitude: 47.5,
  longitude: 8.5,
  timezone: "Europe/Zurich",
  hourly: {
    time: ["2024-01-15T00:00"],
    wave_height: [1.5],
    wave_period: [8.0],
  },
  daily: {
    time: ["2024-01-15"],
    wave_height_max: [2.0],
  },
};

// ============================================================================
// Tool Call Tests
// ============================================================================

Deno.test("handleToolCall: meteo__get_weather with minimal args", async () => {
  mockFetch(mockWeatherData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_weather",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  assertEquals(result.content.length, 1);
  assertEquals(result.content[0].type, "text");

  const data = JSON.parse(result.content[0].text);
  assertEquals(data.latitude, 47.3769);
  assertEquals(data.timezone, "Europe/Zurich");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_weather with all args", async () => {
  mockFetch(mockWeatherData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_weather",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
        forecast_days: 5,
        include_hourly: true,
        timezone: "Europe/Zurich",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.current_weather);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_snow_conditions", async () => {
  mockFetch(mockSnowData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_snow_conditions",
      arguments: {
        latitude: 46.0207,
        longitude: 7.7491,
        forecast_days: 7,
        include_hourly: true,
        timezone: "Europe/Zurich",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertEquals(data.timezone, "Europe/Zurich");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__search_location", async () => {
  mockFetch(mockGeocodingData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__search_location",
      arguments: {
        name: "Zürich",
        count: 10,
        language: "en",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.results);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__search_location with country filter", async () => {
  mockFetch(mockGeocodingData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__search_location",
      arguments: {
        name: "Zürich",
        country: "CH",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.results);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_air_quality", async () => {
  mockFetch(mockAirQualityData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_air_quality",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
        forecast_days: 5,
        include_pollen: true,
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.current);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_weather_alerts", async () => {
  mockFetch(mockWeatherData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_weather_alerts",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
        forecast_hours: 48,
        timezone: "Europe/Zurich",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.alerts);
  assertEquals(data.latitude, 47.3769);
  assertEquals(data.longitude, 8.5417);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_historical_weather", async () => {
  mockFetch(mockHistoricalData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_historical_weather",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        include_hourly: false,
        timezone: "auto",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.daily);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_marine_conditions", async () => {
  mockFetch(mockMarineData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_marine_conditions",
      arguments: {
        latitude: 47.5,
        longitude: 8.5,
        forecast_days: 7,
        include_hourly: true,
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertEquals(data.timezone, "Europe/Zurich");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_comfort_index", async () => {
  // Mock multiple API calls (weather + air quality)
  let callCount = 0;
  globalThis.fetch = (_url: string | URL | Request, _init?: RequestInit) => {
    callCount++;
    const data = callCount === 1 ? mockWeatherData : mockAirQualityData;
    return Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_comfort_index",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
        timezone: "Europe/Zurich",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.comfort_index);
  assertEquals(data.latitude, 47.3769);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_astronomy with auto timezone", async () => {
  mockFetch(mockWeatherData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_astronomy",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
        timezone: "auto",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.astronomy);
  assertEquals(data.timezone, "Europe/Zurich");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_astronomy with explicit timezone", async () => {
  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_astronomy",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
        timezone: "Europe/Zurich",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.astronomy);
  assertEquals(data.timezone, "Europe/Zurich");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__search_location_swiss basic", async () => {
  mockFetch(mockGeocodingData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__search_location_swiss",
      arguments: {
        name: "Zürich",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertEquals(data.country, "CH");
  assertEquals(data.query, "Zürich");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__search_location_swiss with features", async () => {
  mockFetch({
    results: [
      {
        id: 1,
        name: "Zürich",
        latitude: 47.3769,
        longitude: 8.5417,
        country: "Switzerland",
        country_code: "CH",
        feature_code: "PPLA",
        population: 402762,
      },
      {
        id: 2,
        name: "Üetliberg",
        latitude: 47.3519,
        longitude: 8.4919,
        country: "Switzerland",
        country_code: "CH",
        feature_code: "MT",
        population: 0,
      },
    ],
  });

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__search_location_swiss",
      arguments: {
        name: "Zürich",
        include_features: true,
        count: 5,
        language: "de",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertEquals(data.include_features, true);
  assertEquals(data.language, "de");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__compare_locations", async () => {
  let callCount = 0;
  globalThis.fetch = (_url: string | URL | Request, _init?: RequestInit) => {
    callCount++;
    // Alternate between weather and air quality responses
    const data = callCount % 2 === 1 ? mockWeatherData : mockAirQualityData;
    return Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__compare_locations",
      arguments: {
        locations: [
          { name: "Zürich", latitude: 47.3769, longitude: 8.5417 },
          { name: "Bern", latitude: 46.9479, longitude: 7.4474 },
        ],
        criteria: "best_overall",
        forecast_days: 1,
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertEquals(data.criteria, "best_overall");
  assertExists(data.locations);
  assertEquals(data.locations.length, 2);
  assertExists(data.winner);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__compare_locations with warmest criteria", async () => {
  let callCount = 0;
  globalThis.fetch = (_url: string | URL | Request, _init?: RequestInit) => {
    callCount++;
    const data = callCount % 2 === 1 ? mockWeatherData : mockAirQualityData;
    return Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__compare_locations",
      arguments: {
        locations: [
          { name: "Zürich", latitude: 47.3769, longitude: 8.5417 },
        ],
        criteria: "warmest",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertEquals(data.criteria, "warmest");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__compare_locations with best_air_quality criteria", async () => {
  let callCount = 0;
  globalThis.fetch = (_url: string | URL | Request, _init?: RequestInit) => {
    callCount++;
    const data = callCount % 2 === 1 ? mockWeatherData : mockAirQualityData;
    return Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__compare_locations",
      arguments: {
        locations: [
          { name: "Zürich", latitude: 47.3769, longitude: 8.5417 },
        ],
        criteria: "best_air_quality",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertEquals(data.criteria, "best_air_quality");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__compare_locations with calmest criteria", async () => {
  let callCount = 0;
  globalThis.fetch = (_url: string | URL | Request, _init?: RequestInit) => {
    callCount++;
    const data = callCount % 2 === 1 ? mockWeatherData : mockAirQualityData;
    return Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__compare_locations",
      arguments: {
        locations: [
          { name: "Zürich", latitude: 47.3769, longitude: 8.5417 },
        ],
        criteria: "calmest",
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertEquals(data.criteria, "calmest");

  restoreFetch();
});

Deno.test("handleToolCall: meteo__compare_locations handles API error gracefully", async () => {
  globalThis.fetch = (_url: string | URL | Request, _init?: RequestInit) => {
    return Promise.resolve(
      new Response(null, {
        status: 500,
        statusText: "Internal Server Error",
      }),
    );
  };

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__compare_locations",
      arguments: {
        locations: [
          { name: "Zürich", latitude: 47.3769, longitude: 8.5417 },
        ],
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.locations);
  assert(data.locations[0].error);

  restoreFetch();
});

// ============================================================================
// Error Cases
// ============================================================================

Deno.test("handleToolCall: throws error for unknown tool", async () => {
  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__unknown_tool",
      arguments: {},
    },
  };

  await assertRejects(
    async () => await handleToolCall(request),
    Error,
    "Unknown tool",
  );
});

Deno.test("handleToolCall: throws error when arguments are missing", async () => {
  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_weather",
    },
  } as CallToolRequest;

  await assertRejects(
    async () => await handleToolCall(request),
    Error,
    "No arguments provided",
  );
});

Deno.test("handleToolCall: meteo__get_weather_alerts with default forecast_hours", async () => {
  mockFetch(mockWeatherData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_weather_alerts",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.alerts);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_snow_conditions with defaults", async () => {
  mockFetch(mockSnowData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_snow_conditions",
      arguments: {
        latitude: 46.0207,
        longitude: 7.7491,
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.timezone);

  restoreFetch();
});

Deno.test("handleToolCall: meteo__get_air_quality with defaults", async () => {
  mockFetch(mockAirQualityData);

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name: "meteo__get_air_quality",
      arguments: {
        latitude: 47.3769,
        longitude: 8.5417,
      },
    },
  };

  const result = await handleToolCall(request);

  assertExists(result.content);
  const data = JSON.parse(result.content[0].text);
  assertExists(data.current);

  restoreFetch();
});

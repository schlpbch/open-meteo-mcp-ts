/**
 * Unit tests for Zod model schemas.
 * Migrated from Python pytest tests.
 */

import { assertEquals, assertExists, assertThrows } from "@std/assert";
import {
  AirQualityForecastSchema,
  CurrentWeatherSchema,
  DailySnowSchema,
  DailyWeatherSchema,
  GeocodingResponseSchema,
  GeocodingResultSchema,
  HourlySnowSchema,
  HourlyWeatherSchema,
  MarineConditionsSchema,
  SnowConditionsSchema,
  SnowInputSchema,
  WeatherForecastSchema,
  WeatherInputSchema,
} from "../src/models.ts";
import { ZodError } from "zod";

// ============================================================================
// WeatherInput Tests
// ============================================================================

Deno.test("WeatherInput: valid weather input", () => {
  const result = WeatherInputSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
    forecast_days: 7,
    include_hourly: true,
    timezone: "Europe/Zurich",
  });

  assertEquals(result.latitude, 46.9479);
  assertEquals(result.longitude, 7.4474);
  assertEquals(result.forecast_days, 7);
  assertEquals(result.include_hourly, true);
  assertEquals(result.timezone, "Europe/Zurich");
});

Deno.test("WeatherInput: default values", () => {
  const result = WeatherInputSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
  });

  assertEquals(result.forecast_days, 7);
  assertEquals(result.include_hourly, true);
  assertEquals(result.timezone, "auto");
});

Deno.test("WeatherInput: invalid latitude too high", () => {
  assertThrows(
    () => {
      WeatherInputSchema.parse({
        latitude: 100,
        longitude: 7.4474,
      });
    },
    ZodError,
    "latitude",
  );
});

Deno.test("WeatherInput: invalid latitude too low", () => {
  assertThrows(
    () => {
      WeatherInputSchema.parse({
        latitude: -100,
        longitude: 7.4474,
      });
    },
    ZodError,
    "latitude",
  );
});

Deno.test("WeatherInput: invalid longitude too high", () => {
  assertThrows(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: 200,
      });
    },
    ZodError,
    "longitude",
  );
});

Deno.test("WeatherInput: invalid longitude too low", () => {
  assertThrows(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: -200,
      });
    },
    ZodError,
    "longitude",
  );
});

Deno.test("WeatherInput: invalid forecast_days too low", () => {
  assertThrows(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: 7.4474,
        forecast_days: 0,
      });
    },
    ZodError,
    "forecast_days",
  );
});

Deno.test("WeatherInput: invalid forecast_days too high", () => {
  assertThrows(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: 7.4474,
        forecast_days: 20,
      });
    },
    ZodError,
    "forecast_days",
  );
});

Deno.test("WeatherInput: empty timezone", () => {
  assertThrows(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: 7.4474,
        timezone: "",
      });
    },
    ZodError,
    "timezone",
  );
});

// ============================================================================
// SnowInput Tests
// ============================================================================

Deno.test("SnowInput: valid snow input", () => {
  const result = SnowInputSchema.parse({
    latitude: 45.9763,
    longitude: 7.6586,
    forecast_days: 7,
    include_hourly: true,
    timezone: "Europe/Zurich",
  });

  assertEquals(result.latitude, 45.9763);
  assertEquals(result.longitude, 7.6586);
  assertEquals(result.forecast_days, 7);
  assertEquals(result.timezone, "Europe/Zurich");
});

Deno.test("SnowInput: default timezone", () => {
  const result = SnowInputSchema.parse({
    latitude: 45.9763,
    longitude: 7.6586,
  });

  assertEquals(result.timezone, "Europe/Zurich");
});

Deno.test("SnowInput: coordinate validation", () => {
  assertThrows(() => {
    SnowInputSchema.parse({
      latitude: 100,
      longitude: 7.6586,
    });
  }, ZodError);
});

// ============================================================================
// CurrentWeather Tests
// ============================================================================

Deno.test("CurrentWeather: valid current weather", () => {
  const result = CurrentWeatherSchema.parse({
    temperature: 15.2,
    windspeed: 12.5,
    winddirection: 180,
    weathercode: 2,
    time: "2026-01-09T09:00",
  });

  assertEquals(result.temperature, 15.2);
  assertEquals(result.windspeed, 12.5);
  assertEquals(result.winddirection, 180);
  assertEquals(result.weathercode, 2);
  assertEquals(result.time, "2026-01-09T09:00");
});

// ============================================================================
// WeatherForecast Tests
// ============================================================================

Deno.test("WeatherForecast: valid weather forecast", () => {
  const result = WeatherForecastSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
    elevation: 542.0,
    timezone: "Europe/Zurich",
    timezone_abbreviation: "CET",
    utc_offset_seconds: 3600,
    current_weather: {
      temperature: 15.2,
      windspeed: 12.5,
      winddirection: 180,
      weathercode: 2,
      time: "2026-01-09T09:00",
    },
    hourly: {
      time: ["2026-01-09T00:00", "2026-01-09T01:00"],
      temperature_2m: [14.5, 14.2],
      precipitation: [0.0, 0.0],
      weather_code: [2, 2],
      wind_speed_10m: [10.5, 11.2],
    },
    daily: {
      time: ["2026-01-09"],
      temperature_2m_max: [18.5],
      temperature_2m_min: [12.3],
      precipitation_sum: [0.0],
      weather_code: [2],
    },
  });

  assertEquals(result.latitude, 46.9479);
  assertExists(result.current_weather);
  assertEquals(result.current_weather?.temperature, 15.2);
  assertExists(result.hourly);
  assertEquals(result.hourly?.time.length, 2);
  assertExists(result.daily);
  assertEquals(result.daily?.time.length, 1);
});

Deno.test("WeatherForecast: minimal weather forecast", () => {
  const result = WeatherForecastSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
    timezone: "Europe/Zurich",
  });

  assertEquals(result.latitude, 46.9479);
  assertEquals(result.current_weather, undefined);
  assertEquals(result.hourly, undefined);
  assertEquals(result.daily, undefined);
});

// ============================================================================
// SnowConditions Tests
// ============================================================================

Deno.test("SnowConditions: valid snow conditions", () => {
  const result = SnowConditionsSchema.parse({
    latitude: 45.9763,
    longitude: 7.6586,
    elevation: 1620.0,
    timezone: "Europe/Zurich",
    hourly: {
      time: ["2026-01-09T00:00", "2026-01-09T01:00"],
      temperature_2m: [-5.2, -5.8],
      snowfall: [0.5, 0.3],
      snow_depth: [1.2, 1.25],
      weather_code: [71, 71],
    },
    daily: {
      time: ["2026-01-09"],
      temperature_2m_max: [-2.5],
      temperature_2m_min: [-8.3],
      snowfall_sum: [2.5],
    },
  });

  assertEquals(result.latitude, 45.9763);
  assertExists(result.hourly);
  assertEquals(result.hourly?.time.length, 2);
  assertExists(result.daily);
  assertEquals(result.daily?.snowfall_sum[0], 2.5);
});

// ============================================================================
// Model Serialization Tests
// ============================================================================

Deno.test("Serialization: WeatherInput to object", () => {
  const input = WeatherInputSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
  });

  // Zod parse returns a plain object, so we can directly access properties
  assertEquals(input.latitude, 46.9479);
  assertEquals(input.longitude, 7.4474);
  assertEquals(input.forecast_days, 7);
});

Deno.test("Serialization: WeatherForecast from object", () => {
  const data = {
    latitude: 46.9479,
    longitude: 7.4474,
    timezone: "Europe/Zurich",
    current_weather: {
      temperature: 15.2,
      windspeed: 12.5,
      winddirection: 180,
      weathercode: 2,
      time: "2026-01-09T09:00",
    },
  };

  const result = WeatherForecastSchema.parse(data);

  assertEquals(result.latitude, 46.9479);
  assertEquals(result.current_weather?.temperature, 15.2);
});

// ============================================================================
// Additional Model Tests
// ============================================================================

Deno.test("GeocodingResult: valid geocoding result", () => {
  const result = GeocodingResultSchema.parse({
    id: 1,
    name: "Zurich",
    latitude: 47.3769,
    longitude: 8.5417,
    elevation: 408.0,
    country_code: "CH",
    country: "Switzerland",
    timezone: "Europe/Zurich",
    population: 402762,
  });

  assertEquals(result.name, "Zurich");
  assertEquals(result.country_code, "CH");
  assertEquals(result.population, 402762);
});

Deno.test("GeocodingResponse: valid response with results", () => {
  const result = GeocodingResponseSchema.parse({
    results: [
      {
        id: 1,
        name: "Zurich",
        latitude: 47.3769,
        longitude: 8.5417,
        country_code: "CH",
      },
    ],
    generationtime_ms: 0.5,
  });

  assertExists(result.results);
  assertEquals(result.results?.length, 1);
  assertEquals(result.results?.[0].name, "Zurich");
});

Deno.test("AirQualityForecast: valid air quality forecast", () => {
  const result = AirQualityForecastSchema.parse({
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: "Europe/Zurich",
    current: {
      time: "2026-01-09T09:00",
      european_aqi: 25,
      us_aqi: 42,
      pm10: 15.5,
      pm2_5: 8.2,
      uv_index: 2.5,
    },
    hourly: {
      time: ["2026-01-09T00:00", "2026-01-09T01:00"],
      european_aqi: [20, 22],
      us_aqi: [38, 40],
      pm10: [12.0, 14.5],
      pm2_5: [6.5, 7.8],
    },
  });

  assertEquals(result.latitude, 47.3769);
  assertExists(result.current);
  assertEquals(result.current?.european_aqi, 25);
  assertExists(result.hourly);
  assertEquals(result.hourly?.time.length, 2);
});

Deno.test("MarineConditions: valid marine conditions", () => {
  const result = MarineConditionsSchema.parse({
    latitude: 45.5,
    longitude: 9.2,
    timezone: "Europe/Rome",
    hourly: {
      time: ["2026-01-09T00:00", "2026-01-09T01:00"],
      wave_height: [1.2, 1.5],
      wave_direction: [180, 185],
      wave_period: [5.5, 6.0],
    },
    daily: {
      time: ["2026-01-09"],
      wave_height_max: [2.1],
      wave_direction_dominant: [180],
      wave_period_max: [7.5],
    },
  });

  assertEquals(result.latitude, 45.5);
  assertExists(result.hourly);
  assertEquals(result.hourly?.wave_height?.length, 2);
  assertExists(result.daily);
});

// ============================================================================
// HourlyWeather and DailyWeather Default Arrays
// ============================================================================

Deno.test("HourlyWeather: handles default empty arrays", () => {
  const result = HourlyWeatherSchema.parse({});

  assertEquals(result.time, []);
  assertEquals(result.temperature_2m, []);
  assertEquals(result.precipitation, []);
  assertEquals(result.weather_code, []);
  assertEquals(result.wind_speed_10m, []);
});

Deno.test("DailyWeather: handles default empty arrays", () => {
  const result = DailyWeatherSchema.parse({});

  assertEquals(result.time, []);
  assertEquals(result.temperature_2m_max, []);
  assertEquals(result.temperature_2m_min, []);
  assertEquals(result.precipitation_sum, []);
  assertEquals(result.weather_code, []);
});

Deno.test("HourlySnow: handles default empty arrays", () => {
  const result = HourlySnowSchema.parse({});

  assertEquals(result.time, []);
  assertEquals(result.temperature_2m, []);
  assertEquals(result.snowfall, []);
  assertEquals(result.snow_depth, []);
  assertEquals(result.weather_code, []);
});

Deno.test("DailySnow: handles default empty arrays", () => {
  const result = DailySnowSchema.parse({});

  assertEquals(result.time, []);
  assertEquals(result.temperature_2m_max, []);
  assertEquals(result.temperature_2m_min, []);
  assertEquals(result.snowfall_sum, []);
});

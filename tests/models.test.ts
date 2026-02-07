/**
 * Unit tests for Zod model schemas.
 * Migrated from Python pytest tests.
 */

import { test } from "node:test";
import { strict as assert } from "assert";
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
} from "../src/models.js";
import { ZodError } from "zod";

// ============================================================================
// WeatherInput Tests
// ============================================================================

test("WeatherInput: valid weather input", () => {
  const result = WeatherInputSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
    forecast_days: 7,
    include_hourly: true,
    timezone: "Europe/Zurich",
  });

  assert.equal(result.latitude, 46.9479);
  assert.equal(result.longitude, 7.4474);
  assert.equal(result.forecast_days, 7);
  assert.equal(result.include_hourly, true);
  assert.equal(result.timezone, "Europe/Zurich");
});

test("WeatherInput: default values", () => {
  const result = WeatherInputSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
  });

  assert.equal(result.forecast_days, 7);
  assert.equal(result.include_hourly, true);
  assert.equal(result.timezone, "auto");
});

test("WeatherInput: invalid latitude too high", () => {
  assert.throws(
    () => {
      WeatherInputSchema.parse({
        latitude: 100,
        longitude: 7.4474,
      });
    },
    ZodError,
    "latitude"
  );
});

test("WeatherInput: invalid latitude too low", () => {
  assert.throws(
    () => {
      WeatherInputSchema.parse({
        latitude: -100,
        longitude: 7.4474,
      });
    },
    ZodError,
    "latitude"
  );
});

test("WeatherInput: invalid longitude too high", () => {
  assert.throws(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: 200,
      });
    },
    ZodError,
    "longitude"
  );
});

test("WeatherInput: invalid longitude too low", () => {
  assert.throws(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: -200,
      });
    },
    ZodError,
    "longitude"
  );
});

test("WeatherInput: invalid forecast_days too low", () => {
  assert.throws(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: 7.4474,
        forecast_days: 0,
      });
    },
    ZodError,
    "forecast_days"
  );
});

test("WeatherInput: invalid forecast_days too high", () => {
  assert.throws(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: 7.4474,
        forecast_days: 20,
      });
    },
    ZodError,
    "forecast_days"
  );
});

test("WeatherInput: empty timezone", () => {
  assert.throws(
    () => {
      WeatherInputSchema.parse({
        latitude: 46.9479,
        longitude: 7.4474,
        timezone: "",
      });
    },
    ZodError,
    "timezone"
  );
});

// ============================================================================
// SnowInput Tests
// ============================================================================

test("SnowInput: valid snow input", () => {
  const result = SnowInputSchema.parse({
    latitude: 45.9763,
    longitude: 7.6586,
    forecast_days: 7,
    include_hourly: true,
    timezone: "Europe/Zurich",
  });

  assert.equal(result.latitude, 45.9763);
  assert.equal(result.longitude, 7.6586);
  assert.equal(result.forecast_days, 7);
  assert.equal(result.timezone, "Europe/Zurich");
});

test("SnowInput: default timezone", () => {
  const result = SnowInputSchema.parse({
    latitude: 45.9763,
    longitude: 7.6586,
  });

  assert.equal(result.timezone, "Europe/Zurich");
});

test("SnowInput: coordinate validation", () => {
  assert.throws(() => {
    SnowInputSchema.parse({
      latitude: 100,
      longitude: 7.6586,
    });
  }, ZodError);
});

// ============================================================================
// CurrentWeather Tests
// ============================================================================

test("CurrentWeather: valid current weather", () => {
  const result = CurrentWeatherSchema.parse({
    temperature: 15.2,
    windspeed: 12.5,
    winddirection: 180,
    weathercode: 2,
    time: "2026-01-09T09:00",
  });

  assert.equal(result.temperature, 15.2);
  assert.equal(result.windspeed, 12.5);
  assert.equal(result.winddirection, 180);
  assert.equal(result.weathercode, 2);
  assert.equal(result.time, "2026-01-09T09:00");
});

// ============================================================================
// WeatherForecast Tests
// ============================================================================

test("WeatherForecast: valid weather forecast", () => {
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

  assert.equal(result.latitude, 46.9479);
  assert.ok(result.current_weather);
  assert.equal(result.current_weather?.temperature, 15.2);
  assert.ok(result.hourly);
  assert.equal(result.hourly?.time.length, 2);
  assert.ok(result.daily);
  assert.equal(result.daily?.time.length, 1);
});

test("WeatherForecast: minimal weather forecast", () => {
  const result = WeatherForecastSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
    timezone: "Europe/Zurich",
  });

  assert.equal(result.latitude, 46.9479);
  assert.equal(result.current_weather, undefined);
  assert.equal(result.hourly, undefined);
  assert.equal(result.daily, undefined);
});

// ============================================================================
// SnowConditions Tests
// ============================================================================

test("SnowConditions: valid snow conditions", () => {
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

  assert.equal(result.latitude, 45.9763);
  assert.ok(result.hourly);
  assert.equal(result.hourly?.time.length, 2);
  assert.ok(result.daily);
  assert.equal(result.daily?.snowfall_sum[0], 2.5);
});

// ============================================================================
// Model Serialization Tests
// ============================================================================

test("Serialization: WeatherInput to object", () => {
  const input = WeatherInputSchema.parse({
    latitude: 46.9479,
    longitude: 7.4474,
  });

  // Zod parse returns a plain object, so we can directly access properties
  assert.equal(input.latitude, 46.9479);
  assert.equal(input.longitude, 7.4474);
  assert.equal(input.forecast_days, 7);
});

test("Serialization: WeatherForecast from object", () => {
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

  assert.equal(result.latitude, 46.9479);
  assert.equal(result.current_weather?.temperature, 15.2);
});

// ============================================================================
// Additional Model Tests
// ============================================================================

test("GeocodingResult: valid geocoding result", () => {
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

  assert.equal(result.name, "Zurich");
  assert.equal(result.country_code, "CH");
  assert.equal(result.population, 402762);
});

test("GeocodingResponse: valid response with results", () => {
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

  assert.ok(result.results);
  assert.equal(result.results?.length, 1);
  assert.equal(result.results?.[0].name, "Zurich");
});

test("AirQualityForecast: valid air quality forecast", () => {
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

  assert.equal(result.latitude, 47.3769);
  assert.ok(result.current);
  assert.equal(result.current?.european_aqi, 25);
  assert.ok(result.hourly);
  assert.equal(result.hourly?.time.length, 2);
});

test("MarineConditions: valid marine conditions", () => {
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

  assert.equal(result.latitude, 45.5);
  assert.ok(result.hourly);
  assert.equal(result.hourly?.wave_height?.length, 2);
  assert.ok(result.daily);
});

// ============================================================================
// HourlyWeather and DailyWeather Default Arrays
// ============================================================================

test("HourlyWeather: handles default empty arrays", () => {
  const result = HourlyWeatherSchema.parse({});

  assert.deepEqual(result.time, []);
  assert.deepEqual(result.temperature_2m, []);
  assert.deepEqual(result.precipitation, []);
  assert.deepEqual(result.weather_code, []);
  assert.deepEqual(result.wind_speed_10m, []);
});

test("DailyWeather: handles default empty arrays", () => {
  const result = DailyWeatherSchema.parse({});

  assert.deepEqual(result.time, []);
  assert.deepEqual(result.temperature_2m_max, []);
  assert.deepEqual(result.temperature_2m_min, []);
  assert.deepEqual(result.precipitation_sum, []);
  assert.deepEqual(result.weather_code, []);
});

test("HourlySnow: handles default empty arrays", () => {
  const result = HourlySnowSchema.parse({});

  assert.deepEqual(result.time, []);
  assert.deepEqual(result.temperature_2m, []);
  assert.deepEqual(result.snowfall, []);
  assert.deepEqual(result.snow_depth, []);
  assert.deepEqual(result.weather_code, []);
});

test("DailySnow: handles default empty arrays", () => {
  const result = DailySnowSchema.parse({});

  assert.deepEqual(result.time, []);
  assert.deepEqual(result.temperature_2m_max, []);
  assert.deepEqual(result.temperature_2m_min, []);
  assert.deepEqual(result.snowfall_sum, []);
});

/**
 * Async HTTP client for Open-Meteo Weather API.
 * TypeScript/Node.js implementation using native fetch.
 */

import type {
  AirQualityForecast,
  GeocodingResponse,
  MarineConditions,
  SnowConditions,
  WeatherForecast,
} from "./models.ts";
import {
  AirQualityForecastSchema,
  GeocodingResponseSchema,
  MarineConditionsSchema,
  SnowConditionsSchema,
  WeatherForecastSchema,
} from "./models.ts";

/**
 * Client for the Open-Meteo Weather API.
 *
 * Open-Meteo is a free, open-source weather API that provides:
 * - Current weather conditions
 * - Hourly forecasts (up to 16 days)
 * - Daily forecasts
 * - Historical weather data
 *
 * API Documentation: https://open-meteo.com/en/docs
 * No API key required. Free for non-commercial use.
 */
export class OpenMeteoClient {
  private readonly baseUrl = "https://api.open-meteo.com/v1";
  private readonly timeout: number;
  private readonly userAgent = "open-meteo-mcp-ts/4.0.0";

  constructor(timeout = 30000) {
    this.timeout = timeout;
  }

  /**
   * Get current weather and forecast for a location.
   *
   * @param latitude - Latitude in decimal degrees (e.g., 46.9479 for Bern)
   * @param longitude - Longitude in decimal degrees (e.g., 7.4474 for Bern)
   * @param forecastDays - Number of forecast days (1-16, default: 7)
   * @param includeHourly - Include hourly forecast data (default: true)
   * @param timezone - Timezone for timestamps (e.g., 'Europe/Zurich', default: 'auto')
   * @returns WeatherForecast object with current conditions and forecast data
   * @throws Error if the API request fails or response cannot be parsed
   */
  async getWeather(
    latitude: number,
    longitude: number,
    forecastDays = 7,
    includeHourly = true,
    timezone = "auto",
  ): Promise<WeatherForecast> {
    // Clamp forecast_days to 1-16
    const clampedDays = Math.min(Math.max(forecastDays, 1), 16);

    // Build query parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      forecast_days: clampedDays.toString(),
      timezone,
      current_weather: "true",
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,precipitation_hours,weather_code,sunrise,sunset,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max",
    });

    if (includeHourly) {
      params.set(
        "hourly",
        "temperature_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,cloud_cover,visibility,uv_index,is_day",
      );
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/forecast?${params}`,
      );

      if (!response.ok) {
        throw new Error(
          `Weather API HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      return WeatherForecastSchema.parse(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP error")) {
        throw error;
      }
      throw new Error(`Failed to parse weather data: ${error}`);
    }
  }

  /**
   * Get snow conditions and forecasts for mountain locations.
   *
   * @param latitude - Latitude in decimal degrees (e.g., 45.9763 for Zermatt)
   * @param longitude - Longitude in decimal degrees (e.g., 7.6586 for Zermatt)
   * @param forecastDays - Number of forecast days (1-16, default: 7)
   * @param includeHourly - Include hourly data (default: true)
   * @param timezone - Timezone for timestamps (default: 'Europe/Zurich')
   * @returns SnowConditions object with snow depth, snowfall, and forecast data
   * @throws Error if the API request fails or response cannot be parsed
   */
  async getSnowConditions(
    latitude: number,
    longitude: number,
    forecastDays = 7,
    includeHourly = true,
    timezone = "Europe/Zurich",
  ): Promise<SnowConditions> {
    // Clamp forecast_days to 1-16
    const clampedDays = Math.min(Math.max(forecastDays, 1), 16);

    // Build query parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      forecast_days: clampedDays.toString(),
      timezone,
      daily:
        "snowfall_sum,snow_depth_max,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max",
    });

    if (includeHourly) {
      params.set(
        "hourly",
        "snowfall,snow_depth,temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,precipitation_probability",
      );
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/forecast?${params}`,
      );

      if (!response.ok) {
        throw new Error(
          `Snow API HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      return SnowConditionsSchema.parse(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP error")) {
        throw error;
      }
      throw new Error(`Failed to parse snow data: ${error}`);
    }
  }

  /**
   * Get air quality forecast for a location.
   *
   * @param latitude - Latitude in decimal degrees
   * @param longitude - Longitude in decimal degrees
   * @param forecastDays - Number of forecast days (1-5, default: 5)
   * @param includePollen - Include pollen data (Europe only, default: true)
   * @param timezone - Timezone for timestamps (default: 'auto')
   * @returns AirQualityForecast with AQI, pollutants, UV index, and pollen data
   * @throws Error if the API request fails or response cannot be parsed
   */
  async getAirQuality(
    latitude: number,
    longitude: number,
    forecastDays = 5,
    includePollen = true,
    timezone = "auto",
  ): Promise<AirQualityForecast> {
    // Build hourly parameters
    const hourlyParams = [
      "european_aqi",
      "us_aqi",
      "pm10",
      "pm2_5",
      "carbon_monoxide",
      "nitrogen_dioxide",
      "sulphur_dioxide",
      "ozone",
      "dust",
      "uv_index",
      "uv_index_clear_sky",
      "ammonia",
    ];

    // Add pollen data if requested (Europe only)
    if (includePollen) {
      hourlyParams.push(
        "alder_pollen",
        "birch_pollen",
        "grass_pollen",
        "mugwort_pollen",
        "olive_pollen",
        "ragweed_pollen",
      );
    }

    // Clamp forecast_days to 1-5
    const clampedDays = Math.min(Math.max(forecastDays, 1), 5);

    // Build query parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      forecast_days: clampedDays.toString(),
      timezone,
      current: "european_aqi,us_aqi,pm10,pm2_5,uv_index",
      hourly: hourlyParams.join(","),
    });

    try {
      const airQualityUrl =
        `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`;
      const response = await this.fetchWithTimeout(airQualityUrl);

      if (!response.ok) {
        throw new Error(
          `Air Quality API HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      return AirQualityForecastSchema.parse(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP error")) {
        throw error;
      }
      throw new Error(`Failed to parse air quality data: ${error}`);
    }
  }

  /**
   * Search for locations by name using geocoding API.
   *
   * @param name - Location name to search (e.g., "Zurich", "Bern", "Zermatt")
   * @param count - Number of results to return (1-100, default: 10)
   * @param language - Language for results (default: "en")
   * @param country - Optional ISO 3166-1 alpha-2 country code filter (e.g., "CH" for Switzerland)
   * @returns GeocodingResponse with list of matching locations
   * @throws Error if the API request fails or response cannot be parsed
   */
  async searchLocation(
    name: string,
    count = 10,
    language = "en",
    country?: string,
  ): Promise<GeocodingResponse> {
    // Clamp count to 1-100
    const clampedCount = Math.min(Math.max(count, 1), 100);

    // Build query parameters
    const params = new URLSearchParams({
      name,
      count: clampedCount.toString(),
      language,
      format: "json",
    });

    if (country) {
      params.set("country", country);
    }

    try {
      const geocodingUrl =
        `https://geocoding-api.open-meteo.com/v1/search?${params}`;
      const response = await this.fetchWithTimeout(geocodingUrl);

      if (!response.ok) {
        throw new Error(
          `Geocoding API HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        results?: Array<{ country_code?: string }>;
        generationtime_ms?: number;
      };
      let results = data.results || [];

      // Apply client-side country filtering if country is specified
      // The API's country parameter acts as a "bias" not a strict filter
      if (country && results.length > 0) {
        const countryUpper = country.toUpperCase();
        const filteredResults = results.filter(
          (r) => r?.country_code?.toUpperCase?.() === countryUpper,
        );

        // If we have matches after filtering, use them; otherwise return all
        if (filteredResults.length > 0) {
          results = filteredResults;
        }
      }

      // Return the response with filtered results
      return GeocodingResponseSchema.parse({
        results,
        generationtime_ms: data.generationtime_ms,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP error")) {
        throw error;
      }
      throw new Error(`Failed to parse geocoding data: ${error}`);
    }
  }

  /**
   * Get historical weather data for a location.
   *
   * @param latitude - Latitude in decimal degrees
   * @param longitude - Longitude in decimal degrees
   * @param startDate - Start date in ISO format (YYYY-MM-DD)
   * @param endDate - End date in ISO format (YYYY-MM-DD)
   * @param hourly - Include hourly historical data (default: false)
   * @param timezone - Timezone for timestamps (default: 'auto')
   * @returns WeatherForecast object with historical weather data
   * @throws Error if the API request fails or response cannot be parsed
   */
  async getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    hourly = false,
    timezone = "auto",
  ): Promise<WeatherForecast> {
    // Build query parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      start_date: startDate,
      end_date: endDate,
      timezone,
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max",
    });

    if (hourly) {
      params.set(
        "hourly",
        "temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,cloud_cover",
      );
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/archive?${params}`,
      );

      if (!response.ok) {
        throw new Error(
          `Historical Weather API HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      return WeatherForecastSchema.parse(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP error")) {
        throw error;
      }
      throw new Error(`Failed to parse historical weather data: ${error}`);
    }
  }

  /**
   * Get marine conditions for a location (waves, swell, currents).
   *
   * @param latitude - Latitude in decimal degrees
   * @param longitude - Longitude in decimal degrees
   * @param forecastDays - Number of forecast days (1-16, default: 7)
   * @param includeHourly - Include hourly data (default: true)
   * @param timezone - Timezone for timestamps (default: 'auto')
   * @returns MarineConditions object with wave and marine data
   * @throws Error if the API request fails or response cannot be parsed
   */
  async getMarineConditions(
    latitude: number,
    longitude: number,
    forecastDays = 7,
    includeHourly = true,
    timezone = "auto",
  ): Promise<MarineConditions> {
    // Clamp forecast_days to 1-16
    const clampedDays = Math.min(Math.max(forecastDays, 1), 16);

    // Build query parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      forecast_days: clampedDays.toString(),
      timezone,
      daily:
        "wave_height_max,wave_direction_dominant,wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max",
    });

    if (includeHourly) {
      params.set(
        "hourly",
        "wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period",
      );
    }

    try {
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?${params}`;
      const response = await this.fetchWithTimeout(marineUrl);

      if (!response.ok) {
        throw new Error(
          `Marine API HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      return MarineConditionsSchema.parse(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP error")) {
        throw error;
      }
      throw new Error(`Failed to parse marine data: ${error}`);
    }
  }

  /**
   * Convert client state to dictionary for JSON serialization.
   *
   * @returns Object with client configuration
   */
  toDict(): Record<string, unknown> {
    return {
      base_url: this.baseUrl,
      timeout: this.timeout,
    };
  }

  /**
   * Convert client state to JSON string.
   *
   * @returns JSON string with client configuration
   */
  toJSON(): string {
    return JSON.stringify(this.toDict());
  }

  /**
   * String representation of client.
   *
   * @returns String describing the client
   */
  toString(): string {
    return `OpenMeteoClient(base_url=${this.baseUrl})`;
  }

  /**
   * Fetch with timeout support.
   *
   * @param url - URL to fetch
   * @returns Response object
   * @throws Error if request times out or fails
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": this.userAgent,
          "Accept-Encoding": "gzip",
        },
      });

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

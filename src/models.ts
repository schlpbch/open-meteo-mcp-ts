/**
 * Zod schemas for Open-Meteo API requests and responses.
 * Migrated from Python Pydantic models.
 */

import { z } from "zod";

// ============================================================================
// Location Models
// ============================================================================

export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees"),
  longitude: z.number().min(-180).max(180).describe(
    "Longitude in decimal degrees",
  ),
});

export type Location = z.infer<typeof LocationSchema>;

// ============================================================================
// Input Models
// ============================================================================

export const WeatherInputSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees"),
  longitude: z.number().min(-180).max(180).describe(
    "Longitude in decimal degrees",
  ),
  forecast_days: z.number().int().min(1).max(16).default(7).describe(
    "Number of forecast days (1-16)",
  ),
  include_hourly: z.boolean().default(true).describe(
    "Include hourly forecast data",
  ),
  timezone: z.string().min(1).default("auto").describe(
    "Timezone for timestamps (e.g., 'Europe/Zurich', 'auto')",
  ).refine((val) => val.trim().length > 0, {
    message: "Timezone cannot be empty",
  }),
});

export type WeatherInput = z.infer<typeof WeatherInputSchema>;

export const SnowInputSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees"),
  longitude: z.number().min(-180).max(180).describe(
    "Longitude in decimal degrees",
  ),
  forecast_days: z.number().int().min(1).max(16).default(7).describe(
    "Number of forecast days (1-16)",
  ),
  include_hourly: z.boolean().default(true).describe("Include hourly data"),
  timezone: z.string().min(1).default("Europe/Zurich").describe(
    "Timezone for timestamps",
  )
    .refine((val) => val.trim().length > 0, {
      message: "Timezone cannot be empty",
    }),
});

export type SnowInput = z.infer<typeof SnowInputSchema>;

// ============================================================================
// Current Weather Models
// ============================================================================

export const CurrentWeatherSchema = z.object({
  temperature: z.number().describe("Temperature in °C"),
  windspeed: z.number().describe("Wind speed in km/h"),
  winddirection: z.number().int().describe("Wind direction in degrees"),
  weathercode: z.number().int().describe("WMO weather code"),
  time: z.string().describe("Timestamp of observation"),
});

export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>;

// ============================================================================
// Hourly Weather Models
// ============================================================================

export const HourlyWeatherSchema = z.object({
  time: z.array(z.string()).default([]).describe("Timestamps for each hour"),
  temperature_2m: z.array(z.number()).default([]).describe(
    "Temperature at 2m height (°C)",
  ),
  apparent_temperature: z.array(z.number()).optional().describe(
    "Apparent temperature / feels like (°C)",
  ),
  precipitation: z.array(z.number()).default([]).describe("Precipitation (mm)"),
  precipitation_probability: z.array(z.number().int()).optional().describe(
    "Precipitation probability (%)",
  ),
  weather_code: z.array(z.number().int()).default([]).describe(
    "WMO weather codes",
  ),
  wind_speed_10m: z.array(z.number()).default([]).describe(
    "Wind speed at 10m (km/h)",
  ),
  wind_gusts_10m: z.array(z.number()).optional().describe(
    "Wind gusts at 10m (km/h)",
  ),
  relative_humidity_2m: z.array(z.number().int()).optional().describe(
    "Relative humidity (%)",
  ),
  cloud_cover: z.array(z.number().int()).optional().describe("Cloud cover (%)"),
  visibility: z.array(z.number()).optional().describe("Visibility (m)"),
  uv_index: z.array(z.number()).optional().describe("UV index"),
  is_day: z.array(z.number().int()).optional().describe("Day (1) or night (0)"),
});

export type HourlyWeather = z.infer<typeof HourlyWeatherSchema>;

// ============================================================================
// Daily Weather Models
// ============================================================================

export const DailyWeatherSchema = z.object({
  time: z.array(z.string()).default([]).describe("Dates for each day"),
  temperature_2m_max: z.array(z.number()).default([]).describe(
    "Maximum temperature (°C)",
  ),
  temperature_2m_min: z.array(z.number()).default([]).describe(
    "Minimum temperature (°C)",
  ),
  precipitation_sum: z.array(z.number()).default([]).describe(
    "Total precipitation (mm)",
  ),
  precipitation_probability_max: z.array(z.number().int()).optional().describe(
    "Maximum precipitation probability (%)",
  ),
  precipitation_hours: z.array(z.number()).optional().describe(
    "Hours with precipitation",
  ),
  weather_code: z.array(z.number().int()).default([]).describe(
    "WMO weather codes",
  ),
  sunrise: z.array(z.string()).optional().describe("Sunrise times"),
  sunset: z.array(z.string()).optional().describe("Sunset times"),
  uv_index_max: z.array(z.number()).optional().describe("Maximum UV index"),
  wind_speed_10m_max: z.array(z.number()).optional().describe(
    "Maximum wind speed (km/h)",
  ),
  wind_gusts_10m_max: z.array(z.number()).optional().describe(
    "Maximum wind gusts (km/h)",
  ),
});

export type DailyWeather = z.infer<typeof DailyWeatherSchema>;

// ============================================================================
// Weather Forecast Models
// ============================================================================

export const WeatherForecastSchema = z.object({
  latitude: z.number().describe("Latitude of the location"),
  longitude: z.number().describe("Longitude of the location"),
  elevation: z.number().optional().describe("Elevation in meters"),
  timezone: z.string().describe("Timezone name"),
  timezone_abbreviation: z.string().optional().describe(
    "Timezone abbreviation",
  ),
  utc_offset_seconds: z.number().int().optional().describe(
    "UTC offset in seconds",
  ),
  current_weather: CurrentWeatherSchema.optional().describe(
    "Current weather conditions",
  ),
  hourly: HourlyWeatherSchema.optional().describe("Hourly forecast data"),
  daily: DailyWeatherSchema.optional().describe("Daily forecast data"),
});

export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

// ============================================================================
// Snow Conditions Models
// ============================================================================

export const HourlySnowSchema = z.object({
  time: z.array(z.string()).default([]).describe("Timestamps for each hour"),
  temperature_2m: z.array(z.number()).default([]).describe(
    "Temperature at 2m (°C)",
  ),
  apparent_temperature: z.array(z.number()).optional().describe(
    "Apparent temperature / wind chill (°C)",
  ),
  snowfall: z.array(z.number()).default([]).describe("Snowfall amount (cm)"),
  snow_depth: z.array(z.number()).default([]).describe("Snow depth (m)"),
  weather_code: z.array(z.number().int()).default([]).describe(
    "WMO weather codes",
  ),
  wind_speed_10m: z.array(z.number()).optional().describe(
    "Wind speed at 10m (km/h)",
  ),
  wind_gusts_10m: z.array(z.number()).optional().describe(
    "Wind gusts at 10m (km/h)",
  ),
  cloud_cover: z.array(z.number().int()).optional().describe("Cloud cover (%)"),
  precipitation_probability: z.array(z.number().int()).optional().describe(
    "Precipitation probability (%)",
  ),
});

export type HourlySnow = z.infer<typeof HourlySnowSchema>;

export const DailySnowSchema = z.object({
  time: z.array(z.string()).default([]).describe("Dates for each day"),
  temperature_2m_max: z.array(z.number()).default([]).describe(
    "Maximum temperature (°C)",
  ),
  temperature_2m_min: z.array(z.number()).default([]).describe(
    "Minimum temperature (°C)",
  ),
  snowfall_sum: z.array(z.number()).default([]).describe("Total snowfall (cm)"),
  snow_depth_max: z.array(z.number()).optional().describe(
    "Maximum snow depth (m)",
  ),
  precipitation_probability_max: z.array(z.number().int()).optional().describe(
    "Maximum precipitation probability (%)",
  ),
  wind_gusts_10m_max: z.array(z.number()).optional().describe(
    "Maximum wind gusts (km/h)",
  ),
});

export type DailySnow = z.infer<typeof DailySnowSchema>;

export const SnowConditionsSchema = z.object({
  latitude: z.number().describe("Latitude of the location"),
  longitude: z.number().describe("Longitude of the location"),
  elevation: z.number().optional().describe("Elevation in meters"),
  timezone: z.string().describe("Timezone name"),
  timezone_abbreviation: z.string().optional().describe(
    "Timezone abbreviation",
  ),
  utc_offset_seconds: z.number().int().optional().describe(
    "UTC offset in seconds",
  ),
  hourly: HourlySnowSchema.optional().describe("Hourly snow data"),
  daily: DailySnowSchema.optional().describe("Daily snow data"),
});

export type SnowConditions = z.infer<typeof SnowConditionsSchema>;

// ============================================================================
// Geocoding Models
// ============================================================================

export const GeocodingResultSchema = z.object({
  id: z.number().int().optional().describe("Location ID"),
  name: z.string().describe("Location name"),
  latitude: z.number().describe("Latitude in decimal degrees"),
  longitude: z.number().describe("Longitude in decimal degrees"),
  elevation: z.number().optional().describe("Elevation in meters"),
  feature_code: z.string().optional().describe("GeoNames feature code"),
  country_code: z.string().optional().describe(
    "ISO 3166-1 alpha-2 country code",
  ),
  country: z.string().optional().describe("Country name"),
  country_id: z.number().int().optional().describe("Country ID"),
  timezone: z.string().optional().describe("Timezone name"),
  population: z.number().int().optional().describe("Population"),
  admin1: z.string().optional().describe("First-level administrative division"),
  admin2: z.string().optional().describe(
    "Second-level administrative division",
  ),
  admin3: z.string().optional().describe("Third-level administrative division"),
  admin4: z.string().optional().describe(
    "Fourth-level administrative division",
  ),
  admin1_id: z.number().int().optional().describe("Admin1 ID"),
  admin2_id: z.number().int().optional().describe("Admin2 ID"),
  admin3_id: z.number().int().optional().describe("Admin3 ID"),
  admin4_id: z.number().int().optional().describe("Admin4 ID"),
});

export type GeocodingResult = z.infer<typeof GeocodingResultSchema>;

export const GeocodingResponseSchema = z.object({
  results: z.array(GeocodingResultSchema).optional().describe(
    "List of matching locations",
  ),
  generationtime_ms: z.number().optional().describe(
    "API generation time in milliseconds",
  ),
});

export type GeocodingResponse = z.infer<typeof GeocodingResponseSchema>;

// ============================================================================
// Air Quality Models
// ============================================================================

export const CurrentAirQualitySchema = z.object({
  time: z.string().optional().describe("Timestamp of observation"),
  european_aqi: z.number().int().optional().describe(
    "European Air Quality Index (0-100+)",
  ),
  us_aqi: z.number().int().optional().describe(
    "United States Air Quality Index (0-500)",
  ),
  pm10: z.number().optional().describe("Particulate matter PM10 (μg/m³)"),
  pm2_5: z.number().optional().describe("Particulate matter PM2.5 (μg/m³)"),
  uv_index: z.number().optional().describe("UV index"),
});

export type CurrentAirQuality = z.infer<typeof CurrentAirQualitySchema>;

export const HourlyAirQualitySchema = z.object({
  time: z.array(z.string()).default([]).describe("Timestamps for each hour"),
  european_aqi: z.array(z.number().int()).optional().describe(
    "European Air Quality Index",
  ),
  us_aqi: z.array(z.number().int()).optional().describe(
    "United States Air Quality Index",
  ),
  pm10: z.array(z.number()).optional().describe(
    "Particulate matter PM10 (μg/m³)",
  ),
  pm2_5: z.array(z.number()).optional().describe(
    "Particulate matter PM2.5 (μg/m³)",
  ),
  carbon_monoxide: z.array(z.number()).optional().describe(
    "Carbon monoxide (μg/m³)",
  ),
  nitrogen_dioxide: z.array(z.number()).optional().describe(
    "Nitrogen dioxide (μg/m³)",
  ),
  sulphur_dioxide: z.array(z.number()).optional().describe(
    "Sulphur dioxide (μg/m³)",
  ),
  ozone: z.array(z.number()).optional().describe("Ozone (μg/m³)"),
  dust: z.array(z.number()).optional().describe("Dust (μg/m³)"),
  uv_index: z.array(z.number()).optional().describe("UV index"),
  uv_index_clear_sky: z.array(z.number()).optional().describe(
    "UV index under clear sky",
  ),
  ammonia: z.array(z.number()).optional().describe("Ammonia (μg/m³)"),
  alder_pollen: z.array(z.number()).optional().describe(
    "Alder pollen (grains/m³)",
  ),
  birch_pollen: z.array(z.number()).optional().describe(
    "Birch pollen (grains/m³)",
  ),
  grass_pollen: z.array(z.number()).optional().describe(
    "Grass pollen (grains/m³)",
  ),
  mugwort_pollen: z.array(z.number()).optional().describe(
    "Mugwort pollen (grains/m³)",
  ),
  olive_pollen: z.array(z.number()).optional().describe(
    "Olive pollen (grains/m³)",
  ),
  ragweed_pollen: z.array(z.number()).optional().describe(
    "Ragweed pollen (grains/m³)",
  ),
});

export type HourlyAirQuality = z.infer<typeof HourlyAirQualitySchema>;

export const AirQualityForecastSchema = z.object({
  latitude: z.number().describe("Latitude of the location"),
  longitude: z.number().describe("Longitude of the location"),
  elevation: z.number().optional().describe("Elevation in meters"),
  timezone: z.string().describe("Timezone name"),
  timezone_abbreviation: z.string().optional().describe(
    "Timezone abbreviation",
  ),
  utc_offset_seconds: z.number().int().optional().describe(
    "UTC offset in seconds",
  ),
  current: CurrentAirQualitySchema.optional().describe("Current air quality"),
  hourly: HourlyAirQualitySchema.optional().describe(
    "Hourly air quality forecast",
  ),
});

export type AirQualityForecast = z.infer<typeof AirQualityForecastSchema>;

// ============================================================================
// Marine Conditions Models
// ============================================================================

export const HourlyMarineSchema = z.object({
  time: z.array(z.string()).default([]).describe("Timestamps for each hour"),
  wave_height: z.array(z.number()).optional().describe("Wave height (m)"),
  wave_direction: z.array(z.number().int()).optional().describe(
    "Wave direction (degrees)",
  ),
  wave_period: z.array(z.number()).optional().describe("Wave period (seconds)"),
  wind_wave_height: z.array(z.number()).optional().describe(
    "Wind wave height (m)",
  ),
  wind_wave_direction: z.array(z.number().int()).optional().describe(
    "Wind wave direction (degrees)",
  ),
  wind_wave_period: z.array(z.number()).optional().describe(
    "Wind wave period (seconds)",
  ),
  swell_wave_height: z.array(z.number()).optional().describe(
    "Swell wave height (m)",
  ),
  swell_wave_direction: z.array(z.number().int()).optional().describe(
    "Swell wave direction (degrees)",
  ),
  swell_wave_period: z.array(z.number()).optional().describe(
    "Swell wave period (seconds)",
  ),
});

export type HourlyMarine = z.infer<typeof HourlyMarineSchema>;

export const DailyMarineSchema = z.object({
  time: z.array(z.string()).default([]).describe("Dates for each day"),
  wave_height_max: z.array(z.number()).optional().describe(
    "Maximum wave height (m)",
  ),
  wave_direction_dominant: z.array(z.number().int()).optional().describe(
    "Dominant wave direction (degrees)",
  ),
  wave_period_max: z.array(z.number()).optional().describe(
    "Maximum wave period (seconds)",
  ),
  swell_wave_height_max: z.array(z.number()).optional().describe(
    "Maximum swell wave height (m)",
  ),
  swell_wave_direction_dominant: z.array(z.number().int()).optional().describe(
    "Dominant swell wave direction (degrees)",
  ),
  swell_wave_period_max: z.array(z.number()).optional().describe(
    "Maximum swell wave period (seconds)",
  ),
});

export type DailyMarine = z.infer<typeof DailyMarineSchema>;

export const MarineConditionsSchema = z.object({
  latitude: z.number().describe("Latitude of the location"),
  longitude: z.number().describe("Longitude of the location"),
  elevation: z.number().optional().describe("Elevation in meters"),
  timezone: z.string().describe("Timezone name"),
  timezone_abbreviation: z.string().optional().describe(
    "Timezone abbreviation",
  ),
  utc_offset_seconds: z.number().int().optional().describe(
    "UTC offset in seconds",
  ),
  hourly: HourlyMarineSchema.optional().describe("Hourly marine data"),
  daily: DailyMarineSchema.optional().describe("Daily marine data"),
});

export type MarineConditions = z.infer<typeof MarineConditionsSchema>;

// ============================================================================
// Weather Alerts Models
// ============================================================================

export const WeatherAlertSchema = z.object({
  type: z.string().describe(
    "Alert type: storm, heat, cold, uv, wind, air_quality",
  ),
  severity: z.string().describe("Alert severity: advisory, watch, warning"),
  start: z.string().describe("Alert start time (ISO format)"),
  end: z.string().describe("Alert end time (ISO format)"),
  description: z.string().describe("Alert description"),
  recommendations: z.array(z.string()).default([]).describe(
    "Safety recommendations",
  ),
});

export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;

export const WeatherAlertsResponseSchema = z.object({
  latitude: z.number().describe("Latitude of the location"),
  longitude: z.number().describe("Longitude of the location"),
  timezone: z.string().describe("Timezone name"),
  alerts: z.array(WeatherAlertSchema).default([]).describe(
    "List of active alerts",
  ),
});

export type WeatherAlertsResponse = z.infer<typeof WeatherAlertsResponseSchema>;

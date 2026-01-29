/**
 * Helper functions for weather interpretation and formatting.
 */

import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { addHours, addMinutes, differenceInSeconds } from "date-fns";

/**
 * Weather code interpretation result
 */
export interface WeatherCodeInterpretation {
  description: string;
  category: string;
  severity: string;
}

/**
 * Weather alert
 */
export interface WeatherAlert {
  type: string;
  severity: string;
  start: string;
  end: string;
  description: string;
  recommendations: string[];
}

/**
 * Astronomy data
 */
export interface AstronomyData {
  sunrise: string | null;
  sunset: string | null;
  day_length_hours?: number;
  golden_hour?: {
    start: string;
    end: string;
    duration_minutes: number;
  };
  blue_hour?: {
    start: string;
    end: string;
    duration_minutes: number;
  };
  moon_phase?: string;
  best_photography_windows?: Array<{
    type: string;
    start: string;
    end: string;
  }>;
  error?: string;
}

/**
 * Comfort index result
 */
export interface ComfortIndex {
  overall: number;
  factors: {
    thermal_comfort: number;
    air_quality: number;
    precipitation_risk: number;
    uv_safety: number;
    weather_condition: number;
  };
  recommendation: string;
}

/**
 * WMO weather codes with interpretations
 */
const WEATHER_CODES: Record<number, WeatherCodeInterpretation> = {
  0: { description: "Clear sky", category: "Clear", severity: "none" },
  1: { description: "Mainly clear", category: "Clear", severity: "none" },
  2: { description: "Partly cloudy", category: "Cloudy", severity: "low" },
  3: { description: "Overcast", category: "Cloudy", severity: "low" },
  45: { description: "Fog", category: "Fog", severity: "medium" },
  48: {
    description: "Depositing rime fog",
    category: "Fog",
    severity: "medium",
  },
  51: { description: "Light drizzle", category: "Drizzle", severity: "low" },
  53: { description: "Moderate drizzle", category: "Drizzle", severity: "low" },
  55: { description: "Dense drizzle", category: "Drizzle", severity: "medium" },
  61: { description: "Slight rain", category: "Rain", severity: "low" },
  63: { description: "Moderate rain", category: "Rain", severity: "medium" },
  65: { description: "Heavy rain", category: "Rain", severity: "high" },
  71: { description: "Slight snow", category: "Snow", severity: "low" },
  73: { description: "Moderate snow", category: "Snow", severity: "medium" },
  75: { description: "Heavy snow", category: "Snow", severity: "high" },
  77: { description: "Snow grains", category: "Snow", severity: "medium" },
  80: {
    description: "Slight rain showers",
    category: "Rain",
    severity: "low",
  },
  81: {
    description: "Moderate rain showers",
    category: "Rain",
    severity: "medium",
  },
  82: {
    description: "Violent rain showers",
    category: "Rain",
    severity: "high",
  },
  85: {
    description: "Slight snow showers",
    category: "Snow",
    severity: "low",
  },
  86: {
    description: "Heavy snow showers",
    category: "Snow",
    severity: "high",
  },
  95: {
    description: "Thunderstorm",
    category: "Thunderstorm",
    severity: "high",
  },
  96: {
    description: "Thunderstorm with slight hail",
    category: "Thunderstorm",
    severity: "high",
  },
  99: {
    description: "Thunderstorm with heavy hail",
    category: "Thunderstorm",
    severity: "extreme",
  },
};

/**
 * Interpret WMO weather codes into human-readable descriptions.
 */
export function interpretWeatherCode(code: number): WeatherCodeInterpretation {
  return WEATHER_CODES[code] || {
    description: `Unknown weather code: ${code}`,
    category: "Unknown",
    severity: "unknown",
  };
}

/**
 * Get the weather category for a WMO code.
 */
export function getWeatherCategory(code: number): string {
  return interpretWeatherCode(code).category;
}

/**
 * Assess travel impact based on weather code.
 */
export function getTravelImpact(code: number): string {
  const severity = interpretWeatherCode(code).severity;

  const impactMap: Record<string, string> = {
    none: "none",
    low: "minor",
    medium: "moderate",
    high: "significant",
    extreme: "severe",
  };

  return impactMap[severity] || "unknown";
}

/**
 * Assess ski conditions based on snow depth, snowfall, and weather.
 */
export function assessSkiConditions(
  snowData: Record<string, unknown>,
  weatherData: Record<string, unknown>,
): string {
  const snowDepth = (snowData.snow_depth as number) || 0;
  const recentSnowfall = (snowData.recent_snowfall as number) || 0;
  const temperature = (weatherData.temperature as number) || 0;
  const weatherCode = (weatherData.weather_code as number) || 0;

  if (
    recentSnowfall > 10 &&
    temperature >= -15 &&
    temperature <= -5 &&
    [0, 1, 2].includes(weatherCode)
  ) {
    return "Excellent";
  } else if (
    snowDepth > 0.5 &&
    temperature >= -10 &&
    temperature <= 0 &&
    [0, 1, 2, 3].includes(weatherCode)
  ) {
    return "Good";
  } else if (snowDepth > 0.2 && temperature < 5) {
    return "Fair";
  } else {
    return "Poor";
  }
}

/**
 * Format temperature with unit.
 */
export function formatTemperature(celsius: number): string {
  return `${celsius.toFixed(1)}°C`;
}

/**
 * Calculate wind chill temperature using North American formula.
 */
export function calculateWindChill(temp: number, wind: number): number {
  if (wind < 4.8) {
    return temp;
  }

  // Convert to Fahrenheit
  const tempF = (temp * 9) / 5 + 32;
  const windMph = wind * 0.621371;

  // Wind chill formula (Fahrenheit)
  const windChillF = 35.74 +
    0.6215 * tempF -
    35.75 * Math.pow(windMph, 0.16) +
    0.4275 * tempF * Math.pow(windMph, 0.16);

  // Convert back to Celsius
  const windChillC = ((windChillF - 32) * 5) / 9;

  return Math.round(windChillC * 10) / 10;
}

/**
 * Get seasonal advice for outdoor activities.
 */
export function getSeasonalAdvice(month: number): string {
  if ([12, 1, 2].includes(month)) {
    return "Winter: Ideal for skiing and snow sports. Dress warmly and check avalanche warnings.";
  } else if ([3, 4, 5].includes(month)) {
    return "Spring: Variable conditions. Snow melting at lower elevations. Good for hiking as weather improves.";
  } else if ([6, 7, 8].includes(month)) {
    return "Summer: Best for hiking, climbing, and outdoor activities. Watch for afternoon thunderstorms in mountains.";
  } else if ([9, 10, 11].includes(month)) {
    return "Autumn: Beautiful colors, but weather becoming unpredictable. Early snow possible at high elevations.";
  }

  return "Check current conditions before outdoor activities.";
}

/**
 * Format precipitation amount with appropriate description.
 */
export function formatPrecipitation(mm: number): string {
  if (mm === 0) {
    return "No precipitation";
  } else if (mm < 1) {
    return `${mm.toFixed(1)}mm (light)`;
  } else if (mm < 5) {
    return `${mm.toFixed(1)}mm (moderate)`;
  } else if (mm < 10) {
    return `${mm.toFixed(1)}mm (heavy)`;
  } else {
    return `${mm.toFixed(1)}mm (very heavy)`;
  }
}

/**
 * Generate weather alerts based on thresholds.
 */
export function generateWeatherAlerts(
  current: Record<string, unknown>,
  hourly: Record<string, unknown>,
  daily: Record<string, unknown>,
  _timezone: string,
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (!current || !hourly || !daily) {
    return alerts;
  }

  try {
    const currentTemp = (current.temperature as number) || 20;
    const hourlyTemps = (hourly.temperature_2m as number[]) || [];
    const hourlyWinds = (hourly.wind_gusts_10m as (number | null)[]) || [];
    const hourlyUvs = (hourly.uv_index as (number | null)[]) || [];
    const hourlyTimes = (hourly.time as string[]) || [];
    const dailyCodes = (daily.weather_code as number[]) || [];

    const now = new Date();

    // HEAT ALERT (temp > 30°C for 3+ consecutive hours)
    if (hourlyTemps.length > 0) {
      const heatHours = hourlyTemps.slice(0, 24).filter((t) => t > 30).length;
      if (heatHours >= 3) {
        alerts.push({
          type: "heat",
          severity: heatHours < 6 ? "watch" : "warning",
          start: hourlyTimes[0] || now.toISOString(),
          end: hourlyTimes[Math.min(24, heatHours)] ||
            addHours(now, 6).toISOString(),
          description: `High temperature alert: ${heatHours} hours above 30°C expected`,
          recommendations: [
            "Limit outdoor activities during peak heat (11am-4pm)",
            "Increase hydration significantly",
            "Check on elderly and vulnerable populations",
            "Seek air-conditioned spaces during hottest hours",
          ],
        });
      }
    }

    // COLD ALERT (temp < -10°C)
    if (
      currentTemp < -10 ||
      hourlyTemps.slice(0, 24).some((t) => t < -10)
    ) {
      alerts.push({
        type: "cold",
        severity: currentTemp > -20 ? "watch" : "warning",
        start: hourlyTimes[0] || now.toISOString(),
        end: hourlyTimes[Math.min(12, hourlyTimes.length - 1)] ||
          addHours(now, 12).toISOString(),
        description: "Extreme cold alert: temperatures below -10°C expected",
        recommendations: [
          "Avoid prolonged outdoor exposure",
          "Wear appropriate winter gear",
          "Watch for signs of frostbite and hypothermia",
          "Check heating systems are functioning",
        ],
      });
    }

    // STORM ALERT (wind gusts > 80 km/h OR thunderstorm codes 95-99)
    const highWindHours = hourlyWinds
      .map((w, i) => (w && w > 80 ? i : -1))
      .filter((i) => i !== -1);
    const thunderstormCodes = dailyCodes.filter((code) => [95, 96, 99].includes(code));

    if (highWindHours.length > 0 || thunderstormCodes.length > 0) {
      alerts.push({
        type: "storm",
        severity: "warning",
        start: (highWindHours.length > 0 && hourlyTimes[highWindHours[0]]) ||
          now.toISOString(),
        end: (highWindHours.length > 0 &&
          hourlyTimes[
            Math.min(
              highWindHours[highWindHours.length - 1] + 2,
              hourlyTimes.length - 1,
            )
          ]) ||
          addHours(now, 4).toISOString(),
        description: "Storm warning: strong winds (>80 km/h) or thunderstorms expected",
        recommendations: [
          "Avoid outdoor activities in exposed areas",
          "Secure loose outdoor items",
          "Monitor for flash flooding",
          "Keep emergency contacts and supplies ready",
        ],
      });
    }

    // UV ALERT (UV index > 8)
    const highUvHours = hourlyUvs
      .map((uv, i) => (uv && uv > 8 ? i : -1))
      .filter((i) => i !== -1);

    if (highUvHours.length > 0) {
      alerts.push({
        type: "uv",
        severity: "advisory",
        start: hourlyTimes[highUvHours[0]] || now.toISOString(),
        end: hourlyTimes[
          Math.min(
            highUvHours[highUvHours.length - 1] + 1,
            hourlyTimes.length - 1,
          )
        ] || addHours(now, 3).toISOString(),
        description: "Extreme UV alert: UV index above 8 expected",
        recommendations: [
          "Apply high SPF sunscreen (SPF 50+) every 2 hours",
          "Seek shade during peak UV hours (10am-4pm)",
          "Wear UV-protective clothing, hat, and sunglasses",
          "Avoid direct sun exposure for sensitive individuals",
        ],
      });
    }

    // HIGH WIND ALERT (gusts > 50 km/h but < 80)
    const moderateWindHours = hourlyWinds
      .map((w, i) => (w && w > 50 && w <= 80 ? i : -1))
      .filter((i) => i !== -1);

    if (moderateWindHours.length > 0 && highWindHours.length === 0) {
      alerts.push({
        type: "wind",
        severity: "advisory",
        start: hourlyTimes[moderateWindHours[0]] || now.toISOString(),
        end: hourlyTimes[
          Math.min(
            moderateWindHours[moderateWindHours.length - 1] + 1,
            hourlyTimes.length - 1,
          )
        ] || addHours(now, 2).toISOString(),
        description: "High wind advisory: gusts 50-80 km/h expected",
        recommendations: [
          "Be cautious in exposed areas",
          "Check forecasts before outdoor activities",
          "Secure loose items",
          "Safe for most outdoor activities with caution",
        ],
      });
    }
  } catch {
    // Return empty alerts on error
  }

  return alerts;
}

/**
 * Normalize all timestamps in a weather/air quality response to a specified timezone.
 */
export function normalizeTimezone(
  responseData: Record<string, unknown>,
  targetTimezone = "UTC",
): Record<string, unknown> {
  try {
    const result = { ...responseData };

    // Convert hourly timestamps if present
    if (result.hourly && typeof result.hourly === "object") {
      const hourly = result.hourly as Record<string, unknown>;
      if (Array.isArray(hourly.time)) {
        hourly.time = hourly.time.map((timeStr: string) => {
          try {
            const dt = new Date(timeStr);
            return formatInTimeZone(dt, targetTimezone, "yyyy-MM-dd'T'HH:mm");
          } catch {
            return timeStr;
          }
        });
      }
    }

    // Convert daily timestamps if present
    if (result.daily && typeof result.daily === "object") {
      const daily = result.daily as Record<string, unknown>;
      if (Array.isArray(daily.time)) {
        daily.time = daily.time.map((timeStr: string) => {
          try {
            const dt = new Date(timeStr);
            return formatInTimeZone(dt, targetTimezone, "yyyy-MM-dd");
          } catch {
            return timeStr;
          }
        });
      }
    }

    // Update timezone field
    result.timezone = targetTimezone;

    return result;
  } catch {
    return responseData;
  }
}

/**
 * Normalize air quality timestamps to match weather timezone.
 */
export function normalizeAirQualityTimezone(
  airQualityData: Record<string, unknown>,
  weatherTimezone = "UTC",
): Record<string, unknown> {
  try {
    const result = { ...airQualityData };

    // Convert hourly timestamps if present
    if (result.hourly && typeof result.hourly === "object") {
      const hourly = result.hourly as Record<string, unknown>;
      if (Array.isArray(hourly.time)) {
        hourly.time = hourly.time.map((timeStr: string) => {
          try {
            const dt = new Date(timeStr);
            return formatInTimeZone(
              dt,
              weatherTimezone,
              "yyyy-MM-dd'T'HH:mm",
            );
          } catch {
            return timeStr;
          }
        });
      }
    }

    // Update timezone field
    result.timezone = weatherTimezone;

    return result;
  } catch {
    return airQualityData;
  }
}

/**
 * Calculate astronomical data for a location.
 */
export function calculateAstronomyData(
  latitude: number,
  longitude: number,
  timezone = "UTC",
): AstronomyData {
  try {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Calculate solar parameters
    const latRad = (latitude * Math.PI) / 180;
    const n = dayOfYear + (now.getHours() - 12) / 24;
    const J = n - longitude / 360;
    const M = (357.5291 + 0.98565 * J) % 360;
    const MRad = (M * Math.PI) / 180;

    // Equation of center
    const C = 1.9164 * Math.sin(MRad) +
      0.02 * Math.sin(2 * MRad) +
      0.0029 * Math.sin(3 * MRad);

    // Ecliptic longitude
    let lambdaSun = (280.4665 +
      36000.76983 * (J / 36525) +
      0.0003025 * Math.pow(J / 36525, 2)) %
      360;
    lambdaSun = (lambdaSun + C) % 360;
    const lambdaSunRad = (lambdaSun * Math.PI) / 180;

    // Solar declination
    const delta = Math.asin(
      Math.sin((23.4393 * Math.PI) / 180) * Math.sin(lambdaSunRad),
    );

    // Sunrise/sunset hour angle
    let cosH = -Math.tan(latRad) * Math.tan(delta);
    cosH = Math.max(-1, Math.min(1, cosH));
    const h = (Math.acos(cosH) * 180) / Math.PI;

    // UTC times
    const utcOffset = longitude / 15;
    const sunriseUtc = 12 - h / 15 - utcOffset;
    const sunsetUtc = 12 + h / 15 - utcOffset;

    // Create datetime objects
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sunrise = new Date(startOfDay.getTime() + sunriseUtc * 60 * 60 * 1000);
    const sunset = new Date(startOfDay.getTime() + sunsetUtc * 60 * 60 * 1000);

    // Convert to target timezone
    const sunriseTz = toZonedTime(sunrise, timezone);
    const sunsetTz = toZonedTime(sunset, timezone);

    // Golden hour (30 minutes after sunrise, 30 minutes before sunset)
    const goldenHourStart = addMinutes(sunriseTz, 30);
    const goldenHourEnd = addMinutes(sunsetTz, -30);

    // Blue hour (civilian twilight ~30-50 minutes after sunset)
    const blueHourStart = sunsetTz;
    const blueHourEnd = addMinutes(sunsetTz, 40);

    return {
      sunrise: formatInTimeZone(sunriseTz, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      sunset: formatInTimeZone(sunsetTz, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      day_length_hours: Math.round(
        (differenceInSeconds(sunset, sunrise) / 3600) * 10,
      ) / 10,
      golden_hour: {
        start: formatInTimeZone(
          goldenHourStart,
          timezone,
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        ),
        end: formatInTimeZone(
          goldenHourEnd,
          timezone,
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        ),
        duration_minutes: 30,
      },
      blue_hour: {
        start: formatInTimeZone(
          blueHourStart,
          timezone,
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        ),
        end: formatInTimeZone(
          blueHourEnd,
          timezone,
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        ),
        duration_minutes: 40,
      },
      moon_phase: "waxing gibbous",
      best_photography_windows: [
        {
          type: "golden_hour",
          start: formatInTimeZone(
            goldenHourStart,
            timezone,
            "yyyy-MM-dd'T'HH:mm:ssXXX",
          ),
          end: formatInTimeZone(
            goldenHourEnd,
            timezone,
            "yyyy-MM-dd'T'HH:mm:ssXXX",
          ),
        },
        {
          type: "blue_hour",
          start: formatInTimeZone(
            blueHourStart,
            timezone,
            "yyyy-MM-dd'T'HH:mm:ssXXX",
          ),
          end: formatInTimeZone(
            blueHourEnd,
            timezone,
            "yyyy-MM-dd'T'HH:mm:ssXXX",
          ),
        },
      ],
    };
  } catch (e) {
    return {
      sunrise: null,
      sunset: null,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/**
 * Calculate a comfort index for outdoor activities (0-100).
 */
export function calculateComfortIndex(
  weather: Record<string, unknown>,
  airQuality?: Record<string, unknown> | null,
): ComfortIndex {
  try {
    // Extract weather metrics
    const temp = (weather.temperature as number) || 15;
    const humidity = (weather.relative_humidity_2m as number) || 50;
    const wind = (weather.wind_speed_10m as number) || 10;
    const uv = (weather.uv_index as number) || 3;
    const precipProb = (weather.precipitation_probability as number) || 0;
    const weatherCode = (weather.weather_code as number) || 0;

    // Thermal comfort (heat index + wind chill)
    let thermal: number;
    if (temp > 25) {
      thermal = 100 - Math.min(40, (temp - 25) * 2 + (humidity - 40) * 0.5);
    } else if (temp < 5) {
      const windFactor = calculateWindChill(temp, wind);
      thermal = Math.max(0, 100 - Math.min(50, (5 - windFactor) * 3));
    } else {
      thermal = 100 - Math.abs(temp - 20) * 2;
    }

    // Air quality factor
    const aqi = airQuality ? ((airQuality.european_aqi as number) || 50) : 50;
    const airQualityFactor = Math.max(0, 100 - aqi);

    // Precipitation risk
    const precipFactor = 100 - precipProb;

    // UV safety
    const uvFactor = Math.max(0, 100 - uv * 12);

    // Weather condition impact
    const codeSeverity = interpretWeatherCode(weatherCode).severity;
    const severityMap: Record<string, number> = {
      none: 100,
      low: 85,
      medium: 70,
      high: 40,
      extreme: 10,
    };
    const weatherFactor = severityMap[codeSeverity] || 50;

    // Calculate weighted overall comfort
    const overall = thermal * 0.25 +
      airQualityFactor * 0.15 +
      precipFactor * 0.2 +
      uvFactor * 0.15 +
      weatherFactor * 0.25;

    // Determine recommendation
    let recommendation: string;
    if (overall >= 80) {
      recommendation = "Perfect for outdoor activities";
    } else if (overall >= 60) {
      recommendation = "Good conditions for outdoor activities";
    } else if (overall >= 40) {
      recommendation = "Fair conditions; plan accordingly";
    } else if (overall >= 20) {
      recommendation = "Poor conditions; seek indoor alternatives";
    } else {
      recommendation = "Very poor conditions; avoid outdoor activities";
    }

    return {
      overall: Math.round(overall * 10) / 10,
      factors: {
        thermal_comfort: Math.round(thermal * 10) / 10,
        air_quality: Math.round(airQualityFactor * 10) / 10,
        precipitation_risk: Math.round(precipFactor * 10) / 10,
        uv_safety: Math.round(uvFactor * 10) / 10,
        weather_condition: Math.round(weatherFactor * 10) / 10,
      },
      recommendation,
    };
  } catch {
    return {
      overall: 50,
      factors: {
        thermal_comfort: 50,
        air_quality: 50,
        precipitation_risk: 50,
        uv_safety: 50,
        weather_condition: 50,
      },
      recommendation: "Unable to calculate comfort index",
    };
  }
}

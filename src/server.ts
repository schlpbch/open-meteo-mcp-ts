/**
 * MCP Server implementation with tools, resources, and prompts.
 * Migrated from Python FastMCP to TypeScript @modelcontextprotocol/sdk
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type {
  CallToolRequest,
  GetPromptRequest,
  ListPromptsResult,
  ListResourcesResult,
  ListToolsResult,
  ReadResourceRequest,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { OpenMeteoClient } from "./client.js";
import {
  calculateAstronomyData,
  calculateComfortIndex,
  generateWeatherAlerts,
} from "./helpers.js";

// Initialize API client
const client = new OpenMeteoClient();

/**
 * Get the data directory path
 */
function getDataPath(filename: string): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, "data", filename);
}

/**
 * Load resource file as string
 */
function loadResourceFile(filename: string): string {
  const path = getDataPath(filename);
  return readFileSync(path, "utf-8");
}

// ============================================================================
// TOOLS DEFINITIONS
// ============================================================================

export const TOOLS: Tool[] = [
  {
    name: "meteo__get_weather",
    description:
      `Retrieves weather forecast for a location (temperature, rain, sunshine).

Get current weather conditions for any location in Switzerland (or worldwide).

**Examples**:
- "What's the weather in Zürich?" → latitude: 47.3769, longitude: 8.5417
- "Is it raining in Bern?" → Check precipitation field

**Provides**: Current temperature, weather condition, precipitation, wind, humidity, forecasts`,
    inputSchema: {
      type: "object",
      properties: {
        latitude: {
          type: "number",
          description: "Latitude in decimal degrees (e.g., 46.9479 for Bern)",
        },
        longitude: {
          type: "number",
          description: "Longitude in decimal degrees (e.g., 7.4474 for Bern)",
        },
        forecast_days: {
          type: "number",
          description: "Number of forecast days (1-16, default: 7)",
        },
        include_hourly: {
          type: "boolean",
          description: "Include hourly forecasts (default: true)",
        },
        timezone: {
          type: "string",
          description: "Timezone for timestamps (default: 'auto')",
        },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "meteo__get_snow_conditions",
    description:
      "Retrieves snow conditions and forecasts for mountain locations. Use for ski trip planning and mountain weather.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: {
          type: "number",
          description: "Latitude in decimal degrees",
        },
        longitude: {
          type: "number",
          description: "Longitude in decimal degrees",
        },
        forecast_days: { type: "number", description: "Forecast days (1-16)" },
        include_hourly: { type: "boolean", description: "Include hourly data" },
        timezone: { type: "string", description: "Timezone" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "meteo__search_location",
    description:
      "Searches for locations by name to get coordinates for weather queries. Supports fuzzy search.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Location name to search" },
        count: {
          type: "number",
          description: "Number of results (default: 10)",
        },
        language: { type: "string", description: "Language (default: 'en')" },
        country: {
          type: "string",
          description: "Country code filter (e.g., 'CH')",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "meteo__get_air_quality",
    description:
      "Retrieves air quality forecast including AQI, pollutants, UV index, and pollen data.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        forecast_days: { type: "number", description: "Forecast days (1-5)" },
        include_pollen: { type: "boolean", description: "Include pollen data" },
        timezone: { type: "string" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "meteo__get_weather_alerts",
    description:
      "Generate weather alerts based on thresholds (heat, cold, storm, UV warnings).",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        forecast_hours: {
          type: "number",
          description: "Hours to check (1-168)",
        },
        timezone: { type: "string" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "meteo__get_historical_weather",
    description:
      "Retrieves historical weather data for trend analysis. Access 80+ years of data.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
        include_hourly: { type: "boolean" },
        timezone: { type: "string" },
      },
      required: ["latitude", "longitude", "start_date", "end_date"],
    },
  },
  {
    name: "meteo__get_marine_conditions",
    description:
      "Retrieves marine conditions for lakes and coastal areas (wave height, swell, period).",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        forecast_days: { type: "number" },
        include_hourly: { type: "boolean" },
        timezone: { type: "string" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "meteo__get_comfort_index",
    description:
      "Calculates outdoor activity comfort index (0-100) combining weather, air quality, UV factors.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        timezone: { type: "string" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "meteo__get_astronomy",
    description:
      "Provides astronomical data (sunrise, sunset, golden hour, blue hour) for photography and planning.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        timezone: { type: "string" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "meteo__search_location_swiss",
    description:
      "Search for locations in Switzerland with optional geographic features (mountains, lakes, passes).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        include_features: { type: "boolean" },
        language: { type: "string" },
        count: { type: "number" },
      },
      required: ["name"],
    },
  },
  {
    name: "meteo__compare_locations",
    description:
      "Compare weather conditions across multiple locations and rank by criteria.",
    inputSchema: {
      type: "object",
      properties: {
        locations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" },
            },
          },
        },
        criteria: { type: "string" },
        forecast_days: { type: "number" },
      },
      required: ["locations"],
    },
  },
];

// ============================================================================
// TOOL HANDLERS
// ============================================================================

export async function handleToolCall(
  request: CallToolRequest,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { name, arguments: args } = request.params;

  // Ensure args is defined
  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  switch (name) {
    case "meteo__get_weather": {
      const forecast = await client.getWeather(
        args.latitude as number,
        args.longitude as number,
        (args.forecast_days as number) || 7,
        (args.include_hourly as boolean) ?? true,
        (args.timezone as string) || "auto",
      );
      return {
        content: [{ type: "text", text: JSON.stringify(forecast, null, 2) }],
      };
    }

    case "meteo__get_snow_conditions": {
      const conditions = await client.getSnowConditions(
        args.latitude as number,
        args.longitude as number,
        (args.forecast_days as number) || 7,
        (args.include_hourly as boolean) ?? true,
        (args.timezone as string) || "Europe/Zurich",
      );
      return {
        content: [{ type: "text", text: JSON.stringify(conditions, null, 2) }],
      };
    }

    case "meteo__search_location": {
      const response = await client.searchLocation(
        args.name as string,
        (args.count as number) || 10,
        (args.language as string) || "en",
        (args.country as string) || undefined,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "meteo__get_air_quality": {
      const forecast = await client.getAirQuality(
        args.latitude as number,
        args.longitude as number,
        (args.forecast_days as number) || 5,
        (args.include_pollen as boolean) ?? true,
        (args.timezone as string) || "auto",
      );
      return {
        content: [{ type: "text", text: JSON.stringify(forecast, null, 2) }],
      };
    }

    case "meteo__get_weather_alerts": {
      const forecastHours = (args.forecast_hours as number) || 24;
      const timezone = (args.timezone as string) || "auto";

      const forecast = await client.getWeather(
        args.latitude as number,
        args.longitude as number,
        Math.min(Math.max(Math.floor(forecastHours / 24) + 1, 1), 16),
        true,
        timezone,
      );

      const current = forecast.current_weather || {};
      const hourly = forecast.hourly || {};
      const daily = forecast.daily || {};

      const alerts = generateWeatherAlerts(
        current,
        hourly,
        daily,
        forecast.timezone,
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                latitude: args.latitude,
                longitude: args.longitude,
                timezone: forecast.timezone,
                alerts,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "meteo__get_historical_weather": {
      const historical = await client.getHistoricalWeather(
        args.latitude as number,
        args.longitude as number,
        args.start_date as string,
        args.end_date as string,
        (args.include_hourly as boolean) ?? false,
        (args.timezone as string) || "auto",
      );
      return {
        content: [{ type: "text", text: JSON.stringify(historical, null, 2) }],
      };
    }

    case "meteo__get_marine_conditions": {
      const conditions = await client.getMarineConditions(
        args.latitude as number,
        args.longitude as number,
        (args.forecast_days as number) || 7,
        (args.include_hourly as boolean) ?? true,
        (args.timezone as string) || "auto",
      );
      return {
        content: [{ type: "text", text: JSON.stringify(conditions, null, 2) }],
      };
    }

    case "meteo__get_comfort_index": {
      const timezone = (args.timezone as string) || "auto";

      const weatherForecast = await client.getWeather(
        args.latitude as number,
        args.longitude as number,
        1,
        false,
        timezone,
      );

      const airQualityForecast = await client.getAirQuality(
        args.latitude as number,
        args.longitude as number,
        1,
        false,
        timezone,
      );

      const weather = weatherForecast.current_weather || {};
      const currentAqi = airQualityForecast.current || {};

      const comfort = calculateComfortIndex(weather, currentAqi);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                latitude: args.latitude,
                longitude: args.longitude,
                timezone: weatherForecast.timezone,
                comfort_index: comfort,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "meteo__get_astronomy": {
      let timezone = (args.timezone as string) || "auto";

      if (timezone === "auto") {
        const weather = await client.getWeather(
          args.latitude as number,
          args.longitude as number,
          1,
          false,
          "auto",
        );
        timezone = weather.timezone;
      }

      const astronomy = calculateAstronomyData(
        args.latitude as number,
        args.longitude as number,
        timezone,
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                latitude: args.latitude,
                longitude: args.longitude,
                timezone,
                astronomy,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "meteo__search_location_swiss": {
      const count = (args.count as number) || 10;
      const language = (args.language as string) || "en";
      const includeFeatures = (args.include_features as boolean) ?? false;

      const response = await client.searchLocation(
        args.name as string,
        count * 2,
        language,
        "CH",
      );

      let results = response.results || [];

      if (!includeFeatures) {
        results = results.filter(
          (r) => !r.feature_code || r.feature_code.startsWith("PPL"),
        );
      }

      results.sort((a, b) => (b.population || 0) - (a.population || 0));
      results = results.slice(0, count);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query: args.name,
                results,
                total: results.length,
                country: "CH",
                include_features: includeFeatures,
                language,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "meteo__compare_locations": {
      const locations = args.locations as Array<{
        name: string;
        latitude: number;
        longitude: number;
      }>;
      const criteria = (args.criteria as string) || "best_overall";
      const forecastDays = (args.forecast_days as number) || 1;

      const results = [];

      for (const loc of locations) {
        try {
          const weather = await client.getWeather(
            loc.latitude,
            loc.longitude,
            forecastDays,
            false,
            "auto",
          );

          const airQuality = await client.getAirQuality(
            loc.latitude,
            loc.longitude,
            1,
            false,
            "auto",
          );

          const currentWeather = weather.current_weather || {};
          const currentAqi = airQuality.current || {};

          const comfort = calculateComfortIndex(currentWeather, currentAqi);

          results.push({
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            temperature:
              (currentWeather as Record<string, unknown>).temperature || 0,
            wind_speed: (currentWeather as Record<string, unknown>).windspeed ||
              0,
            weather_code:
              (currentWeather as Record<string, unknown>).weathercode ||
              0,
            comfort_index: comfort.overall,
            aqi: (currentAqi as Record<string, unknown>).european_aqi || 0,
            recommendation: comfort.recommendation,
          });
        } catch (e) {
          results.push({
            name: loc.name,
            error: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }

      switch (criteria) {
        case "warmest":
          results.sort((a, b) =>
            ((b as Record<string, unknown>).temperature as number || 0) -
            ((a as Record<string, unknown>).temperature as number || 0)
          );
          break;
        case "best_air_quality":
          results.sort((a, b) =>
            ((a as Record<string, unknown>).aqi as number || 999) -
            ((b as Record<string, unknown>).aqi as number || 999)
          );
          break;
        case "calmest":
          results.sort((a, b) =>
            ((a as Record<string, unknown>).wind_speed as number || 999) -
            ((b as Record<string, unknown>).wind_speed as number || 999)
          );
          break;
        default:
          results.sort((a, b) =>
            ((b as Record<string, unknown>).comfort_index as number || 0) -
            ((a as Record<string, unknown>).comfort_index as number || 0)
          );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                criteria,
                locations: results,
                winner: results[0] || null,
                comparison_timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============================================================================
// RESOURCES
// ============================================================================

export function listResources(): ListResourcesResult {
  return {
    resources: [
      {
        uri: "weather://codes",
        name: "WMO Weather Codes Reference",
        description:
          "WMO weather code reference with descriptions, categories, and travel impact",
        mimeType: "application/json",
      },
      {
        uri: "weather://parameters",
        name: "Weather Parameters Reference",
        description:
          "Available weather and snow parameters from Open-Meteo API",
        mimeType: "application/json",
      },
      {
        uri: "weather://aqi-reference",
        name: "Air Quality Index Reference",
        description: "AQI reference data and pollution level descriptions",
        mimeType: "application/json",
      },
      {
        uri: "weather://swiss-locations",
        name: "Swiss Locations Database",
        description: "Major Swiss cities and locations with coordinates",
        mimeType: "application/json",
      },
    ],
  };
}

export async function readResource(request: ReadResourceRequest) {
  const { uri } = request.params;

  const fileMap: Record<string, string> = {
    "weather://codes": "weather-codes.json",
    "weather://parameters": "weather-parameters.json",
    "weather://aqi-reference": "aqi-reference.json",
    "weather://swiss-locations": "swiss-locations.json",
  };

  const filename = fileMap[uri];
  if (!filename) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  const content = loadResourceFile(filename);

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: content,
      },
    ],
  };
}

// ============================================================================
// PROMPTS
// ============================================================================

export function listPrompts(): ListPromptsResult {
  return {
    prompts: [
      {
        name: "meteo__ski-trip-weather",
        description:
          "Generates a guide for checking snow conditions and weather for ski trips",
        arguments: [
          {
            name: "resort",
            description: "Name of the Swiss ski resort",
            required: false,
          },
          {
            name: "dates",
            description: "Specific dates or time period",
            required: false,
          },
        ],
      },
      {
        name: "meteo__plan-outdoor-activity",
        description:
          "Generates a weather-aware outdoor activity planning workflow",
        arguments: [
          {
            name: "activity",
            description: "Type of outdoor activity",
            required: false,
          },
          {
            name: "location",
            description: "Location for the activity",
            required: false,
          },
          {
            name: "timeframe",
            description: "When planning to do the activity",
            required: false,
          },
        ],
      },
      {
        name: "meteo__weather-aware-travel",
        description:
          "Generates an integration pattern for combining weather forecasts with travel",
        arguments: [
          {
            name: "destination",
            description: "Travel destination",
            required: false,
          },
          {
            name: "travel_dates",
            description: "When traveling",
            required: false,
          },
          {
            name: "trip_type",
            description: "Type of trip",
            required: false,
          },
        ],
      },
    ],
  };
}

export function getPrompt(request: GetPromptRequest) {
  const { name, arguments: args } = request.params;

  // args is optional for prompts, so we provide empty object as default
  const promptArgs = args || {};

  const templates: Record<
    string,
    (args?: Record<string, string>) => string
  > = {
    "meteo__ski-trip-weather": (args) => {
      const resort = args?.resort || "";
      const dates = args?.dates || "";
      return `You are helping plan a ski trip to Swiss Alps resorts. Follow this workflow:

**Step 1: Identify the Resort**
${
        resort
          ? `Resort mentioned: ${resort}`
          : "Determine the resort from the user's query"
      }

**Step 2: Check Snow Conditions**
Use \`meteo__get_snow_conditions\` tool with resort coordinates

**Step 3: Check General Weather**
Use \`meteo__get_weather\` tool for the same coordinates

**Step 4: Provide Ski Condition Assessment**
${dates ? `Focus on dates: ${dates}` : "Focus on the next 7 days"}

**Step 5: Recommendations**
Suggest best days and appropriate gear`;
    },

    "meteo__plan-outdoor-activity": (args) => {
      const activity = args?.activity || "";
      const location = args?.location || "";
      const timeframe = args?.timeframe || "";
      return `You are helping plan outdoor activities with weather awareness.

**Activity**: ${activity || "To be determined"}
**Location**: ${location || "To be determined"}
**Timeframe**: ${timeframe || "Next 3-7 days"}

Use \`meteo__get_weather\` to check conditions and provide recommendations.`;
    },

    "meteo__weather-aware-travel": (args) => {
      const destination = args?.destination || "";
      const travelDates = args?.travel_dates || "";
      const tripType = args?.trip_type || "";
      return `You are helping with weather-aware travel planning.

**Destination**: ${destination || "To be determined"}
**Travel Dates**: ${travelDates || "To be determined"}
**Trip Type**: ${tripType || "General travel"}

Check destination weather and provide packing recommendations.`;
    },
  };

  const template = templates[name];
  if (!template) {
    throw new Error(`Unknown prompt: ${name}`);
  }

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: template(promptArgs as Record<string, string>),
        },
      },
    ],
  };
}

// ============================================================================
// LIST TOOLS
// ============================================================================

export function listTools(): ListToolsResult {
  return { tools: TOOLS };
}

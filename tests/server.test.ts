/**
 * Integration tests for MCP server tools, resources, and prompts.
 * Tests tool registration, resource loading, and prompt generation.
 * Migrated from Python pytest tests.
 */

import { test } from "node:test";
import { strict as assert } from "assert";
import { getPrompt, listPrompts, listResources, listTools, readResource } from "../src/server.js";

// ============================================================================
// Server Tools Tests
// ============================================================================

test("Server Tools: get_weather tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__get_weather"));
});

test("Server Tools: get_snow_conditions tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__get_snow_conditions"));
});

test("Server Tools: get_weather_alerts tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__get_weather_alerts"));
});

test("Server Tools: get_historical_weather tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__get_historical_weather"));
});

test("Server Tools: get_marine_conditions tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__get_marine_conditions"));
});

test("Server Tools: get_comfort_index tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__get_comfort_index"));
});

test("Server Tools: get_astronomy tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__get_astronomy"));
});

test("Server Tools: search_location_swiss tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__search_location_swiss"));
});

test("Server Tools: compare_locations tool registered", () => {
  const result = listTools();
  const toolNames = result.tools.map((tool) => tool.name);
  assert(toolNames.includes("meteo__compare_locations"));
});

test("Server Tools: tool count is 11", () => {
  const result = listTools();
  assert.equal(result.tools.length, 11);
});

// ============================================================================
// Server Resources Tests
// ============================================================================

test("Server Resources: weather codes resource registered", () => {
  const result = listResources();
  const resourceUris = result.resources.map((r) => r.uri);
  assert(resourceUris.includes("weather://codes"));
});

test("Server Resources: weather parameters resource registered", () => {
  const result = listResources();
  const resourceUris = result.resources.map((r) => r.uri);
  assert(resourceUris.includes("weather://parameters"));
});

test("Server Resources: resource count is 4", () => {
  const result = listResources();
  assert.equal(result.resources.length, 4);
});

test("Server Resources: weather codes content is valid JSON", async () => {
  const result = await readResource({
    params: { uri: "weather://codes" },
  } as never);

  assert.ok(result.contents);
  assert(result.contents.length > 0);

  const content = result.contents[0];
  assert("text" in content);

  // Should be valid JSON
  const data = JSON.parse(content.text);
  assert(typeof data === "object");
  // Should contain weather codes
  assert(Object.keys(data).length > 0);
});

test("Server Resources: weather parameters content is valid JSON", async () => {
  const result = await readResource({
    params: { uri: "weather://parameters" },
  } as never);

  assert.ok(result.contents);
  assert(result.contents.length > 0);

  const content = result.contents[0];
  assert("text" in content);

  // Should be valid JSON
  const data = JSON.parse(content.text);
  assert(typeof data === "object");
  // Should contain parameter categories
  assert(Object.keys(data).length > 0);
});

// ============================================================================
// Server Prompts Tests
// ============================================================================

test("Server Prompts: ski trip weather prompt registered", () => {
  const result = listPrompts();
  const promptNames = result.prompts.map((p) => p.name);
  assert(promptNames.includes("meteo__ski-trip-weather"));
});

test("Server Prompts: plan outdoor activity prompt registered", () => {
  const result = listPrompts();
  const promptNames = result.prompts.map((p) => p.name);
  assert(promptNames.includes("meteo__plan-outdoor-activity"));
});

test("Server Prompts: weather aware travel prompt registered", () => {
  const result = listPrompts();
  const promptNames = result.prompts.map((p) => p.name);
  assert(promptNames.includes("meteo__weather-aware-travel"));
});

test("Server Prompts: prompt count is 3", () => {
  const result = listPrompts();
  assert.equal(result.prompts.length, 3);
});

test("Server Prompts: ski trip weather prompt content", () => {
  const result = getPrompt({
    params: {
      name: "meteo__ski-trip-weather",
      arguments: { resort: "Zermatt", dates: "this weekend" },
    },
  } as never);

  // Should return messages
  assert.ok(result.messages);
  assert(result.messages.length > 0);

  const message = result.messages[0];
  assert("content" in message);

  // Content should be a TextContent object
  const content = message.content as { type: string; text: string };
  assert(content.type === "text");
  assert(typeof content.text === "string");
  assert(content.text.length > 0);

  // Should mention the resort
  assert(content.text.includes("Zermatt"));
  // Should mention the dates
  assert(content.text.includes("this weekend"));
});

test("Server Prompts: plan outdoor activity prompt content", () => {
  const result = getPrompt({
    params: {
      name: "meteo__plan-outdoor-activity",
      arguments: {
        activity: "hiking",
        location: "Bern",
        timeframe: "tomorrow",
      },
    },
  } as never);

  // Should return messages
  assert.ok(result.messages);
  assert(result.messages.length > 0);

  const message = result.messages[0];
  assert("content" in message);

  const content = message.content as { type: string; text: string };
  assert(content.type === "text");
  assert(typeof content.text === "string");
  assert(content.text.length > 0);

  // Should mention the activity
  assert(content.text.includes("hiking"));
});

test("Server Prompts: weather aware travel prompt content", () => {
  const result = getPrompt({
    params: {
      name: "meteo__weather-aware-travel",
      arguments: {
        destination: "Zürich",
        travel_dates: "next week",
        trip_type: "business",
      },
    },
  } as never);

  // Should return messages
  assert.ok(result.messages);
  assert(result.messages.length > 0);

  const message = result.messages[0];
  assert("content" in message);

  const content = message.content as { type: string; text: string };
  assert(content.type === "text");
  assert(typeof content.text === "string");
  assert(content.text.length > 0);

  // Should mention the destination
  assert(content.text.includes("Zürich"));
});

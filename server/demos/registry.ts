import type { DemoDefinition } from "./types";
import { match3Demo } from "./match3";
import { archetypeDemoDefinitions } from "./archetypes";
import { patternDemoDefinitions } from "./patterns";

export const demoDefinitions: DemoDefinition<unknown, unknown, unknown, unknown>[] = [
  match3Demo as DemoDefinition<unknown, unknown, unknown, unknown>,
  ...(archetypeDemoDefinitions as DemoDefinition<unknown, unknown, unknown, unknown>[]),
  ...(patternDemoDefinitions as DemoDefinition<unknown, unknown, unknown, unknown>[]),
];

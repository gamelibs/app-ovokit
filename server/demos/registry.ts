import type { DemoDefinition } from "./types";
import { match3Demo } from "./match3";
import { archetypeDemoDefinitions } from "./archetypes";

export const demoDefinitions: DemoDefinition<any, any, any, any>[] = [
  match3Demo,
  ...archetypeDemoDefinitions,
];

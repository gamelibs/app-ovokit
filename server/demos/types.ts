import type { z } from "zod";

export type DemoMeta = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  initHelp: string;
  initExample: unknown;
  actionHelp: string;
  actionExample: unknown;
};

export type DemoInitResult<TState, TView> = {
  state: TState;
  view: TView;
};

export type DemoStepResult<TState, TView> = {
  state: TState;
  view: TView;
  events: Array<{ type: string; payload?: unknown }>;
};

export type DemoDefinition<
  TInit,
  TState,
  TAction,
  TView,
> = {
  id: string;
  name: string;
  description: string;
  tags: string[];

  initHelp: string;
  initExample: unknown;
  initSchema: z.ZodType<TInit, z.ZodTypeDef, unknown>;

  actionHelp: string;
  actionExample: unknown;
  actionSchema: z.ZodType<TAction, z.ZodTypeDef, unknown>;

  init: (input: TInit) => Promise<DemoInitResult<TState, TView>> | DemoInitResult<TState, TView>;
  step: (input: { state: TState; action: TAction }) => Promise<DemoStepResult<TState, TView>> | DemoStepResult<TState, TView>;
};

import type { z } from "zod";

export type AlgoDefinition<TInput, TOutput> = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  inputHelp: string;
  inputExample: TInput;
  inputSchema: z.ZodType<TInput>;
  run: (input: TInput) => Promise<TOutput> | TOutput;
};

export type AlgoRunResult<TOutput> = {
  output: TOutput;
  durationMs: number;
};

export type AlgoMeta = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  inputHelp: string;
  inputExample: unknown;
};

import { z } from "zod";

export const match3InitSchema = z.object({
  width: z.number().int().min(4).max(16).default(8),
  height: z.number().int().min(4).max(16).default(8),
  types: z.number().int().min(3).max(8).default(5),
  seed: z.number().int().default(1),
});

export const match3ActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("swap"),
    from: z.tuple([z.number().int(), z.number().int()]),
    to: z.tuple([z.number().int(), z.number().int()]),
  }),
  z.object({
    type: z.literal("reset"),
  }),
]);


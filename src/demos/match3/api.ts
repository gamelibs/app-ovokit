import type { Match3Action, Match3InitInput, Match3InitResult, Match3State, Match3StepResult } from "./types";

export async function match3Init(input: Match3InitInput): Promise<Match3InitResult> {
  const res = await fetch("/api/demos/match3/init", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`match3 init failed: ${res.status}`);
  return (await res.json()) as Match3InitResult;
}

export async function match3Step(state: Match3State, action: Match3Action): Promise<Match3StepResult> {
  const res = await fetch("/api/demos/match3/step", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state, action }),
  });
  if (!res.ok) throw new Error(`match3 step failed: ${res.status}`);
  return (await res.json()) as Match3StepResult;
}


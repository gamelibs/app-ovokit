export type Vec2 = [number, number];

export type Match3InitInput = {
  width: number;
  height: number;
  types: number;
  seed: number;
  maxMoves?: number;
  targetScore?: number;
};

export type Match3State = {
  width: number;
  height: number;
  types: number;
  seed: number;
  rng: number;
  board: number[][];
  maxMoves: number;
  movesLeft: number;
  targetScore: number;
  score: number;
};

export type Match3Action =
  | { type: "swap"; from: Vec2; to: Vec2 }
  | { type: "reset" };

export type Match3Event =
  | { type: "swap"; payload: { from: Vec2; to: Vec2 } }
  | { type: "swap-revert"; payload: { from: Vec2; to: Vec2 } }
  | { type: "match"; payload: { cells: Vec2[] } }
  | { type: "clear"; payload: { cells: Vec2[] } }
  | { type: "drop"; payload: { moves: Array<{ from: Vec2; to: Vec2; tile: number }> } }
  | { type: "spawn"; payload: { spawns: Array<{ at: Vec2; tile: number }> } }
  | { type: "reset" };

export type Match3View = {
  board: number[][];
  movesLeft: number;
  maxMoves: number;
  score: number;
  targetScore: number;
  phase: "playing" | "won" | "lost";
  hint?: string;
};

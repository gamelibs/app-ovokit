import type { Match3Event, Match3InitInput, Match3State, Vec2 } from "./types";

const EMPTY = -1;

function xorshift32(seed: number) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  };
}

function randInt(nextU32: () => number, maxExclusive: number) {
  return nextU32() % maxExclusive;
}

function inBounds(state: { width: number; height: number }, [x, y]: Vec2) {
  return x >= 0 && y >= 0 && x < state.width && y < state.height;
}

function adjacent(a: Vec2, b: Vec2) {
  const dx = Math.abs(a[0] - b[0]);
  const dy = Math.abs(a[1] - b[1]);
  return dx + dy === 1;
}

function cloneBoard(board: number[][]) {
  return board.map((row) => row.slice());
}

function swapInPlace(board: number[][], a: Vec2, b: Vec2) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const t = board[ay]![ax]!;
  board[ay]![ax] = board[by]![bx]!;
  board[by]![bx] = t;
}

function findMatches(board: number[][]): Vec2[][] {
  const height = board.length;
  const width = height > 0 ? board[0]!.length : 0;
  const groups: Vec2[][] = [];

  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const v = board[y]![x]!;
      if (v === EMPTY) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < width && board[y]![end] === v) end++;
      const len = end - x;
      if (len >= 3) {
        const cells: Vec2[] = [];
        for (let cx = x; cx < end; cx++) cells.push([cx, y]);
        groups.push(cells);
      }
      x = end;
    }
  }

  for (let x = 0; x < width; x++) {
    let y = 0;
    while (y < height) {
      const v = board[y]![x]!;
      if (v === EMPTY) {
        y++;
        continue;
      }
      let end = y + 1;
      while (end < height && board[end]![x] === v) end++;
      const len = end - y;
      if (len >= 3) {
        const cells: Vec2[] = [];
        for (let cy = y; cy < end; cy++) cells.push([x, cy]);
        groups.push(cells);
      }
      y = end;
    }
  }

  return groups;
}

function uniqueCells(groups: Vec2[][]): Vec2[] {
  const seen = new Set<string>();
  const out: Vec2[] = [];
  for (const g of groups) {
    for (const c of g) {
      const key = `${c[0]},${c[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}

function clearCells(board: number[][], cells: Vec2[]) {
  for (const [x, y] of cells) board[y]![x] = EMPTY;
}

function applyGravity(board: number[][]): { moves: Array<{ from: Vec2; to: Vec2; tile: number }> } {
  const height = board.length;
  const width = height > 0 ? board[0]!.length : 0;
  const moves: Array<{ from: Vec2; to: Vec2; tile: number }> = [];

  for (let x = 0; x < width; x++) {
    let writeY = height - 1;
    for (let y = height - 1; y >= 0; y--) {
      const v = board[y]![x]!;
      if (v === EMPTY) continue;
      if (writeY !== y) {
        board[writeY]![x] = v;
        board[y]![x] = EMPTY;
        moves.push({ from: [x, y], to: [x, writeY], tile: v });
      }
      writeY--;
    }
  }

  return { moves };
}

function spawnEmpties(state: Match3State): { spawns: Array<{ at: Vec2; tile: number }> } {
  const nextU32 = xorshift32(state.rng);
  const height = state.board.length;
  const width = height > 0 ? state.board[0]!.length : 0;
  const spawns: Array<{ at: Vec2; tile: number }> = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (state.board[y]![x] !== EMPTY) continue;
      const tile = randInt(nextU32, state.types);
      state.board[y]![x] = tile;
      spawns.push({ at: [x, y], tile });
    }
  }

  state.rng = nextU32();
  return { spawns };
}

function makeBoardNoMatches(init: Match3InitInput, nextU32: () => number) {
  const board: number[][] = Array.from({ length: init.height }, () => Array.from({ length: init.width }, () => EMPTY));
  for (let y = 0; y < init.height; y++) {
    for (let x = 0; x < init.width; x++) {
      let candidate = randInt(nextU32, init.types);
      let guard = 0;
      while (guard++ < 20) {
        const left1 = x - 1 >= 0 ? board[y]![x - 1]! : null;
        const left2 = x - 2 >= 0 ? board[y]![x - 2]! : null;
        const up1 = y - 1 >= 0 ? board[y - 1]![x]! : null;
        const up2 = y - 2 >= 0 ? board[y - 2]![x]! : null;
        const wouldMatchH = left1 === candidate && left2 === candidate;
        const wouldMatchV = up1 === candidate && up2 === candidate;
        if (!wouldMatchH && !wouldMatchV) break;
        candidate = randInt(nextU32, init.types);
      }
      board[y]![x] = candidate;
    }
  }
  return board;
}

export function initMatch3(input: Match3InitInput): { state: Match3State; events: Match3Event[] } {
  const nextU32 = xorshift32(input.seed);
  const board = makeBoardNoMatches(input, nextU32);
  const state: Match3State = {
    width: input.width,
    height: input.height,
    types: input.types,
    seed: input.seed,
    rng: nextU32(),
    board,
  };
  return { state, events: [] };
}

export function stepMatch3(state: Match3State, action: { type: "swap"; from: Vec2; to: Vec2 } | { type: "reset" }) {
  const events: Match3Event[] = [];

  if (action.type === "reset") {
    const next = initMatch3({
      width: state.width,
      height: state.height,
      types: state.types,
      seed: state.seed,
    });
    return { state: next.state, events: [{ type: "reset" } satisfies Match3Event, ...next.events] };
  }

  if (!inBounds(state, action.from) || !inBounds(state, action.to) || !adjacent(action.from, action.to)) {
    return { state, events, hint: "仅支持交换相邻两格" };
  }

  const board = cloneBoard(state.board);
  swapInPlace(board, action.from, action.to);
  events.push({ type: "swap", payload: { from: action.from, to: action.to } });

  const matchesAfterSwap = findMatches(board);
  if (matchesAfterSwap.length === 0) {
    swapInPlace(board, action.from, action.to);
    events.push({ type: "swap-revert", payload: { from: action.from, to: action.to } });
    return { state: { ...state, board }, events, hint: "未形成消除，交换回退" };
  }

  let safety = 0;
  while (safety++ < 50) {
    const matches = findMatches(board);
    if (matches.length === 0) break;
    const cells = uniqueCells(matches);
    events.push({ type: "match", payload: { cells } });
    events.push({ type: "clear", payload: { cells } });
    clearCells(board, cells);
    const drop = applyGravity(board);
    if (drop.moves.length > 0) events.push({ type: "drop", payload: drop });
    const nextState: Match3State = { ...state, board, rng: state.rng };
    const spawn = spawnEmpties(nextState);
    if (spawn.spawns.length > 0) events.push({ type: "spawn", payload: spawn });
    state = nextState;
  }

  return { state: { ...state, board }, events, hint: undefined };
}

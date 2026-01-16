import { z } from "zod";
import type { AlgoDefinition } from "./types";

type Vec2 = [number, number];

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function bfsPath(
  width: number,
  height: number,
  walls: Set<string>,
  start: Vec2,
  end: Vec2,
) {
  const key = (x: number, y: number) => `${x},${y}`;
  const queue: Vec2[] = [start];
  const visited = new Set<string>([key(...start)]);
  const parent = new Map<string, Vec2>();

  while (queue.length) {
    const [x, y] = queue.shift() as Vec2;
    if (x === end[0] && y === end[1]) break;
    const dirs: Vec2[] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const k = key(nx, ny);
      if (walls.has(k) || visited.has(k)) continue;
      visited.add(k);
      parent.set(k, [x, y]);
      queue.push([nx, ny]);
    }
  }

  const endKey = key(...end);
  if (!parent.has(endKey) && !(start[0] === end[0] && start[1] === end[1])) {
    return { path: [], explored: visited.size };
  }

  const path: Vec2[] = [];
  let cur: Vec2 | undefined = end;
  while (cur) {
    path.push(cur);
    const pk = key(...cur);
    cur = parent.get(pk);
  }
  path.reverse();
  return { path, explored: visited.size };
}

type MatchCell = string | null;

function resolveMatch3(board: MatchCell[][], swap: { from: Vec2; to: Vec2 }) {
  const h = board.length;
  const w = board[0]?.length ?? 0;
  if (!w || !h) return { board, matches: [] as Vec2[], cascades: 0 };

  const clone = board.map((row) => row.slice());
  const inside = ([x, y]: Vec2) => x >= 0 && y >= 0 && x < w && y < h;
  if (!inside(swap.from) || !inside(swap.to)) {
    return { board, matches: [], cascades: 0 };
  }
  const tmp = clone[swap.from[1]][swap.from[0]];
  clone[swap.from[1]][swap.from[0]] = clone[swap.to[1]][swap.to[0]];
  clone[swap.to[1]][swap.to[0]] = tmp;

  const findMatches = () => {
    const matched = new Set<string>();
    const key = (x: number, y: number) => `${x},${y}`;
    // horizontal
    for (let y = 0; y < h; y++) {
      let runStart = 0;
      for (let x = 1; x <= w; x++) {
        const same =
          x < w &&
          clone[y][x] !== null &&
          clone[y][x] === clone[y][x - 1] &&
          clone[y][x] !== undefined;
        if (!same) {
          if (x - runStart >= 3 && clone[y][x - 1] !== null) {
            for (let k = runStart; k < x; k++) matched.add(key(k, y));
          }
          runStart = x;
        }
      }
    }
    // vertical
    for (let x = 0; x < w; x++) {
      let runStart = 0;
      for (let y = 1; y <= h; y++) {
        const same =
          y < h &&
          clone[y][x] !== null &&
          clone[y][x] === clone[y - 1][x] &&
          clone[y][x] !== undefined;
        if (!same) {
          if (y - runStart >= 3 && clone[y - 1][x] !== null) {
            for (let k = runStart; k < y; k++) matched.add(key(x, k));
          }
          runStart = y;
        }
      }
    }
    return matched;
  };

  const matches = findMatches();
  if (!matches.size) return { board: clone, matches: [] as Vec2[], cascades: 0 };

  const positions: Vec2[] = [];
  matches.forEach((k) => {
    const [x, y] = k.split(",").map((n) => parseInt(n, 10)) as Vec2;
    positions.push([x, y]);
    clone[y][x] = null;
  });

  let cascades = 0;
  for (let x = 0; x < w; x++) {
    let write = h - 1;
    for (let y = h - 1; y >= 0; y--) {
      if (clone[y][x] !== null) {
        clone[write][x] = clone[y][x];
        if (write !== y) clone[y][x] = null;
        write--;
      }
    }
    for (let y = write; y >= 0; y--) {
      clone[y][x] = null;
    }
    if (write < h - 1) cascades++;
  }

  return { board: clone, matches: positions, cascades };
}

export const algoDefinitions: AlgoDefinition<unknown, unknown>[] = [
  {
    id: "grid-pathfind",
    name: "网格寻路 BFS",
    description: "在二维网格上运行无权重 BFS，返回最短路径和探索节点数。",
    tags: ["grid", "pathfind", "bfs"],
    inputHelp: "传入网格尺寸、墙体列表与起终点坐标；墙体坐标从 0 开始。",
    inputExample: {
      width: 8,
      height: 6,
      walls: [
        [3, 1],
        [3, 2],
        [3, 3],
        [4, 3],
      ],
      start: [0, 0],
      end: [7, 5],
    },
    inputSchema: z.object({
      width: z.number().int().min(2).max(64),
      height: z.number().int().min(2).max(64),
      walls: z
        .array(z.tuple([z.number().int(), z.number().int()]))
        .default([]),
      start: z.tuple([z.number().int(), z.number().int()]),
      end: z.tuple([z.number().int(), z.number().int()]),
    }),
    run: (input) => {
      const { width, height, walls, start, end } = input as {
        width: number;
        height: number;
        walls: Vec2[];
        start: Vec2;
        end: Vec2;
      };
      const wallSet = new Set(walls.map(([x, y]) => `${x},${y}`));
      const { path, explored } = bfsPath(width, height, wallSet, start, end);
      return {
        path,
        explored,
        found: path.length > 0,
      };
    },
  },
  {
    id: "match3-resolve",
    name: "三消消除校验",
    description: "尝试一次交换，检测三连以上并返回消除后的棋盘与下落结果。",
    tags: ["match3", "eliminate", "grid"],
    inputHelp: "board 用字符串表示不同元素；null/0 代表空；swap 用 from/to 坐标。",
    inputExample: {
      board: [
        ["A", "B", "C", "D", "E", "E"],
        ["A", "B", "C", "C", "E", "F"],
        ["A", "B", "C", "D", "E", "F"],
        ["B", "B", "C", "D", "E", "F"],
        ["C", "D", "D", "D", "E", "F"],
      ],
      swap: { from: [1, 2], to: [1, 3] },
    },
    inputSchema: z.object({
      board: z
        .array(z.array(z.string().min(1).nullable()))
        .min(1)
        .max(64),
      swap: z.object({
        from: z.tuple([z.number().int(), z.number().int()]),
        to: z.tuple([z.number().int(), z.number().int()]),
      }),
    }),
    run: (input) => {
      const { board, swap } = input as {
        board: MatchCell[][];
        swap: { from: Vec2; to: Vec2 };
      };
      return resolveMatch3(board, swap);
    },
  },
  {
    id: "noise-heightmap",
    name: "伪随机高度图",
    description: "用简单的 seeded 噪声生成高度图，可用于地形/关卡随机化。",
    tags: ["noise", "terrain", "rng"],
    inputHelp: "控制尺寸、seed 与平滑度；输出 0~1 的 height 值二维数组。",
    inputExample: {
      width: 10,
      height: 10,
      seed: 42,
      smooth: 2,
    },
    inputSchema: z.object({
      width: z.number().int().min(2).max(64),
      height: z.number().int().min(2).max(64),
      seed: z.number().int().optional().default(1),
      smooth: z.number().int().min(0).max(8).optional().default(2),
    }),
    run: (input) => {
      const { width, height, seed = 1, smooth = 2 } = input as {
        width: number;
        height: number;
        seed?: number;
        smooth?: number;
      };
      const rand = seededRandom(seed);
      const raw: number[][] = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => rand()),
      );
      const out: number[][] = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => 0),
      );
      const radius = clamp(smooth, 0, 8);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = clamp(x + dx, 0, width - 1);
              const ny = clamp(y + dy, 0, height - 1);
              sum += raw[ny][nx];
              count++;
            }
          }
          out[y][x] = Number((sum / count).toFixed(4));
        }
      }
      return { grid: out, seed, smooth: radius };
    },
  },
];

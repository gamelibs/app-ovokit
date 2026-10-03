// modules/core/bubble-shooter/logic.ts
var logic_default = {
  name: "bubble-shooter",
  install(ctx) {
    ctx.logger.info("[bubble-shooter] install");
    ctx.system["bubble-shooter"] = createAPI(ctx);
  },
  init(ctx) {
    ctx.logger.info("[bubble-shooter] init");
  },
  start(ctx) {
    ctx.logger.info("[bubble-shooter] start");
  },
  stop(ctx) {
    ctx.logger.info("[bubble-shooter] stop");
  },
  destroy(ctx) {
    delete ctx.system["bubble-shooter"];
  }
};
var COLORS = ["blue", "green", "red"];
var ROWS = 14;
var COLS = 8;
var INITIAL_ROWS = 5;
var MATCH_MIN = 3;
var ADVANCE_EVERY = 10;
function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}
function createGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}
function createAPI(ctx) {
  const events = () => ctx.system.events;
  function emit(event, payload) {
    const ev = events();
    if (ev) ev.emit(event, payload);
  }
  function getNumber(key, fallback = 0) {
    const v = ctx.data.get(key);
    return typeof v === "number" ? v : fallback;
  }
  function getString(key, fallback = "") {
    const v = ctx.data.get(key);
    return typeof v === "string" ? v : fallback;
  }
  function getGrid() {
    const v = ctx.data.get("bubbleGrid");
    if (Array.isArray(v)) return v;
    return createGrid(ROWS, COLS);
  }
  function setGrid(grid) {
    ctx.data.set("bubbleGrid", grid);
  }
  function countBubbles(grid) {
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) count++;
      }
    }
    return count;
  }
  function fillRow(row) {
    for (let c = 0; c < row.length; c++) {
      row[c] = randomColor();
    }
  }
  function initBubbles() {
    const grid = createGrid(ROWS, COLS);
    for (let r = 0; r < INITIAL_ROWS; r++) {
      fillRow(grid[r]);
    }
    return grid;
  }
  function angleToCol(angle) {
    const clamped = Math.max(-80, Math.min(80, angle));
    const t = (clamped + 80) / 160;
    return Math.min(COLS - 1, Math.floor(t * COLS));
  }
  function findAttachCell(grid, col) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][col]) {
        if (r + 1 >= ROWS) return null;
        return { row: r + 1, col };
      }
    }
    return { row: 0, col };
  }
  function neighbors(r, c) {
    return [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
      [r - 1, c - 1],
      [r - 1, c + 1],
      [r + 1, c - 1],
      [r + 1, c + 1]
    ];
  }
  function findMatches(grid, startRow, startCol) {
    const color = grid[startRow][startCol];
    if (!color) return [];
    const visited = /* @__PURE__ */ new Set();
    const matched = [];
    const queue = [[startRow, startCol]];
    visited.add(`${startRow},${startCol}`);
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      matched.push([r, c]);
      for (const [nr, nc] of neighbors(r, c)) {
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;
        if (grid[nr][nc] === color) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
    return matched;
  }
  function findFloating(grid) {
    const anchored = /* @__PURE__ */ new Set();
    const queue = [];
    for (let c = 0; c < COLS; c++) {
      if (grid[0][c]) {
        anchored.add(`0,${c}`);
        queue.push([0, c]);
      }
    }
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      for (const [nr, nc] of neighbors(r, c)) {
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const key = `${nr},${nc}`;
        if (anchored.has(key)) continue;
        if (grid[nr][nc]) {
          anchored.add(key);
          queue.push([nr, nc]);
        }
      }
    }
    const floating = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] && !anchored.has(`${r},${c}`)) {
          floating.push([r, c]);
        }
      }
    }
    return floating;
  }
  function advanceCeiling(grid) {
    const newGrid = createGrid(ROWS, COLS);
    for (let r = 0; r < ROWS - 1; r++) {
      newGrid[r + 1] = [...grid[r]];
    }
    fillRow(newGrid[0]);
    return newGrid;
  }
  return {
    reset() {
      const grid = initBubbles();
      setGrid(grid);
      ctx.data.set("currentBubble", randomColor());
      ctx.data.set("nextBubble", randomColor());
      ctx.data.set("score", 0);
      ctx.data.set("comboCount", 0);
      ctx.data.set("shotsSinceAdvance", 0);
      ctx.data.set("gameOver", false);
      ctx.data.set("bubbleCount", countBubbles(grid));
      ctx.data.set("aimAngle", 0);
      ctx.logger.info("[bubble-shooter] reset");
    },
    setAim(params) {
      const angle = Number(params?.angle ?? 0);
      ctx.data.set("aimAngle", angle);
      ctx.logger.info(`[bubble-shooter] setAim angle=${angle}`);
    },
    shoot(params) {
      if (ctx.data.get("gameOver")) return;
      const angle = Number(params?.angle ?? getNumber("aimAngle", 0));
      ctx.data.set("aimAngle", angle);
      const col = angleToCol(angle);
      const grid = getGrid();
      const cell = findAttachCell(grid, col);
      if (!cell) {
        ctx.data.set("gameOver", true);
        emit("game.over", { finalScore: getNumber("score", 0), reason: "column-full" });
        return;
      }
      const color = getString("currentBubble", randomColor());
      grid[cell.row][cell.col] = color;
      setGrid(grid);
      emit("bubble.attach", { row: cell.row, col: cell.col, color });
      ctx.logger.info(`[bubble-shooter] attach row=${cell.row} col=${cell.col} color=${color}`);
      const matches = findMatches(grid, cell.row, cell.col);
      if (matches.length >= MATCH_MIN) {
        for (const [r, c] of matches) {
          grid[r][c] = null;
        }
        const popScore = matches.length * 10;
        ctx.data.set("score", getNumber("score", 0) + popScore);
        setGrid(grid);
        const positions = matches.map(([r, c]) => ({ row: r, col: c }));
        emit("bubble.pop", { count: matches.length, positions, score: popScore });
        ctx.logger.info(`[bubble-shooter] pop count=${matches.length} score=${popScore}`);
        const floating = findFloating(grid);
        if (floating.length > 0) {
          for (const [r, c] of floating) {
            grid[r][c] = null;
          }
          const cascadeScore = floating.length * 20;
          ctx.data.set("score", getNumber("score", 0) + cascadeScore);
          setGrid(grid);
          emit("cascade.trigger", { droppedCount: floating.length, score: cascadeScore });
          ctx.logger.info(`[bubble-shooter] cascade dropped=${floating.length} score=${cascadeScore}`);
        }
      }
      let shots = getNumber("shotsSinceAdvance", 0) + 1;
      if (shots >= ADVANCE_EVERY) {
        shots = 0;
        let willOverflow = false;
        for (let c = 0; c < COLS; c++) {
          if (grid[ROWS - 1][c]) {
            willOverflow = true;
            break;
          }
        }
        if (willOverflow) {
          ctx.data.set("gameOver", true);
          ctx.data.set("bubbleCount", countBubbles(grid));
          emit("game.over", { finalScore: getNumber("score", 0), reason: "overflow" });
          return;
        }
        const newGrid = advanceCeiling(grid);
        setGrid(newGrid);
        ctx.logger.info("[bubble-shooter] ceiling advanced");
      }
      ctx.data.set("shotsSinceAdvance", shots);
      const next = getString("nextBubble", randomColor());
      ctx.data.set("currentBubble", next);
      ctx.data.set("nextBubble", randomColor());
      const bubbleCount = countBubbles(getGrid());
      ctx.data.set("bubbleCount", bubbleCount);
      if (bubbleCount === 0) {
        ctx.data.set("gameOver", true);
        emit("game.over", { finalScore: getNumber("score", 0), reason: "cleared" });
        return;
      }
    }
  };
}
export {
  logic_default as default
};

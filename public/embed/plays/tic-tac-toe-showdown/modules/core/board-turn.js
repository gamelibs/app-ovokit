// modules/core/board-turn/logic.ts
var logic_default = {
  name: "board-turn",
  install(ctx) {
    ctx.logger.info("[board-turn] install");
    const api = createAPI(ctx);
    ctx.system["board-turn"] = api;
  },
  init(ctx) {
    ctx.logger.info("[board-turn] init");
  },
  start(ctx) {
    ctx.logger.info("[board-turn] start");
    const api = ctx.system["board-turn"];
    if (api && typeof api.onSceneStart === "function") {
      api.onSceneStart(ctx.scene?.id);
    }
  },
  stop(ctx) {
    const api = ctx.system["board-turn"];
    if (api && typeof api.onSceneStop === "function") {
      api.onSceneStop();
    }
  },
  destroy(ctx) {
    const api = ctx.system["board-turn"];
    if (api && typeof api.destroyRenderer === "function") {
      api.destroyRenderer();
    }
    delete ctx.system["board-turn"];
  }
};
function createAPI(ctx) {
  const events = () => ctx.system.events;
  function getNumber(key, fallback = 0) {
    const v = ctx.data.get(key);
    return typeof v === "number" ? v : fallback;
  }
  function getString(key, fallback = "") {
    const v = ctx.data.get(key);
    return typeof v === "string" ? v : fallback;
  }
  function getCells() {
    const raw = ctx.data.get("boardCells");
    return Array.isArray(raw) ? raw : [];
  }
  function rows() {
    return getNumber("boardRows", 3);
  }
  function cols() {
    return getNumber("boardCols", 3);
  }
  function winLength() {
    return getNumber("winLength", 3);
  }
  function boardArea() {
    return {
      x: getNumber("boardX", 225),
      y: getNumber("boardY", 692),
      w: getNumber("boardWidth", 300),
      h: getNumber("boardHeight", 300)
    };
  }
  function emit(event, payload) {
    const ev = events();
    if (ev) ev.emit(event, payload);
  }
  function checkWinner(cells, r, c, player) {
    const R = rows();
    const C = cols();
    const W = winLength();
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];
    const idx = (rr, cc) => rr * C + cc;
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < W; i++) {
        const rr = r + dr * i;
        const cc = c + dc * i;
        if (rr < 0 || rr >= R || cc < 0 || cc >= C) break;
        if (cells[idx(rr, cc)] === player) count++;
        else break;
      }
      for (let i = 1; i < W; i++) {
        const rr = r - dr * i;
        const cc = c - dc * i;
        if (rr < 0 || rr >= R || cc < 0 || cc >= C) break;
        if (cells[idx(rr, cc)] === player) count++;
        else break;
      }
      if (count >= W) return player;
    }
    return null;
  }
  let container = null;
  let gridGraphics = null;
  let piecesContainer = null;
  let unsubTap = null;
  function getPixi() {
    return ctx.engine.pixi;
  }
  function getStage() {
    return ctx.engine.stage;
  }
  function clearRenderer() {
    if (piecesContainer) {
      piecesContainer.removeChildren();
    }
    if (gridGraphics) {
      gridGraphics.clear();
    }
  }
  function destroyRenderer() {
    clearRenderer();
    if (container) {
      if (container.parent) container.parent.removeChild(container);
      container.destroy({ children: true });
      container = null;
    }
    gridGraphics = null;
    piecesContainer = null;
    if (unsubTap) {
      unsubTap();
      unsubTap = null;
    }
  }
  function ensureContainer() {
    const pixi = getPixi();
    const stage = getStage();
    if (!pixi || !stage) return null;
    if (!container) {
      container = new pixi.Container();
      gridGraphics = new pixi.Graphics();
      piecesContainer = new pixi.Container();
      container.addChild(gridGraphics);
      container.addChild(piecesContainer);
      stage.addChild(container);
    }
    return { pixi, container };
  }
  function renderBoard() {
    const res = ensureContainer();
    if (!res) return;
    const { pixi } = res;
    const area = boardArea();
    const R = rows();
    const C = cols();
    const cellW = area.w / C;
    const cellH = area.h / R;
    const cells = getCells();
    clearRenderer();
    gridGraphics.lineStyle(4, 5089023, 1);
    for (let r = 0; r <= R; r++) {
      const y = area.y + r * cellH;
      gridGraphics.moveTo(area.x, y);
      gridGraphics.lineTo(area.x + area.w, y);
    }
    for (let c = 0; c <= C; c++) {
      const x = area.x + c * cellW;
      gridGraphics.moveTo(x, area.y);
      gridGraphics.lineTo(x, area.y + area.h);
    }
    const xColor = getString("playerXColor", "#ff2d55");
    const oColor = getString("playerOColor", "#00f2ff");
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const v = cells[r * C + c];
        if (!v) continue;
        const cx = area.x + c * cellW + cellW / 2;
        const cy = area.y + r * cellH + cellH / 2;
        const style = new pixi.TextStyle({
          fontFamily: "Arial",
          fontSize: Math.min(cellW, cellH) * 0.7,
          fill: v === "X" ? xColor : oColor,
          fontWeight: "bold",
          align: "center"
        });
        const text = new pixi.Text(String(v), style);
        text.anchor.set(0.5);
        text.x = cx;
        text.y = cy;
        piecesContainer.addChild(text);
      }
    }
  }
  function handleTap(payload) {
    const p = payload;
    if (typeof p?.x !== "number" || typeof p?.y !== "number") return;
    const area = boardArea();
    if (p.x < area.x || p.x > area.x + area.w || p.y < area.y || p.y > area.y + area.h) {
      return;
    }
    const R = rows();
    const C = cols();
    const col = Math.floor((p.x - area.x) / area.w * C);
    const row = Math.floor((p.y - area.y) / area.h * R);
    if (row < 0 || row >= R || col < 0 || col >= C) return;
    ctx.logger.info(`[board-turn] tap cell (${row},${col})`);
    emit("cell.click", { row, col, index: row * C + col });
  }
  function onSceneStart(sceneId) {
    if (sceneId !== "gameplay") return;
    renderBoard();
    const ev = events();
    if (ev && !unsubTap) {
      unsubTap = ev.on("input:tap", handleTap);
    }
  }
  function onSceneStop() {
    clearRenderer();
    if (unsubTap) {
      unsubTap();
      unsubTap = null;
    }
  }
  return {
    reset(params) {
      const R = Number(params?.rows ?? 3);
      const C = Number(params?.cols ?? 3);
      const W = Number(params?.winLength ?? 3);
      const players = Array.isArray(params?.players) && params.players.length >= 2 ? params.players : ["X", "O"];
      ctx.data.set("boardRows", R);
      ctx.data.set("boardCols", C);
      ctx.data.set("winLength", W);
      ctx.data.set("boardCells", new Array(R * C).fill(null));
      ctx.data.set("currentPlayer", players[0]);
      ctx.data.set("players", players);
      ctx.data.set("winner", null);
      ctx.data.set("isDraw", false);
      ctx.data.set("lastMove", null);
      ctx.logger.info(`[board-turn] reset ${R}x${C}, winLength=${W}`);
      renderBoard();
    },
    makeMove(params = {}) {
      const R = rows();
      const C = cols();
      const row = Number(params?.row ?? -1);
      const col = Number(params?.col ?? -1);
      if (row < 0 || row >= R || col < 0 || col >= C) {
        ctx.logger.warn(`[board-turn] invalid move (${row},${col})`);
        return;
      }
      const cells = getCells();
      const index = row * C + col;
      if (cells[index] !== null && cells[index] !== void 0) {
        ctx.logger.warn(`[board-turn] cell (${row},${col}) already occupied`);
        return;
      }
      const currentPlayer = getString("currentPlayer", "X");
      const player = params?.player ?? currentPlayer;
      cells[index] = player;
      ctx.data.set("boardCells", cells);
      ctx.data.set("lastMove", { row, col, player });
      emit("board.moveMade", { row, col, player });
      ctx.logger.info(`[board-turn] move (${row},${col}) player=${player}`);
      const winner = checkWinner(cells, row, col, player);
      if (winner) {
        ctx.data.set("winner", winner);
        emit("board.win", { winner, cells });
        ctx.logger.info(`[board-turn] winner ${winner}`);
        renderBoard();
        return;
      }
      const isDraw = cells.every((cell) => cell !== null && cell !== void 0);
      if (isDraw) {
        ctx.data.set("isDraw", true);
        emit("board.draw", { cells });
        ctx.logger.info("[board-turn] draw");
        renderBoard();
        return;
      }
      const players = ctx.data.get("players") || ["X", "O"];
      const nextIndex = (players.indexOf(player) + 1) % players.length;
      ctx.data.set("currentPlayer", players[nextIndex]);
      renderBoard();
    },
    checkStatus() {
      const cells = getCells();
      const lastMove = ctx.data.get("lastMove");
      if (lastMove) {
        const winner = checkWinner(cells, lastMove.row, lastMove.col, lastMove.player);
        if (winner) {
          ctx.data.set("winner", winner);
          emit("board.win", { winner, cells });
          renderBoard();
          return;
        }
      }
      const isDraw = cells.every((cell) => cell !== null && cell !== void 0);
      ctx.data.set("isDraw", isDraw);
      if (isDraw) emit("board.draw", { cells });
      renderBoard();
    },
    renderBoard,
    onSceneStart,
    onSceneStop,
    destroyRenderer
  };
}
export {
  logic_default as default
};

// modules/core/board-ai/logic.ts
var logic_default = {
  name: "board-ai",
  install(ctx) {
    ctx.logger.info("[board-ai] install");
    ctx.system["board-ai"] = createAPI(ctx);
  },
  destroy(ctx) {
    delete ctx.system["board-ai"];
  }
};
function createAPI(ctx) {
  function getNumber(key, fallback = 0) {
    const v = ctx.data.get(key);
    return typeof v === "number" ? v : fallback;
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
  function idx(r, c) {
    return r * cols() + c;
  }
  function checkWinner(cells, player) {
    const R = rows();
    const C = cols();
    const W = winLength();
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (cells[idx(r, c)] !== player) continue;
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
          if (count >= W) return true;
        }
      }
    }
    return false;
  }
  function getEmptyCells(cells) {
    const empty = [];
    const C = cols();
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === null || cells[i] === void 0) {
        empty.push({ row: Math.floor(i / C), col: i % C, index: i });
      }
    }
    return empty;
  }
  function minimax(cells, depth, isMaximizing, aiPlayer, humanPlayer) {
    if (checkWinner(cells, aiPlayer)) return 10 - depth;
    if (checkWinner(cells, humanPlayer)) return depth - 10;
    const empty = getEmptyCells(cells);
    if (empty.length === 0) return 0;
    const C = cols();
    if (isMaximizing) {
      let best = -Infinity;
      for (const e of empty) {
        cells[e.index] = aiPlayer;
        const score = minimax(cells, depth + 1, false, aiPlayer, humanPlayer);
        cells[e.index] = null;
        best = Math.max(best, score);
      }
      return best;
    } else {
      let best = Infinity;
      for (const e of empty) {
        cells[e.index] = humanPlayer;
        const score = minimax(cells, depth + 1, true, aiPlayer, humanPlayer);
        cells[e.index] = null;
        best = Math.min(best, score);
      }
      return best;
    }
  }
  function findBestMove() {
    const cells = getCells();
    const empty = getEmptyCells(cells);
    if (empty.length === 0) return null;
    const players = ctx.data.get("players") || ["X", "O"];
    const currentPlayer = ctx.data.get("currentPlayer") || players[1];
    const opponent = players.find((p) => p !== currentPlayer) || players[0];
    if (cells.length <= 16) {
      let bestScore = -Infinity;
      let bestMove = empty[0];
      for (const e of empty) {
        cells[e.index] = currentPlayer;
        const score = minimax(cells, 0, false, currentPlayer, opponent);
        cells[e.index] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = e;
        }
      }
      return bestMove;
    }
    return empty[Math.floor(Math.random() * empty.length)];
  }
  return {
    getBestMove() {
      const move = findBestMove();
      if (!move) {
        ctx.logger.info("[board-ai] no valid move");
        return;
      }
      ctx.logger.info(`[board-ai] best move ${move.row},${move.col}`);
      const boardTurn = ctx.system["board-turn"] ?? ctx.system["board-3d"];
      if (boardTurn && typeof boardTurn.makeMove === "function") {
        boardTurn.makeMove({ row: move.row, col: move.col });
      } else {
        ctx.logger.warn("[board-ai] board-turn/board-3d module not found");
      }
    }
  };
}
export {
  logic_default as default
};

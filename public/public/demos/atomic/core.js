/*!
 * AtomCore — OVO 原子核心试玩引擎 v1.0.0
 * 理念：大道至简。每个 demo 只演示一个行为原语/母型，手绘草图风格，参数可调。
 * 契约（app-ovoforge-site doc/h5-demo-development-guide.md）：
 *   - 纯静态、无服务器依赖、无外部请求
 *   - postMessage: 发出 demo:ready / demo:score / demo:complete；接收 demo:restart
 *   - 竖屏优先，触摸目标 ≥44px
 * 用法：
 *   <script src="../core.js"></script>
 *   AtomCore.create({
 *     title, objective, params: [{key,label,min,max,step,default,unit}],
 *     setup(game), update(game, dt), draw(game, g), onPointer(game, {x,y,type})
 *   })
 * game 暴露：W,H,score,lives,state('ready'|'playing'|'over'),params,data,rand(),reset(),endGame(),setScore(n)
 */
(function () {
  'use strict';

  var PAPER = '#faf7ef', INK = '#2b2b2b', YELLOW = '#ffda6a', RED = '#ff8b8b', BLUE = '#7cc4ff', GREEN = '#9be29b';

  // ---- i18n（规则：显式 ?lang=zh 才中文，其余一律英文） ----
  var LANG = 'en';
  try {
    LANG = new URLSearchParams(window.location.search).get('lang') === 'zh' ? 'zh' : 'en';
  } catch (e) {}
  try { document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en'; } catch (e) {}
  var DICT = {
    zh: { start: '开始', again: '再来一次', win: '完成！', over: '结束', score: '得分', lives: '生命' },
    en: { start: 'Start', again: 'Play Again', win: 'Done!', over: 'Over', score: 'Score', lives: 'Lives' }
  };
  function T(key) { return (DICT[LANG] && DICT[LANG][key]) || DICT.en[key] || key; }
  /** L(zh, en)：demo 自有文案双语包裹（当前语言 zh 取前者，否则取后者） */
  function L(zh, en) { return LANG === 'zh' ? zh : en; }

  // ---- 固定种子随机（可回放棋盘）：mulberry32，5 行 ----
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- 手绘风格绘制助手 ----
  function jitter(v) { return (Math.random() - 0.5) * v; }
  function makeG(ctx) {
    var g = {
      ctx: ctx,
      line: function (x1, y1, x2, y2, w) {
        ctx.strokeStyle = INK; ctx.lineWidth = w || 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1 + jitter(1.6), y1 + jitter(1.6));
        ctx.quadraticCurveTo((x1 + x2) / 2 + jitter(3), (y1 + y2) / 2 + jitter(3), x2 + jitter(1.6), y2 + jitter(1.6));
        ctx.stroke();
      },
      rect: function (x, y, w, h, fill, lw) {
        if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
        this.line(x, y, x + w, y, lw); this.line(x + w, y, x + w, y + h, lw);
        this.line(x + w, y + h, x, y + h, lw); this.line(x, y + h, x, y, lw);
      },
      circle: function (x, y, r, fill, lw) {
        ctx.beginPath();
        if (fill) { ctx.fillStyle = fill; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); }
        ctx.strokeStyle = INK; ctx.lineWidth = lw || 2;
        ctx.arc(x + jitter(1.2), y + jitter(1.2), r + jitter(1.2), 0, Math.PI * 2);
        ctx.stroke();
      },
      text: function (str, x, y, size, color, align) {
        ctx.fillStyle = color || INK;
        ctx.font = size + 'px Kalam, cursive, sans-serif';
        ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(str, x, y);
      }
    };
    return g;
  }

  function create(cfg) {
    // ---- DOM 骨架（说明/设置侧栏化：宽屏在右，窄屏在上） ----
    var root = document.currentScript ? document.currentScript.parentElement : document.body;
    if (!root || root === document.body) root = document.body;
    root.innerHTML =
      '<div class="ac-wrap">' +
      '  <div class="ac-main">' +
      '    <div class="ac-head"><span class="ac-title"></span></div>' +
      '    <div class="ac-stage"><canvas></canvas>' +
      '      <div class="ac-overlay"><div class="ac-overlay-text"></div><button class="ac-start" type="button">' + T('start') + '</button></div>' +
      '    </div>' +
      '    <div class="ac-hud"></div>' +
      '    <div class="ac-toggles"></div>' +
      '  </div>' +
      '  <aside class="ac-side">' +
      '    <div class="ac-obj"></div>' +
      '    <div class="ac-params"></div>' +
      '  </aside>' +
      '</div>';
    injectStyle(root);

    var wrap = root.querySelector('.ac-wrap');
    var side = root.querySelector('.ac-side');
    var canvas = root.querySelector('canvas');
    var overlay = root.querySelector('.ac-overlay');
    var overlayText = root.querySelector('.ac-overlay-text');
    var hud = root.querySelector('.ac-hud');
    var paramsBox = root.querySelector('.ac-params');
    root.querySelector('.ac-title').textContent = cfg.title || '';
    root.querySelector('.ac-obj').textContent = cfg.objective || '';

    // ---- 游戏对象 ----
    // rand 委托：默认 Math.random；fixedSeed 开关勾选时（且 demo 声明 seedable）换 mulberry32 固定种子
    var rngSource = Math.random;
    function reseed() {
      var seedable = !!(cfg.seedable || (cfg.toggles || []).some(function (t) { return t.key === 'fixedSeed' && t.seedable; }));
      rngSource = seedable && game.toggles.fixedSeed ? mulberry32(0xC0FFEE) : Math.random;
    }
    var game = {
      W: 0, H: 0, score: 0, lives: 3, state: 'ready', time: 0,
      params: {}, toggles: {}, data: {},
      rand: function (a, b) { return a + rngSource() * (b - a); },
      setScore: function (n) {
        game.score = n; renderHud();
        post({ type: 'demo:score', score: n });
      },
      endGame: function (win) {
        game.state = 'over';
        overlayText.textContent = (win ? T('win') : T('over')) + ' · ' + T('score') + ' ' + game.score;
        overlay.style.display = 'flex';
        startBtn.textContent = T('again');
        post({ type: 'demo:complete', score: game.score, win: !!win });
      },
      reset: function () {
        game.score = 0; game.time = 0; game.lives = cfg.lives != null ? cfg.lives : 3;
        game.data = {}; game.state = 'playing';
        reseed(); // 固定种子在 reset 开头重建 rand：同一开关状态 ⇒ 同一局可回放
        if (cfg.setup) cfg.setup(game);
        renderHud();
        overlay.style.display = 'none';
      }
    };

    // ---- 参数滑块 ----
    (cfg.params || []).forEach(function (p) {
      game.params[p.key] = p.default;
      var row = document.createElement('div'); row.className = 'ac-param';
      var label = document.createElement('label');
      label.innerHTML = p.label + ' <b>' + p.default + (p.unit || '') + '</b>';
      var input = document.createElement('input');
      input.type = 'range'; input.min = p.min; input.max = p.max; input.step = p.step; input.value = p.default;
      input.addEventListener('input', function () {
        game.params[p.key] = parseFloat(input.value);
        label.innerHTML = p.label + ' <b>' + input.value + (p.unit || '') + '</b>';
        if (cfg.onParam) cfg.onParam(game, p.key, game.params[p.key]);
      });
      row.appendChild(label); row.appendChild(input);
      paramsBox.appendChild(row);
    });

    // ---- 开关行（HUD 旁 checkbox；label/labelEn 按 lang 取） ----
    var togglesBox = root.querySelector('.ac-toggles');
    (cfg.toggles || []).forEach(function (t) {
      game.toggles[t.key] = t.default === true; // 缺省不勾选（实验开关按需开启）
      var row = document.createElement('label');
      row.className = 'ac-toggle';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = game.toggles[t.key];
      var text = document.createElement('span');
      text.textContent = LANG === 'zh' ? t.label : (t.labelEn || t.label);
      input.addEventListener('change', function () {
        game.toggles[t.key] = input.checked;
        if (t.key === 'fixedSeed') reseed();
        if (cfg.onToggle) cfg.onToggle(game, t.key, input.checked);
      });
      row.appendChild(input); row.appendChild(text);
      togglesBox.appendChild(row);
    });
    reseed(); // 按开关默认状态取 rand（fixedSeed 勾选 ⇒ 预览棋盘即固定棋盘）

    // ---- 画布尺寸（适配窗口，永不出现滚动条）----
    var ctx = canvas.getContext('2d');
    function resize() {
      var main = root.querySelector('.ac-main');
      var narrow = wrap.clientWidth < 600;
      var sideH = narrow ? side.offsetHeight : 0;
      // 实测 chrome 高度（标题栏 + HUD + 参数面板 + 间隙），画布自动缩放填满剩余空间
      var head = root.querySelector('.ac-head');
      var hud = root.querySelector('.ac-hud');
      var chrome = (head ? head.offsetHeight : 0) + (hud ? hud.offsetHeight : 0) + 48 + sideH;
      var fitW = (window.innerHeight - chrome) / 1.5;
      var w = Math.max(200, Math.min(main.clientWidth, 520, fitW));
      var h = Math.round(w * 1.5); // 2:3 竖屏
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      game.W = w; game.H = h;
    }
    window.addEventListener('resize', resize);
    resize();

    // 预览态：开局前先跑一遍 setup，让棋盘/场景在 ready 态就可见（overlay 半透明透出）；
    // 点「开始」时 reset() 会重新 setup，互不影响
    if (cfg.setup) cfg.setup(game);

    // ---- 输入 ----
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (game.state !== 'playing') return;
      var p = pointer(e); p.type = 'down';
      if (cfg.onPointer) cfg.onPointer(game, p);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (game.state !== 'playing' || !cfg.onPointer) return;
      var p = pointer(e); p.type = 'move';
      cfg.onPointer(game, p);
    });
    canvas.addEventListener('pointerup', function (e) {
      if (game.state !== 'playing' || !cfg.onPointer) return;
      var p = pointer(e); p.type = 'up';
      cfg.onPointer(game, p);
    });

    // ---- HUD ----
    function renderHud() {
      hud.innerHTML = '<span>' + T('score') + ' <b>' + game.score + '</b></span>' +
        (cfg.lives ? '<span>' + T('lives') + ' <b>' + game.lives + '</b></span>' : '') +
        (cfg.hudExtra ? '<span>' + cfg.hudExtra(game) + '</span>' : '');
    }

    // ---- 协议 ----
    function post(msg) {
      try { window.parent.postMessage(msg, '*'); } catch (e) {}
    }
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'demo:restart') game.reset();
    });

    // ---- 主循环（固定步长）----
    var last = 0, acc = 0, STEP = 1000 / 60;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!last) last = ts;
      acc += Math.min(ts - last, 100); last = ts;
      while (acc >= STEP) {
        acc -= STEP;
        if (game.state === 'playing' && cfg.update) {
          game.time += STEP / 1000;
          cfg.update(game, STEP / 1000);
        }
      }
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, game.W, game.H);
      var g = makeG(ctx);
      if (cfg.draw) cfg.draw(game, g);
      if (cfg.hudExtra) renderHud();
    }
    requestAnimationFrame(frame);

    // ---- 开始 ----
    var startBtn = root.querySelector('.ac-start');
    startBtn.addEventListener('click', function () { game.reset(); });
    overlayText.textContent = cfg.objective || '';
    renderHud();

    post({ type: 'demo:ready', title: cfg.title || '' });
    try { window.__atomGame = game; } catch (e) {} // 调试/测试钩子（只读引用）
    return game;
  }

  function injectStyle(root) {
    if (document.getElementById('ac-style')) return;
    var s = document.createElement('style');
    s.id = 'ac-style';
    s.textContent =
      'html,body{margin:0;padding:0;background:' + PAPER + ';font-family:Kalam,cursive,sans-serif;overscroll-behavior:none;overflow:hidden}' +
      '.ac-wrap{display:flex;gap:12px;max-width:760px;margin:0 auto;padding:8px;box-sizing:border-box;user-select:none}' +
      '.ac-main{flex:1 1 auto;min-width:0}' +
      '.ac-side{flex:0 0 190px;display:flex;flex-direction:column;gap:8px}' +
      '@media (max-width:600px){.ac-wrap{flex-direction:column}.ac-side{flex:0 0 auto;order:-1;flex-direction:column}}' +
      '.ac-head{display:flex;justify-content:space-between;align-items:center}' +
      '.ac-title{font-size:20px;font-weight:700;color:' + INK + '}' +
      '.ac-obj{font-size:14px;color:#666;line-height:1.5}' +
      '.ac-stage{position:relative;border:2.5px solid ' + INK + ';border-radius:14px 4px 12px 6px;overflow:hidden;background:' + PAPER + '}' +
      '.ac-stage canvas{display:block;margin:0 auto;touch-action:none}' +
      '.ac-overlay{position:absolute;inset:0;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:rgba(250,247,239,.55)}' +
      '.ac-overlay-text{font-size:17px;color:' + INK + ';padding:8px 14px;text-align:center;line-height:1.5;background:rgba(255,218,106,.9);border:2px solid ' + INK + ';border-radius:10px 4px 10px 4px;max-width:86%}' +
      'button{font-family:inherit;font-size:16px;background:' + YELLOW + ';border:2.5px solid ' + INK + ';border-radius:10px 4px 10px 4px;padding:8px 22px;cursor:pointer;min-height:44px;min-width:88px}' +
      'button:active{transform:translate(1px,2px)}' +
      '.ac-hud{display:flex;gap:18px;justify-content:center;font-size:15px;padding:6px 0;color:' + INK + '}' +
      '.ac-hud b{color:#d97706}' +
      '.ac-params{display:flex;flex-direction:column;gap:4px}' +
      '.ac-param{display:flex;flex-direction:column;margin:4px 0}' +
      '.ac-param label{font-size:13px;color:#555;display:flex;justify-content:space-between}' +
      '.ac-param input[type=range]{width:100%;height:28px;accent-color:#d97706;cursor:pointer}' +
      '.ac-toggles{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;padding:2px 0}' +
      '.ac-toggle{display:flex;align-items:center;gap:6px;font-size:13px;color:#555;cursor:pointer;user-select:none}' +
      '.ac-toggle input{accent-color:#d97706;width:16px;height:16px;cursor:pointer}';
    document.head.appendChild(s);
  }

  window.AtomCore = { create: create, COLORS: { PAPER: PAPER, INK: INK, YELLOW: YELLOW, RED: RED, BLUE: BLUE, GREEN: GREEN }, L: L, T: T, lang: LANG };
})();

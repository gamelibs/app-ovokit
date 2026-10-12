/* AUTO-GENERATED SDK Instance Bundle
 * instanceId: site_gameslog
 * templateId: SiteAnalytics
 * generatedAt: 2026-10-12T02:32:34.188Z
 */
/* adapter: site */
/*
 * SiteAnalytics 站点适配器（no-op）。
 *
 * 站点类模板（platform='site'）无渠道方生命周期对接：SDK 由站点页面
 * 以 script 标签同源引入（src="/ovo-track.js"），采集端点部署在各站自身，
 * 不存在 GD/Poki 等渠道 SDK 的 init/广告回调适配需求。
 *
 * 本文件存在的唯一理由：SDK 中心实例审计（runInstanceAudit）要求模板声明
 * 适配器且适配器文件存在。构建时本文件会作为 adapter 段内联进实例产物，
 * 运行时无任何行为。
 *
 * 注意：本文件只允许出现本注释一个块注释——内联进产物时嵌套的块注释
 * 会提前闭合注释导致语法错误（2026-10-12 实证教训）。
 */


/* === entry === */
/* INSTANCE_CONFIG */
const __SDK_INSTANCE_CONFIG__ = {"id":"site_gameslog","templateId":"SiteAnalytics","platformId":"1021","adapter":"site","features":["page-tracking","session-tracking","game-start","custom-events"],"configBase":{"testing":"http://192.168.0.4:19527/api/sdk/instances/site_gameslog/dist/sdk.js","production":"http://192.168.0.4:19527/api/sdk/instances/site_gameslog/dist/sdk.min.js"},"gameConfigBase":{"beta":"http://192.168.0.4:19527/api/sdk/instances/site_gameslog/dist/sdk.js","release":"http://192.168.0.4:19527/api/sdk/instances/site_gameslog/dist/sdk.min.js"}};
try{window.__SDK_INSTANCE_CONFIG__=__SDK_INSTANCE_CONFIG__;}catch(_){}
/* MERGE_CONFIG: static (INSTANCE_CONFIG) + dynamic (__SDK_CONFIG__) */
try{window.__SDK_CONFIG__={...__SDK_INSTANCE_CONFIG__,...(window.__SDK_CONFIG__||{})};}catch(_){}
/*
 * ovo-track.js — OVO 站点访问统计 SDK（契约见 ovo_system docs/task-board/lanes/p2-site-analytics.md）
 * 纯 JS 零依赖，同源托管。引入：
 *   <script src="/ovo-track.js" defer data-ovo-site="gameslog"
 *          data-ovo-endpoint="/api/ovo-track/collect"
 *          data-ovo-game-regex="^/(?:[a-z]{2}/)?play/([a-z0-9-]+)"
 *          data-ovo-game-slug="fixed-slug"></script>
 * data-ovo-game-slug（可选，v1.1）：固定 gameSlug，优先于 regex 提取（demo 包等 path 无 slug 场景）。
 * 手动事件：OVOT.track('game_start', { gameSlug: 'xxx' }) / OVOT.gameStart('xxx')
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;
  var SITE = script.getAttribute('data-ovo-site') || '';
  var ENDPOINT = script.getAttribute('data-ovo-endpoint') || '';
  var GAME_RE_SRC = script.getAttribute('data-ovo-game-regex') || '';
  if (!SITE || !ENDPOINT) return;

  var GAME_RE = null;
  if (GAME_RE_SRC) {
    try { GAME_RE = new RegExp(GAME_RE_SRC); } catch (e) { GAME_RE = null; }
  }
  var GAME_SLUG_FIXED = script.getAttribute('data-ovo-game-slug') || null;
  if (GAME_SLUG_FIXED) GAME_SLUG_FIXED = GAME_SLUG_FIXED.slice(0, 80);

  var SESSION_MS = 30 * 60 * 1000;
  var LS_SID = 'ovo_sid';
  var LS_SID_TS = 'ovo_sid_ts';

  function newSid() {
    var s = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random());
    try {
      localStorage.setItem(LS_SID, s);
      localStorage.setItem(LS_SID_TS, String(Date.now()));
    } catch (e) {}
    return s;
  }

  function getSid() {
    var sid = null, ts = 0;
    try {
      sid = localStorage.getItem(LS_SID);
      ts = Number(localStorage.getItem(LS_SID_TS) || 0);
    } catch (e) {}
    if (!sid || Date.now() - ts > SESSION_MS) sid = newSid();
    else {
      try { localStorage.setItem(LS_SID_TS, String(Date.now())); } catch (e) {}
    }
    return sid;
  }

  function refHost() {
    var r = document.referrer || '';
    if (!r) return null;
    try { return new URL(r).hostname.slice(0, 100); } catch (e) { return null; }
  }

  function utmParams() {
    try {
      var u = new URLSearchParams(location.search);
      var out = {};
      ['source', 'medium', 'campaign'].forEach(function (k) {
        var v = u.get('utm_' + k);
        if (v) out[k] = String(v).slice(0, 100);
      });
      return Object.keys(out).length ? out : null;
    } catch (e) { return null; }
  }

  function gameSlugFromPath(path) {
    if (!GAME_RE) return null;
    var m = GAME_RE.exec(path);
    return m && m[1] ? m[1].slice(0, 80) : null;
  }

  var lastAutoKey = '';

  function send(event, props) {
    props = props || {};
    var path = String(props.path || (location.pathname || '/')).slice(0, 200);
    var payload = {
      site: SITE,
      sid: getSid(),
      event: String(event || 'page_view').slice(0, 40),
      path: path.charAt(0) === '/' ? path : '/' + path,
      gameSlug: props.gameSlug ? String(props.gameSlug).slice(0, 80) : (GAME_SLUG_FIXED || gameSlugFromPath(path)),
      ref: refHost(),
      utm: utmParams(),
      vp: String(window.innerWidth || 0) + 'x' + String(window.innerHeight || 0),
      ts: Date.now()
    };
    var body;
    try { body = JSON.stringify(payload); } catch (e) { return; }
    if (body.length > 2048) return;
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))) return;
    } catch (e) {}
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  function autoPageView() {
    var key = location.pathname + '|' + Math.floor(Date.now() / 2000);
    if (key === lastAutoKey) return;
    lastAutoKey = key;
    send('page_view');
  }

  window.OVOT = {
    track: send,
    gameStart: function (slug) { send('game_start', { gameSlug: slug }); }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') autoPageView();
  else document.addEventListener('DOMContentLoaded', autoPageView);

  try {
    var wrap = function (type) {
      var orig = history[type];
      if (typeof orig !== 'function') return;
      history[type] = function () {
        var ret = orig.apply(this, arguments);
        autoPageView();
        return ret;
      };
    };
    wrap('pushState');
    wrap('replaceState');
    window.addEventListener('popstate', autoPageView);
  } catch (e) {}
})();

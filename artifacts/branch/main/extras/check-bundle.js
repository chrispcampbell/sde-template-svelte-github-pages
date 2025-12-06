import * as worker_threads from "worker_threads";
import { EventEmitter } from "events";
import { cpus } from "os";
import * as path from "path";
import { fileURLToPath } from "url";
let __non_webpack_require__ = () => worker_threads;
const DefaultErrorSerializer = {
  deserialize(e) {
    return Object.assign(Error(e.message), {
      name: e.name,
      stack: e.stack
    });
  },
  serialize(e) {
    return {
      __error_marker: "$$error",
      message: e.message,
      name: e.name,
      stack: e.stack
    };
  }
}, isSerializedError = (e) => e && typeof e == "object" && "__error_marker" in e && e.__error_marker === "$$error", DefaultSerializer = {
  deserialize(e) {
    return isSerializedError(e) ? DefaultErrorSerializer.deserialize(e) : e;
  },
  serialize(e) {
    return e instanceof Error ? DefaultErrorSerializer.serialize(e) : e;
  }
};
let registeredSerializer = DefaultSerializer;
function deserialize(e) {
  return registeredSerializer.deserialize(e);
}
function serialize(e) {
  return registeredSerializer.serialize(e);
}
let bundleURL;
function getBundleURLCached() {
  return bundleURL || (bundleURL = getBundleURL()), bundleURL;
}
function getBundleURL() {
  try {
    throw new Error();
  } catch (e) {
    const t = ("" + e.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);
    if (t)
      return getBaseURL(t[0]);
  }
  return "/";
}
function getBaseURL(e) {
  return ("" + e).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)?\/[^/]+(?:\?.*)?$/, "$1") + "/";
}
const defaultPoolSize$1 = typeof navigator < "u" && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4, isAbsoluteURL = (e) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e);
function createSourceBlobURL(e) {
  const t = new Blob([e], { type: "application/javascript" });
  return URL.createObjectURL(t);
}
function selectWorkerImplementation$1() {
  if (typeof Worker > "u")
    return class {
      constructor() {
        throw Error("No web worker implementation available. You might have tried to spawn a worker within a worker in a browser that doesn't support workers in workers.");
      }
    };
  class e extends Worker {
    constructor(n, i) {
      var s, o;
      typeof n == "string" && i && i._baseURL ? n = new URL(n, i._baseURL) : typeof n == "string" && !isAbsoluteURL(n) && getBundleURLCached().match(/^file:\/\//i) && (n = new URL(n, getBundleURLCached().replace(/\/[^\/]+$/, "/")), (!((s = i?.CORSWorkaround) !== null && s !== void 0) || s) && (n = createSourceBlobURL(`importScripts(${JSON.stringify(n)});`))), typeof n == "string" && isAbsoluteURL(n) && (!((o = i?.CORSWorkaround) !== null && o !== void 0) || o) && (n = createSourceBlobURL(`importScripts(${JSON.stringify(n)});`)), super(n, i);
    }
  }
  class t extends e {
    constructor(n, i) {
      const s = window.URL.createObjectURL(n);
      super(s, i);
    }
    static fromText(n, i) {
      const s = new window.Blob([n], { type: "text/javascript" });
      return new t(s, i);
    }
  }
  return {
    blob: t,
    default: e
  };
}
let implementation$3;
function getWorkerImplementation$2() {
  return implementation$3 || (implementation$3 = selectWorkerImplementation$1()), implementation$3;
}
function isWorkerRuntime$4() {
  const e = typeof self < "u" && typeof Window < "u" && self instanceof Window;
  return !!(typeof self < "u" && self.postMessage && !e);
}
const BrowserImplementation = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  defaultPoolSize: defaultPoolSize$1,
  getWorkerImplementation: getWorkerImplementation$2,
  isWorkerRuntime: isWorkerRuntime$4
}, Symbol.toStringTag, { value: "Module" })), getCallsites = {};
let tsNodeAvailable;
const defaultPoolSize = cpus().length;
function detectTsNode() {
  if (typeof __non_webpack_require__ == "function")
    return !1;
  if (tsNodeAvailable)
    return tsNodeAvailable;
  try {
    eval("require").resolve("ts-node"), tsNodeAvailable = !0;
  } catch (e) {
    if (e && e.code === "MODULE_NOT_FOUND")
      tsNodeAvailable = !1;
    else
      throw e;
  }
  return tsNodeAvailable;
}
function createTsNodeModule(e) {
  return `
    require("ts-node/register/transpile-only");
    require(${JSON.stringify(e)});
  `;
}
function rebaseScriptPath(e, t) {
  const r = getCallsites().find((o) => {
    const a = o.getFileName();
    return !!(a && !a.match(t) && !a.match(/[\/\\]master[\/\\]implementation/) && !a.match(/^internal\/process/));
  }), n = r ? r.getFileName() : null;
  let i = n || null;
  return i && i.startsWith("file:") && (i = fileURLToPath(i)), i ? path.join(path.dirname(i), e) : e;
}
function resolveScriptPath(scriptPath, baseURL) {
  const makeRelative = (filePath) => path.isAbsolute(filePath) ? filePath : path.join(baseURL || eval("__dirname"), filePath), workerFilePath = typeof __non_webpack_require__ == "function" ? __non_webpack_require__.resolve(makeRelative(scriptPath)) : eval("require").resolve(makeRelative(rebaseScriptPath(scriptPath, /[\/\\]worker_threads[\/\\]/)));
  return workerFilePath;
}
function initWorkerThreadsWorker() {
  const NativeWorker = typeof __non_webpack_require__ == "function" ? __non_webpack_require__("worker_threads").Worker : eval("require")("worker_threads").Worker;
  let allWorkers = [];
  class Worker extends NativeWorker {
    constructor(t, r) {
      const n = r && r.fromSource ? null : resolveScriptPath(t, (r || {})._baseURL);
      if (n)
        n.match(/\.tsx?$/i) && detectTsNode() ? super(createTsNodeModule(n), Object.assign(Object.assign({}, r), { eval: !0 })) : n.match(/\.asar[\/\\]/) ? super(n.replace(/\.asar([\/\\])/, ".asar.unpacked$1"), r) : super(n, r);
      else {
        const i = t;
        super(i, Object.assign(Object.assign({}, r), { eval: !0 }));
      }
      this.mappedEventListeners = /* @__PURE__ */ new WeakMap(), allWorkers.push(this);
    }
    addEventListener(t, r) {
      const n = (i) => {
        r({ data: i });
      };
      this.mappedEventListeners.set(r, n), this.on(t, n);
    }
    removeEventListener(t, r) {
      const n = this.mappedEventListeners.get(r) || r;
      this.off(t, n);
    }
  }
  const terminateWorkersAndMaster = () => {
    Promise.all(allWorkers.map((e) => e.terminate())).then(() => process.exit(0), () => process.exit(1)), allWorkers = [];
  };
  process.on("SIGINT", () => terminateWorkersAndMaster()), process.on("SIGTERM", () => terminateWorkersAndMaster());
  class BlobWorker extends Worker {
    constructor(t, r) {
      super(Buffer.from(t).toString("utf-8"), Object.assign(Object.assign({}, r), { fromSource: !0 }));
    }
    static fromText(t, r) {
      return new Worker(t, Object.assign(Object.assign({}, r), { fromSource: !0 }));
    }
  }
  return {
    blob: BlobWorker,
    default: Worker
  };
}
function initTinyWorker() {
  const e = require("tiny-worker");
  let t = [];
  class r extends e {
    constructor(o, a) {
      const u = a && a.fromSource ? null : process.platform === "win32" ? `file:///${resolveScriptPath(o).replace(/\\/g, "/")}` : resolveScriptPath(o);
      if (u)
        u.match(/\.tsx?$/i) && detectTsNode() ? super(new Function(createTsNodeModule(resolveScriptPath(o))), [], { esm: !0 }) : u.match(/\.asar[\/\\]/) ? super(u.replace(/\.asar([\/\\])/, ".asar.unpacked$1"), [], { esm: !0 }) : super(u, [], { esm: !0 });
      else {
        const l = o;
        super(new Function(l), [], { esm: !0 });
      }
      t.push(this), this.emitter = new EventEmitter(), this.onerror = (l) => this.emitter.emit("error", l), this.onmessage = (l) => this.emitter.emit("message", l);
    }
    addEventListener(o, a) {
      this.emitter.addListener(o, a);
    }
    removeEventListener(o, a) {
      this.emitter.removeListener(o, a);
    }
    terminate() {
      return t = t.filter((o) => o !== this), super.terminate();
    }
  }
  const n = () => {
    Promise.all(t.map((s) => s.terminate())).then(() => process.exit(0), () => process.exit(1)), t = [];
  };
  process.on("SIGINT", () => n()), process.on("SIGTERM", () => n());
  class i extends r {
    constructor(o, a) {
      super(Buffer.from(o).toString("utf-8"), Object.assign(Object.assign({}, a), { fromSource: !0 }));
    }
    static fromText(o, a) {
      return new r(o, Object.assign(Object.assign({}, a), { fromSource: !0 }));
    }
  }
  return {
    blob: i,
    default: r
  };
}
let implementation$2, isTinyWorker;
function selectWorkerImplementation() {
  try {
    return isTinyWorker = !1, initWorkerThreadsWorker();
  } catch {
    return console.debug("Node worker_threads not available. Trying to fall back to tiny-worker polyfill..."), isTinyWorker = !0, initTinyWorker();
  }
}
function getWorkerImplementation$1() {
  return implementation$2 || (implementation$2 = selectWorkerImplementation()), implementation$2;
}
function isWorkerRuntime$3() {
  if (isTinyWorker)
    return !!(typeof self < "u" && self.postMessage);
  {
    const isMainThread = typeof __non_webpack_require__ == "function" ? __non_webpack_require__("worker_threads").isMainThread : eval("require")("worker_threads").isMainThread;
    return !isMainThread;
  }
}
const NodeImplementation = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  defaultPoolSize,
  getWorkerImplementation: getWorkerImplementation$1,
  isWorkerRuntime: isWorkerRuntime$3
}, Symbol.toStringTag, { value: "Module" })), runningInNode$1 = typeof process < "u" && process.arch !== "browser" && "pid" in process, implementation$1 = runningInNode$1 ? NodeImplementation : BrowserImplementation, getWorkerImplementation = implementation$1.getWorkerImplementation;
function getDefaultExportFromCjs(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var browser = { exports: {} }, ms, hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var e = 1e3, t = e * 60, r = t * 60, n = r * 24, i = n * 7, s = n * 365.25;
  ms = function(d, y) {
    y = y || {};
    var m = typeof d;
    if (m === "string" && d.length > 0)
      return o(d);
    if (m === "number" && isFinite(d))
      return y.long ? u(d) : a(d);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(d)
    );
  };
  function o(d) {
    if (d = String(d), !(d.length > 100)) {
      var y = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        d
      );
      if (y) {
        var m = parseFloat(y[1]), _ = (y[2] || "ms").toLowerCase();
        switch (_) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return m * s;
          case "weeks":
          case "week":
          case "w":
            return m * i;
          case "days":
          case "day":
          case "d":
            return m * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return m * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return m * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return m * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return m;
          default:
            return;
        }
      }
    }
  }
  function a(d) {
    var y = Math.abs(d);
    return y >= n ? Math.round(d / n) + "d" : y >= r ? Math.round(d / r) + "h" : y >= t ? Math.round(d / t) + "m" : y >= e ? Math.round(d / e) + "s" : d + "ms";
  }
  function u(d) {
    var y = Math.abs(d);
    return y >= n ? l(d, y, n, "day") : y >= r ? l(d, y, r, "hour") : y >= t ? l(d, y, t, "minute") : y >= e ? l(d, y, e, "second") : d + " ms";
  }
  function l(d, y, m, _) {
    var b = y >= m * 1.5;
    return Math.round(d / m) + " " + _ + (b ? "s" : "");
  }
  return ms;
}
var common, hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function e(t) {
    n.debug = n, n.default = n, n.coerce = l, n.disable = a, n.enable = s, n.enabled = u, n.humanize = requireMs(), n.destroy = d, Object.keys(t).forEach((y) => {
      n[y] = t[y];
    }), n.names = [], n.skips = [], n.formatters = {};
    function r(y) {
      let m = 0;
      for (let _ = 0; _ < y.length; _++)
        m = (m << 5) - m + y.charCodeAt(_), m |= 0;
      return n.colors[Math.abs(m) % n.colors.length];
    }
    n.selectColor = r;
    function n(y) {
      let m, _ = null, b, w;
      function f(...g) {
        if (!f.enabled)
          return;
        const c = f, h = Number(/* @__PURE__ */ new Date()), S = h - (m || h);
        c.diff = S, c.prev = m, c.curr = h, m = h, g[0] = n.coerce(g[0]), typeof g[0] != "string" && g.unshift("%O");
        let p = 0;
        g[0] = g[0].replace(/%([a-zA-Z%])/g, ($, O) => {
          if ($ === "%%")
            return "%";
          p++;
          const C = n.formatters[O];
          if (typeof C == "function") {
            const j = g[p];
            $ = C.call(c, j), g.splice(p, 1), p--;
          }
          return $;
        }), n.formatArgs.call(c, g), (c.log || n.log).apply(c, g);
      }
      return f.namespace = y, f.useColors = n.useColors(), f.color = n.selectColor(y), f.extend = i, f.destroy = n.destroy, Object.defineProperty(f, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => _ !== null ? _ : (b !== n.namespaces && (b = n.namespaces, w = n.enabled(y)), w),
        set: (g) => {
          _ = g;
        }
      }), typeof n.init == "function" && n.init(f), f;
    }
    function i(y, m) {
      const _ = n(this.namespace + (typeof m > "u" ? ":" : m) + y);
      return _.log = this.log, _;
    }
    function s(y) {
      n.save(y), n.namespaces = y, n.names = [], n.skips = [];
      const m = (typeof y == "string" ? y : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const _ of m)
        _[0] === "-" ? n.skips.push(_.slice(1)) : n.names.push(_);
    }
    function o(y, m) {
      let _ = 0, b = 0, w = -1, f = 0;
      for (; _ < y.length; )
        if (b < m.length && (m[b] === y[_] || m[b] === "*"))
          m[b] === "*" ? (w = b, f = _, b++) : (_++, b++);
        else if (w !== -1)
          b = w + 1, f++, _ = f;
        else
          return !1;
      for (; b < m.length && m[b] === "*"; )
        b++;
      return b === m.length;
    }
    function a() {
      const y = [
        ...n.names,
        ...n.skips.map((m) => "-" + m)
      ].join(",");
      return n.enable(""), y;
    }
    function u(y) {
      for (const m of n.skips)
        if (o(y, m))
          return !1;
      for (const m of n.names)
        if (o(y, m))
          return !0;
      return !1;
    }
    function l(y) {
      return y instanceof Error ? y.stack || y.message : y;
    }
    function d() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return n.enable(n.load()), n;
  }
  return common = e, common;
}
var hasRequiredBrowser;
function requireBrowser() {
  return hasRequiredBrowser || (hasRequiredBrowser = 1, (function(e, t) {
    t.formatArgs = n, t.save = i, t.load = s, t.useColors = r, t.storage = o(), t.destroy = /* @__PURE__ */ (() => {
      let u = !1;
      return () => {
        u || (u = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), t.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function r() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let u;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (u = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(u[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function n(u) {
      if (u[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + u[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const l = "color: " + this.color;
      u.splice(1, 0, l, "color: inherit");
      let d = 0, y = 0;
      u[0].replace(/%[a-zA-Z%]/g, (m) => {
        m !== "%%" && (d++, m === "%c" && (y = d));
      }), u.splice(y, 0, l);
    }
    t.log = console.debug || console.log || (() => {
    });
    function i(u) {
      try {
        u ? t.storage.setItem("debug", u) : t.storage.removeItem("debug");
      } catch {
      }
    }
    function s() {
      let u;
      try {
        u = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !u && typeof process < "u" && "env" in process && (u = process.env.DEBUG), u;
    }
    function o() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = requireCommon()(t);
    const { formatters: a } = e.exports;
    a.j = function(u) {
      try {
        return JSON.stringify(u);
      } catch (l) {
        return "[UnexpectedJSONParseError]: " + l.message;
      }
    };
  })(browser, browser.exports)), browser.exports;
}
var browserExports = requireBrowser();
const DebugLogger = /* @__PURE__ */ getDefaultExportFromCjs(browserExports), hasSymbols = () => typeof Symbol == "function", hasSymbol = (e) => hasSymbols() && !!Symbol[e], getSymbol = (e) => hasSymbol(e) ? Symbol[e] : "@@" + e;
hasSymbol("asyncIterator") || (Symbol.asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator"));
const SymbolIterator = getSymbol("iterator"), SymbolObservable = getSymbol("observable"), SymbolSpecies = getSymbol("species");
function getMethod(e, t) {
  const r = e[t];
  if (r != null) {
    if (typeof r != "function")
      throw new TypeError(r + " is not a function");
    return r;
  }
}
function getSpecies(e) {
  let t = e.constructor;
  return t !== void 0 && (t = t[SymbolSpecies], t === null && (t = void 0)), t !== void 0 ? t : Observable;
}
function isObservable(e) {
  return e instanceof Observable;
}
function hostReportError(e) {
  hostReportError.log ? hostReportError.log(e) : setTimeout(() => {
    throw e;
  }, 0);
}
function enqueue(e) {
  Promise.resolve().then(() => {
    try {
      e();
    } catch (t) {
      hostReportError(t);
    }
  });
}
function cleanupSubscription(e) {
  const t = e._cleanup;
  if (t !== void 0 && (e._cleanup = void 0, !!t))
    try {
      if (typeof t == "function")
        t();
      else {
        const r = getMethod(t, "unsubscribe");
        r && r.call(t);
      }
    } catch (r) {
      hostReportError(r);
    }
}
function closeSubscription(e) {
  e._observer = void 0, e._queue = void 0, e._state = "closed";
}
function flushSubscription(e) {
  const t = e._queue;
  if (t) {
    e._queue = void 0, e._state = "ready";
    for (const r of t)
      if (notifySubscription(e, r.type, r.value), e._state === "closed")
        break;
  }
}
function notifySubscription(e, t, r) {
  e._state = "running";
  const n = e._observer;
  try {
    const i = n ? getMethod(n, t) : void 0;
    switch (t) {
      case "next":
        i && i.call(n, r);
        break;
      case "error":
        if (closeSubscription(e), i)
          i.call(n, r);
        else
          throw r;
        break;
      case "complete":
        closeSubscription(e), i && i.call(n);
        break;
    }
  } catch (i) {
    hostReportError(i);
  }
  e._state === "closed" ? cleanupSubscription(e) : e._state === "running" && (e._state = "ready");
}
function onNotify(e, t, r) {
  if (e._state !== "closed") {
    if (e._state === "buffering") {
      e._queue = e._queue || [], e._queue.push({ type: t, value: r });
      return;
    }
    if (e._state !== "ready") {
      e._state = "buffering", e._queue = [{ type: t, value: r }], enqueue(() => flushSubscription(e));
      return;
    }
    notifySubscription(e, t, r);
  }
}
class Subscription {
  constructor(t, r) {
    this._cleanup = void 0, this._observer = t, this._queue = void 0, this._state = "initializing";
    const n = new SubscriptionObserver(this);
    try {
      this._cleanup = r.call(void 0, n);
    } catch (i) {
      n.error(i);
    }
    this._state === "initializing" && (this._state = "ready");
  }
  get closed() {
    return this._state === "closed";
  }
  unsubscribe() {
    this._state !== "closed" && (closeSubscription(this), cleanupSubscription(this));
  }
}
class SubscriptionObserver {
  constructor(t) {
    this._subscription = t;
  }
  get closed() {
    return this._subscription._state === "closed";
  }
  next(t) {
    onNotify(this._subscription, "next", t);
  }
  error(t) {
    onNotify(this._subscription, "error", t);
  }
  complete() {
    onNotify(this._subscription, "complete");
  }
}
class Observable {
  constructor(t) {
    if (!(this instanceof Observable))
      throw new TypeError("Observable cannot be called as a function");
    if (typeof t != "function")
      throw new TypeError("Observable initializer must be a function");
    this._subscriber = t;
  }
  subscribe(t, r, n) {
    return (typeof t != "object" || t === null) && (t = {
      next: t,
      error: r,
      complete: n
    }), new Subscription(t, this._subscriber);
  }
  pipe(t, ...r) {
    let n = this;
    for (const i of [t, ...r])
      n = i(n);
    return n;
  }
  tap(t, r, n) {
    const i = typeof t != "object" || t === null ? {
      next: t,
      error: r,
      complete: n
    } : t;
    return new Observable((s) => this.subscribe({
      next(o) {
        i.next && i.next(o), s.next(o);
      },
      error(o) {
        i.error && i.error(o), s.error(o);
      },
      complete() {
        i.complete && i.complete(), s.complete();
      },
      start(o) {
        i.start && i.start(o);
      }
    }));
  }
  forEach(t) {
    return new Promise((r, n) => {
      if (typeof t != "function") {
        n(new TypeError(t + " is not a function"));
        return;
      }
      function i() {
        s.unsubscribe(), r(void 0);
      }
      const s = this.subscribe({
        next(o) {
          try {
            t(o, i);
          } catch (a) {
            n(a), s.unsubscribe();
          }
        },
        error(o) {
          n(o);
        },
        complete() {
          r(void 0);
        }
      });
    });
  }
  map(t) {
    if (typeof t != "function")
      throw new TypeError(t + " is not a function");
    const r = getSpecies(this);
    return new r((n) => this.subscribe({
      next(i) {
        let s = i;
        try {
          s = t(i);
        } catch (o) {
          return n.error(o);
        }
        n.next(s);
      },
      error(i) {
        n.error(i);
      },
      complete() {
        n.complete();
      }
    }));
  }
  filter(t) {
    if (typeof t != "function")
      throw new TypeError(t + " is not a function");
    const r = getSpecies(this);
    return new r((n) => this.subscribe({
      next(i) {
        try {
          if (!t(i))
            return;
        } catch (s) {
          return n.error(s);
        }
        n.next(i);
      },
      error(i) {
        n.error(i);
      },
      complete() {
        n.complete();
      }
    }));
  }
  reduce(t, r) {
    if (typeof t != "function")
      throw new TypeError(t + " is not a function");
    const n = getSpecies(this), i = arguments.length > 1;
    let s = !1, o = r;
    return new n((a) => this.subscribe({
      next(u) {
        const l = !s;
        if (s = !0, !l || i)
          try {
            o = t(o, u);
          } catch (d) {
            return a.error(d);
          }
        else
          o = u;
      },
      error(u) {
        a.error(u);
      },
      complete() {
        if (!s && !i)
          return a.error(new TypeError("Cannot reduce an empty sequence"));
        a.next(o), a.complete();
      }
    }));
  }
  concat(...t) {
    const r = getSpecies(this);
    return new r((n) => {
      let i, s = 0;
      function o(a) {
        i = a.subscribe({
          next(u) {
            n.next(u);
          },
          error(u) {
            n.error(u);
          },
          complete() {
            s === t.length ? (i = void 0, n.complete()) : o(r.from(t[s++]));
          }
        });
      }
      return o(this), () => {
        i && (i.unsubscribe(), i = void 0);
      };
    });
  }
  flatMap(t) {
    if (typeof t != "function")
      throw new TypeError(t + " is not a function");
    const r = getSpecies(this);
    return new r((n) => {
      const i = [], s = this.subscribe({
        next(a) {
          let u;
          if (t)
            try {
              u = t(a);
            } catch (d) {
              return n.error(d);
            }
          else
            u = a;
          const l = r.from(u).subscribe({
            next(d) {
              n.next(d);
            },
            error(d) {
              n.error(d);
            },
            complete() {
              const d = i.indexOf(l);
              d >= 0 && i.splice(d, 1), o();
            }
          });
          i.push(l);
        },
        error(a) {
          n.error(a);
        },
        complete() {
          o();
        }
      });
      function o() {
        s.closed && i.length === 0 && n.complete();
      }
      return () => {
        i.forEach((a) => a.unsubscribe()), s.unsubscribe();
      };
    });
  }
  [SymbolObservable]() {
    return this;
  }
  static from(t) {
    const r = typeof this == "function" ? this : Observable;
    if (t == null)
      throw new TypeError(t + " is not an object");
    const n = getMethod(t, SymbolObservable);
    if (n) {
      const i = n.call(t);
      if (Object(i) !== i)
        throw new TypeError(i + " is not an object");
      return isObservable(i) && i.constructor === r ? i : new r((s) => i.subscribe(s));
    }
    if (hasSymbol("iterator")) {
      const i = getMethod(t, SymbolIterator);
      if (i)
        return new r((s) => {
          enqueue(() => {
            if (!s.closed) {
              for (const o of i.call(t))
                if (s.next(o), s.closed)
                  return;
              s.complete();
            }
          });
        });
    }
    if (Array.isArray(t))
      return new r((i) => {
        enqueue(() => {
          if (!i.closed) {
            for (const s of t)
              if (i.next(s), i.closed)
                return;
            i.complete();
          }
        });
      });
    throw new TypeError(t + " is not observable");
  }
  static of(...t) {
    const r = typeof this == "function" ? this : Observable;
    return new r((n) => {
      enqueue(() => {
        if (!n.closed) {
          for (const i of t)
            if (n.next(i), n.closed)
              return;
          n.complete();
        }
      });
    });
  }
  static get [SymbolSpecies]() {
    return this;
  }
}
hasSymbols() && Object.defineProperty(Observable, Symbol("extensions"), {
  value: {
    symbol: SymbolObservable,
    hostReportError
  },
  configurable: !0
});
function unsubscribe(e) {
  typeof e == "function" ? e() : e && typeof e.unsubscribe == "function" && e.unsubscribe();
}
class MulticastSubject extends Observable {
  constructor() {
    super((t) => (this._observers.add(t), () => this._observers.delete(t))), this._observers = /* @__PURE__ */ new Set();
  }
  next(t) {
    for (const r of this._observers)
      r.next(t);
  }
  error(t) {
    for (const r of this._observers)
      r.error(t);
  }
  complete() {
    for (const t of this._observers)
      t.complete();
  }
}
function multicast(e) {
  const t = new MulticastSubject();
  let r, n = 0;
  return new Observable((i) => {
    r || (r = e.subscribe(t));
    const s = t.subscribe(i);
    return n++, () => {
      n--, s.unsubscribe(), n === 0 && (unsubscribe(r), r = void 0);
    };
  });
}
const $errors = Symbol("thread.errors"), $events = Symbol("thread.events"), $terminate = Symbol("thread.terminate"), $transferable = Symbol("thread.transferable"), $worker = Symbol("thread.worker");
function fail$1(e) {
  throw Error(e);
}
const Thread = {
  /** Return an observable that can be used to subscribe to all errors happening in the thread. */
  errors(e) {
    return e[$errors] || fail$1("Error observable not found. Make sure to pass a thread instance as returned by the spawn() promise.");
  },
  /** Return an observable that can be used to subscribe to internal events happening in the thread. Useful for debugging. */
  events(e) {
    return e[$events] || fail$1("Events observable not found. Make sure to pass a thread instance as returned by the spawn() promise.");
  },
  /** Terminate a thread. Remember to terminate every thread when you are done using it. */
  terminate(e) {
    return e[$terminate]();
  }
}, doNothing$1 = () => {
};
function createPromiseWithResolver() {
  let e = !1, t, r = doNothing$1;
  return [new Promise((s) => {
    e ? s(t) : r = s;
  }), (s) => {
    e = !0, t = s, r(t);
  }];
}
var WorkerEventType;
(function(e) {
  e.internalError = "internalError", e.message = "message", e.termination = "termination";
})(WorkerEventType || (WorkerEventType = {}));
const doNothing = () => {
}, returnInput = (e) => e, runDeferred = (e) => Promise.resolve().then(e);
function fail(e) {
  throw e;
}
function isThenable(e) {
  return e && typeof e.then == "function";
}
class ObservablePromise extends Observable {
  constructor(t) {
    super((r) => {
      const n = this, i = Object.assign(Object.assign({}, r), {
        complete() {
          r.complete(), n.onCompletion();
        },
        error(s) {
          r.error(s), n.onError(s);
        },
        next(s) {
          r.next(s), n.onNext(s);
        }
      });
      try {
        return this.initHasRun = !0, t(i);
      } catch (s) {
        i.error(s);
      }
    }), this.initHasRun = !1, this.fulfillmentCallbacks = [], this.rejectionCallbacks = [], this.firstValueSet = !1, this.state = "pending";
  }
  onNext(t) {
    this.firstValueSet || (this.firstValue = t, this.firstValueSet = !0);
  }
  onError(t) {
    this.state = "rejected", this.rejection = t;
    for (const r of this.rejectionCallbacks)
      runDeferred(() => r(t));
  }
  onCompletion() {
    this.state = "fulfilled";
    for (const t of this.fulfillmentCallbacks)
      runDeferred(() => t(this.firstValue));
  }
  then(t, r) {
    const n = t || returnInput, i = r || fail;
    let s = !1;
    return new Promise((o, a) => {
      const u = (d) => {
        if (!s) {
          s = !0;
          try {
            o(i(d));
          } catch (y) {
            a(y);
          }
        }
      }, l = (d) => {
        try {
          o(n(d));
        } catch (y) {
          u(y);
        }
      };
      if (this.initHasRun || this.subscribe({ error: u }), this.state === "fulfilled")
        return o(n(this.firstValue));
      if (this.state === "rejected")
        return s = !0, o(i(this.rejection));
      this.fulfillmentCallbacks.push(l), this.rejectionCallbacks.push(u);
    });
  }
  catch(t) {
    return this.then(void 0, t);
  }
  finally(t) {
    const r = t || doNothing;
    return this.then((n) => (r(), n), () => r());
  }
  static from(t) {
    return isThenable(t) ? new ObservablePromise((r) => {
      const n = (s) => {
        r.next(s), r.complete();
      }, i = (s) => {
        r.error(s);
      };
      t.then(n, i);
    }) : super.from(t);
  }
}
function isTransferable(e) {
  return !(!e || typeof e != "object");
}
function isTransferDescriptor(e) {
  return e && typeof e == "object" && e[$transferable];
}
function Transfer(e, t) {
  if (!t) {
    if (!isTransferable(e))
      throw Error();
    t = [e];
  }
  return {
    [$transferable]: !0,
    send: e,
    transferables: t
  };
}
var MasterMessageType;
(function(e) {
  e.cancel = "cancel", e.run = "run";
})(MasterMessageType || (MasterMessageType = {}));
var WorkerMessageType;
(function(e) {
  e.error = "error", e.init = "init", e.result = "result", e.running = "running", e.uncaughtError = "uncaughtError";
})(WorkerMessageType || (WorkerMessageType = {}));
const debugMessages$1 = DebugLogger("threads:master:messages");
let nextJobUID = 1;
const dedupe = (e) => Array.from(new Set(e)), isJobErrorMessage = (e) => e && e.type === WorkerMessageType.error, isJobResultMessage = (e) => e && e.type === WorkerMessageType.result, isJobStartMessage = (e) => e && e.type === WorkerMessageType.running;
function createObservableForJob(e, t) {
  return new Observable((r) => {
    let n;
    const i = ((s) => {
      if (debugMessages$1("Message from worker:", s.data), !(!s.data || s.data.uid !== t)) {
        if (isJobStartMessage(s.data))
          n = s.data.resultType;
        else if (isJobResultMessage(s.data))
          n === "promise" ? (typeof s.data.payload < "u" && r.next(deserialize(s.data.payload)), r.complete(), e.removeEventListener("message", i)) : (s.data.payload && r.next(deserialize(s.data.payload)), s.data.complete && (r.complete(), e.removeEventListener("message", i)));
        else if (isJobErrorMessage(s.data)) {
          const o = deserialize(s.data.error);
          r.error(o), e.removeEventListener("message", i);
        }
      }
    });
    return e.addEventListener("message", i), () => {
      if (n === "observable" || !n) {
        const s = {
          type: MasterMessageType.cancel,
          uid: t
        };
        e.postMessage(s);
      }
      e.removeEventListener("message", i);
    };
  });
}
function prepareArguments(e) {
  if (e.length === 0)
    return {
      args: [],
      transferables: []
    };
  const t = [], r = [];
  for (const n of e)
    isTransferDescriptor(n) ? (t.push(serialize(n.send)), r.push(...n.transferables)) : t.push(serialize(n));
  return {
    args: t,
    transferables: r.length === 0 ? r : dedupe(r)
  };
}
function createProxyFunction(e, t) {
  return ((...r) => {
    const n = nextJobUID++, { args: i, transferables: s } = prepareArguments(r), o = {
      type: MasterMessageType.run,
      uid: n,
      method: t,
      args: i
    };
    debugMessages$1("Sending command to run function to worker:", o);
    try {
      e.postMessage(o, s);
    } catch (a) {
      return ObservablePromise.from(Promise.reject(a));
    }
    return ObservablePromise.from(multicast(createObservableForJob(e, n)));
  });
}
function createProxyModule(e, t) {
  const r = {};
  for (const n of t)
    r[n] = createProxyFunction(e, n);
  return r;
}
var __awaiter$2 = function(e, t, r, n) {
  function i(s) {
    return s instanceof r ? s : new r(function(o) {
      o(s);
    });
  }
  return new (r || (r = Promise))(function(s, o) {
    function a(d) {
      try {
        l(n.next(d));
      } catch (y) {
        o(y);
      }
    }
    function u(d) {
      try {
        l(n.throw(d));
      } catch (y) {
        o(y);
      }
    }
    function l(d) {
      d.done ? s(d.value) : i(d.value).then(a, u);
    }
    l((n = n.apply(e, t || [])).next());
  });
};
const debugMessages = DebugLogger("threads:master:messages"), debugSpawn = DebugLogger("threads:master:spawn"), debugThreadUtils = DebugLogger("threads:master:thread-utils"), isInitMessage = (e) => e && e.type === "init", isUncaughtErrorMessage = (e) => e && e.type === "uncaughtError", initMessageTimeout = typeof process < "u" && process.env.THREADS_WORKER_INIT_TIMEOUT ? Number.parseInt(process.env.THREADS_WORKER_INIT_TIMEOUT, 10) : 1e4;
function withTimeout(e, t, r) {
  return __awaiter$2(this, void 0, void 0, function* () {
    let n;
    const i = new Promise((o, a) => {
      n = setTimeout(() => a(Error(r)), t);
    }), s = yield Promise.race([
      e,
      i
    ]);
    return clearTimeout(n), s;
  });
}
function receiveInitMessage(e) {
  return new Promise((t, r) => {
    const n = ((i) => {
      debugMessages("Message from worker before finishing initialization:", i.data), isInitMessage(i.data) ? (e.removeEventListener("message", n), t(i.data)) : isUncaughtErrorMessage(i.data) && (e.removeEventListener("message", n), r(deserialize(i.data.error)));
    });
    e.addEventListener("message", n);
  });
}
function createEventObservable(e, t) {
  return new Observable((r) => {
    const n = ((s) => {
      const o = {
        type: WorkerEventType.message,
        data: s.data
      };
      r.next(o);
    }), i = ((s) => {
      debugThreadUtils("Unhandled promise rejection event in thread:", s);
      const o = {
        type: WorkerEventType.internalError,
        error: Error(s.reason)
      };
      r.next(o);
    });
    e.addEventListener("message", n), e.addEventListener("unhandledrejection", i), t.then(() => {
      const s = {
        type: WorkerEventType.termination
      };
      e.removeEventListener("message", n), e.removeEventListener("unhandledrejection", i), r.next(s), r.complete();
    });
  });
}
function createTerminator(e) {
  const [t, r] = createPromiseWithResolver();
  return { terminate: () => __awaiter$2(this, void 0, void 0, function* () {
    debugThreadUtils("Terminating worker"), yield e.terminate(), r();
  }), termination: t };
}
function setPrivateThreadProps(e, t, r, n) {
  const i = r.filter((s) => s.type === WorkerEventType.internalError).map((s) => s.error);
  return Object.assign(e, {
    [$errors]: i,
    [$events]: r,
    [$terminate]: n,
    [$worker]: t
  });
}
function spawn(e, t) {
  return __awaiter$2(this, void 0, void 0, function* () {
    debugSpawn("Initializing new thread");
    const r = initMessageTimeout, i = (yield withTimeout(receiveInitMessage(e), r, `Timeout: Did not receive an init message from worker after ${r}ms. Make sure the worker calls expose().`)).exposed, { termination: s, terminate: o } = createTerminator(e), a = createEventObservable(e, s);
    if (i.type === "function") {
      const u = createProxyFunction(e);
      return setPrivateThreadProps(u, e, a, o);
    } else if (i.type === "module") {
      const u = createProxyModule(e, i.methods);
      return setPrivateThreadProps(u, e, a, o);
    } else {
      const u = i.type;
      throw Error(`Worker init message states unexpected type of expose(): ${u}`);
    }
  });
}
const BlobWorker = getWorkerImplementation().blob, Worker$1 = getWorkerImplementation().default, isWorkerRuntime$2 = function e() {
  const t = typeof self < "u" && typeof Window < "u" && self instanceof Window;
  return !!(typeof self < "u" && self.postMessage && !t);
}, postMessageToMaster$2 = function e(t, r) {
  self.postMessage(t, r);
}, subscribeToMasterMessages$2 = function e(t) {
  const r = (i) => {
    t(i.data);
  }, n = () => {
    self.removeEventListener("message", r);
  };
  return self.addEventListener("message", r), n;
}, WebWorkerImplementation = {
  isWorkerRuntime: isWorkerRuntime$2,
  postMessageToMaster: postMessageToMaster$2,
  subscribeToMasterMessages: subscribeToMasterMessages$2
};
typeof self > "u" && (global.self = global);
const isWorkerRuntime$1 = function e() {
  return !!(typeof self < "u" && self.postMessage);
}, postMessageToMaster$1 = function e(t) {
  self.postMessage(t);
};
let muxingHandlerSetUp = !1;
const messageHandlers = /* @__PURE__ */ new Set(), subscribeToMasterMessages$1 = function e(t) {
  return muxingHandlerSetUp || (self.addEventListener("message", ((n) => {
    messageHandlers.forEach((i) => i(n.data));
  })), muxingHandlerSetUp = !0), messageHandlers.add(t), () => messageHandlers.delete(t);
}, TinyWorkerImplementation = {
  isWorkerRuntime: isWorkerRuntime$1,
  postMessageToMaster: postMessageToMaster$1,
  subscribeToMasterMessages: subscribeToMasterMessages$1
};
let implementation;
function selectImplementation() {
  return typeof __non_webpack_require__ == "function" ? __non_webpack_require__("worker_threads") : eval("require")("worker_threads");
}
function getImplementation() {
  return implementation || (implementation = selectImplementation()), implementation;
}
function assertMessagePort(e) {
  if (!e)
    throw Error("Invariant violation: MessagePort to parent is not available.");
  return e;
}
const isWorkerRuntime = function e() {
  return !getImplementation().isMainThread;
}, postMessageToMaster = function e(t, r) {
  assertMessagePort(getImplementation().parentPort).postMessage(t, r);
}, subscribeToMasterMessages = function e(t) {
  const r = getImplementation().parentPort;
  if (!r)
    throw Error("Invariant violation: MessagePort to parent is not available.");
  const n = (s) => {
    t(s);
  }, i = () => {
    assertMessagePort(r).off("message", n);
  };
  return assertMessagePort(r).on("message", n), i;
};
function testImplementation() {
  getImplementation();
}
const WorkerThreadsImplementation = {
  isWorkerRuntime,
  postMessageToMaster,
  subscribeToMasterMessages,
  testImplementation
}, runningInNode = typeof process < "u" && process.arch !== "browser" && "pid" in process;
function selectNodeImplementation() {
  try {
    return WorkerThreadsImplementation.testImplementation(), WorkerThreadsImplementation;
  } catch {
    return TinyWorkerImplementation;
  }
}
const Implementation = runningInNode ? selectNodeImplementation() : WebWorkerImplementation;
Implementation.isWorkerRuntime;
function postUncaughtErrorMessage(e) {
  try {
    const t = {
      type: WorkerMessageType.uncaughtError,
      error: serialize(e)
    };
    Implementation.postMessageToMaster(t);
  } catch (t) {
    console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.
Latest error:`, t, `
Original error:`, e);
  }
}
typeof self < "u" && typeof self.addEventListener == "function" && Implementation.isWorkerRuntime() && (self.addEventListener("error", (e) => {
  setTimeout(() => postUncaughtErrorMessage(e.error || e), 250);
}), self.addEventListener("unhandledrejection", (e) => {
  const t = e.reason;
  t && typeof t.message == "string" && setTimeout(() => postUncaughtErrorMessage(t), 250);
}));
typeof process < "u" && typeof process.on == "function" && Implementation.isWorkerRuntime() && (process.on("uncaughtException", (e) => {
  setTimeout(() => postUncaughtErrorMessage(e), 250);
}), process.on("unhandledRejection", (e) => {
  e && typeof e.message == "string" && setTimeout(() => postUncaughtErrorMessage(e), 250);
}));
var ok$1 = function(e) {
  return new Ok$1(e);
}, err$1 = function(e) {
  return new Err$1(e);
}, Ok$1 = (
  /** @class */
  (function() {
    function e(t) {
      var r = this;
      this.value = t, this.match = function(n, i) {
        return n(r.value);
      };
    }
    return e.prototype.isOk = function() {
      return !0;
    }, e.prototype.isErr = function() {
      return !this.isOk();
    }, e.prototype.map = function(t) {
      return ok$1(t(this.value));
    }, e.prototype.mapErr = function(t) {
      return ok$1(this.value);
    }, e.prototype.andThen = function(t) {
      return t(this.value);
    }, e.prototype.asyncAndThen = function(t) {
      return t(this.value);
    }, e.prototype.asyncMap = function(t) {
      return ResultAsync$1.fromPromise(t(this.value));
    }, e.prototype.unwrapOr = function(t) {
      return this.value;
    }, e.prototype._unsafeUnwrap = function() {
      return this.value;
    }, e.prototype._unsafeUnwrapErr = function() {
      throw new Error("Called `_unsafeUnwrapErr` on an Ok");
    }, e;
  })()
), Err$1 = (
  /** @class */
  (function() {
    function e(t) {
      var r = this;
      this.error = t, this.match = function(n, i) {
        return i(r.error);
      };
    }
    return e.prototype.isOk = function() {
      return !1;
    }, e.prototype.isErr = function() {
      return !this.isOk();
    }, e.prototype.map = function(t) {
      return err$1(this.error);
    }, e.prototype.mapErr = function(t) {
      return err$1(t(this.error));
    }, e.prototype.andThen = function(t) {
      return err$1(this.error);
    }, e.prototype.asyncAndThen = function(t) {
      return errAsync$1(this.error);
    }, e.prototype.asyncMap = function(t) {
      return errAsync$1(this.error);
    }, e.prototype.unwrapOr = function(t) {
      return t;
    }, e.prototype._unsafeUnwrap = function() {
      throw new Error("Called `_unsafeUnwrap` on an Err");
    }, e.prototype._unsafeUnwrapErr = function() {
      return this.error;
    }, e;
  })()
);
function __awaiter$1(e, t, r, n) {
  function i(s) {
    return s instanceof r ? s : new r(function(o) {
      o(s);
    });
  }
  return new (r || (r = Promise))(function(s, o) {
    function a(d) {
      try {
        l(n.next(d));
      } catch (y) {
        o(y);
      }
    }
    function u(d) {
      try {
        l(n.throw(d));
      } catch (y) {
        o(y);
      }
    }
    function l(d) {
      d.done ? s(d.value) : i(d.value).then(a, u);
    }
    l((n = n.apply(e, [])).next());
  });
}
function __generator$1(e, t) {
  var r = { label: 0, sent: function() {
    if (s[0] & 1) throw s[1];
    return s[1];
  }, trys: [], ops: [] }, n, i, s, o;
  return o = { next: a(0), throw: a(1), return: a(2) }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
    return this;
  }), o;
  function a(l) {
    return function(d) {
      return u([l, d]);
    };
  }
  function u(l) {
    if (n) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (n = 1, i && (s = l[0] & 2 ? i.return : l[0] ? i.throw || ((s = i.return) && s.call(i), 0) : i.next) && !(s = s.call(i, l[1])).done) return s;
      switch (i = 0, s && (l = [l[0] & 2, s.value]), l[0]) {
        case 0:
        case 1:
          s = l;
          break;
        case 4:
          return r.label++, { value: l[1], done: !1 };
        case 5:
          r.label++, i = l[1], l = [0];
          continue;
        case 7:
          l = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (s = r.trys, !(s = s.length > 0 && s[s.length - 1]) && (l[0] === 6 || l[0] === 2)) {
            r = 0;
            continue;
          }
          if (l[0] === 3 && (!s || l[1] > s[0] && l[1] < s[3])) {
            r.label = l[1];
            break;
          }
          if (l[0] === 6 && r.label < s[1]) {
            r.label = s[1], s = l;
            break;
          }
          if (s && r.label < s[2]) {
            r.label = s[2], r.ops.push(l);
            break;
          }
          s[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      l = t.call(e, r);
    } catch (d) {
      l = [6, d], i = 0;
    } finally {
      n = s = 0;
    }
    if (l[0] & 5) throw l[1];
    return { value: l[0] ? l[1] : void 0, done: !0 };
  }
}
var logWarning = function(e) {
  if (typeof process != "object" || process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
    var t = "\x1B[33m%s\x1B[0m", r = ["[neverthrow]", e].join(" - ");
    console.warn(t, r);
  }
}, ResultAsync$1 = (
  /** @class */
  (function() {
    function e(t) {
      this._promise = t;
    }
    return e.fromPromise = function(t, r) {
      var n = t.then(function(s) {
        return new Ok$1(s);
      });
      if (r)
        n = n.catch(function(s) {
          return new Err$1(r(s));
        });
      else {
        var i = [
          "`fromPromise` called without a promise rejection handler",
          "Ensure that you are catching promise rejections yourself, or pass a second argument to `fromPromise` to convert a caught exception into an `Err` instance"
        ].join(" - ");
        logWarning(i);
      }
      return new e(n);
    }, e.prototype.map = function(t) {
      var r = this;
      return new e(this._promise.then(function(n) {
        return __awaiter$1(r, void 0, void 0, function() {
          var i;
          return __generator$1(this, function(s) {
            switch (s.label) {
              case 0:
                return n.isErr() ? [2, new Err$1(n.error)] : (i = Ok$1.bind, [4, t(n.value)]);
              case 1:
                return [2, new (i.apply(Ok$1, [void 0, s.sent()]))()];
            }
          });
        });
      }));
    }, e.prototype.mapErr = function(t) {
      var r = this;
      return new e(this._promise.then(function(n) {
        return __awaiter$1(r, void 0, void 0, function() {
          var i;
          return __generator$1(this, function(s) {
            switch (s.label) {
              case 0:
                return n.isOk() ? [2, new Ok$1(n.value)] : (i = Err$1.bind, [4, t(n.error)]);
              case 1:
                return [2, new (i.apply(Err$1, [void 0, s.sent()]))()];
            }
          });
        });
      }));
    }, e.prototype.andThen = function(t) {
      return new e(this._promise.then(function(r) {
        if (r.isErr())
          return new Err$1(r.error);
        var n = t(r.value);
        return n instanceof e ? n._promise : n;
      }));
    }, e.prototype.match = function(t, r) {
      return this._promise.then(function(n) {
        return n.match(t, r);
      });
    }, e.prototype.unwrapOr = function(t) {
      return this._promise.then(function(r) {
        return r.unwrapOr(t);
      });
    }, e.prototype.then = function(t) {
      return this._promise.then(t);
    }, e;
  })()
), errAsync$1 = function(e) {
  return new ResultAsync$1(Promise.resolve(new Err$1(e)));
}, __defProp = Object.defineProperty, __getOwnPropSymbols = Object.getOwnPropertySymbols, __hasOwnProp = Object.prototype.hasOwnProperty, __propIsEnum = Object.prototype.propertyIsEnumerable, __defNormalProp = (e, t, r) => t in e ? __defProp(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, __spreadValues = (e, t) => {
  for (var r in t || (t = {}))
    __hasOwnProp.call(t, r) && __defNormalProp(e, r, t[r]);
  if (__getOwnPropSymbols)
    for (var r of __getOwnPropSymbols(t))
      __propIsEnum.call(t, r) && __defNormalProp(e, r, t[r]);
  return e;
};
function createInputValue(e, t, r) {
  let n = t;
  const i = {}, s = () => n, o = (u) => {
    var l;
    u !== n && (n = u, (l = i.onSet) == null || l.call(i));
  };
  return { varId: e, get: s, set: o, reset: () => {
    o(t);
  }, callbacks: i };
}
var Series = class fe {
  /**
   * @param varId The ID for the output variable (as used by SDEverywhere).
   * @param points The data points for the variable, one point per time increment.
   */
  constructor(t, r) {
    this.varId = t, this.points = r;
  }
  /**
   * Return the Y value at the given time.  Note that this does not attempt to interpolate
   * if there is no data point defined for the given time and will return undefined in
   * that case.
   *
   * @param time The x (time) value.
   * @return The y value for the given time, or undefined if there is no data point defined
   * for the given time.
   */
  getValueAtTime(t) {
    var r;
    return (r = this.points.find((n) => n.x === t)) == null ? void 0 : r.y;
  }
  /**
   * Create a new `Series` instance that is a copy of this one.
   */
  copy() {
    const t = this.points.map((r) => __spreadValues({}, r));
    return new fe(this.varId, t);
  }
}, Outputs = class {
  /**
   * @param varIds The output variable identifiers.
   * @param startTime The start time for the model.
   * @param endTime The end time for the model.
   * @param saveFreq The frequency with which output values are saved (aka `SAVEPER`).
   */
  constructor(e, t, r, n = 1) {
    this.varIds = e, this.startTime = t, this.endTime = r, this.saveFreq = n, this.seriesLength = Math.round((r - t) / n) + 1, this.varSeries = new Array(e.length);
    for (let i = 0; i < e.length; i++) {
      const s = new Array(this.seriesLength);
      for (let a = 0; a < this.seriesLength; a++)
        s[a] = { x: t + a * n, y: 0 };
      const o = e[i];
      this.varSeries[i] = new Series(o, s);
    }
  }
  /**
   * The optional set of specs that dictate which variables from the model will be
   * stored in this `Outputs` instance.  If undefined, the default set of outputs
   * will be stored (as configured in `varIds`).
   * @hidden This is not yet part of the public API; it is exposed here for use
   * in experimental testing tools.
   */
  setVarSpecs(e) {
    if (e.length !== this.varIds.length)
      throw new Error("Length of output varSpecs must match that of varIds");
    this.varSpecs = e;
  }
  /**
   * Parse the given raw float buffer (produced by the model) and store the values
   * into this `Outputs` instance.
   *
   * Note that the length of `outputsBuffer` must be greater than or equal to
   * the capacity of this `Outputs` instance.  The `Outputs` instance is allowed
   * to be smaller to support the case where you want to extract a subset of
   * the time range in the buffer produced by the model.
   *
   * @param outputsBuffer The raw outputs buffer produced by the model.
   * @param rowLength The number of elements per row (one element per save point).
   * @return An `ok` result if the buffer is valid, otherwise an `err` result.
   */
  updateFromBuffer(e, t) {
    const r = parseOutputsBuffer(e, t, this);
    return r.isOk() ? ok$1(void 0) : err$1(r.error);
  }
  /**
   * Return the series for the given output variable.
   *
   * @param varId The ID of the output variable (as used by SDEverywhere).
   */
  getSeriesForVar(e) {
    const t = this.varIds.indexOf(e);
    if (t >= 0)
      return this.varSeries[t];
  }
};
function parseOutputsBuffer(e, t, r) {
  const n = r.varIds.length, i = r.seriesLength;
  if (t < i || e.length < n * i)
    return err$1("invalid-point-count");
  for (let s = 0; s < n; s++) {
    const o = r.varSeries[s];
    let a = t * s;
    for (let u = 0; u < i; u++)
      o.points[u].y = validateNumber(e[a]), a++;
  }
  return ok$1(r);
}
function validateNumber(e) {
  if (!isNaN(e) && e > -1e32)
    return e;
}
function getEncodedVarIndicesLength(e) {
  var t;
  let r = 1;
  for (const n of e) {
    r += 2;
    const i = ((t = n.subscriptIndices) == null ? void 0 : t.length) || 0;
    r += i;
  }
  return r;
}
function encodeVarIndices(e, t) {
  let r = 0;
  t[r++] = e.length;
  for (const n of e) {
    t[r++] = n.varIndex;
    const i = n.subscriptIndices, s = i?.length || 0;
    t[r++] = s;
    for (let o = 0; o < s; o++)
      t[r++] = i[o];
  }
}
function getEncodedLookupBufferLengths(e) {
  var t, r;
  let n = 1, i = 0;
  for (const s of e) {
    const o = s.varRef.varSpec;
    if (o === void 0)
      throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");
    n += 2;
    const a = ((t = o.subscriptIndices) == null ? void 0 : t.length) || 0;
    n += a, n += 2, i += ((r = s.points) == null ? void 0 : r.length) || 0;
  }
  return {
    lookupIndicesLength: n,
    lookupsLength: i
  };
}
function encodeLookups(e, t, r) {
  let n = 0;
  t[n++] = e.length;
  let i = 0;
  for (const s of e) {
    const o = s.varRef.varSpec;
    t[n++] = o.varIndex;
    const a = o.subscriptIndices, u = a?.length || 0;
    t[n++] = u;
    for (let l = 0; l < u; l++)
      t[n++] = a[l];
    s.points !== void 0 ? (t[n++] = i, t[n++] = s.points.length, r?.set(s.points, i), i += s.points.length) : (t[n++] = -1, t[n++] = 0);
  }
}
function decodeLookups(e, t) {
  const r = [];
  let n = 0;
  const i = e[n++];
  for (let s = 0; s < i; s++) {
    const o = e[n++], a = e[n++], u = a > 0 ? Array(a) : void 0;
    for (let _ = 0; _ < a; _++)
      u[_] = e[n++];
    const l = e[n++], d = e[n++], y = {
      varIndex: o,
      subscriptIndices: u
    };
    let m;
    l >= 0 ? t ? m = t.slice(l, l + d) : m = new Float64Array(0) : m = void 0, r.push({
      varRef: {
        varSpec: y
      },
      points: m
    });
  }
  return r;
}
var ModelListing = class {
  constructor(e) {
    this.varSpecs = /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    for (const i of e.dimensions) {
      const s = i.id, o = [];
      for (let a = 0; a < i.subIds.length; a++)
        o.push({
          id: i.subIds[a],
          index: a
        });
      t.set(s, {
        id: s,
        subscripts: o
      });
    }
    function r(i) {
      const s = t.get(i);
      if (s === void 0)
        throw new Error(`No dimension info found for id=${i}`);
      return s;
    }
    const n = /* @__PURE__ */ new Set();
    for (const i of e.variables) {
      const s = varIdWithoutSubscripts(i.id);
      if (!n.has(s)) {
        const a = (i.dimIds || []).map(r);
        if (a.length > 0) {
          const u = [];
          for (const d of a)
            u.push(d.subscripts);
          const l = cartesianProductOf(u);
          for (const d of l) {
            const y = d.map((b) => b.id).join(","), m = d.map((b) => b.index), _ = `${s}[${y}]`;
            this.varSpecs.set(_, {
              varIndex: i.index,
              subscriptIndices: m
            });
          }
        } else
          this.varSpecs.set(s, {
            varIndex: i.index
          });
        n.add(s);
      }
    }
  }
  /**
   * Return the `VarSpec` for the given variable ID, or undefined if there is no spec defined
   * in the listing for that variable.
   */
  getSpecForVarId(e) {
    return this.varSpecs.get(e);
  }
  /**
   * Return the `VarSpec` for the given variable name, or undefined if there is no spec defined
   * in the listing for that variable.
   */
  getSpecForVarName(e) {
    const t = sdeVarIdForVensimVarName(e);
    return this.varSpecs.get(t);
  }
  /**
   * Create a new `Outputs` instance that uses the same start/end years as the given "normal"
   * `Outputs` instance but is prepared for reading the specified internal variables from the model.
   *
   * @param normalOutputs The `Outputs` that is used to access normal output variables from the model.
   * @param varIds The variable IDs to include with the new `Outputs` instance.
   */
  deriveOutputs(e, t) {
    const r = [];
    for (const i of t) {
      const s = this.varSpecs.get(i);
      s !== void 0 ? r.push(s) : console.warn(`WARNING: No output var spec found for id=${i}`);
    }
    const n = new Outputs(t, e.startTime, e.endTime, e.saveFreq);
    return n.varSpecs = r, n;
  }
};
function varIdWithoutSubscripts(e) {
  const t = e.indexOf("[");
  return t >= 0 ? e.substring(0, t) : e;
}
function cartesianProductOf(e) {
  return e.reduce(
    (t, r) => t.map((n) => r.map((i) => n.concat([i]))).reduce((n, i) => n.concat(i), []),
    [[]]
  );
}
function sdeVarIdForVensimName(e) {
  return "_" + e.trim().replace(/"/g, "_").replace(/\s+!$/g, "!").replace(/\s/g, "_").replace(/,/g, "_").replace(/-/g, "_").replace(/\./g, "_").replace(/\$/g, "_").replace(/'/g, "_").replace(/&/g, "_").replace(/%/g, "_").replace(/\//g, "_").replace(/\|/g, "_").toLowerCase();
}
function sdeVarIdForVensimVarName(e) {
  const t = e.match(/([^[]+)(?:\[([^\]]+)\])?/);
  if (!t)
    throw new Error(`Invalid Vensim name: ${e}`);
  let r = sdeVarIdForVensimName(t[1]);
  if (t[2]) {
    const n = t[2].split(",").map((i) => sdeVarIdForVensimName(i));
    r += `[${n.join(",")}]`;
  }
  return r;
}
function resolveVarRef(e, t, r) {
  if (!t.varSpec) {
    if (e === void 0)
      throw new Error(
        `Unable to resolve ${r} variable references by name or identifier when model listing is unavailable`
      );
    if (t.varId) {
      const n = e?.getSpecForVarId(t.varId);
      if (n)
        t.varSpec = n;
      else
        throw new Error(`Failed to resolve ${r} variable reference for varId=${t.varId}`);
    } else {
      const n = e?.getSpecForVarName(t.varName);
      if (n)
        t.varSpec = n;
      else
        throw new Error(`Failed to resolve ${r} variable reference for varName='${t.varId}'`);
    }
  }
}
var headerLengthInElements = 16, extrasLengthInElements = 1, Int32Section = class {
  constructor() {
    this.offsetInBytes = 0, this.lengthInElements = 0;
  }
  update(e, t, r) {
    this.view = r > 0 ? new Int32Array(e, t, r) : void 0, this.offsetInBytes = t, this.lengthInElements = r;
  }
}, Float64Section = class {
  constructor() {
    this.offsetInBytes = 0, this.lengthInElements = 0;
  }
  update(e, t, r) {
    this.view = r > 0 ? new Float64Array(e, t, r) : void 0, this.offsetInBytes = t, this.lengthInElements = r;
  }
}, BufferedRunModelParams = class {
  /**
   * @param listing The model listing that is used to locate a variable that is referenced by
   * name or identifier.  If undefined, variables cannot be referenced by name or identifier,
   * and can only be referenced using a valid `VarSpec`.
   */
  constructor(e) {
    this.listing = e, this.header = new Int32Section(), this.extras = new Float64Section(), this.inputs = new Float64Section(), this.outputs = new Float64Section(), this.outputIndices = new Int32Section(), this.lookups = new Float64Section(), this.lookupIndices = new Int32Section();
  }
  /**
   * Return the encoded buffer from this instance, which can be passed to `updateFromEncodedBuffer`.
   */
  getEncodedBuffer() {
    return this.encoded;
  }
  // from RunModelParams interface
  getInputs() {
    return this.inputs.view;
  }
  // from RunModelParams interface
  copyInputs(e, t) {
    this.inputs.lengthInElements !== 0 && ((e === void 0 || e.length < this.inputs.lengthInElements) && (e = t(this.inputs.lengthInElements)), e.set(this.inputs.view));
  }
  // from RunModelParams interface
  getOutputIndicesLength() {
    return this.outputIndices.lengthInElements;
  }
  // from RunModelParams interface
  getOutputIndices() {
    return this.outputIndices.view;
  }
  // from RunModelParams interface
  copyOutputIndices(e, t) {
    this.outputIndices.lengthInElements !== 0 && ((e === void 0 || e.length < this.outputIndices.lengthInElements) && (e = t(this.outputIndices.lengthInElements)), e.set(this.outputIndices.view));
  }
  // from RunModelParams interface
  getOutputsLength() {
    return this.outputs.lengthInElements;
  }
  // from RunModelParams interface
  getOutputs() {
    return this.outputs.view;
  }
  // from RunModelParams interface
  getOutputsObject() {
  }
  // from RunModelParams interface
  storeOutputs(e) {
    this.outputs.view !== void 0 && (e.length > this.outputs.view.length ? this.outputs.view.set(e.subarray(0, this.outputs.view.length)) : this.outputs.view.set(e));
  }
  // from RunModelParams interface
  getLookups() {
    if (this.lookupIndices.lengthInElements !== 0)
      return decodeLookups(this.lookupIndices.view, this.lookups.view);
  }
  // from RunModelParams interface
  getElapsedTime() {
    return this.extras.view[0];
  }
  // from RunModelParams interface
  storeElapsedTime(e) {
    this.extras.view[0] = e;
  }
  /**
   * Copy the outputs buffer to the given `Outputs` instance.  This should be called
   * after the `runModel` call has completed so that the output values are copied from
   * the internal buffer to the `Outputs` instance that was passed to `runModel`.
   *
   * @param outputs The `Outputs` instance into which the output values will be copied.
   */
  finalizeOutputs(e) {
    this.outputs.view && e.updateFromBuffer(this.outputs.view, e.seriesLength), e.runTimeInMillis = this.getElapsedTime();
  }
  /**
   * Update this instance using the parameters that are passed to a `runModel` call.
   *
   * @param inputs The model input values (must be in the same order as in the spec file).
   * @param outputs The structure into which the model outputs will be stored.
   * @param options Additional options that influence the model run.
   */
  updateFromParams(e, t, r) {
    const n = e.length, i = t.varIds.length * t.seriesLength;
    let s;
    const o = t.varSpecs;
    o !== void 0 && o.length > 0 ? s = getEncodedVarIndicesLength(o) : s = 0;
    let a, u;
    if (r?.lookups !== void 0 && r.lookups.length > 0) {
      for (const $ of r.lookups)
        resolveVarRef(this.listing, $.varRef, "lookup");
      const v = getEncodedLookupBufferLengths(r.lookups);
      a = v.lookupsLength, u = v.lookupIndicesLength;
    } else
      a = 0, u = 0;
    let l = 0;
    function d(v, $) {
      const O = l, C = v === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, j = Math.round($ * C), F = Math.ceil(j / 8) * 8;
      return l += F, O;
    }
    const y = d("int32", headerLengthInElements), m = d("float64", extrasLengthInElements), _ = d("float64", n), b = d("float64", i), w = d("int32", s), f = d("float64", a), g = d("int32", u), c = l;
    if (this.encoded === void 0 || this.encoded.byteLength < c) {
      const v = Math.ceil(c * 1.2);
      this.encoded = new ArrayBuffer(v), this.header.update(this.encoded, y, headerLengthInElements);
    }
    const h = this.header.view;
    let S = 0;
    h[S++] = m, h[S++] = extrasLengthInElements, h[S++] = _, h[S++] = n, h[S++] = b, h[S++] = i, h[S++] = w, h[S++] = s, h[S++] = f, h[S++] = a, h[S++] = g, h[S++] = u, this.inputs.update(this.encoded, _, n), this.extras.update(this.encoded, m, extrasLengthInElements), this.outputs.update(this.encoded, b, i), this.outputIndices.update(this.encoded, w, s), this.lookups.update(this.encoded, f, a), this.lookupIndices.update(this.encoded, g, u);
    const p = this.inputs.view;
    for (let v = 0; v < e.length; v++) {
      const $ = e[v];
      typeof $ == "number" ? p[v] = $ : p[v] = $.get();
    }
    this.outputIndices.view && encodeVarIndices(o, this.outputIndices.view), u > 0 && encodeLookups(r.lookups, this.lookupIndices.view, this.lookups.view);
  }
  /**
   * Update this instance using the values contained in the encoded buffer from another
   * `BufferedRunModelParams` instance.
   *
   * @param buffer An encoded buffer returned by `getEncodedBuffer`.
   */
  updateFromEncodedBuffer(e) {
    const t = headerLengthInElements * Int32Array.BYTES_PER_ELEMENT;
    if (e.byteLength < t)
      throw new Error("Buffer must be long enough to contain header section");
    this.encoded = e, this.header.update(this.encoded, 0, headerLengthInElements);
    const n = this.header.view;
    let i = 0;
    const s = n[i++], o = n[i++], a = n[i++], u = n[i++], l = n[i++], d = n[i++], y = n[i++], m = n[i++], _ = n[i++], b = n[i++], w = n[i++], f = n[i++], g = o * Float64Array.BYTES_PER_ELEMENT, c = u * Float64Array.BYTES_PER_ELEMENT, h = d * Float64Array.BYTES_PER_ELEMENT, S = m * Int32Array.BYTES_PER_ELEMENT, p = b * Float64Array.BYTES_PER_ELEMENT, v = f * Int32Array.BYTES_PER_ELEMENT, $ = t + g + c + h + S + p + v;
    if (e.byteLength < $)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, s, o), this.inputs.update(this.encoded, a, u), this.outputs.update(this.encoded, l, d), this.outputIndices.update(this.encoded, y, m), this.lookups.update(this.encoded, _, b), this.lookupIndices.update(this.encoded, w, f);
  }
};
async function spawnAsyncModelRunner(e) {
  return e.path ? spawnAsyncModelRunnerWithWorker(new Worker$1(e.path)) : spawnAsyncModelRunnerWithWorker(BlobWorker.fromText(e.source));
}
async function spawnAsyncModelRunnerWithWorker(e) {
  const t = await spawn(e), r = await t.initModel(), n = r.modelListing ? new ModelListing(r.modelListing) : void 0, i = new BufferedRunModelParams(n);
  let s = !1, o = !1;
  return {
    createOutputs: () => new Outputs(r.outputVarIds, r.startTime, r.endTime, r.saveFreq),
    runModel: async (a, u, l) => {
      if (o)
        throw new Error("Async model runner has already been terminated");
      if (s)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      s = !0, i.updateFromParams(a, u, l);
      let d;
      try {
        d = await t.runModel(Transfer(i.getEncodedBuffer()));
      } finally {
        s = !1;
      }
      return i.updateFromEncodedBuffer(d), i.finalizeOutputs(u), u;
    },
    terminate: () => o ? Promise.resolve() : (o = !0, Thread.terminate(t))
  };
}
var assertNever = {}, hasRequiredAssertNever;
function requireAssertNever() {
  if (hasRequiredAssertNever) return assertNever;
  hasRequiredAssertNever = 1, Object.defineProperty(assertNever, "__esModule", { value: !0 }), assertNever.assertNever = e;
  function e(t, r) {
    if (typeof r == "string")
      throw new Error(r);
    if (typeof r == "function")
      throw new Error(r(t));
    if (r)
      return t;
    throw new Error("Unhandled discriminated union member: ".concat(JSON.stringify(t)));
  }
  return assertNever.default = e, assertNever;
}
var assertNeverExports = requireAssertNever(), ajv = { exports: {} }, core$1 = {}, validate = {}, boolSchema = {}, errors = {}, codegen = {}, code$1 = {}, hasRequiredCode$1;
function requireCode$1() {
  return hasRequiredCode$1 || (hasRequiredCode$1 = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
    class t {
    }
    e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    class r extends t {
      constructor(c) {
        if (super(), !e.IDENTIFIER.test(c))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = c;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return !1;
      }
      get names() {
        return { [this.str]: 1 };
      }
    }
    e.Name = r;
    class n extends t {
      constructor(c) {
        super(), this._items = typeof c == "string" ? [c] : c;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return !1;
        const c = this._items[0];
        return c === "" || c === '""';
      }
      get str() {
        var c;
        return (c = this._str) !== null && c !== void 0 ? c : this._str = this._items.reduce((h, S) => `${h}${S}`, "");
      }
      get names() {
        var c;
        return (c = this._names) !== null && c !== void 0 ? c : this._names = this._items.reduce((h, S) => (S instanceof r && (h[S.str] = (h[S.str] || 0) + 1), h), {});
      }
    }
    e._Code = n, e.nil = new n("");
    function i(g, ...c) {
      const h = [g[0]];
      let S = 0;
      for (; S < c.length; )
        a(h, c[S]), h.push(g[++S]);
      return new n(h);
    }
    e._ = i;
    const s = new n("+");
    function o(g, ...c) {
      const h = [_(g[0])];
      let S = 0;
      for (; S < c.length; )
        h.push(s), a(h, c[S]), h.push(s, _(g[++S]));
      return u(h), new n(h);
    }
    e.str = o;
    function a(g, c) {
      c instanceof n ? g.push(...c._items) : c instanceof r ? g.push(c) : g.push(y(c));
    }
    e.addCodeArg = a;
    function u(g) {
      let c = 1;
      for (; c < g.length - 1; ) {
        if (g[c] === s) {
          const h = l(g[c - 1], g[c + 1]);
          if (h !== void 0) {
            g.splice(c - 1, 3, h);
            continue;
          }
          g[c++] = "+";
        }
        c++;
      }
    }
    function l(g, c) {
      if (c === '""')
        return g;
      if (g === '""')
        return c;
      if (typeof g == "string")
        return c instanceof r || g[g.length - 1] !== '"' ? void 0 : typeof c != "string" ? `${g.slice(0, -1)}${c}"` : c[0] === '"' ? g.slice(0, -1) + c.slice(1) : void 0;
      if (typeof c == "string" && c[0] === '"' && !(g instanceof r))
        return `"${g}${c.slice(1)}`;
    }
    function d(g, c) {
      return c.emptyStr() ? g : g.emptyStr() ? c : o`${g}${c}`;
    }
    e.strConcat = d;
    function y(g) {
      return typeof g == "number" || typeof g == "boolean" || g === null ? g : _(Array.isArray(g) ? g.join(",") : g);
    }
    function m(g) {
      return new n(_(g));
    }
    e.stringify = m;
    function _(g) {
      return JSON.stringify(g).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    e.safeStringify = _;
    function b(g) {
      return typeof g == "string" && e.IDENTIFIER.test(g) ? new n(`.${g}`) : i`[${g}]`;
    }
    e.getProperty = b;
    function w(g) {
      if (typeof g == "string" && e.IDENTIFIER.test(g))
        return new n(`${g}`);
      throw new Error(`CodeGen: invalid export name: ${g}, use explicit $id name mapping`);
    }
    e.getEsmExportName = w;
    function f(g) {
      return new n(g.toString());
    }
    e.regexpCode = f;
  })(code$1)), code$1;
}
var scope = {}, hasRequiredScope;
function requireScope() {
  return hasRequiredScope || (hasRequiredScope = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
    const t = requireCode$1();
    class r extends Error {
      constructor(l) {
        super(`CodeGen: "code" for ${l} not defined`), this.value = l.value;
      }
    }
    var n;
    (function(u) {
      u[u.Started = 0] = "Started", u[u.Completed = 1] = "Completed";
    })(n || (e.UsedValueState = n = {})), e.varKinds = {
      const: new t.Name("const"),
      let: new t.Name("let"),
      var: new t.Name("var")
    };
    class i {
      constructor({ prefixes: l, parent: d } = {}) {
        this._names = {}, this._prefixes = l, this._parent = d;
      }
      toName(l) {
        return l instanceof t.Name ? l : this.name(l);
      }
      name(l) {
        return new t.Name(this._newName(l));
      }
      _newName(l) {
        const d = this._names[l] || this._nameGroup(l);
        return `${l}${d.index++}`;
      }
      _nameGroup(l) {
        var d, y;
        if (!((y = (d = this._parent) === null || d === void 0 ? void 0 : d._prefixes) === null || y === void 0) && y.has(l) || this._prefixes && !this._prefixes.has(l))
          throw new Error(`CodeGen: prefix "${l}" is not allowed in this scope`);
        return this._names[l] = { prefix: l, index: 0 };
      }
    }
    e.Scope = i;
    class s extends t.Name {
      constructor(l, d) {
        super(d), this.prefix = l;
      }
      setValue(l, { property: d, itemIndex: y }) {
        this.value = l, this.scopePath = (0, t._)`.${new t.Name(d)}[${y}]`;
      }
    }
    e.ValueScopeName = s;
    const o = (0, t._)`\n`;
    class a extends i {
      constructor(l) {
        super(l), this._values = {}, this._scope = l.scope, this.opts = { ...l, _n: l.lines ? o : t.nil };
      }
      get() {
        return this._scope;
      }
      name(l) {
        return new s(l, this._newName(l));
      }
      value(l, d) {
        var y;
        if (d.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const m = this.toName(l), { prefix: _ } = m, b = (y = d.key) !== null && y !== void 0 ? y : d.ref;
        let w = this._values[_];
        if (w) {
          const c = w.get(b);
          if (c)
            return c;
        } else
          w = this._values[_] = /* @__PURE__ */ new Map();
        w.set(b, m);
        const f = this._scope[_] || (this._scope[_] = []), g = f.length;
        return f[g] = d.ref, m.setValue(d, { property: _, itemIndex: g }), m;
      }
      getValue(l, d) {
        const y = this._values[l];
        if (y)
          return y.get(d);
      }
      scopeRefs(l, d = this._values) {
        return this._reduceValues(d, (y) => {
          if (y.scopePath === void 0)
            throw new Error(`CodeGen: name "${y}" has no value`);
          return (0, t._)`${l}${y.scopePath}`;
        });
      }
      scopeCode(l = this._values, d, y) {
        return this._reduceValues(l, (m) => {
          if (m.value === void 0)
            throw new Error(`CodeGen: name "${m}" has no value`);
          return m.value.code;
        }, d, y);
      }
      _reduceValues(l, d, y = {}, m) {
        let _ = t.nil;
        for (const b in l) {
          const w = l[b];
          if (!w)
            continue;
          const f = y[b] = y[b] || /* @__PURE__ */ new Map();
          w.forEach((g) => {
            if (f.has(g))
              return;
            f.set(g, n.Started);
            let c = d(g);
            if (c) {
              const h = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
              _ = (0, t._)`${_}${h} ${g} = ${c};${this.opts._n}`;
            } else if (c = m?.(g))
              _ = (0, t._)`${_}${c}${this.opts._n}`;
            else
              throw new r(g);
            f.set(g, n.Completed);
          });
        }
        return _;
      }
    }
    e.ValueScope = a;
  })(scope)), scope;
}
var hasRequiredCodegen;
function requireCodegen() {
  return hasRequiredCodegen || (hasRequiredCodegen = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
    const t = requireCode$1(), r = requireScope();
    var n = requireCode$1();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return n._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return n.str;
    } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
      return n.strConcat;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return n.nil;
    } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
      return n.getProperty;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return n.stringify;
    } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
      return n.regexpCode;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return n.Name;
    } });
    var i = requireScope();
    Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
      return i.Scope;
    } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
      return i.ValueScope;
    } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
      return i.ValueScopeName;
    } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
      return i.varKinds;
    } }), e.operators = {
      GT: new t._Code(">"),
      GTE: new t._Code(">="),
      LT: new t._Code("<"),
      LTE: new t._Code("<="),
      EQ: new t._Code("==="),
      NEQ: new t._Code("!=="),
      NOT: new t._Code("!"),
      OR: new t._Code("||"),
      AND: new t._Code("&&"),
      ADD: new t._Code("+")
    };
    class s {
      optimizeNodes() {
        return this;
      }
      optimizeNames(E, I) {
        return this;
      }
    }
    class o extends s {
      constructor(E, I, M) {
        super(), this.varKind = E, this.name = I, this.rhs = M;
      }
      render({ es5: E, _n: I }) {
        const M = E ? r.varKinds.var : this.varKind, V = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${M} ${this.name}${V};` + I;
      }
      optimizeNames(E, I) {
        if (E[this.name.str])
          return this.rhs && (this.rhs = J(this.rhs, E, I)), this;
      }
      get names() {
        return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
      }
    }
    class a extends s {
      constructor(E, I, M) {
        super(), this.lhs = E, this.rhs = I, this.sideEffects = M;
      }
      render({ _n: E }) {
        return `${this.lhs} = ${this.rhs};` + E;
      }
      optimizeNames(E, I) {
        if (!(this.lhs instanceof t.Name && !E[this.lhs.str] && !this.sideEffects))
          return this.rhs = J(this.rhs, E, I), this;
      }
      get names() {
        const E = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
        return z(E, this.rhs);
      }
    }
    class u extends a {
      constructor(E, I, M, V) {
        super(E, M, V), this.op = I;
      }
      render({ _n: E }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + E;
      }
    }
    class l extends s {
      constructor(E) {
        super(), this.label = E, this.names = {};
      }
      render({ _n: E }) {
        return `${this.label}:` + E;
      }
    }
    class d extends s {
      constructor(E) {
        super(), this.label = E, this.names = {};
      }
      render({ _n: E }) {
        return `break${this.label ? ` ${this.label}` : ""};` + E;
      }
    }
    class y extends s {
      constructor(E) {
        super(), this.error = E;
      }
      render({ _n: E }) {
        return `throw ${this.error};` + E;
      }
      get names() {
        return this.error.names;
      }
    }
    class m extends s {
      constructor(E) {
        super(), this.code = E;
      }
      render({ _n: E }) {
        return `${this.code};` + E;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(E, I) {
        return this.code = J(this.code, E, I), this;
      }
      get names() {
        return this.code instanceof t._CodeOrName ? this.code.names : {};
      }
    }
    class _ extends s {
      constructor(E = []) {
        super(), this.nodes = E;
      }
      render(E) {
        return this.nodes.reduce((I, M) => I + M.render(E), "");
      }
      optimizeNodes() {
        const { nodes: E } = this;
        let I = E.length;
        for (; I--; ) {
          const M = E[I].optimizeNodes();
          Array.isArray(M) ? E.splice(I, 1, ...M) : M ? E[I] = M : E.splice(I, 1);
        }
        return E.length > 0 ? this : void 0;
      }
      optimizeNames(E, I) {
        const { nodes: M } = this;
        let V = M.length;
        for (; V--; ) {
          const U = M[V];
          U.optimizeNames(E, I) || (x(E, U.names), M.splice(V, 1));
        }
        return M.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((E, I) => B(E, I.names), {});
      }
    }
    class b extends _ {
      render(E) {
        return "{" + E._n + super.render(E) + "}" + E._n;
      }
    }
    class w extends _ {
    }
    class f extends b {
    }
    f.kind = "else";
    class g extends b {
      constructor(E, I) {
        super(I), this.condition = E;
      }
      render(E) {
        let I = `if(${this.condition})` + super.render(E);
        return this.else && (I += "else " + this.else.render(E)), I;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const E = this.condition;
        if (E === !0)
          return this.nodes;
        let I = this.else;
        if (I) {
          const M = I.optimizeNodes();
          I = this.else = Array.isArray(M) ? new f(M) : M;
        }
        if (I)
          return E === !1 ? I instanceof g ? I : I.nodes : this.nodes.length ? this : new g(re(E), I instanceof g ? [I] : I.nodes);
        if (!(E === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(E, I) {
        var M;
        if (this.else = (M = this.else) === null || M === void 0 ? void 0 : M.optimizeNames(E, I), !!(super.optimizeNames(E, I) || this.else))
          return this.condition = J(this.condition, E, I), this;
      }
      get names() {
        const E = super.names;
        return z(E, this.condition), this.else && B(E, this.else.names), E;
      }
    }
    g.kind = "if";
    class c extends b {
    }
    c.kind = "for";
    class h extends c {
      constructor(E) {
        super(), this.iteration = E;
      }
      render(E) {
        return `for(${this.iteration})` + super.render(E);
      }
      optimizeNames(E, I) {
        if (super.optimizeNames(E, I))
          return this.iteration = J(this.iteration, E, I), this;
      }
      get names() {
        return B(super.names, this.iteration.names);
      }
    }
    class S extends c {
      constructor(E, I, M, V) {
        super(), this.varKind = E, this.name = I, this.from = M, this.to = V;
      }
      render(E) {
        const I = E.es5 ? r.varKinds.var : this.varKind, { name: M, from: V, to: U } = this;
        return `for(${I} ${M}=${V}; ${M}<${U}; ${M}++)` + super.render(E);
      }
      get names() {
        const E = z(super.names, this.from);
        return z(E, this.to);
      }
    }
    class p extends c {
      constructor(E, I, M, V) {
        super(), this.loop = E, this.varKind = I, this.name = M, this.iterable = V;
      }
      render(E) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(E);
      }
      optimizeNames(E, I) {
        if (super.optimizeNames(E, I))
          return this.iterable = J(this.iterable, E, I), this;
      }
      get names() {
        return B(super.names, this.iterable.names);
      }
    }
    class v extends b {
      constructor(E, I, M) {
        super(), this.name = E, this.args = I, this.async = M;
      }
      render(E) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(E);
      }
    }
    v.kind = "func";
    class $ extends _ {
      render(E) {
        return "return " + super.render(E);
      }
    }
    $.kind = "return";
    class O extends b {
      render(E) {
        let I = "try" + super.render(E);
        return this.catch && (I += this.catch.render(E)), this.finally && (I += this.finally.render(E)), I;
      }
      optimizeNodes() {
        var E, I;
        return super.optimizeNodes(), (E = this.catch) === null || E === void 0 || E.optimizeNodes(), (I = this.finally) === null || I === void 0 || I.optimizeNodes(), this;
      }
      optimizeNames(E, I) {
        var M, V;
        return super.optimizeNames(E, I), (M = this.catch) === null || M === void 0 || M.optimizeNames(E, I), (V = this.finally) === null || V === void 0 || V.optimizeNames(E, I), this;
      }
      get names() {
        const E = super.names;
        return this.catch && B(E, this.catch.names), this.finally && B(E, this.finally.names), E;
      }
    }
    class C extends b {
      constructor(E) {
        super(), this.error = E;
      }
      render(E) {
        return `catch(${this.error})` + super.render(E);
      }
    }
    C.kind = "catch";
    class j extends b {
      render(E) {
        return "finally" + super.render(E);
      }
    }
    j.kind = "finally";
    class F {
      constructor(E, I = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...I, _n: I.lines ? `
` : "" }, this._extScope = E, this._scope = new r.Scope({ parent: E }), this._nodes = [new w()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(E) {
        return this._scope.name(E);
      }
      // reserves unique name in the external scope
      scopeName(E) {
        return this._extScope.name(E);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(E, I) {
        const M = this._extScope.value(E, I);
        return (this._values[M.prefix] || (this._values[M.prefix] = /* @__PURE__ */ new Set())).add(M), M;
      }
      getScopeValue(E, I) {
        return this._extScope.getValue(E, I);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(E) {
        return this._extScope.scopeRefs(E, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(E, I, M, V) {
        const U = this._scope.toName(I);
        return M !== void 0 && V && (this._constants[U.str] = M), this._leafNode(new o(E, U, M)), U;
      }
      // `const` declaration (`var` in es5 mode)
      const(E, I, M) {
        return this._def(r.varKinds.const, E, I, M);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(E, I, M) {
        return this._def(r.varKinds.let, E, I, M);
      }
      // `var` declaration with optional assignment
      var(E, I, M) {
        return this._def(r.varKinds.var, E, I, M);
      }
      // assignment code
      assign(E, I, M) {
        return this._leafNode(new a(E, I, M));
      }
      // `+=` code
      add(E, I) {
        return this._leafNode(new u(E, e.operators.ADD, I));
      }
      // appends passed SafeExpr to code or executes Block
      code(E) {
        return typeof E == "function" ? E() : E !== t.nil && this._leafNode(new m(E)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...E) {
        const I = ["{"];
        for (const [M, V] of E)
          I.length > 1 && I.push(","), I.push(M), (M !== V || this.opts.es5) && (I.push(":"), (0, t.addCodeArg)(I, V));
        return I.push("}"), new t._Code(I);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(E, I, M) {
        if (this._blockNode(new g(E)), I && M)
          this.code(I).else().code(M).endIf();
        else if (I)
          this.code(I).endIf();
        else if (M)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(E) {
        return this._elseNode(new g(E));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new f());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(g, f);
      }
      _for(E, I) {
        return this._blockNode(E), I && this.code(I).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(E, I) {
        return this._for(new h(E), I);
      }
      // `for` statement for a range of values
      forRange(E, I, M, V, U = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const G = this._scope.toName(E);
        return this._for(new S(U, G, I, M), () => V(G));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(E, I, M, V = r.varKinds.const) {
        const U = this._scope.toName(E);
        if (this.opts.es5) {
          const G = I instanceof t.Name ? I : this.var("_arr", I);
          return this.forRange("_i", 0, (0, t._)`${G}.length`, (K) => {
            this.var(U, (0, t._)`${G}[${K}]`), M(U);
          });
        }
        return this._for(new p("of", V, U, I), () => M(U));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(E, I, M, V = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(E, (0, t._)`Object.keys(${I})`, M);
        const U = this._scope.toName(E);
        return this._for(new p("in", V, U, I), () => M(U));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(c);
      }
      // `label` statement
      label(E) {
        return this._leafNode(new l(E));
      }
      // `break` statement
      break(E) {
        return this._leafNode(new d(E));
      }
      // `return` statement
      return(E) {
        const I = new $();
        if (this._blockNode(I), this.code(E), I.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode($);
      }
      // `try` statement
      try(E, I, M) {
        if (!I && !M)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const V = new O();
        if (this._blockNode(V), this.code(E), I) {
          const U = this.name("e");
          this._currNode = V.catch = new C(U), I(U);
        }
        return M && (this._currNode = V.finally = new j(), this.code(M)), this._endBlockNode(C, j);
      }
      // `throw` statement
      throw(E) {
        return this._leafNode(new y(E));
      }
      // start self-balancing block
      block(E, I) {
        return this._blockStarts.push(this._nodes.length), E && this.code(E).endBlock(I), this;
      }
      // end the current self-balancing block
      endBlock(E) {
        const I = this._blockStarts.pop();
        if (I === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const M = this._nodes.length - I;
        if (M < 0 || E !== void 0 && M !== E)
          throw new Error(`CodeGen: wrong number of nodes: ${M} vs ${E} expected`);
        return this._nodes.length = I, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(E, I = t.nil, M, V) {
        return this._blockNode(new v(E, I, M)), V && this.code(V).endFunc(), this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(v);
      }
      optimize(E = 1) {
        for (; E-- > 0; )
          this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(E) {
        return this._currNode.nodes.push(E), this;
      }
      _blockNode(E) {
        this._currNode.nodes.push(E), this._nodes.push(E);
      }
      _endBlockNode(E, I) {
        const M = this._currNode;
        if (M instanceof E || I && M instanceof I)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${I ? `${E.kind}/${I.kind}` : E.kind}"`);
      }
      _elseNode(E) {
        const I = this._currNode;
        if (!(I instanceof g))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = I.else = E, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const E = this._nodes;
        return E[E.length - 1];
      }
      set _currNode(E) {
        const I = this._nodes;
        I[I.length - 1] = E;
      }
    }
    e.CodeGen = F;
    function B(P, E) {
      for (const I in E)
        P[I] = (P[I] || 0) + (E[I] || 0);
      return P;
    }
    function z(P, E) {
      return E instanceof t._CodeOrName ? B(P, E.names) : P;
    }
    function J(P, E, I) {
      if (P instanceof t.Name)
        return M(P);
      if (!V(P))
        return P;
      return new t._Code(P._items.reduce((U, G) => (G instanceof t.Name && (G = M(G)), G instanceof t._Code ? U.push(...G._items) : U.push(G), U), []));
      function M(U) {
        const G = I[U.str];
        return G === void 0 || E[U.str] !== 1 ? U : (delete E[U.str], G);
      }
      function V(U) {
        return U instanceof t._Code && U._items.some((G) => G instanceof t.Name && E[G.str] === 1 && I[G.str] !== void 0);
      }
    }
    function x(P, E) {
      for (const I in E)
        P[I] = (P[I] || 0) - (E[I] || 0);
    }
    function re(P) {
      return typeof P == "boolean" || typeof P == "number" || P === null ? !P : (0, t._)`!${N(P)}`;
    }
    e.not = re;
    const ne = R(e.operators.AND);
    function H(...P) {
      return P.reduce(ne);
    }
    e.and = H;
    const se = R(e.operators.OR);
    function A(...P) {
      return P.reduce(se);
    }
    e.or = A;
    function R(P) {
      return (E, I) => E === t.nil ? I : I === t.nil ? E : (0, t._)`${N(E)} ${P} ${N(I)}`;
    }
    function N(P) {
      return P instanceof t.Name ? P : (0, t._)`(${P})`;
    }
  })(codegen)), codegen;
}
var util = {}, hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util;
  hasRequiredUtil = 1, Object.defineProperty(util, "__esModule", { value: !0 }), util.checkStrictMode = util.getErrorPath = util.Type = util.useFunc = util.setEvaluated = util.evaluatedPropsToName = util.mergeEvaluated = util.eachItem = util.unescapeJsonPointer = util.escapeJsonPointer = util.escapeFragment = util.unescapeFragment = util.schemaRefOrVal = util.schemaHasRulesButRef = util.schemaHasRules = util.checkUnknownRules = util.alwaysValidSchema = util.toHash = void 0;
  const e = requireCodegen(), t = requireCode$1();
  function r(p) {
    const v = {};
    for (const $ of p)
      v[$] = !0;
    return v;
  }
  util.toHash = r;
  function n(p, v) {
    return typeof v == "boolean" ? v : Object.keys(v).length === 0 ? !0 : (i(p, v), !s(v, p.self.RULES.all));
  }
  util.alwaysValidSchema = n;
  function i(p, v = p.schema) {
    const { opts: $, self: O } = p;
    if (!$.strictSchema || typeof v == "boolean")
      return;
    const C = O.RULES.keywords;
    for (const j in v)
      C[j] || S(p, `unknown keyword: "${j}"`);
  }
  util.checkUnknownRules = i;
  function s(p, v) {
    if (typeof p == "boolean")
      return !p;
    for (const $ in p)
      if (v[$])
        return !0;
    return !1;
  }
  util.schemaHasRules = s;
  function o(p, v) {
    if (typeof p == "boolean")
      return !p;
    for (const $ in p)
      if ($ !== "$ref" && v.all[$])
        return !0;
    return !1;
  }
  util.schemaHasRulesButRef = o;
  function a({ topSchemaRef: p, schemaPath: v }, $, O, C) {
    if (!C) {
      if (typeof $ == "number" || typeof $ == "boolean")
        return $;
      if (typeof $ == "string")
        return (0, e._)`${$}`;
    }
    return (0, e._)`${p}${v}${(0, e.getProperty)(O)}`;
  }
  util.schemaRefOrVal = a;
  function u(p) {
    return y(decodeURIComponent(p));
  }
  util.unescapeFragment = u;
  function l(p) {
    return encodeURIComponent(d(p));
  }
  util.escapeFragment = l;
  function d(p) {
    return typeof p == "number" ? `${p}` : p.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  util.escapeJsonPointer = d;
  function y(p) {
    return p.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  util.unescapeJsonPointer = y;
  function m(p, v) {
    if (Array.isArray(p))
      for (const $ of p)
        v($);
    else
      v(p);
  }
  util.eachItem = m;
  function _({ mergeNames: p, mergeToName: v, mergeValues: $, resultToName: O }) {
    return (C, j, F, B) => {
      const z = F === void 0 ? j : F instanceof e.Name ? (j instanceof e.Name ? p(C, j, F) : v(C, j, F), F) : j instanceof e.Name ? (v(C, F, j), j) : $(j, F);
      return B === e.Name && !(z instanceof e.Name) ? O(C, z) : z;
    };
  }
  util.mergeEvaluated = {
    props: _({
      mergeNames: (p, v, $) => p.if((0, e._)`${$} !== true && ${v} !== undefined`, () => {
        p.if((0, e._)`${v} === true`, () => p.assign($, !0), () => p.assign($, (0, e._)`${$} || {}`).code((0, e._)`Object.assign(${$}, ${v})`));
      }),
      mergeToName: (p, v, $) => p.if((0, e._)`${$} !== true`, () => {
        v === !0 ? p.assign($, !0) : (p.assign($, (0, e._)`${$} || {}`), w(p, $, v));
      }),
      mergeValues: (p, v) => p === !0 ? !0 : { ...p, ...v },
      resultToName: b
    }),
    items: _({
      mergeNames: (p, v, $) => p.if((0, e._)`${$} !== true && ${v} !== undefined`, () => p.assign($, (0, e._)`${v} === true ? true : ${$} > ${v} ? ${$} : ${v}`)),
      mergeToName: (p, v, $) => p.if((0, e._)`${$} !== true`, () => p.assign($, v === !0 ? !0 : (0, e._)`${$} > ${v} ? ${$} : ${v}`)),
      mergeValues: (p, v) => p === !0 ? !0 : Math.max(p, v),
      resultToName: (p, v) => p.var("items", v)
    })
  };
  function b(p, v) {
    if (v === !0)
      return p.var("props", !0);
    const $ = p.var("props", (0, e._)`{}`);
    return v !== void 0 && w(p, $, v), $;
  }
  util.evaluatedPropsToName = b;
  function w(p, v, $) {
    Object.keys($).forEach((O) => p.assign((0, e._)`${v}${(0, e.getProperty)(O)}`, !0));
  }
  util.setEvaluated = w;
  const f = {};
  function g(p, v) {
    return p.scopeValue("func", {
      ref: v,
      code: f[v.code] || (f[v.code] = new t._Code(v.code))
    });
  }
  util.useFunc = g;
  var c;
  (function(p) {
    p[p.Num = 0] = "Num", p[p.Str = 1] = "Str";
  })(c || (util.Type = c = {}));
  function h(p, v, $) {
    if (p instanceof e.Name) {
      const O = v === c.Num;
      return $ ? O ? (0, e._)`"[" + ${p} + "]"` : (0, e._)`"['" + ${p} + "']"` : O ? (0, e._)`"/" + ${p}` : (0, e._)`"/" + ${p}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return $ ? (0, e.getProperty)(p).toString() : "/" + d(p);
  }
  util.getErrorPath = h;
  function S(p, v, $ = p.opts.strictSchema) {
    if ($) {
      if (v = `strict mode: ${v}`, $ === !0)
        throw new Error(v);
      p.self.logger.warn(v);
    }
  }
  return util.checkStrictMode = S, util;
}
var names = {}, hasRequiredNames;
function requireNames() {
  if (hasRequiredNames) return names;
  hasRequiredNames = 1, Object.defineProperty(names, "__esModule", { value: !0 });
  const e = requireCodegen(), t = {
    // validation function arguments
    data: new e.Name("data"),
    // data passed to validation function
    // args passed from referencing schema
    valCxt: new e.Name("valCxt"),
    // validation/data context - should not be used directly, it is destructured to the names below
    instancePath: new e.Name("instancePath"),
    parentData: new e.Name("parentData"),
    parentDataProperty: new e.Name("parentDataProperty"),
    rootData: new e.Name("rootData"),
    // root data - same as the data passed to the first/top validation function
    dynamicAnchors: new e.Name("dynamicAnchors"),
    // used to support recursiveRef and dynamicRef
    // function scoped variables
    vErrors: new e.Name("vErrors"),
    // null or array of validation errors
    errors: new e.Name("errors"),
    // counter of validation errors
    this: new e.Name("this"),
    // "globals"
    self: new e.Name("self"),
    scope: new e.Name("scope"),
    // JTD serialize/parse name for JSON string and position
    json: new e.Name("json"),
    jsonPos: new e.Name("jsonPos"),
    jsonLen: new e.Name("jsonLen"),
    jsonPart: new e.Name("jsonPart")
  };
  return names.default = t, names;
}
var hasRequiredErrors;
function requireErrors() {
  return hasRequiredErrors || (hasRequiredErrors = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
    const t = requireCodegen(), r = requireUtil(), n = requireNames();
    e.keywordError = {
      message: ({ keyword: f }) => (0, t.str)`must pass "${f}" keyword validation`
    }, e.keyword$DataError = {
      message: ({ keyword: f, schemaType: g }) => g ? (0, t.str)`"${f}" keyword must be ${g} ($data)` : (0, t.str)`"${f}" keyword is invalid ($data)`
    };
    function i(f, g = e.keywordError, c, h) {
      const { it: S } = f, { gen: p, compositeRule: v, allErrors: $ } = S, O = y(f, g, c);
      h ?? (v || $) ? u(p, O) : l(S, (0, t._)`[${O}]`);
    }
    e.reportError = i;
    function s(f, g = e.keywordError, c) {
      const { it: h } = f, { gen: S, compositeRule: p, allErrors: v } = h, $ = y(f, g, c);
      u(S, $), p || v || l(h, n.default.vErrors);
    }
    e.reportExtraError = s;
    function o(f, g) {
      f.assign(n.default.errors, g), f.if((0, t._)`${n.default.vErrors} !== null`, () => f.if(g, () => f.assign((0, t._)`${n.default.vErrors}.length`, g), () => f.assign(n.default.vErrors, null)));
    }
    e.resetErrorsCount = o;
    function a({ gen: f, keyword: g, schemaValue: c, data: h, errsCount: S, it: p }) {
      if (S === void 0)
        throw new Error("ajv implementation error");
      const v = f.name("err");
      f.forRange("i", S, n.default.errors, ($) => {
        f.const(v, (0, t._)`${n.default.vErrors}[${$}]`), f.if((0, t._)`${v}.instancePath === undefined`, () => f.assign((0, t._)`${v}.instancePath`, (0, t.strConcat)(n.default.instancePath, p.errorPath))), f.assign((0, t._)`${v}.schemaPath`, (0, t.str)`${p.errSchemaPath}/${g}`), p.opts.verbose && (f.assign((0, t._)`${v}.schema`, c), f.assign((0, t._)`${v}.data`, h));
      });
    }
    e.extendErrors = a;
    function u(f, g) {
      const c = f.const("err", g);
      f.if((0, t._)`${n.default.vErrors} === null`, () => f.assign(n.default.vErrors, (0, t._)`[${c}]`), (0, t._)`${n.default.vErrors}.push(${c})`), f.code((0, t._)`${n.default.errors}++`);
    }
    function l(f, g) {
      const { gen: c, validateName: h, schemaEnv: S } = f;
      S.$async ? c.throw((0, t._)`new ${f.ValidationError}(${g})`) : (c.assign((0, t._)`${h}.errors`, g), c.return(!1));
    }
    const d = {
      keyword: new t.Name("keyword"),
      schemaPath: new t.Name("schemaPath"),
      // also used in JTD errors
      params: new t.Name("params"),
      propertyName: new t.Name("propertyName"),
      message: new t.Name("message"),
      schema: new t.Name("schema"),
      parentSchema: new t.Name("parentSchema")
    };
    function y(f, g, c) {
      const { createErrors: h } = f.it;
      return h === !1 ? (0, t._)`{}` : m(f, g, c);
    }
    function m(f, g, c = {}) {
      const { gen: h, it: S } = f, p = [
        _(S, c),
        b(f, c)
      ];
      return w(f, g, p), h.object(...p);
    }
    function _({ errorPath: f }, { instancePath: g }) {
      const c = g ? (0, t.str)`${f}${(0, r.getErrorPath)(g, r.Type.Str)}` : f;
      return [n.default.instancePath, (0, t.strConcat)(n.default.instancePath, c)];
    }
    function b({ keyword: f, it: { errSchemaPath: g } }, { schemaPath: c, parentSchema: h }) {
      let S = h ? g : (0, t.str)`${g}/${f}`;
      return c && (S = (0, t.str)`${S}${(0, r.getErrorPath)(c, r.Type.Str)}`), [d.schemaPath, S];
    }
    function w(f, { params: g, message: c }, h) {
      const { keyword: S, data: p, schemaValue: v, it: $ } = f, { opts: O, propertyName: C, topSchemaRef: j, schemaPath: F } = $;
      h.push([d.keyword, S], [d.params, typeof g == "function" ? g(f) : g || (0, t._)`{}`]), O.messages && h.push([d.message, typeof c == "function" ? c(f) : c]), O.verbose && h.push([d.schema, v], [d.parentSchema, (0, t._)`${j}${F}`], [n.default.data, p]), C && h.push([d.propertyName, C]);
    }
  })(errors)), errors;
}
var hasRequiredBoolSchema;
function requireBoolSchema() {
  if (hasRequiredBoolSchema) return boolSchema;
  hasRequiredBoolSchema = 1, Object.defineProperty(boolSchema, "__esModule", { value: !0 }), boolSchema.boolOrEmptySchema = boolSchema.topBoolOrEmptySchema = void 0;
  const e = requireErrors(), t = requireCodegen(), r = requireNames(), n = {
    message: "boolean schema is false"
  };
  function i(a) {
    const { gen: u, schema: l, validateName: d } = a;
    l === !1 ? o(a, !1) : typeof l == "object" && l.$async === !0 ? u.return(r.default.data) : (u.assign((0, t._)`${d}.errors`, null), u.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = i;
  function s(a, u) {
    const { gen: l, schema: d } = a;
    d === !1 ? (l.var(u, !1), o(a)) : l.var(u, !0);
  }
  boolSchema.boolOrEmptySchema = s;
  function o(a, u) {
    const { gen: l, data: d } = a, y = {
      gen: l,
      keyword: "false schema",
      data: d,
      schema: !1,
      schemaCode: !1,
      schemaValue: !1,
      params: {},
      it: a
    };
    (0, e.reportError)(y, n, void 0, u);
  }
  return boolSchema;
}
var dataType = {}, rules = {}, hasRequiredRules;
function requireRules() {
  if (hasRequiredRules) return rules;
  hasRequiredRules = 1, Object.defineProperty(rules, "__esModule", { value: !0 }), rules.getRules = rules.isJSONType = void 0;
  const e = ["string", "number", "integer", "boolean", "null", "object", "array"], t = new Set(e);
  function r(i) {
    return typeof i == "string" && t.has(i);
  }
  rules.isJSONType = r;
  function n() {
    const i = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...i, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, i.number, i.string, i.array, i.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  return rules.getRules = n, rules;
}
var applicability = {}, hasRequiredApplicability;
function requireApplicability() {
  if (hasRequiredApplicability) return applicability;
  hasRequiredApplicability = 1, Object.defineProperty(applicability, "__esModule", { value: !0 }), applicability.shouldUseRule = applicability.shouldUseGroup = applicability.schemaHasRulesForType = void 0;
  function e({ schema: n, self: i }, s) {
    const o = i.RULES.types[s];
    return o && o !== !0 && t(n, o);
  }
  applicability.schemaHasRulesForType = e;
  function t(n, i) {
    return i.rules.some((s) => r(n, s));
  }
  applicability.shouldUseGroup = t;
  function r(n, i) {
    var s;
    return n[i.keyword] !== void 0 || ((s = i.definition.implements) === null || s === void 0 ? void 0 : s.some((o) => n[o] !== void 0));
  }
  return applicability.shouldUseRule = r, applicability;
}
var hasRequiredDataType;
function requireDataType() {
  if (hasRequiredDataType) return dataType;
  hasRequiredDataType = 1, Object.defineProperty(dataType, "__esModule", { value: !0 }), dataType.reportTypeError = dataType.checkDataTypes = dataType.checkDataType = dataType.coerceAndCheckDataType = dataType.getJSONTypes = dataType.getSchemaTypes = dataType.DataType = void 0;
  const e = requireRules(), t = requireApplicability(), r = requireErrors(), n = requireCodegen(), i = requireUtil();
  var s;
  (function(c) {
    c[c.Correct = 0] = "Correct", c[c.Wrong = 1] = "Wrong";
  })(s || (dataType.DataType = s = {}));
  function o(c) {
    const h = a(c.type);
    if (h.includes("null")) {
      if (c.nullable === !1)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!h.length && c.nullable !== void 0)
        throw new Error('"nullable" cannot be used without "type"');
      c.nullable === !0 && h.push("null");
    }
    return h;
  }
  dataType.getSchemaTypes = o;
  function a(c) {
    const h = Array.isArray(c) ? c : c ? [c] : [];
    if (h.every(e.isJSONType))
      return h;
    throw new Error("type must be JSONType or JSONType[]: " + h.join(","));
  }
  dataType.getJSONTypes = a;
  function u(c, h) {
    const { gen: S, data: p, opts: v } = c, $ = d(h, v.coerceTypes), O = h.length > 0 && !($.length === 0 && h.length === 1 && (0, t.schemaHasRulesForType)(c, h[0]));
    if (O) {
      const C = b(h, p, v.strictNumbers, s.Wrong);
      S.if(C, () => {
        $.length ? y(c, h, $) : f(c);
      });
    }
    return O;
  }
  dataType.coerceAndCheckDataType = u;
  const l = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function d(c, h) {
    return h ? c.filter((S) => l.has(S) || h === "array" && S === "array") : [];
  }
  function y(c, h, S) {
    const { gen: p, data: v, opts: $ } = c, O = p.let("dataType", (0, n._)`typeof ${v}`), C = p.let("coerced", (0, n._)`undefined`);
    $.coerceTypes === "array" && p.if((0, n._)`${O} == 'object' && Array.isArray(${v}) && ${v}.length == 1`, () => p.assign(v, (0, n._)`${v}[0]`).assign(O, (0, n._)`typeof ${v}`).if(b(h, v, $.strictNumbers), () => p.assign(C, v))), p.if((0, n._)`${C} !== undefined`);
    for (const F of S)
      (l.has(F) || F === "array" && $.coerceTypes === "array") && j(F);
    p.else(), f(c), p.endIf(), p.if((0, n._)`${C} !== undefined`, () => {
      p.assign(v, C), m(c, C);
    });
    function j(F) {
      switch (F) {
        case "string":
          p.elseIf((0, n._)`${O} == "number" || ${O} == "boolean"`).assign(C, (0, n._)`"" + ${v}`).elseIf((0, n._)`${v} === null`).assign(C, (0, n._)`""`);
          return;
        case "number":
          p.elseIf((0, n._)`${O} == "boolean" || ${v} === null
              || (${O} == "string" && ${v} && ${v} == +${v})`).assign(C, (0, n._)`+${v}`);
          return;
        case "integer":
          p.elseIf((0, n._)`${O} === "boolean" || ${v} === null
              || (${O} === "string" && ${v} && ${v} == +${v} && !(${v} % 1))`).assign(C, (0, n._)`+${v}`);
          return;
        case "boolean":
          p.elseIf((0, n._)`${v} === "false" || ${v} === 0 || ${v} === null`).assign(C, !1).elseIf((0, n._)`${v} === "true" || ${v} === 1`).assign(C, !0);
          return;
        case "null":
          p.elseIf((0, n._)`${v} === "" || ${v} === 0 || ${v} === false`), p.assign(C, null);
          return;
        case "array":
          p.elseIf((0, n._)`${O} === "string" || ${O} === "number"
              || ${O} === "boolean" || ${v} === null`).assign(C, (0, n._)`[${v}]`);
      }
    }
  }
  function m({ gen: c, parentData: h, parentDataProperty: S }, p) {
    c.if((0, n._)`${h} !== undefined`, () => c.assign((0, n._)`${h}[${S}]`, p));
  }
  function _(c, h, S, p = s.Correct) {
    const v = p === s.Correct ? n.operators.EQ : n.operators.NEQ;
    let $;
    switch (c) {
      case "null":
        return (0, n._)`${h} ${v} null`;
      case "array":
        $ = (0, n._)`Array.isArray(${h})`;
        break;
      case "object":
        $ = (0, n._)`${h} && typeof ${h} == "object" && !Array.isArray(${h})`;
        break;
      case "integer":
        $ = O((0, n._)`!(${h} % 1) && !isNaN(${h})`);
        break;
      case "number":
        $ = O();
        break;
      default:
        return (0, n._)`typeof ${h} ${v} ${c}`;
    }
    return p === s.Correct ? $ : (0, n.not)($);
    function O(C = n.nil) {
      return (0, n.and)((0, n._)`typeof ${h} == "number"`, C, S ? (0, n._)`isFinite(${h})` : n.nil);
    }
  }
  dataType.checkDataType = _;
  function b(c, h, S, p) {
    if (c.length === 1)
      return _(c[0], h, S, p);
    let v;
    const $ = (0, i.toHash)(c);
    if ($.array && $.object) {
      const O = (0, n._)`typeof ${h} != "object"`;
      v = $.null ? O : (0, n._)`!${h} || ${O}`, delete $.null, delete $.array, delete $.object;
    } else
      v = n.nil;
    $.number && delete $.integer;
    for (const O in $)
      v = (0, n.and)(v, _(O, h, S, p));
    return v;
  }
  dataType.checkDataTypes = b;
  const w = {
    message: ({ schema: c }) => `must be ${c}`,
    params: ({ schema: c, schemaValue: h }) => typeof c == "string" ? (0, n._)`{type: ${c}}` : (0, n._)`{type: ${h}}`
  };
  function f(c) {
    const h = g(c);
    (0, r.reportError)(h, w);
  }
  dataType.reportTypeError = f;
  function g(c) {
    const { gen: h, data: S, schema: p } = c, v = (0, i.schemaRefOrVal)(c, p, "type");
    return {
      gen: h,
      keyword: "type",
      data: S,
      schema: p.type,
      schemaCode: v,
      schemaValue: v,
      parentSchema: p,
      params: {},
      it: c
    };
  }
  return dataType;
}
var defaults = {}, hasRequiredDefaults;
function requireDefaults() {
  if (hasRequiredDefaults) return defaults;
  hasRequiredDefaults = 1, Object.defineProperty(defaults, "__esModule", { value: !0 }), defaults.assignDefaults = void 0;
  const e = requireCodegen(), t = requireUtil();
  function r(i, s) {
    const { properties: o, items: a } = i.schema;
    if (s === "object" && o)
      for (const u in o)
        n(i, u, o[u].default);
    else s === "array" && Array.isArray(a) && a.forEach((u, l) => n(i, l, u.default));
  }
  defaults.assignDefaults = r;
  function n(i, s, o) {
    const { gen: a, compositeRule: u, data: l, opts: d } = i;
    if (o === void 0)
      return;
    const y = (0, e._)`${l}${(0, e.getProperty)(s)}`;
    if (u) {
      (0, t.checkStrictMode)(i, `default is ignored for: ${y}`);
      return;
    }
    let m = (0, e._)`${y} === undefined`;
    d.useDefaults === "empty" && (m = (0, e._)`${m} || ${y} === null || ${y} === ""`), a.if(m, (0, e._)`${y} = ${(0, e.stringify)(o)}`);
  }
  return defaults;
}
var keyword = {}, code = {}, hasRequiredCode;
function requireCode() {
  if (hasRequiredCode) return code;
  hasRequiredCode = 1, Object.defineProperty(code, "__esModule", { value: !0 }), code.validateUnion = code.validateArray = code.usePattern = code.callValidateCode = code.schemaProperties = code.allSchemaProperties = code.noPropertyInData = code.propertyInData = code.isOwnProperty = code.hasPropFunc = code.reportMissingProp = code.checkMissingProp = code.checkReportMissingProp = void 0;
  const e = requireCodegen(), t = requireUtil(), r = requireNames(), n = requireUtil();
  function i(c, h) {
    const { gen: S, data: p, it: v } = c;
    S.if(d(S, p, h, v.opts.ownProperties), () => {
      c.setParams({ missingProperty: (0, e._)`${h}` }, !0), c.error();
    });
  }
  code.checkReportMissingProp = i;
  function s({ gen: c, data: h, it: { opts: S } }, p, v) {
    return (0, e.or)(...p.map(($) => (0, e.and)(d(c, h, $, S.ownProperties), (0, e._)`${v} = ${$}`)));
  }
  code.checkMissingProp = s;
  function o(c, h) {
    c.setParams({ missingProperty: h }, !0), c.error();
  }
  code.reportMissingProp = o;
  function a(c) {
    return c.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, e._)`Object.prototype.hasOwnProperty`
    });
  }
  code.hasPropFunc = a;
  function u(c, h, S) {
    return (0, e._)`${a(c)}.call(${h}, ${S})`;
  }
  code.isOwnProperty = u;
  function l(c, h, S, p) {
    const v = (0, e._)`${h}${(0, e.getProperty)(S)} !== undefined`;
    return p ? (0, e._)`${v} && ${u(c, h, S)}` : v;
  }
  code.propertyInData = l;
  function d(c, h, S, p) {
    const v = (0, e._)`${h}${(0, e.getProperty)(S)} === undefined`;
    return p ? (0, e.or)(v, (0, e.not)(u(c, h, S))) : v;
  }
  code.noPropertyInData = d;
  function y(c) {
    return c ? Object.keys(c).filter((h) => h !== "__proto__") : [];
  }
  code.allSchemaProperties = y;
  function m(c, h) {
    return y(h).filter((S) => !(0, t.alwaysValidSchema)(c, h[S]));
  }
  code.schemaProperties = m;
  function _({ schemaCode: c, data: h, it: { gen: S, topSchemaRef: p, schemaPath: v, errorPath: $ }, it: O }, C, j, F) {
    const B = F ? (0, e._)`${c}, ${h}, ${p}${v}` : h, z = [
      [r.default.instancePath, (0, e.strConcat)(r.default.instancePath, $)],
      [r.default.parentData, O.parentData],
      [r.default.parentDataProperty, O.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    O.opts.dynamicRef && z.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const J = (0, e._)`${B}, ${S.object(...z)}`;
    return j !== e.nil ? (0, e._)`${C}.call(${j}, ${J})` : (0, e._)`${C}(${J})`;
  }
  code.callValidateCode = _;
  const b = (0, e._)`new RegExp`;
  function w({ gen: c, it: { opts: h } }, S) {
    const p = h.unicodeRegExp ? "u" : "", { regExp: v } = h.code, $ = v(S, p);
    return c.scopeValue("pattern", {
      key: $.toString(),
      ref: $,
      code: (0, e._)`${v.code === "new RegExp" ? b : (0, n.useFunc)(c, v)}(${S}, ${p})`
    });
  }
  code.usePattern = w;
  function f(c) {
    const { gen: h, data: S, keyword: p, it: v } = c, $ = h.name("valid");
    if (v.allErrors) {
      const C = h.let("valid", !0);
      return O(() => h.assign(C, !1)), C;
    }
    return h.var($, !0), O(() => h.break()), $;
    function O(C) {
      const j = h.const("len", (0, e._)`${S}.length`);
      h.forRange("i", 0, j, (F) => {
        c.subschema({
          keyword: p,
          dataProp: F,
          dataPropType: t.Type.Num
        }, $), h.if((0, e.not)($), C);
      });
    }
  }
  code.validateArray = f;
  function g(c) {
    const { gen: h, schema: S, keyword: p, it: v } = c;
    if (!Array.isArray(S))
      throw new Error("ajv implementation error");
    if (S.some((j) => (0, t.alwaysValidSchema)(v, j)) && !v.opts.unevaluated)
      return;
    const O = h.let("valid", !1), C = h.name("_valid");
    h.block(() => S.forEach((j, F) => {
      const B = c.subschema({
        keyword: p,
        schemaProp: F,
        compositeRule: !0
      }, C);
      h.assign(O, (0, e._)`${O} || ${C}`), c.mergeValidEvaluated(B, C) || h.if((0, e.not)(O));
    })), c.result(O, () => c.reset(), () => c.error(!0));
  }
  return code.validateUnion = g, code;
}
var hasRequiredKeyword;
function requireKeyword() {
  if (hasRequiredKeyword) return keyword;
  hasRequiredKeyword = 1, Object.defineProperty(keyword, "__esModule", { value: !0 }), keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
  const e = requireCodegen(), t = requireNames(), r = requireCode(), n = requireErrors();
  function i(m, _) {
    const { gen: b, keyword: w, schema: f, parentSchema: g, it: c } = m, h = _.macro.call(c.self, f, g, c), S = l(b, w, h);
    c.opts.validateSchema !== !1 && c.self.validateSchema(h, !0);
    const p = b.name("valid");
    m.subschema({
      schema: h,
      schemaPath: e.nil,
      errSchemaPath: `${c.errSchemaPath}/${w}`,
      topSchemaRef: S,
      compositeRule: !0
    }, p), m.pass(p, () => m.error(!0));
  }
  keyword.macroKeywordCode = i;
  function s(m, _) {
    var b;
    const { gen: w, keyword: f, schema: g, parentSchema: c, $data: h, it: S } = m;
    u(S, _);
    const p = !h && _.compile ? _.compile.call(S.self, g, c, S) : _.validate, v = l(w, f, p), $ = w.let("valid");
    m.block$data($, O), m.ok((b = _.valid) !== null && b !== void 0 ? b : $);
    function O() {
      if (_.errors === !1)
        F(), _.modifying && o(m), B(() => m.error());
      else {
        const z = _.async ? C() : j();
        _.modifying && o(m), B(() => a(m, z));
      }
    }
    function C() {
      const z = w.let("ruleErrs", null);
      return w.try(() => F((0, e._)`await `), (J) => w.assign($, !1).if((0, e._)`${J} instanceof ${S.ValidationError}`, () => w.assign(z, (0, e._)`${J}.errors`), () => w.throw(J))), z;
    }
    function j() {
      const z = (0, e._)`${v}.errors`;
      return w.assign(z, null), F(e.nil), z;
    }
    function F(z = _.async ? (0, e._)`await ` : e.nil) {
      const J = S.opts.passContext ? t.default.this : t.default.self, x = !("compile" in _ && !h || _.schema === !1);
      w.assign($, (0, e._)`${z}${(0, r.callValidateCode)(m, v, J, x)}`, _.modifying);
    }
    function B(z) {
      var J;
      w.if((0, e.not)((J = _.valid) !== null && J !== void 0 ? J : $), z);
    }
  }
  keyword.funcKeywordCode = s;
  function o(m) {
    const { gen: _, data: b, it: w } = m;
    _.if(w.parentData, () => _.assign(b, (0, e._)`${w.parentData}[${w.parentDataProperty}]`));
  }
  function a(m, _) {
    const { gen: b } = m;
    b.if((0, e._)`Array.isArray(${_})`, () => {
      b.assign(t.default.vErrors, (0, e._)`${t.default.vErrors} === null ? ${_} : ${t.default.vErrors}.concat(${_})`).assign(t.default.errors, (0, e._)`${t.default.vErrors}.length`), (0, n.extendErrors)(m);
    }, () => m.error());
  }
  function u({ schemaEnv: m }, _) {
    if (_.async && !m.$async)
      throw new Error("async keyword in sync schema");
  }
  function l(m, _, b) {
    if (b === void 0)
      throw new Error(`keyword "${_}" failed to compile`);
    return m.scopeValue("keyword", typeof b == "function" ? { ref: b } : { ref: b, code: (0, e.stringify)(b) });
  }
  function d(m, _, b = !1) {
    return !_.length || _.some((w) => w === "array" ? Array.isArray(m) : w === "object" ? m && typeof m == "object" && !Array.isArray(m) : typeof m == w || b && typeof m > "u");
  }
  keyword.validSchemaType = d;
  function y({ schema: m, opts: _, self: b, errSchemaPath: w }, f, g) {
    if (Array.isArray(f.keyword) ? !f.keyword.includes(g) : f.keyword !== g)
      throw new Error("ajv implementation error");
    const c = f.dependencies;
    if (c?.some((h) => !Object.prototype.hasOwnProperty.call(m, h)))
      throw new Error(`parent schema must have dependencies of ${g}: ${c.join(",")}`);
    if (f.validateSchema && !f.validateSchema(m[g])) {
      const S = `keyword "${g}" value is invalid at path "${w}": ` + b.errorsText(f.validateSchema.errors);
      if (_.validateSchema === "log")
        b.logger.error(S);
      else
        throw new Error(S);
    }
  }
  return keyword.validateKeywordUsage = y, keyword;
}
var subschema = {}, hasRequiredSubschema;
function requireSubschema() {
  if (hasRequiredSubschema) return subschema;
  hasRequiredSubschema = 1, Object.defineProperty(subschema, "__esModule", { value: !0 }), subschema.extendSubschemaMode = subschema.extendSubschemaData = subschema.getSubschema = void 0;
  const e = requireCodegen(), t = requireUtil();
  function r(s, { keyword: o, schemaProp: a, schema: u, schemaPath: l, errSchemaPath: d, topSchemaRef: y }) {
    if (o !== void 0 && u !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (o !== void 0) {
      const m = s.schema[o];
      return a === void 0 ? {
        schema: m,
        schemaPath: (0, e._)`${s.schemaPath}${(0, e.getProperty)(o)}`,
        errSchemaPath: `${s.errSchemaPath}/${o}`
      } : {
        schema: m[a],
        schemaPath: (0, e._)`${s.schemaPath}${(0, e.getProperty)(o)}${(0, e.getProperty)(a)}`,
        errSchemaPath: `${s.errSchemaPath}/${o}/${(0, t.escapeFragment)(a)}`
      };
    }
    if (u !== void 0) {
      if (l === void 0 || d === void 0 || y === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: u,
        schemaPath: l,
        topSchemaRef: y,
        errSchemaPath: d
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  subschema.getSubschema = r;
  function n(s, o, { dataProp: a, dataPropType: u, data: l, dataTypes: d, propertyName: y }) {
    if (l !== void 0 && a !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: m } = o;
    if (a !== void 0) {
      const { errorPath: b, dataPathArr: w, opts: f } = o, g = m.let("data", (0, e._)`${o.data}${(0, e.getProperty)(a)}`, !0);
      _(g), s.errorPath = (0, e.str)`${b}${(0, t.getErrorPath)(a, u, f.jsPropertySyntax)}`, s.parentDataProperty = (0, e._)`${a}`, s.dataPathArr = [...w, s.parentDataProperty];
    }
    if (l !== void 0) {
      const b = l instanceof e.Name ? l : m.let("data", l, !0);
      _(b), y !== void 0 && (s.propertyName = y);
    }
    d && (s.dataTypes = d);
    function _(b) {
      s.data = b, s.dataLevel = o.dataLevel + 1, s.dataTypes = [], o.definedProperties = /* @__PURE__ */ new Set(), s.parentData = o.data, s.dataNames = [...o.dataNames, b];
    }
  }
  subschema.extendSubschemaData = n;
  function i(s, { jtdDiscriminator: o, jtdMetadata: a, compositeRule: u, createErrors: l, allErrors: d }) {
    u !== void 0 && (s.compositeRule = u), l !== void 0 && (s.createErrors = l), d !== void 0 && (s.allErrors = d), s.jtdDiscriminator = o, s.jtdMetadata = a;
  }
  return subschema.extendSubschemaMode = i, subschema;
}
var resolve = {}, fastDeepEqual, hasRequiredFastDeepEqual;
function requireFastDeepEqual() {
  return hasRequiredFastDeepEqual || (hasRequiredFastDeepEqual = 1, fastDeepEqual = function e(t, r) {
    if (t === r) return !0;
    if (t && r && typeof t == "object" && typeof r == "object") {
      if (t.constructor !== r.constructor) return !1;
      var n, i, s;
      if (Array.isArray(t)) {
        if (n = t.length, n != r.length) return !1;
        for (i = n; i-- !== 0; )
          if (!e(t[i], r[i])) return !1;
        return !0;
      }
      if (t.constructor === RegExp) return t.source === r.source && t.flags === r.flags;
      if (t.valueOf !== Object.prototype.valueOf) return t.valueOf() === r.valueOf();
      if (t.toString !== Object.prototype.toString) return t.toString() === r.toString();
      if (s = Object.keys(t), n = s.length, n !== Object.keys(r).length) return !1;
      for (i = n; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(r, s[i])) return !1;
      for (i = n; i-- !== 0; ) {
        var o = s[i];
        if (!e(t[o], r[o])) return !1;
      }
      return !0;
    }
    return t !== t && r !== r;
  }), fastDeepEqual;
}
var jsonSchemaTraverse = { exports: {} }, hasRequiredJsonSchemaTraverse;
function requireJsonSchemaTraverse() {
  if (hasRequiredJsonSchemaTraverse) return jsonSchemaTraverse.exports;
  hasRequiredJsonSchemaTraverse = 1;
  var e = jsonSchemaTraverse.exports = function(n, i, s) {
    typeof i == "function" && (s = i, i = {}), s = i.cb || s;
    var o = typeof s == "function" ? s : s.pre || function() {
    }, a = s.post || function() {
    };
    t(i, o, a, n, "", n);
  };
  e.keywords = {
    additionalItems: !0,
    items: !0,
    contains: !0,
    additionalProperties: !0,
    propertyNames: !0,
    not: !0,
    if: !0,
    then: !0,
    else: !0
  }, e.arrayKeywords = {
    items: !0,
    allOf: !0,
    anyOf: !0,
    oneOf: !0
  }, e.propsKeywords = {
    $defs: !0,
    definitions: !0,
    properties: !0,
    patternProperties: !0,
    dependencies: !0
  }, e.skipKeywords = {
    default: !0,
    enum: !0,
    const: !0,
    required: !0,
    maximum: !0,
    minimum: !0,
    exclusiveMaximum: !0,
    exclusiveMinimum: !0,
    multipleOf: !0,
    maxLength: !0,
    minLength: !0,
    pattern: !0,
    format: !0,
    maxItems: !0,
    minItems: !0,
    uniqueItems: !0,
    maxProperties: !0,
    minProperties: !0
  };
  function t(n, i, s, o, a, u, l, d, y, m) {
    if (o && typeof o == "object" && !Array.isArray(o)) {
      i(o, a, u, l, d, y, m);
      for (var _ in o) {
        var b = o[_];
        if (Array.isArray(b)) {
          if (_ in e.arrayKeywords)
            for (var w = 0; w < b.length; w++)
              t(n, i, s, b[w], a + "/" + _ + "/" + w, u, a, _, o, w);
        } else if (_ in e.propsKeywords) {
          if (b && typeof b == "object")
            for (var f in b)
              t(n, i, s, b[f], a + "/" + _ + "/" + r(f), u, a, _, o, f);
        } else (_ in e.keywords || n.allKeys && !(_ in e.skipKeywords)) && t(n, i, s, b, a + "/" + _, u, a, _, o);
      }
      s(o, a, u, l, d, y, m);
    }
  }
  function r(n) {
    return n.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  return jsonSchemaTraverse.exports;
}
var hasRequiredResolve;
function requireResolve() {
  if (hasRequiredResolve) return resolve;
  hasRequiredResolve = 1, Object.defineProperty(resolve, "__esModule", { value: !0 }), resolve.getSchemaRefs = resolve.resolveUrl = resolve.normalizeId = resolve._getFullPath = resolve.getFullPath = resolve.inlineRef = void 0;
  const e = requireUtil(), t = requireFastDeepEqual(), r = requireJsonSchemaTraverse(), n = /* @__PURE__ */ new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function i(w, f = !0) {
    return typeof w == "boolean" ? !0 : f === !0 ? !o(w) : f ? a(w) <= f : !1;
  }
  resolve.inlineRef = i;
  const s = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function o(w) {
    for (const f in w) {
      if (s.has(f))
        return !0;
      const g = w[f];
      if (Array.isArray(g) && g.some(o) || typeof g == "object" && o(g))
        return !0;
    }
    return !1;
  }
  function a(w) {
    let f = 0;
    for (const g in w) {
      if (g === "$ref")
        return 1 / 0;
      if (f++, !n.has(g) && (typeof w[g] == "object" && (0, e.eachItem)(w[g], (c) => f += a(c)), f === 1 / 0))
        return 1 / 0;
    }
    return f;
  }
  function u(w, f = "", g) {
    g !== !1 && (f = y(f));
    const c = w.parse(f);
    return l(w, c);
  }
  resolve.getFullPath = u;
  function l(w, f) {
    return w.serialize(f).split("#")[0] + "#";
  }
  resolve._getFullPath = l;
  const d = /#\/?$/;
  function y(w) {
    return w ? w.replace(d, "") : "";
  }
  resolve.normalizeId = y;
  function m(w, f, g) {
    return g = y(g), w.resolve(f, g);
  }
  resolve.resolveUrl = m;
  const _ = /^[a-z_][-a-z0-9._]*$/i;
  function b(w, f) {
    if (typeof w == "boolean")
      return {};
    const { schemaId: g, uriResolver: c } = this.opts, h = y(w[g] || f), S = { "": h }, p = u(c, h, !1), v = {}, $ = /* @__PURE__ */ new Set();
    return r(w, { allKeys: !0 }, (j, F, B, z) => {
      if (z === void 0)
        return;
      const J = p + F;
      let x = S[z];
      typeof j[g] == "string" && (x = re.call(this, j[g])), ne.call(this, j.$anchor), ne.call(this, j.$dynamicAnchor), S[F] = x;
      function re(H) {
        const se = this.opts.uriResolver.resolve;
        if (H = y(x ? se(x, H) : H), $.has(H))
          throw C(H);
        $.add(H);
        let A = this.refs[H];
        return typeof A == "string" && (A = this.refs[A]), typeof A == "object" ? O(j, A.schema, H) : H !== y(J) && (H[0] === "#" ? (O(j, v[H], H), v[H] = j) : this.refs[H] = J), H;
      }
      function ne(H) {
        if (typeof H == "string") {
          if (!_.test(H))
            throw new Error(`invalid anchor "${H}"`);
          re.call(this, `#${H}`);
        }
      }
    }), v;
    function O(j, F, B) {
      if (F !== void 0 && !t(j, F))
        throw C(B);
    }
    function C(j) {
      return new Error(`reference "${j}" resolves to more than one schema`);
    }
  }
  return resolve.getSchemaRefs = b, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const e = requireBoolSchema(), t = requireDataType(), r = requireApplicability(), n = requireDataType(), i = requireDefaults(), s = requireKeyword(), o = requireSubschema(), a = requireCodegen(), u = requireNames(), l = requireResolve(), d = requireUtil(), y = requireErrors();
  function m(k) {
    if (p(k) && ($(k), S(k))) {
      f(k);
      return;
    }
    _(k, () => (0, e.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = m;
  function _({ gen: k, validateName: q, schema: T, schemaEnv: L, opts: D }, W) {
    D.code.es5 ? k.func(q, (0, a._)`${u.default.data}, ${u.default.valCxt}`, L.$async, () => {
      k.code((0, a._)`"use strict"; ${c(T, D)}`), w(k, D), k.code(W);
    }) : k.func(q, (0, a._)`${u.default.data}, ${b(D)}`, L.$async, () => k.code(c(T, D)).code(W));
  }
  function b(k) {
    return (0, a._)`{${u.default.instancePath}="", ${u.default.parentData}, ${u.default.parentDataProperty}, ${u.default.rootData}=${u.default.data}${k.dynamicRef ? (0, a._)`, ${u.default.dynamicAnchors}={}` : a.nil}}={}`;
  }
  function w(k, q) {
    k.if(u.default.valCxt, () => {
      k.var(u.default.instancePath, (0, a._)`${u.default.valCxt}.${u.default.instancePath}`), k.var(u.default.parentData, (0, a._)`${u.default.valCxt}.${u.default.parentData}`), k.var(u.default.parentDataProperty, (0, a._)`${u.default.valCxt}.${u.default.parentDataProperty}`), k.var(u.default.rootData, (0, a._)`${u.default.valCxt}.${u.default.rootData}`), q.dynamicRef && k.var(u.default.dynamicAnchors, (0, a._)`${u.default.valCxt}.${u.default.dynamicAnchors}`);
    }, () => {
      k.var(u.default.instancePath, (0, a._)`""`), k.var(u.default.parentData, (0, a._)`undefined`), k.var(u.default.parentDataProperty, (0, a._)`undefined`), k.var(u.default.rootData, u.default.data), q.dynamicRef && k.var(u.default.dynamicAnchors, (0, a._)`{}`);
    });
  }
  function f(k) {
    const { schema: q, opts: T, gen: L } = k;
    _(k, () => {
      T.$comment && q.$comment && z(k), j(k), L.let(u.default.vErrors, null), L.let(u.default.errors, 0), T.unevaluated && g(k), O(k), J(k);
    });
  }
  function g(k) {
    const { gen: q, validateName: T } = k;
    k.evaluated = q.const("evaluated", (0, a._)`${T}.evaluated`), q.if((0, a._)`${k.evaluated}.dynamicProps`, () => q.assign((0, a._)`${k.evaluated}.props`, (0, a._)`undefined`)), q.if((0, a._)`${k.evaluated}.dynamicItems`, () => q.assign((0, a._)`${k.evaluated}.items`, (0, a._)`undefined`));
  }
  function c(k, q) {
    const T = typeof k == "object" && k[q.schemaId];
    return T && (q.code.source || q.code.process) ? (0, a._)`/*# sourceURL=${T} */` : a.nil;
  }
  function h(k, q) {
    if (p(k) && ($(k), S(k))) {
      v(k, q);
      return;
    }
    (0, e.boolOrEmptySchema)(k, q);
  }
  function S({ schema: k, self: q }) {
    if (typeof k == "boolean")
      return !k;
    for (const T in k)
      if (q.RULES.all[T])
        return !0;
    return !1;
  }
  function p(k) {
    return typeof k.schema != "boolean";
  }
  function v(k, q) {
    const { schema: T, gen: L, opts: D } = k;
    D.$comment && T.$comment && z(k), F(k), B(k);
    const W = L.const("_errs", u.default.errors);
    O(k, W), L.var(q, (0, a._)`${W} === ${u.default.errors}`);
  }
  function $(k) {
    (0, d.checkUnknownRules)(k), C(k);
  }
  function O(k, q) {
    if (k.opts.jtd)
      return re(k, [], !1, q);
    const T = (0, t.getSchemaTypes)(k.schema), L = (0, t.coerceAndCheckDataType)(k, T);
    re(k, T, !L, q);
  }
  function C(k) {
    const { schema: q, errSchemaPath: T, opts: L, self: D } = k;
    q.$ref && L.ignoreKeywordsWithRef && (0, d.schemaHasRulesButRef)(q, D.RULES) && D.logger.warn(`$ref: keywords ignored in schema at path "${T}"`);
  }
  function j(k) {
    const { schema: q, opts: T } = k;
    q.default !== void 0 && T.useDefaults && T.strictSchema && (0, d.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function F(k) {
    const q = k.schema[k.opts.schemaId];
    q && (k.baseId = (0, l.resolveUrl)(k.opts.uriResolver, k.baseId, q));
  }
  function B(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function z({ gen: k, schemaEnv: q, schema: T, errSchemaPath: L, opts: D }) {
    const W = T.$comment;
    if (D.$comment === !0)
      k.code((0, a._)`${u.default.self}.logger.log(${W})`);
    else if (typeof D.$comment == "function") {
      const Y = (0, a.str)`${L}/$comment`, te = k.scopeValue("root", { ref: q.root });
      k.code((0, a._)`${u.default.self}.opts.$comment(${W}, ${Y}, ${te}.schema)`);
    }
  }
  function J(k) {
    const { gen: q, schemaEnv: T, validateName: L, ValidationError: D, opts: W } = k;
    T.$async ? q.if((0, a._)`${u.default.errors} === 0`, () => q.return(u.default.data), () => q.throw((0, a._)`new ${D}(${u.default.vErrors})`)) : (q.assign((0, a._)`${L}.errors`, u.default.vErrors), W.unevaluated && x(k), q.return((0, a._)`${u.default.errors} === 0`));
  }
  function x({ gen: k, evaluated: q, props: T, items: L }) {
    T instanceof a.Name && k.assign((0, a._)`${q}.props`, T), L instanceof a.Name && k.assign((0, a._)`${q}.items`, L);
  }
  function re(k, q, T, L) {
    const { gen: D, schema: W, data: Y, allErrors: te, opts: X, self: Z } = k, { RULES: Q } = Z;
    if (W.$ref && (X.ignoreKeywordsWithRef || !(0, d.schemaHasRulesButRef)(W, Q))) {
      D.block(() => V(k, "$ref", Q.all.$ref.definition));
      return;
    }
    X.jtd || H(k, q), D.block(() => {
      for (const ee of Q.rules)
        ie(ee);
      ie(Q.post);
    });
    function ie(ee) {
      (0, r.shouldUseGroup)(W, ee) && (ee.type ? (D.if((0, n.checkDataType)(ee.type, Y, X.strictNumbers)), ne(k, ee), q.length === 1 && q[0] === ee.type && T && (D.else(), (0, n.reportTypeError)(k)), D.endIf()) : ne(k, ee), te || D.if((0, a._)`${u.default.errors} === ${L || 0}`));
    }
  }
  function ne(k, q) {
    const { gen: T, schema: L, opts: { useDefaults: D } } = k;
    D && (0, i.assignDefaults)(k, q.type), T.block(() => {
      for (const W of q.rules)
        (0, r.shouldUseRule)(L, W) && V(k, W.keyword, W.definition, q.type);
    });
  }
  function H(k, q) {
    k.schemaEnv.meta || !k.opts.strictTypes || (se(k, q), k.opts.allowUnionTypes || A(k, q), R(k, k.dataTypes));
  }
  function se(k, q) {
    if (q.length) {
      if (!k.dataTypes.length) {
        k.dataTypes = q;
        return;
      }
      q.forEach((T) => {
        P(k.dataTypes, T) || I(k, `type "${T}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), E(k, q);
    }
  }
  function A(k, q) {
    q.length > 1 && !(q.length === 2 && q.includes("null")) && I(k, "use allowUnionTypes to allow union type keyword");
  }
  function R(k, q) {
    const T = k.self.RULES.all;
    for (const L in T) {
      const D = T[L];
      if (typeof D == "object" && (0, r.shouldUseRule)(k.schema, D)) {
        const { type: W } = D.definition;
        W.length && !W.some((Y) => N(q, Y)) && I(k, `missing type "${W.join(",")}" for keyword "${L}"`);
      }
    }
  }
  function N(k, q) {
    return k.includes(q) || q === "number" && k.includes("integer");
  }
  function P(k, q) {
    return k.includes(q) || q === "integer" && k.includes("number");
  }
  function E(k, q) {
    const T = [];
    for (const L of k.dataTypes)
      P(q, L) ? T.push(L) : q.includes("integer") && L === "number" && T.push("integer");
    k.dataTypes = T;
  }
  function I(k, q) {
    const T = k.schemaEnv.baseId + k.errSchemaPath;
    q += ` at "${T}" (strictTypes)`, (0, d.checkStrictMode)(k, q, k.opts.strictTypes);
  }
  class M {
    constructor(q, T, L) {
      if ((0, s.validateKeywordUsage)(q, T, L), this.gen = q.gen, this.allErrors = q.allErrors, this.keyword = L, this.data = q.data, this.schema = q.schema[L], this.$data = T.$data && q.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, d.schemaRefOrVal)(q, this.schema, L, this.$data), this.schemaType = T.schemaType, this.parentSchema = q.schema, this.params = {}, this.it = q, this.def = T, this.$data)
        this.schemaCode = q.gen.const("vSchema", K(this.$data, q));
      else if (this.schemaCode = this.schemaValue, !(0, s.validSchemaType)(this.schema, T.schemaType, T.allowUndefined))
        throw new Error(`${L} value must be ${JSON.stringify(T.schemaType)}`);
      ("code" in T ? T.trackErrors : T.errors !== !1) && (this.errsCount = q.gen.const("_errs", u.default.errors));
    }
    result(q, T, L) {
      this.failResult((0, a.not)(q), T, L);
    }
    failResult(q, T, L) {
      this.gen.if(q), L ? L() : this.error(), T ? (this.gen.else(), T(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(q, T) {
      this.failResult((0, a.not)(q), void 0, T);
    }
    fail(q) {
      if (q === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(q), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(q) {
      if (!this.$data)
        return this.fail(q);
      const { schemaCode: T } = this;
      this.fail((0, a._)`${T} !== undefined && (${(0, a.or)(this.invalid$data(), q)})`);
    }
    error(q, T, L) {
      if (T) {
        this.setParams(T), this._error(q, L), this.setParams({});
        return;
      }
      this._error(q, L);
    }
    _error(q, T) {
      (q ? y.reportExtraError : y.reportError)(this, this.def.error, T);
    }
    $dataError() {
      (0, y.reportError)(this, this.def.$dataError || y.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, y.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(q) {
      this.allErrors || this.gen.if(q);
    }
    setParams(q, T) {
      T ? Object.assign(this.params, q) : this.params = q;
    }
    block$data(q, T, L = a.nil) {
      this.gen.block(() => {
        this.check$data(q, L), T();
      });
    }
    check$data(q = a.nil, T = a.nil) {
      if (!this.$data)
        return;
      const { gen: L, schemaCode: D, schemaType: W, def: Y } = this;
      L.if((0, a.or)((0, a._)`${D} === undefined`, T)), q !== a.nil && L.assign(q, !0), (W.length || Y.validateSchema) && (L.elseIf(this.invalid$data()), this.$dataError(), q !== a.nil && L.assign(q, !1)), L.else();
    }
    invalid$data() {
      const { gen: q, schemaCode: T, schemaType: L, def: D, it: W } = this;
      return (0, a.or)(Y(), te());
      function Y() {
        if (L.length) {
          if (!(T instanceof a.Name))
            throw new Error("ajv implementation error");
          const X = Array.isArray(L) ? L : [L];
          return (0, a._)`${(0, n.checkDataTypes)(X, T, W.opts.strictNumbers, n.DataType.Wrong)}`;
        }
        return a.nil;
      }
      function te() {
        if (D.validateSchema) {
          const X = q.scopeValue("validate$data", { ref: D.validateSchema });
          return (0, a._)`!${X}(${T})`;
        }
        return a.nil;
      }
    }
    subschema(q, T) {
      const L = (0, o.getSubschema)(this.it, q);
      (0, o.extendSubschemaData)(L, this.it, q), (0, o.extendSubschemaMode)(L, q);
      const D = { ...this.it, ...L, items: void 0, props: void 0 };
      return h(D, T), D;
    }
    mergeEvaluated(q, T) {
      const { it: L, gen: D } = this;
      L.opts.unevaluated && (L.props !== !0 && q.props !== void 0 && (L.props = d.mergeEvaluated.props(D, q.props, L.props, T)), L.items !== !0 && q.items !== void 0 && (L.items = d.mergeEvaluated.items(D, q.items, L.items, T)));
    }
    mergeValidEvaluated(q, T) {
      const { it: L, gen: D } = this;
      if (L.opts.unevaluated && (L.props !== !0 || L.items !== !0))
        return D.if(T, () => this.mergeEvaluated(q, a.Name)), !0;
    }
  }
  validate.KeywordCxt = M;
  function V(k, q, T, L) {
    const D = new M(k, T, q);
    "code" in T ? T.code(D, L) : D.$data && T.validate ? (0, s.funcKeywordCode)(D, T) : "macro" in T ? (0, s.macroKeywordCode)(D, T) : (T.compile || T.validate) && (0, s.funcKeywordCode)(D, T);
  }
  const U = /^\/(?:[^~]|~0|~1)*$/, G = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function K(k, { dataLevel: q, dataNames: T, dataPathArr: L }) {
    let D, W;
    if (k === "")
      return u.default.rootData;
    if (k[0] === "/") {
      if (!U.test(k))
        throw new Error(`Invalid JSON-pointer: ${k}`);
      D = k, W = u.default.rootData;
    } else {
      const Z = G.exec(k);
      if (!Z)
        throw new Error(`Invalid JSON-pointer: ${k}`);
      const Q = +Z[1];
      if (D = Z[2], D === "#") {
        if (Q >= q)
          throw new Error(X("property/index", Q));
        return L[q - Q];
      }
      if (Q > q)
        throw new Error(X("data", Q));
      if (W = T[q - Q], !D)
        return W;
    }
    let Y = W;
    const te = D.split("/");
    for (const Z of te)
      Z && (W = (0, a._)`${W}${(0, a.getProperty)((0, d.unescapeJsonPointer)(Z))}`, Y = (0, a._)`${Y} && ${W}`);
    return Y;
    function X(Z, Q) {
      return `Cannot access ${Z} ${Q} levels up, current level is ${q}`;
    }
  }
  return validate.getData = K, validate;
}
var validation_error = {}, hasRequiredValidation_error;
function requireValidation_error() {
  if (hasRequiredValidation_error) return validation_error;
  hasRequiredValidation_error = 1, Object.defineProperty(validation_error, "__esModule", { value: !0 });
  class e extends Error {
    constructor(r) {
      super("validation failed"), this.errors = r, this.ajv = this.validation = !0;
    }
  }
  return validation_error.default = e, validation_error;
}
var ref_error = {}, hasRequiredRef_error;
function requireRef_error() {
  if (hasRequiredRef_error) return ref_error;
  hasRequiredRef_error = 1, Object.defineProperty(ref_error, "__esModule", { value: !0 });
  const e = requireResolve();
  class t extends Error {
    constructor(n, i, s, o) {
      super(o || `can't resolve reference ${s} from id ${i}`), this.missingRef = (0, e.resolveUrl)(n, i, s), this.missingSchema = (0, e.normalizeId)((0, e.getFullPath)(n, this.missingRef));
    }
  }
  return ref_error.default = t, ref_error;
}
var compile = {}, hasRequiredCompile;
function requireCompile() {
  if (hasRequiredCompile) return compile;
  hasRequiredCompile = 1, Object.defineProperty(compile, "__esModule", { value: !0 }), compile.resolveSchema = compile.getCompilingSchema = compile.resolveRef = compile.compileSchema = compile.SchemaEnv = void 0;
  const e = requireCodegen(), t = requireValidation_error(), r = requireNames(), n = requireResolve(), i = requireUtil(), s = requireValidate();
  class o {
    constructor(g) {
      var c;
      this.refs = {}, this.dynamicAnchors = {};
      let h;
      typeof g.schema == "object" && (h = g.schema), this.schema = g.schema, this.schemaId = g.schemaId, this.root = g.root || this, this.baseId = (c = g.baseId) !== null && c !== void 0 ? c : (0, n.normalizeId)(h?.[g.schemaId || "$id"]), this.schemaPath = g.schemaPath, this.localRefs = g.localRefs, this.meta = g.meta, this.$async = h?.$async, this.refs = {};
    }
  }
  compile.SchemaEnv = o;
  function a(f) {
    const g = d.call(this, f);
    if (g)
      return g;
    const c = (0, n.getFullPath)(this.opts.uriResolver, f.root.baseId), { es5: h, lines: S } = this.opts.code, { ownProperties: p } = this.opts, v = new e.CodeGen(this.scope, { es5: h, lines: S, ownProperties: p });
    let $;
    f.$async && ($ = v.scopeValue("Error", {
      ref: t.default,
      code: (0, e._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const O = v.scopeName("validate");
    f.validateName = O;
    const C = {
      gen: v,
      allErrors: this.opts.allErrors,
      data: r.default.data,
      parentData: r.default.parentData,
      parentDataProperty: r.default.parentDataProperty,
      dataNames: [r.default.data],
      dataPathArr: [e.nil],
      // TODO can its length be used as dataLevel if nil is removed?
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: v.scopeValue("schema", this.opts.code.source === !0 ? { ref: f.schema, code: (0, e.stringify)(f.schema) } : { ref: f.schema }),
      validateName: O,
      ValidationError: $,
      schema: f.schema,
      schemaEnv: f,
      rootId: c,
      baseId: f.baseId || c,
      schemaPath: e.nil,
      errSchemaPath: f.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, e._)`""`,
      opts: this.opts,
      self: this
    };
    let j;
    try {
      this._compilations.add(f), (0, s.validateFunctionCode)(C), v.optimize(this.opts.code.optimize);
      const F = v.toString();
      j = `${v.scopeRefs(r.default.scope)}return ${F}`, this.opts.code.process && (j = this.opts.code.process(j, f));
      const z = new Function(`${r.default.self}`, `${r.default.scope}`, j)(this, this.scope.get());
      if (this.scope.value(O, { ref: z }), z.errors = null, z.schema = f.schema, z.schemaEnv = f, f.$async && (z.$async = !0), this.opts.code.source === !0 && (z.source = { validateName: O, validateCode: F, scopeValues: v._values }), this.opts.unevaluated) {
        const { props: J, items: x } = C;
        z.evaluated = {
          props: J instanceof e.Name ? void 0 : J,
          items: x instanceof e.Name ? void 0 : x,
          dynamicProps: J instanceof e.Name,
          dynamicItems: x instanceof e.Name
        }, z.source && (z.source.evaluated = (0, e.stringify)(z.evaluated));
      }
      return f.validate = z, f;
    } catch (F) {
      throw delete f.validate, delete f.validateName, j && this.logger.error("Error compiling schema, function code:", j), F;
    } finally {
      this._compilations.delete(f);
    }
  }
  compile.compileSchema = a;
  function u(f, g, c) {
    var h;
    c = (0, n.resolveUrl)(this.opts.uriResolver, g, c);
    const S = f.refs[c];
    if (S)
      return S;
    let p = m.call(this, f, c);
    if (p === void 0) {
      const v = (h = f.localRefs) === null || h === void 0 ? void 0 : h[c], { schemaId: $ } = this.opts;
      v && (p = new o({ schema: v, schemaId: $, root: f, baseId: g }));
    }
    if (p !== void 0)
      return f.refs[c] = l.call(this, p);
  }
  compile.resolveRef = u;
  function l(f) {
    return (0, n.inlineRef)(f.schema, this.opts.inlineRefs) ? f.schema : f.validate ? f : a.call(this, f);
  }
  function d(f) {
    for (const g of this._compilations)
      if (y(g, f))
        return g;
  }
  compile.getCompilingSchema = d;
  function y(f, g) {
    return f.schema === g.schema && f.root === g.root && f.baseId === g.baseId;
  }
  function m(f, g) {
    let c;
    for (; typeof (c = this.refs[g]) == "string"; )
      g = c;
    return c || this.schemas[g] || _.call(this, f, g);
  }
  function _(f, g) {
    const c = this.opts.uriResolver.parse(g), h = (0, n._getFullPath)(this.opts.uriResolver, c);
    let S = (0, n.getFullPath)(this.opts.uriResolver, f.baseId, void 0);
    if (Object.keys(f.schema).length > 0 && h === S)
      return w.call(this, c, f);
    const p = (0, n.normalizeId)(h), v = this.refs[p] || this.schemas[p];
    if (typeof v == "string") {
      const $ = _.call(this, f, v);
      return typeof $?.schema != "object" ? void 0 : w.call(this, c, $);
    }
    if (typeof v?.schema == "object") {
      if (v.validate || a.call(this, v), p === (0, n.normalizeId)(g)) {
        const { schema: $ } = v, { schemaId: O } = this.opts, C = $[O];
        return C && (S = (0, n.resolveUrl)(this.opts.uriResolver, S, C)), new o({ schema: $, schemaId: O, root: f, baseId: S });
      }
      return w.call(this, c, v);
    }
  }
  compile.resolveSchema = _;
  const b = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function w(f, { baseId: g, schema: c, root: h }) {
    var S;
    if (((S = f.fragment) === null || S === void 0 ? void 0 : S[0]) !== "/")
      return;
    for (const $ of f.fragment.slice(1).split("/")) {
      if (typeof c == "boolean")
        return;
      const O = c[(0, i.unescapeFragment)($)];
      if (O === void 0)
        return;
      c = O;
      const C = typeof c == "object" && c[this.opts.schemaId];
      !b.has($) && C && (g = (0, n.resolveUrl)(this.opts.uriResolver, g, C));
    }
    let p;
    if (typeof c != "boolean" && c.$ref && !(0, i.schemaHasRulesButRef)(c, this.RULES)) {
      const $ = (0, n.resolveUrl)(this.opts.uriResolver, g, c.$ref);
      p = _.call(this, h, $);
    }
    const { schemaId: v } = this.opts;
    if (p = p || new o({ schema: c, schemaId: v, root: h, baseId: g }), p.schema !== p.root.schema)
      return p;
  }
  return compile;
}
const $id$1 = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", description = "Meta-schema for $data reference (JSON AnySchema extension proposal)", type$1 = "object", required$1 = ["$data"], properties$2 = { $data: { type: "string", anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }] } }, additionalProperties$1 = !1, require$$9 = {
  $id: $id$1,
  description,
  type: type$1,
  required: required$1,
  properties: properties$2,
  additionalProperties: additionalProperties$1
};
var uri = {}, fastUri = { exports: {} }, utils, hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  const e = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), t = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  function r(m) {
    let _ = "", b = 0, w = 0;
    for (w = 0; w < m.length; w++)
      if (b = m[w].charCodeAt(0), b !== 48) {
        if (!(b >= 48 && b <= 57 || b >= 65 && b <= 70 || b >= 97 && b <= 102))
          return "";
        _ += m[w];
        break;
      }
    for (w += 1; w < m.length; w++) {
      if (b = m[w].charCodeAt(0), !(b >= 48 && b <= 57 || b >= 65 && b <= 70 || b >= 97 && b <= 102))
        return "";
      _ += m[w];
    }
    return _;
  }
  const n = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  function i(m) {
    return m.length = 0, !0;
  }
  function s(m, _, b) {
    if (m.length) {
      const w = r(m);
      if (w !== "")
        _.push(w);
      else
        return b.error = !0, !1;
      m.length = 0;
    }
    return !0;
  }
  function o(m) {
    let _ = 0;
    const b = { error: !1, address: "", zone: "" }, w = [], f = [];
    let g = !1, c = !1, h = s;
    for (let S = 0; S < m.length; S++) {
      const p = m[S];
      if (!(p === "[" || p === "]"))
        if (p === ":") {
          if (g === !0 && (c = !0), !h(f, w, b))
            break;
          if (++_ > 7) {
            b.error = !0;
            break;
          }
          S > 0 && m[S - 1] === ":" && (g = !0), w.push(":");
          continue;
        } else if (p === "%") {
          if (!h(f, w, b))
            break;
          h = i;
        } else {
          f.push(p);
          continue;
        }
    }
    return f.length && (h === i ? b.zone = f.join("") : c ? w.push(f.join("")) : w.push(r(f))), b.address = w.join(""), b;
  }
  function a(m) {
    if (u(m, ":") < 2)
      return { host: m, isIPV6: !1 };
    const _ = o(m);
    if (_.error)
      return { host: m, isIPV6: !1 };
    {
      let b = _.address, w = _.address;
      return _.zone && (b += "%" + _.zone, w += "%25" + _.zone), { host: b, isIPV6: !0, escapedHost: w };
    }
  }
  function u(m, _) {
    let b = 0;
    for (let w = 0; w < m.length; w++)
      m[w] === _ && b++;
    return b;
  }
  function l(m) {
    let _ = m;
    const b = [];
    let w = -1, f = 0;
    for (; f = _.length; ) {
      if (f === 1) {
        if (_ === ".")
          break;
        if (_ === "/") {
          b.push("/");
          break;
        } else {
          b.push(_);
          break;
        }
      } else if (f === 2) {
        if (_[0] === ".") {
          if (_[1] === ".")
            break;
          if (_[1] === "/") {
            _ = _.slice(2);
            continue;
          }
        } else if (_[0] === "/" && (_[1] === "." || _[1] === "/")) {
          b.push("/");
          break;
        }
      } else if (f === 3 && _ === "/..") {
        b.length !== 0 && b.pop(), b.push("/");
        break;
      }
      if (_[0] === ".") {
        if (_[1] === ".") {
          if (_[2] === "/") {
            _ = _.slice(3);
            continue;
          }
        } else if (_[1] === "/") {
          _ = _.slice(2);
          continue;
        }
      } else if (_[0] === "/" && _[1] === ".") {
        if (_[2] === "/") {
          _ = _.slice(2);
          continue;
        } else if (_[2] === "." && _[3] === "/") {
          _ = _.slice(3), b.length !== 0 && b.pop();
          continue;
        }
      }
      if ((w = _.indexOf("/", 1)) === -1) {
        b.push(_);
        break;
      } else
        b.push(_.slice(0, w)), _ = _.slice(w);
    }
    return b.join("");
  }
  function d(m, _) {
    const b = _ !== !0 ? escape : unescape;
    return m.scheme !== void 0 && (m.scheme = b(m.scheme)), m.userinfo !== void 0 && (m.userinfo = b(m.userinfo)), m.host !== void 0 && (m.host = b(m.host)), m.path !== void 0 && (m.path = b(m.path)), m.query !== void 0 && (m.query = b(m.query)), m.fragment !== void 0 && (m.fragment = b(m.fragment)), m;
  }
  function y(m) {
    const _ = [];
    if (m.userinfo !== void 0 && (_.push(m.userinfo), _.push("@")), m.host !== void 0) {
      let b = unescape(m.host);
      if (!t(b)) {
        const w = a(b);
        w.isIPV6 === !0 ? b = `[${w.escapedHost}]` : b = m.host;
      }
      _.push(b);
    }
    return (typeof m.port == "number" || typeof m.port == "string") && (_.push(":"), _.push(String(m.port))), _.length ? _.join("") : void 0;
  }
  return utils = {
    nonSimpleDomain: n,
    recomposeAuthority: y,
    normalizeComponentEncoding: d,
    removeDotSegments: l,
    isIPv4: t,
    isUUID: e,
    normalizeIPv6: a,
    stringArrayToHexStripped: r
  }, utils;
}
var schemes, hasRequiredSchemes;
function requireSchemes() {
  if (hasRequiredSchemes) return schemes;
  hasRequiredSchemes = 1;
  const { isUUID: e } = requireUtils(), t = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu, r = (
    /** @type {const} */
    [
      "http",
      "https",
      "ws",
      "wss",
      "urn",
      "urn:uuid"
    ]
  );
  function n(p) {
    return r.indexOf(
      /** @type {*} */
      p
    ) !== -1;
  }
  function i(p) {
    return p.secure === !0 ? !0 : p.secure === !1 ? !1 : p.scheme ? p.scheme.length === 3 && (p.scheme[0] === "w" || p.scheme[0] === "W") && (p.scheme[1] === "s" || p.scheme[1] === "S") && (p.scheme[2] === "s" || p.scheme[2] === "S") : !1;
  }
  function s(p) {
    return p.host || (p.error = p.error || "HTTP URIs must have a host."), p;
  }
  function o(p) {
    const v = String(p.scheme).toLowerCase() === "https";
    return (p.port === (v ? 443 : 80) || p.port === "") && (p.port = void 0), p.path || (p.path = "/"), p;
  }
  function a(p) {
    return p.secure = i(p), p.resourceName = (p.path || "/") + (p.query ? "?" + p.query : ""), p.path = void 0, p.query = void 0, p;
  }
  function u(p) {
    if ((p.port === (i(p) ? 443 : 80) || p.port === "") && (p.port = void 0), typeof p.secure == "boolean" && (p.scheme = p.secure ? "wss" : "ws", p.secure = void 0), p.resourceName) {
      const [v, $] = p.resourceName.split("?");
      p.path = v && v !== "/" ? v : void 0, p.query = $, p.resourceName = void 0;
    }
    return p.fragment = void 0, p;
  }
  function l(p, v) {
    if (!p.path)
      return p.error = "URN can not be parsed", p;
    const $ = p.path.match(t);
    if ($) {
      const O = v.scheme || p.scheme || "urn";
      p.nid = $[1].toLowerCase(), p.nss = $[2];
      const C = `${O}:${v.nid || p.nid}`, j = S(C);
      p.path = void 0, j && (p = j.parse(p, v));
    } else
      p.error = p.error || "URN can not be parsed.";
    return p;
  }
  function d(p, v) {
    if (p.nid === void 0)
      throw new Error("URN without nid cannot be serialized");
    const $ = v.scheme || p.scheme || "urn", O = p.nid.toLowerCase(), C = `${$}:${v.nid || O}`, j = S(C);
    j && (p = j.serialize(p, v));
    const F = p, B = p.nss;
    return F.path = `${O || v.nid}:${B}`, v.skipEscape = !0, F;
  }
  function y(p, v) {
    const $ = p;
    return $.uuid = $.nss, $.nss = void 0, !v.tolerant && (!$.uuid || !e($.uuid)) && ($.error = $.error || "UUID is not valid."), $;
  }
  function m(p) {
    const v = p;
    return v.nss = (p.uuid || "").toLowerCase(), v;
  }
  const _ = (
    /** @type {SchemeHandler} */
    {
      scheme: "http",
      domainHost: !0,
      parse: s,
      serialize: o
    }
  ), b = (
    /** @type {SchemeHandler} */
    {
      scheme: "https",
      domainHost: _.domainHost,
      parse: s,
      serialize: o
    }
  ), w = (
    /** @type {SchemeHandler} */
    {
      scheme: "ws",
      domainHost: !0,
      parse: a,
      serialize: u
    }
  ), f = (
    /** @type {SchemeHandler} */
    {
      scheme: "wss",
      domainHost: w.domainHost,
      parse: w.parse,
      serialize: w.serialize
    }
  ), h = (
    /** @type {Record<SchemeName, SchemeHandler>} */
    {
      http: _,
      https: b,
      ws: w,
      wss: f,
      urn: (
        /** @type {SchemeHandler} */
        {
          scheme: "urn",
          parse: l,
          serialize: d,
          skipNormalize: !0
        }
      ),
      "urn:uuid": (
        /** @type {SchemeHandler} */
        {
          scheme: "urn:uuid",
          parse: y,
          serialize: m,
          skipNormalize: !0
        }
      )
    }
  );
  Object.setPrototypeOf(h, null);
  function S(p) {
    return p && (h[
      /** @type {SchemeName} */
      p
    ] || h[
      /** @type {SchemeName} */
      p.toLowerCase()
    ]) || void 0;
  }
  return schemes = {
    wsIsSecure: i,
    SCHEMES: h,
    isValidSchemeName: n,
    getSchemeHandler: S
  }, schemes;
}
var hasRequiredFastUri;
function requireFastUri() {
  if (hasRequiredFastUri) return fastUri.exports;
  hasRequiredFastUri = 1;
  const { normalizeIPv6: e, removeDotSegments: t, recomposeAuthority: r, normalizeComponentEncoding: n, isIPv4: i, nonSimpleDomain: s } = requireUtils(), { SCHEMES: o, getSchemeHandler: a } = requireSchemes();
  function u(f, g) {
    return typeof f == "string" ? f = /** @type {T} */
    m(b(f, g), g) : typeof f == "object" && (f = /** @type {T} */
    b(m(f, g), g)), f;
  }
  function l(f, g, c) {
    const h = c ? Object.assign({ scheme: "null" }, c) : { scheme: "null" }, S = d(b(f, h), b(g, h), h, !0);
    return h.skipEscape = !0, m(S, h);
  }
  function d(f, g, c, h) {
    const S = {};
    return h || (f = b(m(f, c), c), g = b(m(g, c), c)), c = c || {}, !c.tolerant && g.scheme ? (S.scheme = g.scheme, S.userinfo = g.userinfo, S.host = g.host, S.port = g.port, S.path = t(g.path || ""), S.query = g.query) : (g.userinfo !== void 0 || g.host !== void 0 || g.port !== void 0 ? (S.userinfo = g.userinfo, S.host = g.host, S.port = g.port, S.path = t(g.path || ""), S.query = g.query) : (g.path ? (g.path[0] === "/" ? S.path = t(g.path) : ((f.userinfo !== void 0 || f.host !== void 0 || f.port !== void 0) && !f.path ? S.path = "/" + g.path : f.path ? S.path = f.path.slice(0, f.path.lastIndexOf("/") + 1) + g.path : S.path = g.path, S.path = t(S.path)), S.query = g.query) : (S.path = f.path, g.query !== void 0 ? S.query = g.query : S.query = f.query), S.userinfo = f.userinfo, S.host = f.host, S.port = f.port), S.scheme = f.scheme), S.fragment = g.fragment, S;
  }
  function y(f, g, c) {
    return typeof f == "string" ? (f = unescape(f), f = m(n(b(f, c), !0), { ...c, skipEscape: !0 })) : typeof f == "object" && (f = m(n(f, !0), { ...c, skipEscape: !0 })), typeof g == "string" ? (g = unescape(g), g = m(n(b(g, c), !0), { ...c, skipEscape: !0 })) : typeof g == "object" && (g = m(n(g, !0), { ...c, skipEscape: !0 })), f.toLowerCase() === g.toLowerCase();
  }
  function m(f, g) {
    const c = {
      host: f.host,
      scheme: f.scheme,
      userinfo: f.userinfo,
      port: f.port,
      path: f.path,
      query: f.query,
      nid: f.nid,
      nss: f.nss,
      uuid: f.uuid,
      fragment: f.fragment,
      reference: f.reference,
      resourceName: f.resourceName,
      secure: f.secure,
      error: ""
    }, h = Object.assign({}, g), S = [], p = a(h.scheme || c.scheme);
    p && p.serialize && p.serialize(c, h), c.path !== void 0 && (h.skipEscape ? c.path = unescape(c.path) : (c.path = escape(c.path), c.scheme !== void 0 && (c.path = c.path.split("%3A").join(":")))), h.reference !== "suffix" && c.scheme && S.push(c.scheme, ":");
    const v = r(c);
    if (v !== void 0 && (h.reference !== "suffix" && S.push("//"), S.push(v), c.path && c.path[0] !== "/" && S.push("/")), c.path !== void 0) {
      let $ = c.path;
      !h.absolutePath && (!p || !p.absolutePath) && ($ = t($)), v === void 0 && $[0] === "/" && $[1] === "/" && ($ = "/%2F" + $.slice(2)), S.push($);
    }
    return c.query !== void 0 && S.push("?", c.query), c.fragment !== void 0 && S.push("#", c.fragment), S.join("");
  }
  const _ = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function b(f, g) {
    const c = Object.assign({}, g), h = {
      scheme: void 0,
      userinfo: void 0,
      host: "",
      port: void 0,
      path: "",
      query: void 0,
      fragment: void 0
    };
    let S = !1;
    c.reference === "suffix" && (c.scheme ? f = c.scheme + ":" + f : f = "//" + f);
    const p = f.match(_);
    if (p) {
      if (h.scheme = p[1], h.userinfo = p[3], h.host = p[4], h.port = parseInt(p[5], 10), h.path = p[6] || "", h.query = p[7], h.fragment = p[8], isNaN(h.port) && (h.port = p[5]), h.host)
        if (i(h.host) === !1) {
          const O = e(h.host);
          h.host = O.host.toLowerCase(), S = O.isIPV6;
        } else
          S = !0;
      h.scheme === void 0 && h.userinfo === void 0 && h.host === void 0 && h.port === void 0 && h.query === void 0 && !h.path ? h.reference = "same-document" : h.scheme === void 0 ? h.reference = "relative" : h.fragment === void 0 ? h.reference = "absolute" : h.reference = "uri", c.reference && c.reference !== "suffix" && c.reference !== h.reference && (h.error = h.error || "URI is not a " + c.reference + " reference.");
      const v = a(c.scheme || h.scheme);
      if (!c.unicodeSupport && (!v || !v.unicodeSupport) && h.host && (c.domainHost || v && v.domainHost) && S === !1 && s(h.host))
        try {
          h.host = URL.domainToASCII(h.host.toLowerCase());
        } catch ($) {
          h.error = h.error || "Host's domain name can not be converted to ASCII: " + $;
        }
      (!v || v && !v.skipNormalize) && (f.indexOf("%") !== -1 && (h.scheme !== void 0 && (h.scheme = unescape(h.scheme)), h.host !== void 0 && (h.host = unescape(h.host))), h.path && (h.path = escape(unescape(h.path))), h.fragment && (h.fragment = encodeURI(decodeURIComponent(h.fragment)))), v && v.parse && v.parse(h, c);
    } else
      h.error = h.error || "URI can not be parsed.";
    return h;
  }
  const w = {
    SCHEMES: o,
    normalize: u,
    resolve: l,
    resolveComponent: d,
    equal: y,
    serialize: m,
    parse: b
  };
  return fastUri.exports = w, fastUri.exports.default = w, fastUri.exports.fastUri = w, fastUri.exports;
}
var hasRequiredUri;
function requireUri() {
  if (hasRequiredUri) return uri;
  hasRequiredUri = 1, Object.defineProperty(uri, "__esModule", { value: !0 });
  const e = requireFastUri();
  return e.code = 'require("ajv/dist/runtime/uri").default', uri.default = e, uri;
}
var hasRequiredCore$1;
function requireCore$1() {
  return hasRequiredCore$1 || (hasRequiredCore$1 = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
    var t = requireValidate();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return t.KeywordCxt;
    } });
    var r = requireCodegen();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return r._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return r.str;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return r.stringify;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return r.nil;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return r.Name;
    } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
      return r.CodeGen;
    } });
    const n = requireValidation_error(), i = requireRef_error(), s = requireRules(), o = requireCompile(), a = requireCodegen(), u = requireResolve(), l = requireDataType(), d = requireUtil(), y = require$$9, m = requireUri(), _ = (A, R) => new RegExp(A, R);
    _.code = "new RegExp";
    const b = ["removeAdditional", "useDefaults", "coerceTypes"], w = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]), f = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    }, g = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, c = 200;
    function h(A) {
      var R, N, P, E, I, M, V, U, G, K, k, q, T, L, D, W, Y, te, X, Z, Q, ie, ee, ae, ue;
      const oe = A.strict, le = (R = A.code) === null || R === void 0 ? void 0 : R.optimize, ce = le === !0 || le === void 0 ? 1 : le || 0, de = (P = (N = A.code) === null || N === void 0 ? void 0 : N.regExp) !== null && P !== void 0 ? P : _, pe = (E = A.uriResolver) !== null && E !== void 0 ? E : m.default;
      return {
        strictSchema: (M = (I = A.strictSchema) !== null && I !== void 0 ? I : oe) !== null && M !== void 0 ? M : !0,
        strictNumbers: (U = (V = A.strictNumbers) !== null && V !== void 0 ? V : oe) !== null && U !== void 0 ? U : !0,
        strictTypes: (K = (G = A.strictTypes) !== null && G !== void 0 ? G : oe) !== null && K !== void 0 ? K : "log",
        strictTuples: (q = (k = A.strictTuples) !== null && k !== void 0 ? k : oe) !== null && q !== void 0 ? q : "log",
        strictRequired: (L = (T = A.strictRequired) !== null && T !== void 0 ? T : oe) !== null && L !== void 0 ? L : !1,
        code: A.code ? { ...A.code, optimize: ce, regExp: de } : { optimize: ce, regExp: de },
        loopRequired: (D = A.loopRequired) !== null && D !== void 0 ? D : c,
        loopEnum: (W = A.loopEnum) !== null && W !== void 0 ? W : c,
        meta: (Y = A.meta) !== null && Y !== void 0 ? Y : !0,
        messages: (te = A.messages) !== null && te !== void 0 ? te : !0,
        inlineRefs: (X = A.inlineRefs) !== null && X !== void 0 ? X : !0,
        schemaId: (Z = A.schemaId) !== null && Z !== void 0 ? Z : "$id",
        addUsedSchema: (Q = A.addUsedSchema) !== null && Q !== void 0 ? Q : !0,
        validateSchema: (ie = A.validateSchema) !== null && ie !== void 0 ? ie : !0,
        validateFormats: (ee = A.validateFormats) !== null && ee !== void 0 ? ee : !0,
        unicodeRegExp: (ae = A.unicodeRegExp) !== null && ae !== void 0 ? ae : !0,
        int32range: (ue = A.int32range) !== null && ue !== void 0 ? ue : !0,
        uriResolver: pe
      };
    }
    class S {
      constructor(R = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), R = this.opts = { ...R, ...h(R) };
        const { es5: N, lines: P } = this.opts.code;
        this.scope = new a.ValueScope({ scope: {}, prefixes: w, es5: N, lines: P }), this.logger = B(R.logger);
        const E = R.validateFormats;
        R.validateFormats = !1, this.RULES = (0, s.getRules)(), p.call(this, f, R, "NOT SUPPORTED"), p.call(this, g, R, "DEPRECATED", "warn"), this._metaOpts = j.call(this), R.formats && O.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), R.keywords && C.call(this, R.keywords), typeof R.meta == "object" && this.addMetaSchema(R.meta), $.call(this), R.validateFormats = E;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: R, meta: N, schemaId: P } = this.opts;
        let E = y;
        P === "id" && (E = { ...y }, E.id = E.$id, delete E.$id), N && R && this.addMetaSchema(E, E[P], !1);
      }
      defaultMeta() {
        const { meta: R, schemaId: N } = this.opts;
        return this.opts.defaultMeta = typeof R == "object" ? R[N] || R : void 0;
      }
      validate(R, N) {
        let P;
        if (typeof R == "string") {
          if (P = this.getSchema(R), !P)
            throw new Error(`no schema with key or ref "${R}"`);
        } else
          P = this.compile(R);
        const E = P(N);
        return "$async" in P || (this.errors = P.errors), E;
      }
      compile(R, N) {
        const P = this._addSchema(R, N);
        return P.validate || this._compileSchemaEnv(P);
      }
      compileAsync(R, N) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: P } = this.opts;
        return E.call(this, R, N);
        async function E(K, k) {
          await I.call(this, K.$schema);
          const q = this._addSchema(K, k);
          return q.validate || M.call(this, q);
        }
        async function I(K) {
          K && !this.getSchema(K) && await E.call(this, { $ref: K }, !0);
        }
        async function M(K) {
          try {
            return this._compileSchemaEnv(K);
          } catch (k) {
            if (!(k instanceof i.default))
              throw k;
            return V.call(this, k), await U.call(this, k.missingSchema), M.call(this, K);
          }
        }
        function V({ missingSchema: K, missingRef: k }) {
          if (this.refs[K])
            throw new Error(`AnySchema ${K} is loaded but ${k} cannot be resolved`);
        }
        async function U(K) {
          const k = await G.call(this, K);
          this.refs[K] || await I.call(this, k.$schema), this.refs[K] || this.addSchema(k, K, N);
        }
        async function G(K) {
          const k = this._loading[K];
          if (k)
            return k;
          try {
            return await (this._loading[K] = P(K));
          } finally {
            delete this._loading[K];
          }
        }
      }
      // Adds schema to the instance
      addSchema(R, N, P, E = this.opts.validateSchema) {
        if (Array.isArray(R)) {
          for (const M of R)
            this.addSchema(M, void 0, P, E);
          return this;
        }
        let I;
        if (typeof R == "object") {
          const { schemaId: M } = this.opts;
          if (I = R[M], I !== void 0 && typeof I != "string")
            throw new Error(`schema ${M} must be string`);
        }
        return N = (0, u.normalizeId)(N || I), this._checkUnique(N), this.schemas[N] = this._addSchema(R, P, N, E, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(R, N, P = this.opts.validateSchema) {
        return this.addSchema(R, N, !0, P), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(R, N) {
        if (typeof R == "boolean")
          return !0;
        let P;
        if (P = R.$schema, P !== void 0 && typeof P != "string")
          throw new Error("$schema must be a string");
        if (P = P || this.opts.defaultMeta || this.defaultMeta(), !P)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const E = this.validate(P, R);
        if (!E && N) {
          const I = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(I);
          else
            throw new Error(I);
        }
        return E;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(R) {
        let N;
        for (; typeof (N = v.call(this, R)) == "string"; )
          R = N;
        if (N === void 0) {
          const { schemaId: P } = this.opts, E = new o.SchemaEnv({ schema: {}, schemaId: P });
          if (N = o.resolveSchema.call(this, E, R), !N)
            return;
          this.refs[R] = N;
        }
        return N.validate || this._compileSchemaEnv(N);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(R) {
        if (R instanceof RegExp)
          return this._removeAllSchemas(this.schemas, R), this._removeAllSchemas(this.refs, R), this;
        switch (typeof R) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            const N = v.call(this, R);
            return typeof N == "object" && this._cache.delete(N.schema), delete this.schemas[R], delete this.refs[R], this;
          }
          case "object": {
            const N = R;
            this._cache.delete(N);
            let P = R[this.opts.schemaId];
            return P && (P = (0, u.normalizeId)(P), delete this.schemas[P], delete this.refs[P]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(R) {
        for (const N of R)
          this.addKeyword(N);
        return this;
      }
      addKeyword(R, N) {
        let P;
        if (typeof R == "string")
          P = R, typeof N == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), N.keyword = P);
        else if (typeof R == "object" && N === void 0) {
          if (N = R, P = N.keyword, Array.isArray(P) && !P.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (J.call(this, P, N), !N)
          return (0, d.eachItem)(P, (I) => x.call(this, I)), this;
        ne.call(this, N);
        const E = {
          ...N,
          type: (0, l.getJSONTypes)(N.type),
          schemaType: (0, l.getJSONTypes)(N.schemaType)
        };
        return (0, d.eachItem)(P, E.type.length === 0 ? (I) => x.call(this, I, E) : (I) => E.type.forEach((M) => x.call(this, I, E, M))), this;
      }
      getKeyword(R) {
        const N = this.RULES.all[R];
        return typeof N == "object" ? N.definition : !!N;
      }
      // Remove keyword
      removeKeyword(R) {
        const { RULES: N } = this;
        delete N.keywords[R], delete N.all[R];
        for (const P of N.rules) {
          const E = P.rules.findIndex((I) => I.keyword === R);
          E >= 0 && P.rules.splice(E, 1);
        }
        return this;
      }
      // Add format
      addFormat(R, N) {
        return typeof N == "string" && (N = new RegExp(N)), this.formats[R] = N, this;
      }
      errorsText(R = this.errors, { separator: N = ", ", dataVar: P = "data" } = {}) {
        return !R || R.length === 0 ? "No errors" : R.map((E) => `${P}${E.instancePath} ${E.message}`).reduce((E, I) => E + N + I);
      }
      $dataMetaSchema(R, N) {
        const P = this.RULES.all;
        R = JSON.parse(JSON.stringify(R));
        for (const E of N) {
          const I = E.split("/").slice(1);
          let M = R;
          for (const V of I)
            M = M[V];
          for (const V in P) {
            const U = P[V];
            if (typeof U != "object")
              continue;
            const { $data: G } = U.definition, K = M[V];
            G && K && (M[V] = se(K));
          }
        }
        return R;
      }
      _removeAllSchemas(R, N) {
        for (const P in R) {
          const E = R[P];
          (!N || N.test(P)) && (typeof E == "string" ? delete R[P] : E && !E.meta && (this._cache.delete(E.schema), delete R[P]));
        }
      }
      _addSchema(R, N, P, E = this.opts.validateSchema, I = this.opts.addUsedSchema) {
        let M;
        const { schemaId: V } = this.opts;
        if (typeof R == "object")
          M = R[V];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof R != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let U = this._cache.get(R);
        if (U !== void 0)
          return U;
        P = (0, u.normalizeId)(M || P);
        const G = u.getSchemaRefs.call(this, R, P);
        return U = new o.SchemaEnv({ schema: R, schemaId: V, meta: N, baseId: P, localRefs: G }), this._cache.set(U.schema, U), I && !P.startsWith("#") && (P && this._checkUnique(P), this.refs[P] = U), E && this.validateSchema(R, !0), U;
      }
      _checkUnique(R) {
        if (this.schemas[R] || this.refs[R])
          throw new Error(`schema with key or id "${R}" already exists`);
      }
      _compileSchemaEnv(R) {
        if (R.meta ? this._compileMetaSchema(R) : o.compileSchema.call(this, R), !R.validate)
          throw new Error("ajv implementation error");
        return R.validate;
      }
      _compileMetaSchema(R) {
        const N = this.opts;
        this.opts = this._metaOpts;
        try {
          o.compileSchema.call(this, R);
        } finally {
          this.opts = N;
        }
      }
    }
    S.ValidationError = n.default, S.MissingRefError = i.default, e.default = S;
    function p(A, R, N, P = "error") {
      for (const E in A) {
        const I = E;
        I in R && this.logger[P](`${N}: option ${E}. ${A[I]}`);
      }
    }
    function v(A) {
      return A = (0, u.normalizeId)(A), this.schemas[A] || this.refs[A];
    }
    function $() {
      const A = this.opts.schemas;
      if (A)
        if (Array.isArray(A))
          this.addSchema(A);
        else
          for (const R in A)
            this.addSchema(A[R], R);
    }
    function O() {
      for (const A in this.opts.formats) {
        const R = this.opts.formats[A];
        R && this.addFormat(A, R);
      }
    }
    function C(A) {
      if (Array.isArray(A)) {
        this.addVocabulary(A);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const R in A) {
        const N = A[R];
        N.keyword || (N.keyword = R), this.addKeyword(N);
      }
    }
    function j() {
      const A = { ...this.opts };
      for (const R of b)
        delete A[R];
      return A;
    }
    const F = { log() {
    }, warn() {
    }, error() {
    } };
    function B(A) {
      if (A === !1)
        return F;
      if (A === void 0)
        return console;
      if (A.log && A.warn && A.error)
        return A;
      throw new Error("logger must implement log, warn and error methods");
    }
    const z = /^[a-z_$][a-z0-9_$:-]*$/i;
    function J(A, R) {
      const { RULES: N } = this;
      if ((0, d.eachItem)(A, (P) => {
        if (N.keywords[P])
          throw new Error(`Keyword ${P} is already defined`);
        if (!z.test(P))
          throw new Error(`Keyword ${P} has invalid name`);
      }), !!R && R.$data && !("code" in R || "validate" in R))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function x(A, R, N) {
      var P;
      const E = R?.post;
      if (N && E)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: I } = this;
      let M = E ? I.post : I.rules.find(({ type: U }) => U === N);
      if (M || (M = { type: N, rules: [] }, I.rules.push(M)), I.keywords[A] = !0, !R)
        return;
      const V = {
        keyword: A,
        definition: {
          ...R,
          type: (0, l.getJSONTypes)(R.type),
          schemaType: (0, l.getJSONTypes)(R.schemaType)
        }
      };
      R.before ? re.call(this, M, V, R.before) : M.rules.push(V), I.all[A] = V, (P = R.implements) === null || P === void 0 || P.forEach((U) => this.addKeyword(U));
    }
    function re(A, R, N) {
      const P = A.rules.findIndex((E) => E.keyword === N);
      P >= 0 ? A.rules.splice(P, 0, R) : (A.rules.push(R), this.logger.warn(`rule ${N} is not defined`));
    }
    function ne(A) {
      let { metaSchema: R } = A;
      R !== void 0 && (A.$data && this.opts.$data && (R = se(R)), A.validateSchema = this.compile(R, !0));
    }
    const H = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function se(A) {
      return { anyOf: [A, H] };
    }
  })(core$1)), core$1;
}
var draft7 = {}, core = {}, id = {}, hasRequiredId;
function requireId() {
  if (hasRequiredId) return id;
  hasRequiredId = 1, Object.defineProperty(id, "__esModule", { value: !0 });
  const e = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  return id.default = e, id;
}
var ref = {}, hasRequiredRef;
function requireRef() {
  if (hasRequiredRef) return ref;
  hasRequiredRef = 1, Object.defineProperty(ref, "__esModule", { value: !0 }), ref.callRef = ref.getValidate = void 0;
  const e = requireRef_error(), t = requireCode(), r = requireCodegen(), n = requireNames(), i = requireCompile(), s = requireUtil(), o = {
    keyword: "$ref",
    schemaType: "string",
    code(l) {
      const { gen: d, schema: y, it: m } = l, { baseId: _, schemaEnv: b, validateName: w, opts: f, self: g } = m, { root: c } = b;
      if ((y === "#" || y === "#/") && _ === c.baseId)
        return S();
      const h = i.resolveRef.call(g, c, _, y);
      if (h === void 0)
        throw new e.default(m.opts.uriResolver, _, y);
      if (h instanceof i.SchemaEnv)
        return p(h);
      return v(h);
      function S() {
        if (b === c)
          return u(l, w, b, b.$async);
        const $ = d.scopeValue("root", { ref: c });
        return u(l, (0, r._)`${$}.validate`, c, c.$async);
      }
      function p($) {
        const O = a(l, $);
        u(l, O, $, $.$async);
      }
      function v($) {
        const O = d.scopeValue("schema", f.code.source === !0 ? { ref: $, code: (0, r.stringify)($) } : { ref: $ }), C = d.name("valid"), j = l.subschema({
          schema: $,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: O,
          errSchemaPath: y
        }, C);
        l.mergeEvaluated(j), l.ok(C);
      }
    }
  };
  function a(l, d) {
    const { gen: y } = l;
    return d.validate ? y.scopeValue("validate", { ref: d.validate }) : (0, r._)`${y.scopeValue("wrapper", { ref: d })}.validate`;
  }
  ref.getValidate = a;
  function u(l, d, y, m) {
    const { gen: _, it: b } = l, { allErrors: w, schemaEnv: f, opts: g } = b, c = g.passContext ? n.default.this : r.nil;
    m ? h() : S();
    function h() {
      if (!f.$async)
        throw new Error("async schema referenced by sync schema");
      const $ = _.let("valid");
      _.try(() => {
        _.code((0, r._)`await ${(0, t.callValidateCode)(l, d, c)}`), v(d), w || _.assign($, !0);
      }, (O) => {
        _.if((0, r._)`!(${O} instanceof ${b.ValidationError})`, () => _.throw(O)), p(O), w || _.assign($, !1);
      }), l.ok($);
    }
    function S() {
      l.result((0, t.callValidateCode)(l, d, c), () => v(d), () => p(d));
    }
    function p($) {
      const O = (0, r._)`${$}.errors`;
      _.assign(n.default.vErrors, (0, r._)`${n.default.vErrors} === null ? ${O} : ${n.default.vErrors}.concat(${O})`), _.assign(n.default.errors, (0, r._)`${n.default.vErrors}.length`);
    }
    function v($) {
      var O;
      if (!b.opts.unevaluated)
        return;
      const C = (O = y?.validate) === null || O === void 0 ? void 0 : O.evaluated;
      if (b.props !== !0)
        if (C && !C.dynamicProps)
          C.props !== void 0 && (b.props = s.mergeEvaluated.props(_, C.props, b.props));
        else {
          const j = _.var("props", (0, r._)`${$}.evaluated.props`);
          b.props = s.mergeEvaluated.props(_, j, b.props, r.Name);
        }
      if (b.items !== !0)
        if (C && !C.dynamicItems)
          C.items !== void 0 && (b.items = s.mergeEvaluated.items(_, C.items, b.items));
        else {
          const j = _.var("items", (0, r._)`${$}.evaluated.items`);
          b.items = s.mergeEvaluated.items(_, j, b.items, r.Name);
        }
    }
  }
  return ref.callRef = u, ref.default = o, ref;
}
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore) return core;
  hasRequiredCore = 1, Object.defineProperty(core, "__esModule", { value: !0 });
  const e = requireId(), t = requireRef(), r = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    e.default,
    t.default
  ];
  return core.default = r, core;
}
var validation = {}, limitNumber = {}, hasRequiredLimitNumber;
function requireLimitNumber() {
  if (hasRequiredLimitNumber) return limitNumber;
  hasRequiredLimitNumber = 1, Object.defineProperty(limitNumber, "__esModule", { value: !0 });
  const e = requireCodegen(), t = e.operators, r = {
    maximum: { okStr: "<=", ok: t.LTE, fail: t.GT },
    minimum: { okStr: ">=", ok: t.GTE, fail: t.LT },
    exclusiveMaximum: { okStr: "<", ok: t.LT, fail: t.GTE },
    exclusiveMinimum: { okStr: ">", ok: t.GT, fail: t.LTE }
  }, n = {
    message: ({ keyword: s, schemaCode: o }) => (0, e.str)`must be ${r[s].okStr} ${o}`,
    params: ({ keyword: s, schemaCode: o }) => (0, e._)`{comparison: ${r[s].okStr}, limit: ${o}}`
  }, i = {
    keyword: Object.keys(r),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: n,
    code(s) {
      const { keyword: o, data: a, schemaCode: u } = s;
      s.fail$data((0, e._)`${a} ${r[o].fail} ${u} || isNaN(${a})`);
    }
  };
  return limitNumber.default = i, limitNumber;
}
var multipleOf = {}, hasRequiredMultipleOf;
function requireMultipleOf() {
  if (hasRequiredMultipleOf) return multipleOf;
  hasRequiredMultipleOf = 1, Object.defineProperty(multipleOf, "__esModule", { value: !0 });
  const e = requireCodegen(), r = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: !0,
    error: {
      message: ({ schemaCode: n }) => (0, e.str)`must be multiple of ${n}`,
      params: ({ schemaCode: n }) => (0, e._)`{multipleOf: ${n}}`
    },
    code(n) {
      const { gen: i, data: s, schemaCode: o, it: a } = n, u = a.opts.multipleOfPrecision, l = i.let("res"), d = u ? (0, e._)`Math.abs(Math.round(${l}) - ${l}) > 1e-${u}` : (0, e._)`${l} !== parseInt(${l})`;
      n.fail$data((0, e._)`(${o} === 0 || (${l} = ${s}/${o}, ${d}))`);
    }
  };
  return multipleOf.default = r, multipleOf;
}
var limitLength = {}, ucs2length = {}, hasRequiredUcs2length;
function requireUcs2length() {
  if (hasRequiredUcs2length) return ucs2length;
  hasRequiredUcs2length = 1, Object.defineProperty(ucs2length, "__esModule", { value: !0 });
  function e(t) {
    const r = t.length;
    let n = 0, i = 0, s;
    for (; i < r; )
      n++, s = t.charCodeAt(i++), s >= 55296 && s <= 56319 && i < r && (s = t.charCodeAt(i), (s & 64512) === 56320 && i++);
    return n;
  }
  return ucs2length.default = e, e.code = 'require("ajv/dist/runtime/ucs2length").default', ucs2length;
}
var hasRequiredLimitLength;
function requireLimitLength() {
  if (hasRequiredLimitLength) return limitLength;
  hasRequiredLimitLength = 1, Object.defineProperty(limitLength, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireUtil(), r = requireUcs2length(), i = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: s, schemaCode: o }) {
        const a = s === "maxLength" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${a} than ${o} characters`;
      },
      params: ({ schemaCode: s }) => (0, e._)`{limit: ${s}}`
    },
    code(s) {
      const { keyword: o, data: a, schemaCode: u, it: l } = s, d = o === "maxLength" ? e.operators.GT : e.operators.LT, y = l.opts.unicode === !1 ? (0, e._)`${a}.length` : (0, e._)`${(0, t.useFunc)(s.gen, r.default)}(${a})`;
      s.fail$data((0, e._)`${y} ${d} ${u}`);
    }
  };
  return limitLength.default = i, limitLength;
}
var pattern = {}, hasRequiredPattern;
function requirePattern() {
  if (hasRequiredPattern) return pattern;
  hasRequiredPattern = 1, Object.defineProperty(pattern, "__esModule", { value: !0 });
  const e = requireCode(), t = requireCodegen(), n = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: i }) => (0, t.str)`must match pattern "${i}"`,
      params: ({ schemaCode: i }) => (0, t._)`{pattern: ${i}}`
    },
    code(i) {
      const { data: s, $data: o, schema: a, schemaCode: u, it: l } = i, d = l.opts.unicodeRegExp ? "u" : "", y = o ? (0, t._)`(new RegExp(${u}, ${d}))` : (0, e.usePattern)(i, a);
      i.fail$data((0, t._)`!${y}.test(${s})`);
    }
  };
  return pattern.default = n, pattern;
}
var limitProperties = {}, hasRequiredLimitProperties;
function requireLimitProperties() {
  if (hasRequiredLimitProperties) return limitProperties;
  hasRequiredLimitProperties = 1, Object.defineProperty(limitProperties, "__esModule", { value: !0 });
  const e = requireCodegen(), r = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: n, schemaCode: i }) {
        const s = n === "maxProperties" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${s} than ${i} properties`;
      },
      params: ({ schemaCode: n }) => (0, e._)`{limit: ${n}}`
    },
    code(n) {
      const { keyword: i, data: s, schemaCode: o } = n, a = i === "maxProperties" ? e.operators.GT : e.operators.LT;
      n.fail$data((0, e._)`Object.keys(${s}).length ${a} ${o}`);
    }
  };
  return limitProperties.default = r, limitProperties;
}
var required = {}, hasRequiredRequired;
function requireRequired() {
  if (hasRequiredRequired) return required;
  hasRequiredRequired = 1, Object.defineProperty(required, "__esModule", { value: !0 });
  const e = requireCode(), t = requireCodegen(), r = requireUtil(), i = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: !0,
    error: {
      message: ({ params: { missingProperty: s } }) => (0, t.str)`must have required property '${s}'`,
      params: ({ params: { missingProperty: s } }) => (0, t._)`{missingProperty: ${s}}`
    },
    code(s) {
      const { gen: o, schema: a, schemaCode: u, data: l, $data: d, it: y } = s, { opts: m } = y;
      if (!d && a.length === 0)
        return;
      const _ = a.length >= m.loopRequired;
      if (y.allErrors ? b() : w(), m.strictRequired) {
        const c = s.parentSchema.properties, { definedProperties: h } = s.it;
        for (const S of a)
          if (c?.[S] === void 0 && !h.has(S)) {
            const p = y.schemaEnv.baseId + y.errSchemaPath, v = `required property "${S}" is not defined at "${p}" (strictRequired)`;
            (0, r.checkStrictMode)(y, v, y.opts.strictRequired);
          }
      }
      function b() {
        if (_ || d)
          s.block$data(t.nil, f);
        else
          for (const c of a)
            (0, e.checkReportMissingProp)(s, c);
      }
      function w() {
        const c = o.let("missing");
        if (_ || d) {
          const h = o.let("valid", !0);
          s.block$data(h, () => g(c, h)), s.ok(h);
        } else
          o.if((0, e.checkMissingProp)(s, a, c)), (0, e.reportMissingProp)(s, c), o.else();
      }
      function f() {
        o.forOf("prop", u, (c) => {
          s.setParams({ missingProperty: c }), o.if((0, e.noPropertyInData)(o, l, c, m.ownProperties), () => s.error());
        });
      }
      function g(c, h) {
        s.setParams({ missingProperty: c }), o.forOf(c, u, () => {
          o.assign(h, (0, e.propertyInData)(o, l, c, m.ownProperties)), o.if((0, t.not)(h), () => {
            s.error(), o.break();
          });
        }, t.nil);
      }
    }
  };
  return required.default = i, required;
}
var limitItems = {}, hasRequiredLimitItems;
function requireLimitItems() {
  if (hasRequiredLimitItems) return limitItems;
  hasRequiredLimitItems = 1, Object.defineProperty(limitItems, "__esModule", { value: !0 });
  const e = requireCodegen(), r = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: n, schemaCode: i }) {
        const s = n === "maxItems" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${s} than ${i} items`;
      },
      params: ({ schemaCode: n }) => (0, e._)`{limit: ${n}}`
    },
    code(n) {
      const { keyword: i, data: s, schemaCode: o } = n, a = i === "maxItems" ? e.operators.GT : e.operators.LT;
      n.fail$data((0, e._)`${s}.length ${a} ${o}`);
    }
  };
  return limitItems.default = r, limitItems;
}
var uniqueItems = {}, equal = {}, hasRequiredEqual;
function requireEqual() {
  if (hasRequiredEqual) return equal;
  hasRequiredEqual = 1, Object.defineProperty(equal, "__esModule", { value: !0 });
  const e = requireFastDeepEqual();
  return e.code = 'require("ajv/dist/runtime/equal").default', equal.default = e, equal;
}
var hasRequiredUniqueItems;
function requireUniqueItems() {
  if (hasRequiredUniqueItems) return uniqueItems;
  hasRequiredUniqueItems = 1, Object.defineProperty(uniqueItems, "__esModule", { value: !0 });
  const e = requireDataType(), t = requireCodegen(), r = requireUtil(), n = requireEqual(), s = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: !0,
    error: {
      message: ({ params: { i: o, j: a } }) => (0, t.str)`must NOT have duplicate items (items ## ${a} and ${o} are identical)`,
      params: ({ params: { i: o, j: a } }) => (0, t._)`{i: ${o}, j: ${a}}`
    },
    code(o) {
      const { gen: a, data: u, $data: l, schema: d, parentSchema: y, schemaCode: m, it: _ } = o;
      if (!l && !d)
        return;
      const b = a.let("valid"), w = y.items ? (0, e.getSchemaTypes)(y.items) : [];
      o.block$data(b, f, (0, t._)`${m} === false`), o.ok(b);
      function f() {
        const S = a.let("i", (0, t._)`${u}.length`), p = a.let("j");
        o.setParams({ i: S, j: p }), a.assign(b, !0), a.if((0, t._)`${S} > 1`, () => (g() ? c : h)(S, p));
      }
      function g() {
        return w.length > 0 && !w.some((S) => S === "object" || S === "array");
      }
      function c(S, p) {
        const v = a.name("item"), $ = (0, e.checkDataTypes)(w, v, _.opts.strictNumbers, e.DataType.Wrong), O = a.const("indices", (0, t._)`{}`);
        a.for((0, t._)`;${S}--;`, () => {
          a.let(v, (0, t._)`${u}[${S}]`), a.if($, (0, t._)`continue`), w.length > 1 && a.if((0, t._)`typeof ${v} == "string"`, (0, t._)`${v} += "_"`), a.if((0, t._)`typeof ${O}[${v}] == "number"`, () => {
            a.assign(p, (0, t._)`${O}[${v}]`), o.error(), a.assign(b, !1).break();
          }).code((0, t._)`${O}[${v}] = ${S}`);
        });
      }
      function h(S, p) {
        const v = (0, r.useFunc)(a, n.default), $ = a.name("outer");
        a.label($).for((0, t._)`;${S}--;`, () => a.for((0, t._)`${p} = ${S}; ${p}--;`, () => a.if((0, t._)`${v}(${u}[${S}], ${u}[${p}])`, () => {
          o.error(), a.assign(b, !1).break($);
        })));
      }
    }
  };
  return uniqueItems.default = s, uniqueItems;
}
var _const = {}, hasRequired_const;
function require_const() {
  if (hasRequired_const) return _const;
  hasRequired_const = 1, Object.defineProperty(_const, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireUtil(), r = requireEqual(), i = {
    keyword: "const",
    $data: !0,
    error: {
      message: "must be equal to constant",
      params: ({ schemaCode: s }) => (0, e._)`{allowedValue: ${s}}`
    },
    code(s) {
      const { gen: o, data: a, $data: u, schemaCode: l, schema: d } = s;
      u || d && typeof d == "object" ? s.fail$data((0, e._)`!${(0, t.useFunc)(o, r.default)}(${a}, ${l})`) : s.fail((0, e._)`${d} !== ${a}`);
    }
  };
  return _const.default = i, _const;
}
var _enum = {}, hasRequired_enum;
function require_enum() {
  if (hasRequired_enum) return _enum;
  hasRequired_enum = 1, Object.defineProperty(_enum, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireUtil(), r = requireEqual(), i = {
    keyword: "enum",
    schemaType: "array",
    $data: !0,
    error: {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: s }) => (0, e._)`{allowedValues: ${s}}`
    },
    code(s) {
      const { gen: o, data: a, $data: u, schema: l, schemaCode: d, it: y } = s;
      if (!u && l.length === 0)
        throw new Error("enum must have non-empty array");
      const m = l.length >= y.opts.loopEnum;
      let _;
      const b = () => _ ?? (_ = (0, t.useFunc)(o, r.default));
      let w;
      if (m || u)
        w = o.let("valid"), s.block$data(w, f);
      else {
        if (!Array.isArray(l))
          throw new Error("ajv implementation error");
        const c = o.const("vSchema", d);
        w = (0, e.or)(...l.map((h, S) => g(c, S)));
      }
      s.pass(w);
      function f() {
        o.assign(w, !1), o.forOf("v", d, (c) => o.if((0, e._)`${b()}(${a}, ${c})`, () => o.assign(w, !0).break()));
      }
      function g(c, h) {
        const S = l[h];
        return typeof S == "object" && S !== null ? (0, e._)`${b()}(${a}, ${c}[${h}])` : (0, e._)`${a} === ${S}`;
      }
    }
  };
  return _enum.default = i, _enum;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation;
  hasRequiredValidation = 1, Object.defineProperty(validation, "__esModule", { value: !0 });
  const e = requireLimitNumber(), t = requireMultipleOf(), r = requireLimitLength(), n = requirePattern(), i = requireLimitProperties(), s = requireRequired(), o = requireLimitItems(), a = requireUniqueItems(), u = require_const(), l = require_enum(), d = [
    // number
    e.default,
    t.default,
    // string
    r.default,
    n.default,
    // object
    i.default,
    s.default,
    // array
    o.default,
    a.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    u.default,
    l.default
  ];
  return validation.default = d, validation;
}
var applicator = {}, additionalItems = {}, hasRequiredAdditionalItems;
function requireAdditionalItems() {
  if (hasRequiredAdditionalItems) return additionalItems;
  hasRequiredAdditionalItems = 1, Object.defineProperty(additionalItems, "__esModule", { value: !0 }), additionalItems.validateAdditionalItems = void 0;
  const e = requireCodegen(), t = requireUtil(), n = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: s } }) => (0, e.str)`must NOT have more than ${s} items`,
      params: ({ params: { len: s } }) => (0, e._)`{limit: ${s}}`
    },
    code(s) {
      const { parentSchema: o, it: a } = s, { items: u } = o;
      if (!Array.isArray(u)) {
        (0, t.checkStrictMode)(a, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      i(s, u);
    }
  };
  function i(s, o) {
    const { gen: a, schema: u, data: l, keyword: d, it: y } = s;
    y.items = !0;
    const m = a.const("len", (0, e._)`${l}.length`);
    if (u === !1)
      s.setParams({ len: o.length }), s.pass((0, e._)`${m} <= ${o.length}`);
    else if (typeof u == "object" && !(0, t.alwaysValidSchema)(y, u)) {
      const b = a.var("valid", (0, e._)`${m} <= ${o.length}`);
      a.if((0, e.not)(b), () => _(b)), s.ok(b);
    }
    function _(b) {
      a.forRange("i", o.length, m, (w) => {
        s.subschema({ keyword: d, dataProp: w, dataPropType: t.Type.Num }, b), y.allErrors || a.if((0, e.not)(b), () => a.break());
      });
    }
  }
  return additionalItems.validateAdditionalItems = i, additionalItems.default = n, additionalItems;
}
var prefixItems = {}, items = {}, hasRequiredItems;
function requireItems() {
  if (hasRequiredItems) return items;
  hasRequiredItems = 1, Object.defineProperty(items, "__esModule", { value: !0 }), items.validateTuple = void 0;
  const e = requireCodegen(), t = requireUtil(), r = requireCode(), n = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(s) {
      const { schema: o, it: a } = s;
      if (Array.isArray(o))
        return i(s, "additionalItems", o);
      a.items = !0, !(0, t.alwaysValidSchema)(a, o) && s.ok((0, r.validateArray)(s));
    }
  };
  function i(s, o, a = s.schema) {
    const { gen: u, parentSchema: l, data: d, keyword: y, it: m } = s;
    w(l), m.opts.unevaluated && a.length && m.items !== !0 && (m.items = t.mergeEvaluated.items(u, a.length, m.items));
    const _ = u.name("valid"), b = u.const("len", (0, e._)`${d}.length`);
    a.forEach((f, g) => {
      (0, t.alwaysValidSchema)(m, f) || (u.if((0, e._)`${b} > ${g}`, () => s.subschema({
        keyword: y,
        schemaProp: g,
        dataProp: g
      }, _)), s.ok(_));
    });
    function w(f) {
      const { opts: g, errSchemaPath: c } = m, h = a.length, S = h === f.minItems && (h === f.maxItems || f[o] === !1);
      if (g.strictTuples && !S) {
        const p = `"${y}" is ${h}-tuple, but minItems or maxItems/${o} are not specified or different at path "${c}"`;
        (0, t.checkStrictMode)(m, p, g.strictTuples);
      }
    }
  }
  return items.validateTuple = i, items.default = n, items;
}
var hasRequiredPrefixItems;
function requirePrefixItems() {
  if (hasRequiredPrefixItems) return prefixItems;
  hasRequiredPrefixItems = 1, Object.defineProperty(prefixItems, "__esModule", { value: !0 });
  const e = requireItems(), t = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (r) => (0, e.validateTuple)(r, "items")
  };
  return prefixItems.default = t, prefixItems;
}
var items2020 = {}, hasRequiredItems2020;
function requireItems2020() {
  if (hasRequiredItems2020) return items2020;
  hasRequiredItems2020 = 1, Object.defineProperty(items2020, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireUtil(), r = requireCode(), n = requireAdditionalItems(), s = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: o } }) => (0, e.str)`must NOT have more than ${o} items`,
      params: ({ params: { len: o } }) => (0, e._)`{limit: ${o}}`
    },
    code(o) {
      const { schema: a, parentSchema: u, it: l } = o, { prefixItems: d } = u;
      l.items = !0, !(0, t.alwaysValidSchema)(l, a) && (d ? (0, n.validateAdditionalItems)(o, d) : o.ok((0, r.validateArray)(o)));
    }
  };
  return items2020.default = s, items2020;
}
var contains = {}, hasRequiredContains;
function requireContains() {
  if (hasRequiredContains) return contains;
  hasRequiredContains = 1, Object.defineProperty(contains, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireUtil(), n = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: !0,
    error: {
      message: ({ params: { min: i, max: s } }) => s === void 0 ? (0, e.str)`must contain at least ${i} valid item(s)` : (0, e.str)`must contain at least ${i} and no more than ${s} valid item(s)`,
      params: ({ params: { min: i, max: s } }) => s === void 0 ? (0, e._)`{minContains: ${i}}` : (0, e._)`{minContains: ${i}, maxContains: ${s}}`
    },
    code(i) {
      const { gen: s, schema: o, parentSchema: a, data: u, it: l } = i;
      let d, y;
      const { minContains: m, maxContains: _ } = a;
      l.opts.next ? (d = m === void 0 ? 1 : m, y = _) : d = 1;
      const b = s.const("len", (0, e._)`${u}.length`);
      if (i.setParams({ min: d, max: y }), y === void 0 && d === 0) {
        (0, t.checkStrictMode)(l, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (y !== void 0 && d > y) {
        (0, t.checkStrictMode)(l, '"minContains" > "maxContains" is always invalid'), i.fail();
        return;
      }
      if ((0, t.alwaysValidSchema)(l, o)) {
        let h = (0, e._)`${b} >= ${d}`;
        y !== void 0 && (h = (0, e._)`${h} && ${b} <= ${y}`), i.pass(h);
        return;
      }
      l.items = !0;
      const w = s.name("valid");
      y === void 0 && d === 1 ? g(w, () => s.if(w, () => s.break())) : d === 0 ? (s.let(w, !0), y !== void 0 && s.if((0, e._)`${u}.length > 0`, f)) : (s.let(w, !1), f()), i.result(w, () => i.reset());
      function f() {
        const h = s.name("_valid"), S = s.let("count", 0);
        g(h, () => s.if(h, () => c(S)));
      }
      function g(h, S) {
        s.forRange("i", 0, b, (p) => {
          i.subschema({
            keyword: "contains",
            dataProp: p,
            dataPropType: t.Type.Num,
            compositeRule: !0
          }, h), S();
        });
      }
      function c(h) {
        s.code((0, e._)`${h}++`), y === void 0 ? s.if((0, e._)`${h} >= ${d}`, () => s.assign(w, !0).break()) : (s.if((0, e._)`${h} > ${y}`, () => s.assign(w, !1).break()), d === 1 ? s.assign(w, !0) : s.if((0, e._)`${h} >= ${d}`, () => s.assign(w, !0)));
      }
    }
  };
  return contains.default = n, contains;
}
var dependencies = {}, hasRequiredDependencies;
function requireDependencies() {
  return hasRequiredDependencies || (hasRequiredDependencies = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
    const t = requireCodegen(), r = requireUtil(), n = requireCode();
    e.error = {
      message: ({ params: { property: u, depsCount: l, deps: d } }) => {
        const y = l === 1 ? "property" : "properties";
        return (0, t.str)`must have ${y} ${d} when property ${u} is present`;
      },
      params: ({ params: { property: u, depsCount: l, deps: d, missingProperty: y } }) => (0, t._)`{property: ${u},
    missingProperty: ${y},
    depsCount: ${l},
    deps: ${d}}`
      // TODO change to reference
    };
    const i = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: e.error,
      code(u) {
        const [l, d] = s(u);
        o(u, l), a(u, d);
      }
    };
    function s({ schema: u }) {
      const l = {}, d = {};
      for (const y in u) {
        if (y === "__proto__")
          continue;
        const m = Array.isArray(u[y]) ? l : d;
        m[y] = u[y];
      }
      return [l, d];
    }
    function o(u, l = u.schema) {
      const { gen: d, data: y, it: m } = u;
      if (Object.keys(l).length === 0)
        return;
      const _ = d.let("missing");
      for (const b in l) {
        const w = l[b];
        if (w.length === 0)
          continue;
        const f = (0, n.propertyInData)(d, y, b, m.opts.ownProperties);
        u.setParams({
          property: b,
          depsCount: w.length,
          deps: w.join(", ")
        }), m.allErrors ? d.if(f, () => {
          for (const g of w)
            (0, n.checkReportMissingProp)(u, g);
        }) : (d.if((0, t._)`${f} && (${(0, n.checkMissingProp)(u, w, _)})`), (0, n.reportMissingProp)(u, _), d.else());
      }
    }
    e.validatePropertyDeps = o;
    function a(u, l = u.schema) {
      const { gen: d, data: y, keyword: m, it: _ } = u, b = d.name("valid");
      for (const w in l)
        (0, r.alwaysValidSchema)(_, l[w]) || (d.if(
          (0, n.propertyInData)(d, y, w, _.opts.ownProperties),
          () => {
            const f = u.subschema({ keyword: m, schemaProp: w }, b);
            u.mergeValidEvaluated(f, b);
          },
          () => d.var(b, !0)
          // TODO var
        ), u.ok(b));
    }
    e.validateSchemaDeps = a, e.default = i;
  })(dependencies)), dependencies;
}
var propertyNames = {}, hasRequiredPropertyNames;
function requirePropertyNames() {
  if (hasRequiredPropertyNames) return propertyNames;
  hasRequiredPropertyNames = 1, Object.defineProperty(propertyNames, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireUtil(), n = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: {
      message: "property name must be valid",
      params: ({ params: i }) => (0, e._)`{propertyName: ${i.propertyName}}`
    },
    code(i) {
      const { gen: s, schema: o, data: a, it: u } = i;
      if ((0, t.alwaysValidSchema)(u, o))
        return;
      const l = s.name("valid");
      s.forIn("key", a, (d) => {
        i.setParams({ propertyName: d }), i.subschema({
          keyword: "propertyNames",
          data: d,
          dataTypes: ["string"],
          propertyName: d,
          compositeRule: !0
        }, l), s.if((0, e.not)(l), () => {
          i.error(!0), u.allErrors || s.break();
        });
      }), i.ok(l);
    }
  };
  return propertyNames.default = n, propertyNames;
}
var additionalProperties = {}, hasRequiredAdditionalProperties;
function requireAdditionalProperties() {
  if (hasRequiredAdditionalProperties) return additionalProperties;
  hasRequiredAdditionalProperties = 1, Object.defineProperty(additionalProperties, "__esModule", { value: !0 });
  const e = requireCode(), t = requireCodegen(), r = requireNames(), n = requireUtil(), s = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: !0,
    trackErrors: !0,
    error: {
      message: "must NOT have additional properties",
      params: ({ params: o }) => (0, t._)`{additionalProperty: ${o.additionalProperty}}`
    },
    code(o) {
      const { gen: a, schema: u, parentSchema: l, data: d, errsCount: y, it: m } = o;
      if (!y)
        throw new Error("ajv implementation error");
      const { allErrors: _, opts: b } = m;
      if (m.props = !0, b.removeAdditional !== "all" && (0, n.alwaysValidSchema)(m, u))
        return;
      const w = (0, e.allSchemaProperties)(l.properties), f = (0, e.allSchemaProperties)(l.patternProperties);
      g(), o.ok((0, t._)`${y} === ${r.default.errors}`);
      function g() {
        a.forIn("key", d, (v) => {
          !w.length && !f.length ? S(v) : a.if(c(v), () => S(v));
        });
      }
      function c(v) {
        let $;
        if (w.length > 8) {
          const O = (0, n.schemaRefOrVal)(m, l.properties, "properties");
          $ = (0, e.isOwnProperty)(a, O, v);
        } else w.length ? $ = (0, t.or)(...w.map((O) => (0, t._)`${v} === ${O}`)) : $ = t.nil;
        return f.length && ($ = (0, t.or)($, ...f.map((O) => (0, t._)`${(0, e.usePattern)(o, O)}.test(${v})`))), (0, t.not)($);
      }
      function h(v) {
        a.code((0, t._)`delete ${d}[${v}]`);
      }
      function S(v) {
        if (b.removeAdditional === "all" || b.removeAdditional && u === !1) {
          h(v);
          return;
        }
        if (u === !1) {
          o.setParams({ additionalProperty: v }), o.error(), _ || a.break();
          return;
        }
        if (typeof u == "object" && !(0, n.alwaysValidSchema)(m, u)) {
          const $ = a.name("valid");
          b.removeAdditional === "failing" ? (p(v, $, !1), a.if((0, t.not)($), () => {
            o.reset(), h(v);
          })) : (p(v, $), _ || a.if((0, t.not)($), () => a.break()));
        }
      }
      function p(v, $, O) {
        const C = {
          keyword: "additionalProperties",
          dataProp: v,
          dataPropType: n.Type.Str
        };
        O === !1 && Object.assign(C, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), o.subschema(C, $);
      }
    }
  };
  return additionalProperties.default = s, additionalProperties;
}
var properties$1 = {}, hasRequiredProperties;
function requireProperties() {
  if (hasRequiredProperties) return properties$1;
  hasRequiredProperties = 1, Object.defineProperty(properties$1, "__esModule", { value: !0 });
  const e = requireValidate(), t = requireCode(), r = requireUtil(), n = requireAdditionalProperties(), i = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(s) {
      const { gen: o, schema: a, parentSchema: u, data: l, it: d } = s;
      d.opts.removeAdditional === "all" && u.additionalProperties === void 0 && n.default.code(new e.KeywordCxt(d, n.default, "additionalProperties"));
      const y = (0, t.allSchemaProperties)(a);
      for (const f of y)
        d.definedProperties.add(f);
      d.opts.unevaluated && y.length && d.props !== !0 && (d.props = r.mergeEvaluated.props(o, (0, r.toHash)(y), d.props));
      const m = y.filter((f) => !(0, r.alwaysValidSchema)(d, a[f]));
      if (m.length === 0)
        return;
      const _ = o.name("valid");
      for (const f of m)
        b(f) ? w(f) : (o.if((0, t.propertyInData)(o, l, f, d.opts.ownProperties)), w(f), d.allErrors || o.else().var(_, !0), o.endIf()), s.it.definedProperties.add(f), s.ok(_);
      function b(f) {
        return d.opts.useDefaults && !d.compositeRule && a[f].default !== void 0;
      }
      function w(f) {
        s.subschema({
          keyword: "properties",
          schemaProp: f,
          dataProp: f
        }, _);
      }
    }
  };
  return properties$1.default = i, properties$1;
}
var patternProperties = {}, hasRequiredPatternProperties;
function requirePatternProperties() {
  if (hasRequiredPatternProperties) return patternProperties;
  hasRequiredPatternProperties = 1, Object.defineProperty(patternProperties, "__esModule", { value: !0 });
  const e = requireCode(), t = requireCodegen(), r = requireUtil(), n = requireUtil(), i = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(s) {
      const { gen: o, schema: a, data: u, parentSchema: l, it: d } = s, { opts: y } = d, m = (0, e.allSchemaProperties)(a), _ = m.filter((S) => (0, r.alwaysValidSchema)(d, a[S]));
      if (m.length === 0 || _.length === m.length && (!d.opts.unevaluated || d.props === !0))
        return;
      const b = y.strictSchema && !y.allowMatchingProperties && l.properties, w = o.name("valid");
      d.props !== !0 && !(d.props instanceof t.Name) && (d.props = (0, n.evaluatedPropsToName)(o, d.props));
      const { props: f } = d;
      g();
      function g() {
        for (const S of m)
          b && c(S), d.allErrors ? h(S) : (o.var(w, !0), h(S), o.if(w));
      }
      function c(S) {
        for (const p in b)
          new RegExp(S).test(p) && (0, r.checkStrictMode)(d, `property ${p} matches pattern ${S} (use allowMatchingProperties)`);
      }
      function h(S) {
        o.forIn("key", u, (p) => {
          o.if((0, t._)`${(0, e.usePattern)(s, S)}.test(${p})`, () => {
            const v = _.includes(S);
            v || s.subschema({
              keyword: "patternProperties",
              schemaProp: S,
              dataProp: p,
              dataPropType: n.Type.Str
            }, w), d.opts.unevaluated && f !== !0 ? o.assign((0, t._)`${f}[${p}]`, !0) : !v && !d.allErrors && o.if((0, t.not)(w), () => o.break());
          });
        });
      }
    }
  };
  return patternProperties.default = i, patternProperties;
}
var not = {}, hasRequiredNot;
function requireNot() {
  if (hasRequiredNot) return not;
  hasRequiredNot = 1, Object.defineProperty(not, "__esModule", { value: !0 });
  const e = requireUtil(), t = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    code(r) {
      const { gen: n, schema: i, it: s } = r;
      if ((0, e.alwaysValidSchema)(s, i)) {
        r.fail();
        return;
      }
      const o = n.name("valid");
      r.subschema({
        keyword: "not",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, o), r.failResult(o, () => r.reset(), () => r.error());
    },
    error: { message: "must NOT be valid" }
  };
  return not.default = t, not;
}
var anyOf = {}, hasRequiredAnyOf;
function requireAnyOf() {
  if (hasRequiredAnyOf) return anyOf;
  hasRequiredAnyOf = 1, Object.defineProperty(anyOf, "__esModule", { value: !0 });
  const t = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: !0,
    code: requireCode().validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  return anyOf.default = t, anyOf;
}
var oneOf = {}, hasRequiredOneOf;
function requireOneOf() {
  if (hasRequiredOneOf) return oneOf;
  hasRequiredOneOf = 1, Object.defineProperty(oneOf, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireUtil(), n = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: !0,
    error: {
      message: "must match exactly one schema in oneOf",
      params: ({ params: i }) => (0, e._)`{passingSchemas: ${i.passing}}`
    },
    code(i) {
      const { gen: s, schema: o, parentSchema: a, it: u } = i;
      if (!Array.isArray(o))
        throw new Error("ajv implementation error");
      if (u.opts.discriminator && a.discriminator)
        return;
      const l = o, d = s.let("valid", !1), y = s.let("passing", null), m = s.name("_valid");
      i.setParams({ passing: y }), s.block(_), i.result(d, () => i.reset(), () => i.error(!0));
      function _() {
        l.forEach((b, w) => {
          let f;
          (0, t.alwaysValidSchema)(u, b) ? s.var(m, !0) : f = i.subschema({
            keyword: "oneOf",
            schemaProp: w,
            compositeRule: !0
          }, m), w > 0 && s.if((0, e._)`${m} && ${d}`).assign(d, !1).assign(y, (0, e._)`[${y}, ${w}]`).else(), s.if(m, () => {
            s.assign(d, !0), s.assign(y, w), f && i.mergeEvaluated(f, e.Name);
          });
        });
      }
    }
  };
  return oneOf.default = n, oneOf;
}
var allOf = {}, hasRequiredAllOf;
function requireAllOf() {
  if (hasRequiredAllOf) return allOf;
  hasRequiredAllOf = 1, Object.defineProperty(allOf, "__esModule", { value: !0 });
  const e = requireUtil(), t = {
    keyword: "allOf",
    schemaType: "array",
    code(r) {
      const { gen: n, schema: i, it: s } = r;
      if (!Array.isArray(i))
        throw new Error("ajv implementation error");
      const o = n.name("valid");
      i.forEach((a, u) => {
        if ((0, e.alwaysValidSchema)(s, a))
          return;
        const l = r.subschema({ keyword: "allOf", schemaProp: u }, o);
        r.ok(o), r.mergeEvaluated(l);
      });
    }
  };
  return allOf.default = t, allOf;
}
var _if = {}, hasRequired_if;
function require_if() {
  if (hasRequired_if) return _if;
  hasRequired_if = 1, Object.defineProperty(_if, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireUtil(), n = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    error: {
      message: ({ params: s }) => (0, e.str)`must match "${s.ifClause}" schema`,
      params: ({ params: s }) => (0, e._)`{failingKeyword: ${s.ifClause}}`
    },
    code(s) {
      const { gen: o, parentSchema: a, it: u } = s;
      a.then === void 0 && a.else === void 0 && (0, t.checkStrictMode)(u, '"if" without "then" and "else" is ignored');
      const l = i(u, "then"), d = i(u, "else");
      if (!l && !d)
        return;
      const y = o.let("valid", !0), m = o.name("_valid");
      if (_(), s.reset(), l && d) {
        const w = o.let("ifClause");
        s.setParams({ ifClause: w }), o.if(m, b("then", w), b("else", w));
      } else l ? o.if(m, b("then")) : o.if((0, e.not)(m), b("else"));
      s.pass(y, () => s.error(!0));
      function _() {
        const w = s.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, m);
        s.mergeEvaluated(w);
      }
      function b(w, f) {
        return () => {
          const g = s.subschema({ keyword: w }, m);
          o.assign(y, m), s.mergeValidEvaluated(g, y), f ? o.assign(f, (0, e._)`${w}`) : s.setParams({ ifClause: w });
        };
      }
    }
  };
  function i(s, o) {
    const a = s.schema[o];
    return a !== void 0 && !(0, t.alwaysValidSchema)(s, a);
  }
  return _if.default = n, _if;
}
var thenElse = {}, hasRequiredThenElse;
function requireThenElse() {
  if (hasRequiredThenElse) return thenElse;
  hasRequiredThenElse = 1, Object.defineProperty(thenElse, "__esModule", { value: !0 });
  const e = requireUtil(), t = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword: r, parentSchema: n, it: i }) {
      n.if === void 0 && (0, e.checkStrictMode)(i, `"${r}" without "if" is ignored`);
    }
  };
  return thenElse.default = t, thenElse;
}
var hasRequiredApplicator;
function requireApplicator() {
  if (hasRequiredApplicator) return applicator;
  hasRequiredApplicator = 1, Object.defineProperty(applicator, "__esModule", { value: !0 });
  const e = requireAdditionalItems(), t = requirePrefixItems(), r = requireItems(), n = requireItems2020(), i = requireContains(), s = requireDependencies(), o = requirePropertyNames(), a = requireAdditionalProperties(), u = requireProperties(), l = requirePatternProperties(), d = requireNot(), y = requireAnyOf(), m = requireOneOf(), _ = requireAllOf(), b = require_if(), w = requireThenElse();
  function f(g = !1) {
    const c = [
      // any
      d.default,
      y.default,
      m.default,
      _.default,
      b.default,
      w.default,
      // object
      o.default,
      a.default,
      s.default,
      u.default,
      l.default
    ];
    return g ? c.push(t.default, n.default) : c.push(e.default, r.default), c.push(i.default), c;
  }
  return applicator.default = f, applicator;
}
var format$1 = {}, format = {}, hasRequiredFormat$1;
function requireFormat$1() {
  if (hasRequiredFormat$1) return format;
  hasRequiredFormat$1 = 1, Object.defineProperty(format, "__esModule", { value: !0 });
  const e = requireCodegen(), r = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: n }) => (0, e.str)`must match format "${n}"`,
      params: ({ schemaCode: n }) => (0, e._)`{format: ${n}}`
    },
    code(n, i) {
      const { gen: s, data: o, $data: a, schema: u, schemaCode: l, it: d } = n, { opts: y, errSchemaPath: m, schemaEnv: _, self: b } = d;
      if (!y.validateFormats)
        return;
      a ? w() : f();
      function w() {
        const g = s.scopeValue("formats", {
          ref: b.formats,
          code: y.code.formats
        }), c = s.const("fDef", (0, e._)`${g}[${l}]`), h = s.let("fType"), S = s.let("format");
        s.if((0, e._)`typeof ${c} == "object" && !(${c} instanceof RegExp)`, () => s.assign(h, (0, e._)`${c}.type || "string"`).assign(S, (0, e._)`${c}.validate`), () => s.assign(h, (0, e._)`"string"`).assign(S, c)), n.fail$data((0, e.or)(p(), v()));
        function p() {
          return y.strictSchema === !1 ? e.nil : (0, e._)`${l} && !${S}`;
        }
        function v() {
          const $ = _.$async ? (0, e._)`(${c}.async ? await ${S}(${o}) : ${S}(${o}))` : (0, e._)`${S}(${o})`, O = (0, e._)`(typeof ${S} == "function" ? ${$} : ${S}.test(${o}))`;
          return (0, e._)`${S} && ${S} !== true && ${h} === ${i} && !${O}`;
        }
      }
      function f() {
        const g = b.formats[u];
        if (!g) {
          p();
          return;
        }
        if (g === !0)
          return;
        const [c, h, S] = v(g);
        c === i && n.pass($());
        function p() {
          if (y.strictSchema === !1) {
            b.logger.warn(O());
            return;
          }
          throw new Error(O());
          function O() {
            return `unknown format "${u}" ignored in schema at path "${m}"`;
          }
        }
        function v(O) {
          const C = O instanceof RegExp ? (0, e.regexpCode)(O) : y.code.formats ? (0, e._)`${y.code.formats}${(0, e.getProperty)(u)}` : void 0, j = s.scopeValue("formats", { key: u, ref: O, code: C });
          return typeof O == "object" && !(O instanceof RegExp) ? [O.type || "string", O.validate, (0, e._)`${j}.validate`] : ["string", O, j];
        }
        function $() {
          if (typeof g == "object" && !(g instanceof RegExp) && g.async) {
            if (!_.$async)
              throw new Error("async format in sync schema");
            return (0, e._)`await ${S}(${o})`;
          }
          return typeof h == "function" ? (0, e._)`${S}(${o})` : (0, e._)`${S}.test(${o})`;
        }
      }
    }
  };
  return format.default = r, format;
}
var hasRequiredFormat;
function requireFormat() {
  if (hasRequiredFormat) return format$1;
  hasRequiredFormat = 1, Object.defineProperty(format$1, "__esModule", { value: !0 });
  const t = [requireFormat$1().default];
  return format$1.default = t, format$1;
}
var metadata = {}, hasRequiredMetadata;
function requireMetadata() {
  return hasRequiredMetadata || (hasRequiredMetadata = 1, Object.defineProperty(metadata, "__esModule", { value: !0 }), metadata.contentVocabulary = metadata.metadataVocabulary = void 0, metadata.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ], metadata.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ]), metadata;
}
var hasRequiredDraft7;
function requireDraft7() {
  if (hasRequiredDraft7) return draft7;
  hasRequiredDraft7 = 1, Object.defineProperty(draft7, "__esModule", { value: !0 });
  const e = requireCore(), t = requireValidation(), r = requireApplicator(), n = requireFormat(), i = requireMetadata(), s = [
    e.default,
    t.default,
    (0, r.default)(),
    n.default,
    i.metadataVocabulary,
    i.contentVocabulary
  ];
  return draft7.default = s, draft7;
}
var discriminator = {}, types = {}, hasRequiredTypes;
function requireTypes() {
  if (hasRequiredTypes) return types;
  hasRequiredTypes = 1, Object.defineProperty(types, "__esModule", { value: !0 }), types.DiscrError = void 0;
  var e;
  return (function(t) {
    t.Tag = "tag", t.Mapping = "mapping";
  })(e || (types.DiscrError = e = {})), types;
}
var hasRequiredDiscriminator;
function requireDiscriminator() {
  if (hasRequiredDiscriminator) return discriminator;
  hasRequiredDiscriminator = 1, Object.defineProperty(discriminator, "__esModule", { value: !0 });
  const e = requireCodegen(), t = requireTypes(), r = requireCompile(), n = requireRef_error(), i = requireUtil(), o = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error: {
      message: ({ params: { discrError: a, tagName: u } }) => a === t.DiscrError.Tag ? `tag "${u}" must be string` : `value of tag "${u}" must be in oneOf`,
      params: ({ params: { discrError: a, tag: u, tagName: l } }) => (0, e._)`{error: ${a}, tag: ${l}, tagValue: ${u}}`
    },
    code(a) {
      const { gen: u, data: l, schema: d, parentSchema: y, it: m } = a, { oneOf: _ } = y;
      if (!m.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const b = d.propertyName;
      if (typeof b != "string")
        throw new Error("discriminator: requires propertyName");
      if (d.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!_)
        throw new Error("discriminator: requires oneOf keyword");
      const w = u.let("valid", !1), f = u.const("tag", (0, e._)`${l}${(0, e.getProperty)(b)}`);
      u.if((0, e._)`typeof ${f} == "string"`, () => g(), () => a.error(!1, { discrError: t.DiscrError.Tag, tag: f, tagName: b })), a.ok(w);
      function g() {
        const S = h();
        u.if(!1);
        for (const p in S)
          u.elseIf((0, e._)`${f} === ${p}`), u.assign(w, c(S[p]));
        u.else(), a.error(!1, { discrError: t.DiscrError.Mapping, tag: f, tagName: b }), u.endIf();
      }
      function c(S) {
        const p = u.name("valid"), v = a.subschema({ keyword: "oneOf", schemaProp: S }, p);
        return a.mergeEvaluated(v, e.Name), p;
      }
      function h() {
        var S;
        const p = {}, v = O(y);
        let $ = !0;
        for (let F = 0; F < _.length; F++) {
          let B = _[F];
          if (B?.$ref && !(0, i.schemaHasRulesButRef)(B, m.self.RULES)) {
            const J = B.$ref;
            if (B = r.resolveRef.call(m.self, m.schemaEnv.root, m.baseId, J), B instanceof r.SchemaEnv && (B = B.schema), B === void 0)
              throw new n.default(m.opts.uriResolver, m.baseId, J);
          }
          const z = (S = B?.properties) === null || S === void 0 ? void 0 : S[b];
          if (typeof z != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${b}"`);
          $ = $ && (v || O(B)), C(z, F);
        }
        if (!$)
          throw new Error(`discriminator: "${b}" must be required`);
        return p;
        function O({ required: F }) {
          return Array.isArray(F) && F.includes(b);
        }
        function C(F, B) {
          if (F.const)
            j(F.const, B);
          else if (F.enum)
            for (const z of F.enum)
              j(z, B);
          else
            throw new Error(`discriminator: "properties/${b}" must have "const" or "enum"`);
        }
        function j(F, B) {
          if (typeof F != "string" || F in p)
            throw new Error(`discriminator: "${b}" values must be unique strings`);
          p[F] = B;
        }
      }
    }
  };
  return discriminator.default = o, discriminator;
}
const $schema = "http://json-schema.org/draft-07/schema#", $id = "http://json-schema.org/draft-07/schema#", title = "Core schema meta-schema", definitions = { schemaArray: { type: "array", minItems: 1, items: { $ref: "#" } }, nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, type = ["object", "boolean"], properties = { $id: { type: "string", format: "uri-reference" }, $schema: { type: "string", format: "uri" }, $ref: { type: "string", format: "uri-reference" }, $comment: { type: "string" }, title: { type: "string" }, description: { type: "string" }, default: !0, readOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/definitions/nonNegativeInteger" }, minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, additionalItems: { $ref: "#" }, items: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }], default: !0 }, maxItems: { $ref: "#/definitions/nonNegativeInteger" }, minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, contains: { $ref: "#" }, maxProperties: { $ref: "#/definitions/nonNegativeInteger" }, minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, required: { $ref: "#/definitions/stringArray" }, additionalProperties: { $ref: "#" }, definitions: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, properties: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $ref: "#" }, propertyNames: { format: "regex" }, default: {} }, dependencies: { type: "object", additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] } }, propertyNames: { $ref: "#" }, const: !0, enum: { type: "array", items: !0, minItems: 1, uniqueItems: !0 }, type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, { type: "array", items: { $ref: "#/definitions/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, format: { type: "string" }, contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, if: { $ref: "#" }, then: { $ref: "#" }, else: { $ref: "#" }, allOf: { $ref: "#/definitions/schemaArray" }, anyOf: { $ref: "#/definitions/schemaArray" }, oneOf: { $ref: "#/definitions/schemaArray" }, not: { $ref: "#" } }, require$$3 = {
  $schema,
  $id,
  title,
  definitions,
  type,
  properties,
  default: !0
};
var hasRequiredAjv;
function requireAjv() {
  return hasRequiredAjv || (hasRequiredAjv = 1, (function(e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv = void 0;
    const r = requireCore$1(), n = requireDraft7(), i = requireDiscriminator(), s = require$$3, o = ["/properties"], a = "http://json-schema.org/draft-07/schema";
    class u extends r.default {
      _addVocabularies() {
        super._addVocabularies(), n.default.forEach((b) => this.addVocabulary(b)), this.opts.discriminator && this.addKeyword(i.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const b = this.opts.$data ? this.$dataMetaSchema(s, o) : s;
        this.addMetaSchema(b, a, !1), this.refs["http://json-schema.org/schema"] = a;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(a) ? a : void 0);
      }
    }
    t.Ajv = u, e.exports = t = u, e.exports.Ajv = u, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = u;
    var l = requireValidate();
    Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
      return l.KeywordCxt;
    } });
    var d = requireCodegen();
    Object.defineProperty(t, "_", { enumerable: !0, get: function() {
      return d._;
    } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
      return d.str;
    } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
      return d.stringify;
    } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
      return d.nil;
    } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
      return d.Name;
    } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
      return d.CodeGen;
    } });
    var y = requireValidation_error();
    Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
      return y.default;
    } });
    var m = requireRef_error();
    Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
      return m.default;
    } });
  })(ajv, ajv.exports)), ajv.exports;
}
requireAjv();
function __awaiter(e, t, r, n) {
  function i(s) {
    return s instanceof r ? s : new r(function(o) {
      o(s);
    });
  }
  return new (r || (r = Promise))(function(s, o) {
    function a(d) {
      try {
        l(n.next(d));
      } catch (y) {
        o(y);
      }
    }
    function u(d) {
      try {
        l(n.throw(d));
      } catch (y) {
        o(y);
      }
    }
    function l(d) {
      d.done ? s(d.value) : i(d.value).then(a, u);
    }
    l((n = n.apply(e, [])).next());
  });
}
function __generator(e, t) {
  var r = { label: 0, sent: function() {
    if (s[0] & 1) throw s[1];
    return s[1];
  }, trys: [], ops: [] }, n, i, s, o;
  return o = { next: a(0), throw: a(1), return: a(2) }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
    return this;
  }), o;
  function a(l) {
    return function(d) {
      return u([l, d]);
    };
  }
  function u(l) {
    if (n) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (n = 1, i && (s = l[0] & 2 ? i.return : l[0] ? i.throw || ((s = i.return) && s.call(i), 0) : i.next) && !(s = s.call(i, l[1])).done) return s;
      switch (i = 0, s && (l = [l[0] & 2, s.value]), l[0]) {
        case 0:
        case 1:
          s = l;
          break;
        case 4:
          return r.label++, { value: l[1], done: !1 };
        case 5:
          r.label++, i = l[1], l = [0];
          continue;
        case 7:
          l = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (s = r.trys, !(s = s.length > 0 && s[s.length - 1]) && (l[0] === 6 || l[0] === 2)) {
            r = 0;
            continue;
          }
          if (l[0] === 3 && (!s || l[1] > s[0] && l[1] < s[3])) {
            r.label = l[1];
            break;
          }
          if (l[0] === 6 && r.label < s[1]) {
            r.label = s[1], s = l;
            break;
          }
          if (s && r.label < s[2]) {
            r.label = s[2], r.ops.push(l);
            break;
          }
          s[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      l = t.call(e, r);
    } catch (d) {
      l = [6, d], i = 0;
    } finally {
      n = s = 0;
    }
    if (l[0] & 5) throw l[1];
    return { value: l[0] ? l[1] : void 0, done: !0 };
  }
}
function __read(e, t) {
  var r = typeof Symbol == "function" && e[Symbol.iterator];
  if (!r) return e;
  var n = r.call(e), i, s = [], o;
  try {
    for (; (t === void 0 || t-- > 0) && !(i = n.next()).done; ) s.push(i.value);
  } catch (a) {
    o = { error: a };
  } finally {
    try {
      i && !i.done && (r = n.return) && r.call(n);
    } finally {
      if (o) throw o.error;
    }
  }
  return s;
}
function __spreadArray(e, t, r) {
  if (arguments.length === 2) for (var n = 0, i = t.length, s; n < i; n++)
    (s || !(n in t)) && (s || (s = Array.prototype.slice.call(t, 0, n)), s[n] = t[n]);
  return e.concat(s || Array.prototype.slice.call(t));
}
var defaultErrorConfig = {
  withStackTrace: !1
}, createNeverThrowError = function(e, t, r) {
  r === void 0 && (r = defaultErrorConfig);
  var n = t.isOk() ? { type: "Ok", value: t.value } : { type: "Err", value: t.error }, i = r.withStackTrace ? new Error().stack : void 0;
  return {
    data: n,
    message: e,
    stack: i
  };
}, Result;
(function(e) {
  function t(r, n) {
    return function() {
      for (var i = [], s = 0; s < arguments.length; s++)
        i[s] = arguments[s];
      try {
        var o = r.apply(void 0, __spreadArray([], __read(i), !1));
        return ok(o);
      } catch (a) {
        return err(n ? n(a) : a);
      }
    };
  }
  e.fromThrowable = t;
})(Result || (Result = {}));
var ok = function(e) {
  return new Ok(e);
}, err = function(e) {
  return new Err(e);
}, Ok = (
  /** @class */
  (function() {
    function e(t) {
      this.value = t;
    }
    return e.prototype.isOk = function() {
      return !0;
    }, e.prototype.isErr = function() {
      return !this.isOk();
    }, e.prototype.map = function(t) {
      return ok(t(this.value));
    }, e.prototype.mapErr = function(t) {
      return ok(this.value);
    }, e.prototype.andThen = function(t) {
      return t(this.value);
    }, e.prototype.orElse = function(t) {
      return ok(this.value);
    }, e.prototype.asyncAndThen = function(t) {
      return t(this.value);
    }, e.prototype.asyncMap = function(t) {
      return ResultAsync.fromSafePromise(t(this.value));
    }, e.prototype.unwrapOr = function(t) {
      return this.value;
    }, e.prototype.match = function(t, r) {
      return t(this.value);
    }, e.prototype._unsafeUnwrap = function(t) {
      return this.value;
    }, e.prototype._unsafeUnwrapErr = function(t) {
      throw createNeverThrowError("Called `_unsafeUnwrapErr` on an Ok", this, t);
    }, e;
  })()
), Err = (
  /** @class */
  (function() {
    function e(t) {
      this.error = t;
    }
    return e.prototype.isOk = function() {
      return !1;
    }, e.prototype.isErr = function() {
      return !this.isOk();
    }, e.prototype.map = function(t) {
      return err(this.error);
    }, e.prototype.mapErr = function(t) {
      return err(t(this.error));
    }, e.prototype.andThen = function(t) {
      return err(this.error);
    }, e.prototype.orElse = function(t) {
      return t(this.error);
    }, e.prototype.asyncAndThen = function(t) {
      return errAsync(this.error);
    }, e.prototype.asyncMap = function(t) {
      return errAsync(this.error);
    }, e.prototype.unwrapOr = function(t) {
      return t;
    }, e.prototype.match = function(t, r) {
      return r(this.error);
    }, e.prototype._unsafeUnwrap = function(t) {
      throw createNeverThrowError("Called `_unsafeUnwrap` on an Err", this, t);
    }, e.prototype._unsafeUnwrapErr = function(t) {
      return this.error;
    }, e;
  })()
);
Result.fromThrowable;
var ResultAsync = (
  /** @class */
  (function() {
    function e(t) {
      this._promise = t;
    }
    return e.fromSafePromise = function(t) {
      var r = t.then(function(n) {
        return new Ok(n);
      });
      return new e(r);
    }, e.fromPromise = function(t, r) {
      var n = t.then(function(i) {
        return new Ok(i);
      }).catch(function(i) {
        return new Err(r(i));
      });
      return new e(n);
    }, e.prototype.map = function(t) {
      var r = this;
      return new e(this._promise.then(function(n) {
        return __awaiter(r, void 0, void 0, function() {
          var i;
          return __generator(this, function(s) {
            switch (s.label) {
              case 0:
                return n.isErr() ? [2, new Err(n.error)] : (i = Ok.bind, [4, t(n.value)]);
              case 1:
                return [2, new (i.apply(Ok, [void 0, s.sent()]))()];
            }
          });
        });
      }));
    }, e.prototype.mapErr = function(t) {
      var r = this;
      return new e(this._promise.then(function(n) {
        return __awaiter(r, void 0, void 0, function() {
          var i;
          return __generator(this, function(s) {
            switch (s.label) {
              case 0:
                return n.isOk() ? [2, new Ok(n.value)] : (i = Err.bind, [4, t(n.error)]);
              case 1:
                return [2, new (i.apply(Err, [void 0, s.sent()]))()];
            }
          });
        });
      }));
    }, e.prototype.andThen = function(t) {
      return new e(this._promise.then(function(r) {
        if (r.isErr())
          return new Err(r.error);
        var n = t(r.value);
        return n instanceof e ? n._promise : n;
      }));
    }, e.prototype.orElse = function(t) {
      var r = this;
      return new e(this._promise.then(function(n) {
        return __awaiter(r, void 0, void 0, function() {
          return __generator(this, function(i) {
            return n.isErr() ? [2, t(n.error)] : [2, new Ok(n.value)];
          });
        });
      }));
    }, e.prototype.match = function(t, r) {
      return this._promise.then(function(n) {
        return n.match(t, r);
      });
    }, e.prototype.unwrapOr = function(t) {
      return this._promise.then(function(r) {
        return r.unwrapOr(t);
      });
    }, e.prototype.then = function(t, r) {
      return this._promise.then(t, r);
    }, e;
  })()
), errAsync = function(e) {
  return new ResultAsync(Promise.resolve(new Err(e)));
};
ResultAsync.fromPromise;
ResultAsync.fromSafePromise;
const ALIAS = Symbol.for("yaml.alias"), DOC = Symbol.for("yaml.document"), MAP = Symbol.for("yaml.map"), PAIR = Symbol.for("yaml.pair"), SCALAR = Symbol.for("yaml.scalar"), SEQ = Symbol.for("yaml.seq"), NODE_TYPE = Symbol.for("yaml.node.type"), isAlias = (e) => !!e && typeof e == "object" && e[NODE_TYPE] === ALIAS, isDocument = (e) => !!e && typeof e == "object" && e[NODE_TYPE] === DOC, isMap = (e) => !!e && typeof e == "object" && e[NODE_TYPE] === MAP, isPair = (e) => !!e && typeof e == "object" && e[NODE_TYPE] === PAIR, isScalar = (e) => !!e && typeof e == "object" && e[NODE_TYPE] === SCALAR, isSeq = (e) => !!e && typeof e == "object" && e[NODE_TYPE] === SEQ;
function isCollection(e) {
  if (e && typeof e == "object")
    switch (e[NODE_TYPE]) {
      case MAP:
      case SEQ:
        return !0;
    }
  return !1;
}
function isNode(e) {
  if (e && typeof e == "object")
    switch (e[NODE_TYPE]) {
      case ALIAS:
      case MAP:
      case SCALAR:
      case SEQ:
        return !0;
    }
  return !1;
}
const hasAnchor = (e) => (isScalar(e) || isCollection(e)) && !!e.anchor, BREAK = Symbol("break visit"), SKIP = Symbol("skip children"), REMOVE = Symbol("remove node");
function visit(e, t) {
  const r = initVisitor(t);
  isDocument(e) ? visit_(null, e.contents, r, Object.freeze([e])) === REMOVE && (e.contents = null) : visit_(null, e, r, Object.freeze([]));
}
visit.BREAK = BREAK;
visit.SKIP = SKIP;
visit.REMOVE = REMOVE;
function visit_(e, t, r, n) {
  const i = callVisitor(e, t, r, n);
  if (isNode(i) || isPair(i))
    return replaceNode(e, n, i), visit_(e, i, r, n);
  if (typeof i != "symbol") {
    if (isCollection(t)) {
      n = Object.freeze(n.concat(t));
      for (let s = 0; s < t.items.length; ++s) {
        const o = visit_(s, t.items[s], r, n);
        if (typeof o == "number")
          s = o - 1;
        else {
          if (o === BREAK)
            return BREAK;
          o === REMOVE && (t.items.splice(s, 1), s -= 1);
        }
      }
    } else if (isPair(t)) {
      n = Object.freeze(n.concat(t));
      const s = visit_("key", t.key, r, n);
      if (s === BREAK)
        return BREAK;
      s === REMOVE && (t.key = null);
      const o = visit_("value", t.value, r, n);
      if (o === BREAK)
        return BREAK;
      o === REMOVE && (t.value = null);
    }
  }
  return i;
}
function initVisitor(e) {
  return typeof e == "object" && (e.Collection || e.Node || e.Value) ? Object.assign({
    Alias: e.Node,
    Map: e.Node,
    Scalar: e.Node,
    Seq: e.Node
  }, e.Value && {
    Map: e.Value,
    Scalar: e.Value,
    Seq: e.Value
  }, e.Collection && {
    Map: e.Collection,
    Seq: e.Collection
  }, e) : e;
}
function callVisitor(e, t, r, n) {
  if (typeof r == "function")
    return r(e, t, n);
  if (isMap(t))
    return r.Map?.(e, t, n);
  if (isSeq(t))
    return r.Seq?.(e, t, n);
  if (isPair(t))
    return r.Pair?.(e, t, n);
  if (isScalar(t))
    return r.Scalar?.(e, t, n);
  if (isAlias(t))
    return r.Alias?.(e, t, n);
}
function replaceNode(e, t, r) {
  const n = t[t.length - 1];
  if (isCollection(n))
    n.items[e] = r;
  else if (isPair(n))
    e === "key" ? n.key = r : n.value = r;
  else if (isDocument(n))
    n.contents = r;
  else {
    const i = isAlias(n) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${i} parent`);
  }
}
function anchorIsValid(e) {
  if (/[\x00-\x19\s,[\]{}]/.test(e)) {
    const r = `Anchor must not contain whitespace or control characters: ${JSON.stringify(e)}`;
    throw new Error(r);
  }
  return !0;
}
function applyReviver(e, t, r, n) {
  if (n && typeof n == "object")
    if (Array.isArray(n))
      for (let i = 0, s = n.length; i < s; ++i) {
        const o = n[i], a = applyReviver(e, n, String(i), o);
        a === void 0 ? delete n[i] : a !== o && (n[i] = a);
      }
    else if (n instanceof Map)
      for (const i of Array.from(n.keys())) {
        const s = n.get(i), o = applyReviver(e, n, i, s);
        o === void 0 ? n.delete(i) : o !== s && n.set(i, o);
      }
    else if (n instanceof Set)
      for (const i of Array.from(n)) {
        const s = applyReviver(e, n, i, i);
        s === void 0 ? n.delete(i) : s !== i && (n.delete(i), n.add(s));
      }
    else
      for (const [i, s] of Object.entries(n)) {
        const o = applyReviver(e, n, i, s);
        o === void 0 ? delete n[i] : o !== s && (n[i] = o);
      }
  return e.call(t, r, n);
}
function toJS(e, t, r) {
  if (Array.isArray(e))
    return e.map((n, i) => toJS(n, String(i), r));
  if (e && typeof e.toJSON == "function") {
    if (!r || !hasAnchor(e))
      return e.toJSON(t, r);
    const n = { aliasCount: 0, count: 1, res: void 0 };
    r.anchors.set(e, n), r.onCreate = (s) => {
      n.res = s, delete r.onCreate;
    };
    const i = e.toJSON(t, r);
    return r.onCreate && r.onCreate(i), i;
  }
  return typeof e == "bigint" && !r?.keep ? Number(e) : e;
}
class NodeBase {
  constructor(t) {
    Object.defineProperty(this, NODE_TYPE, { value: t });
  }
  /** Create a copy of this node.  */
  clone() {
    const t = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    return this.range && (t.range = this.range.slice()), t;
  }
  /** A plain JavaScript representation of this node. */
  toJS(t, { mapAsMap: r, maxAliasCount: n, onAnchor: i, reviver: s } = {}) {
    if (!isDocument(t))
      throw new TypeError("A document argument is required");
    const o = {
      anchors: /* @__PURE__ */ new Map(),
      doc: t,
      keep: !0,
      mapAsMap: r === !0,
      mapKeyWarned: !1,
      maxAliasCount: typeof n == "number" ? n : 100
    }, a = toJS(this, "", o);
    if (typeof i == "function")
      for (const { count: u, res: l } of o.anchors.values())
        i(l, u);
    return typeof s == "function" ? applyReviver(s, { "": a }, "", a) : a;
  }
}
class Alias extends NodeBase {
  constructor(t) {
    super(ALIAS), this.source = t, Object.defineProperty(this, "tag", {
      set() {
        throw new Error("Alias nodes cannot have tags");
      }
    });
  }
  /**
   * Resolve the value of this alias within `doc`, finding the last
   * instance of the `source` anchor before this node.
   */
  resolve(t, r) {
    let n;
    r?.aliasResolveCache ? n = r.aliasResolveCache : (n = [], visit(t, {
      Node: (s, o) => {
        (isAlias(o) || hasAnchor(o)) && n.push(o);
      }
    }), r && (r.aliasResolveCache = n));
    let i;
    for (const s of n) {
      if (s === this)
        break;
      s.anchor === this.source && (i = s);
    }
    return i;
  }
  toJSON(t, r) {
    if (!r)
      return { source: this.source };
    const { anchors: n, doc: i, maxAliasCount: s } = r, o = this.resolve(i, r);
    if (!o) {
      const u = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(u);
    }
    let a = n.get(o);
    if (a || (toJS(o, null, r), a = n.get(o)), a?.res === void 0) {
      const u = "This should not happen: Alias anchor was not resolved?";
      throw new ReferenceError(u);
    }
    if (s >= 0 && (a.count += 1, a.aliasCount === 0 && (a.aliasCount = getAliasCount(i, o, n)), a.count * a.aliasCount > s)) {
      const u = "Excessive alias count indicates a resource exhaustion attack";
      throw new ReferenceError(u);
    }
    return a.res;
  }
  toString(t, r, n) {
    const i = `*${this.source}`;
    if (t) {
      if (anchorIsValid(this.source), t.options.verifyAliasOrder && !t.anchors.has(this.source)) {
        const s = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(s);
      }
      if (t.implicitKey)
        return `${i} `;
    }
    return i;
  }
}
function getAliasCount(e, t, r) {
  if (isAlias(t)) {
    const n = t.resolve(e), i = r && n && r.get(n);
    return i ? i.count * i.aliasCount : 0;
  } else if (isCollection(t)) {
    let n = 0;
    for (const i of t.items) {
      const s = getAliasCount(e, i, r);
      s > n && (n = s);
    }
    return n;
  } else if (isPair(t)) {
    const n = getAliasCount(e, t.key, r), i = getAliasCount(e, t.value, r);
    return Math.max(n, i);
  }
  return 1;
}
const isScalarValue = (e) => !e || typeof e != "function" && typeof e != "object";
class Scalar extends NodeBase {
  constructor(t) {
    super(SCALAR), this.value = t;
  }
  toJSON(t, r) {
    return r?.keep ? this.value : toJS(this.value, t, r);
  }
  toString() {
    return String(this.value);
  }
}
Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
Scalar.PLAIN = "PLAIN";
Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
function findTagObject(e, t, r) {
  return r.find((n) => n.identify?.(e) && !n.format);
}
function createNode(e, t, r) {
  if (isDocument(e) && (e = e.contents), isNode(e))
    return e;
  if (isPair(e)) {
    const y = r.schema[MAP].createNode?.(r.schema, null, r);
    return y.items.push(e), y;
  }
  (e instanceof String || e instanceof Number || e instanceof Boolean || typeof BigInt < "u" && e instanceof BigInt) && (e = e.valueOf());
  const { aliasDuplicateObjects: n, onAnchor: i, onTagObj: s, schema: o, sourceObjects: a } = r;
  let u;
  if (n && e && typeof e == "object") {
    if (u = a.get(e), u)
      return u.anchor ?? (u.anchor = i(e)), new Alias(u.anchor);
    u = { anchor: null, node: null }, a.set(e, u);
  }
  let l = findTagObject(e, t, o.tags);
  if (!l) {
    if (e && typeof e.toJSON == "function" && (e = e.toJSON()), !e || typeof e != "object") {
      const y = new Scalar(e);
      return u && (u.node = y), y;
    }
    l = e instanceof Map ? o[MAP] : Symbol.iterator in Object(e) ? o[SEQ] : o[MAP];
  }
  s && (s(l), delete r.onTagObj);
  const d = l?.createNode ? l.createNode(r.schema, e, r) : typeof l?.nodeClass?.from == "function" ? l.nodeClass.from(r.schema, e, r) : new Scalar(e);
  return l.default || (d.tag = l.tag), u && (u.node = d), d;
}
function collectionFromPath(e, t, r) {
  let n = r;
  for (let i = t.length - 1; i >= 0; --i) {
    const s = t[i];
    if (typeof s == "number" && Number.isInteger(s) && s >= 0) {
      const o = [];
      o[s] = n, n = o;
    } else
      n = /* @__PURE__ */ new Map([[s, n]]);
  }
  return createNode(n, void 0, {
    aliasDuplicateObjects: !1,
    keepUndefined: !1,
    onAnchor: () => {
      throw new Error("This should not happen, please report a bug.");
    },
    schema: e,
    sourceObjects: /* @__PURE__ */ new Map()
  });
}
const isEmptyPath = (e) => e == null || typeof e == "object" && !!e[Symbol.iterator]().next().done;
class Collection extends NodeBase {
  constructor(t, r) {
    super(t), Object.defineProperty(this, "schema", {
      value: r,
      configurable: !0,
      enumerable: !1,
      writable: !0
    });
  }
  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(t) {
    const r = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    return t && (r.schema = t), r.items = r.items.map((n) => isNode(n) || isPair(n) ? n.clone(t) : n), this.range && (r.range = this.range.slice()), r;
  }
  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  addIn(t, r) {
    if (isEmptyPath(t))
      this.add(r);
    else {
      const [n, ...i] = t, s = this.get(n, !0);
      if (isCollection(s))
        s.addIn(i, r);
      else if (s === void 0 && this.schema)
        this.set(n, collectionFromPath(this.schema, i, r));
      else
        throw new Error(`Expected YAML collection at ${n}. Remaining path: ${i}`);
    }
  }
  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(t) {
    const [r, ...n] = t;
    if (n.length === 0)
      return this.delete(r);
    const i = this.get(r, !0);
    if (isCollection(i))
      return i.deleteIn(n);
    throw new Error(`Expected YAML collection at ${r}. Remaining path: ${n}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(t, r) {
    const [n, ...i] = t, s = this.get(n, !0);
    return i.length === 0 ? !r && isScalar(s) ? s.value : s : isCollection(s) ? s.getIn(i, r) : void 0;
  }
  hasAllNullValues(t) {
    return this.items.every((r) => {
      if (!isPair(r))
        return !1;
      const n = r.value;
      return n == null || t && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
    });
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn(t) {
    const [r, ...n] = t;
    if (n.length === 0)
      return this.has(r);
    const i = this.get(r, !0);
    return isCollection(i) ? i.hasIn(n) : !1;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(t, r) {
    const [n, ...i] = t;
    if (i.length === 0)
      this.set(n, r);
    else {
      const s = this.get(n, !0);
      if (isCollection(s))
        s.setIn(i, r);
      else if (s === void 0 && this.schema)
        this.set(n, collectionFromPath(this.schema, i, r));
      else
        throw new Error(`Expected YAML collection at ${n}. Remaining path: ${i}`);
    }
  }
}
const stringifyComment = (e) => e.replace(/^(?!$)(?: $)?/gm, "#");
function indentComment(e, t) {
  return /^\n+$/.test(e) ? e.substring(1) : t ? e.replace(/^(?! *$)/gm, t) : e;
}
const lineComment = (e, t, r) => e.endsWith(`
`) ? indentComment(r, t) : r.includes(`
`) ? `
` + indentComment(r, t) : (e.endsWith(" ") ? "" : " ") + r, FOLD_FLOW = "flow", FOLD_BLOCK = "block", FOLD_QUOTED = "quoted";
function foldFlowLines(e, t, r = "flow", { indentAtStart: n, lineWidth: i = 80, minContentWidth: s = 20, onFold: o, onOverflow: a } = {}) {
  if (!i || i < 0)
    return e;
  i < s && (s = 0);
  const u = Math.max(1 + s, 1 + i - t.length);
  if (e.length <= u)
    return e;
  const l = [], d = {};
  let y = i - t.length;
  typeof n == "number" && (n > i - Math.max(2, s) ? l.push(0) : y = i - n);
  let m, _, b = !1, w = -1, f = -1, g = -1;
  r === FOLD_BLOCK && (w = consumeMoreIndentedLines(e, w, t.length), w !== -1 && (y = w + u));
  for (let h; h = e[w += 1]; ) {
    if (r === FOLD_QUOTED && h === "\\") {
      switch (f = w, e[w + 1]) {
        case "x":
          w += 3;
          break;
        case "u":
          w += 5;
          break;
        case "U":
          w += 9;
          break;
        default:
          w += 1;
      }
      g = w;
    }
    if (h === `
`)
      r === FOLD_BLOCK && (w = consumeMoreIndentedLines(e, w, t.length)), y = w + t.length + u, m = void 0;
    else {
      if (h === " " && _ && _ !== " " && _ !== `
` && _ !== "	") {
        const S = e[w + 1];
        S && S !== " " && S !== `
` && S !== "	" && (m = w);
      }
      if (w >= y)
        if (m)
          l.push(m), y = m + u, m = void 0;
        else if (r === FOLD_QUOTED) {
          for (; _ === " " || _ === "	"; )
            _ = h, h = e[w += 1], b = !0;
          const S = w > g + 1 ? w - 2 : f - 1;
          if (d[S])
            return e;
          l.push(S), d[S] = !0, y = S + u, m = void 0;
        } else
          b = !0;
    }
    _ = h;
  }
  if (b && a && a(), l.length === 0)
    return e;
  o && o();
  let c = e.slice(0, l[0]);
  for (let h = 0; h < l.length; ++h) {
    const S = l[h], p = l[h + 1] || e.length;
    S === 0 ? c = `
${t}${e.slice(0, p)}` : (r === FOLD_QUOTED && d[S] && (c += `${e[S]}\\`), c += `
${t}${e.slice(S + 1, p)}`);
  }
  return c;
}
function consumeMoreIndentedLines(e, t, r) {
  let n = t, i = t + 1, s = e[i];
  for (; s === " " || s === "	"; )
    if (t < i + r)
      s = e[++t];
    else {
      do
        s = e[++t];
      while (s && s !== `
`);
      n = t, i = t + 1, s = e[i];
    }
  return n;
}
const getFoldOptions = (e, t) => ({
  indentAtStart: t ? e.indent.length : e.indentAtStart,
  lineWidth: e.options.lineWidth,
  minContentWidth: e.options.minContentWidth
}), containsDocumentMarker = (e) => /^(%|---|\.\.\.)/m.test(e);
function lineLengthOverLimit(e, t, r) {
  if (!t || t < 0)
    return !1;
  const n = t - r, i = e.length;
  if (i <= n)
    return !1;
  for (let s = 0, o = 0; s < i; ++s)
    if (e[s] === `
`) {
      if (s - o > n)
        return !0;
      if (o = s + 1, i - o <= n)
        return !1;
    }
  return !0;
}
function doubleQuotedString(e, t) {
  const r = JSON.stringify(e);
  if (t.options.doubleQuotedAsJSON)
    return r;
  const { implicitKey: n } = t, i = t.options.doubleQuotedMinMultiLineLength, s = t.indent || (containsDocumentMarker(e) ? "  " : "");
  let o = "", a = 0;
  for (let u = 0, l = r[u]; l; l = r[++u])
    if (l === " " && r[u + 1] === "\\" && r[u + 2] === "n" && (o += r.slice(a, u) + "\\ ", u += 1, a = u, l = "\\"), l === "\\")
      switch (r[u + 1]) {
        case "u":
          {
            o += r.slice(a, u);
            const d = r.substr(u + 2, 4);
            switch (d) {
              case "0000":
                o += "\\0";
                break;
              case "0007":
                o += "\\a";
                break;
              case "000b":
                o += "\\v";
                break;
              case "001b":
                o += "\\e";
                break;
              case "0085":
                o += "\\N";
                break;
              case "00a0":
                o += "\\_";
                break;
              case "2028":
                o += "\\L";
                break;
              case "2029":
                o += "\\P";
                break;
              default:
                d.substr(0, 2) === "00" ? o += "\\x" + d.substr(2) : o += r.substr(u, 6);
            }
            u += 5, a = u + 1;
          }
          break;
        case "n":
          if (n || r[u + 2] === '"' || r.length < i)
            u += 1;
          else {
            for (o += r.slice(a, u) + `

`; r[u + 2] === "\\" && r[u + 3] === "n" && r[u + 4] !== '"'; )
              o += `
`, u += 2;
            o += s, r[u + 2] === " " && (o += "\\"), u += 1, a = u + 1;
          }
          break;
        default:
          u += 1;
      }
  return o = a ? o + r.slice(a) : r, n ? o : foldFlowLines(o, s, FOLD_QUOTED, getFoldOptions(t, !1));
}
function singleQuotedString(e, t) {
  if (t.options.singleQuote === !1 || t.implicitKey && e.includes(`
`) || /[ \t]\n|\n[ \t]/.test(e))
    return doubleQuotedString(e, t);
  const r = t.indent || (containsDocumentMarker(e) ? "  " : ""), n = "'" + e.replace(/'/g, "''").replace(/\n+/g, `$&
${r}`) + "'";
  return t.implicitKey ? n : foldFlowLines(n, r, FOLD_FLOW, getFoldOptions(t, !1));
}
function quotedString(e, t) {
  const { singleQuote: r } = t.options;
  let n;
  if (r === !1)
    n = doubleQuotedString;
  else {
    const i = e.includes('"'), s = e.includes("'");
    i && !s ? n = singleQuotedString : s && !i ? n = doubleQuotedString : n = r ? singleQuotedString : doubleQuotedString;
  }
  return n(e, t);
}
let blockEndNewlines;
try {
  blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
} catch {
  blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment: e, type: t, value: r }, n, i, s) {
  const { blockQuote: o, commentString: a, lineWidth: u } = n.options;
  if (!o || /\n[\t ]+$/.test(r))
    return quotedString(r, n);
  const l = n.indent || (n.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), d = o === "literal" ? !0 : o === "folded" || t === Scalar.BLOCK_FOLDED ? !1 : t === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, u, l.length);
  if (!r)
    return d ? `|
` : `>
`;
  let y, m;
  for (m = r.length; m > 0; --m) {
    const p = r[m - 1];
    if (p !== `
` && p !== "	" && p !== " ")
      break;
  }
  let _ = r.substring(m);
  const b = _.indexOf(`
`);
  b === -1 ? y = "-" : r === _ || b !== _.length - 1 ? (y = "+", s && s()) : y = "", _ && (r = r.slice(0, -_.length), _[_.length - 1] === `
` && (_ = _.slice(0, -1)), _ = _.replace(blockEndNewlines, `$&${l}`));
  let w = !1, f, g = -1;
  for (f = 0; f < r.length; ++f) {
    const p = r[f];
    if (p === " ")
      w = !0;
    else if (p === `
`)
      g = f;
    else
      break;
  }
  let c = r.substring(0, g < f ? g + 1 : f);
  c && (r = r.substring(c.length), c = c.replace(/\n+/g, `$&${l}`));
  let S = (w ? l ? "2" : "1" : "") + y;
  if (e && (S += " " + a(e.replace(/ ?[\r\n]+/g, " ")), i && i()), !d) {
    const p = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${l}`);
    let v = !1;
    const $ = getFoldOptions(n, !0);
    o !== "folded" && t !== Scalar.BLOCK_FOLDED && ($.onOverflow = () => {
      v = !0;
    });
    const O = foldFlowLines(`${c}${p}${_}`, l, FOLD_BLOCK, $);
    if (!v)
      return `>${S}
${l}${O}`;
  }
  return r = r.replace(/\n+/g, `$&${l}`), `|${S}
${l}${c}${r}${_}`;
}
function plainString(e, t, r, n) {
  const { type: i, value: s } = e, { actualString: o, implicitKey: a, indent: u, indentStep: l, inFlow: d } = t;
  if (a && s.includes(`
`) || d && /[[\]{},]/.test(s))
    return quotedString(s, t);
  if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(s))
    return a || d || !s.includes(`
`) ? quotedString(s, t) : blockString(e, t, r, n);
  if (!a && !d && i !== Scalar.PLAIN && s.includes(`
`))
    return blockString(e, t, r, n);
  if (containsDocumentMarker(s)) {
    if (u === "")
      return t.forceBlockIndent = !0, blockString(e, t, r, n);
    if (a && u === l)
      return quotedString(s, t);
  }
  const y = s.replace(/\n+/g, `$&
${u}`);
  if (o) {
    const m = (w) => w.default && w.tag !== "tag:yaml.org,2002:str" && w.test?.test(y), { compat: _, tags: b } = t.doc.schema;
    if (b.some(m) || _?.some(m))
      return quotedString(s, t);
  }
  return a ? y : foldFlowLines(y, u, FOLD_FLOW, getFoldOptions(t, !1));
}
function stringifyString(e, t, r, n) {
  const { implicitKey: i, inFlow: s } = t, o = typeof e.value == "string" ? e : Object.assign({}, e, { value: String(e.value) });
  let { type: a } = e;
  a !== Scalar.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(o.value) && (a = Scalar.QUOTE_DOUBLE);
  const u = (d) => {
    switch (d) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return i || s ? quotedString(o.value, t) : blockString(o, t, r, n);
      case Scalar.QUOTE_DOUBLE:
        return doubleQuotedString(o.value, t);
      case Scalar.QUOTE_SINGLE:
        return singleQuotedString(o.value, t);
      case Scalar.PLAIN:
        return plainString(o, t, r, n);
      default:
        return null;
    }
  };
  let l = u(a);
  if (l === null) {
    const { defaultKeyType: d, defaultStringType: y } = t.options, m = i && d || y;
    if (l = u(m), l === null)
      throw new Error(`Unsupported default string type ${m}`);
  }
  return l;
}
function createStringifyContext(e, t) {
  const r = Object.assign({
    blockQuote: !0,
    commentString: stringifyComment,
    defaultKeyType: null,
    defaultStringType: "PLAIN",
    directives: null,
    doubleQuotedAsJSON: !1,
    doubleQuotedMinMultiLineLength: 40,
    falseStr: "false",
    flowCollectionPadding: !0,
    indentSeq: !0,
    lineWidth: 80,
    minContentWidth: 20,
    nullStr: "null",
    simpleKeys: !1,
    singleQuote: null,
    trueStr: "true",
    verifyAliasOrder: !0
  }, e.schema.toStringOptions, t);
  let n;
  switch (r.collectionStyle) {
    case "block":
      n = !1;
      break;
    case "flow":
      n = !0;
      break;
    default:
      n = null;
  }
  return {
    anchors: /* @__PURE__ */ new Set(),
    doc: e,
    flowCollectionPadding: r.flowCollectionPadding ? " " : "",
    indent: "",
    indentStep: typeof r.indent == "number" ? " ".repeat(r.indent) : "  ",
    inFlow: n,
    options: r
  };
}
function getTagObject(e, t) {
  if (t.tag) {
    const i = e.filter((s) => s.tag === t.tag);
    if (i.length > 0)
      return i.find((s) => s.format === t.format) ?? i[0];
  }
  let r, n;
  if (isScalar(t)) {
    n = t.value;
    let i = e.filter((s) => s.identify?.(n));
    if (i.length > 1) {
      const s = i.filter((o) => o.test);
      s.length > 0 && (i = s);
    }
    r = i.find((s) => s.format === t.format) ?? i.find((s) => !s.format);
  } else
    n = t, r = e.find((i) => i.nodeClass && n instanceof i.nodeClass);
  if (!r) {
    const i = n?.constructor?.name ?? (n === null ? "null" : typeof n);
    throw new Error(`Tag not resolved for ${i} value`);
  }
  return r;
}
function stringifyProps(e, t, { anchors: r, doc: n }) {
  if (!n.directives)
    return "";
  const i = [], s = (isScalar(e) || isCollection(e)) && e.anchor;
  s && anchorIsValid(s) && (r.add(s), i.push(`&${s}`));
  const o = e.tag ?? (t.default ? null : t.tag);
  return o && i.push(n.directives.tagString(o)), i.join(" ");
}
function stringify(e, t, r, n) {
  if (isPair(e))
    return e.toString(t, r, n);
  if (isAlias(e)) {
    if (t.doc.directives)
      return e.toString(t);
    if (t.resolvedAliases?.has(e))
      throw new TypeError("Cannot stringify circular structure without alias nodes");
    t.resolvedAliases ? t.resolvedAliases.add(e) : t.resolvedAliases = /* @__PURE__ */ new Set([e]), e = e.resolve(t.doc);
  }
  let i;
  const s = isNode(e) ? e : t.doc.createNode(e, { onTagObj: (u) => i = u });
  i ?? (i = getTagObject(t.doc.schema.tags, s));
  const o = stringifyProps(s, i, t);
  o.length > 0 && (t.indentAtStart = (t.indentAtStart ?? 0) + o.length + 1);
  const a = typeof i.stringify == "function" ? i.stringify(s, t, r, n) : isScalar(s) ? stringifyString(s, t, r, n) : s.toString(t, r, n);
  return o ? isScalar(s) || a[0] === "{" || a[0] === "[" ? `${o} ${a}` : `${o}
${t.indent}${a}` : a;
}
function stringifyPair({ key: e, value: t }, r, n, i) {
  const { allNullValues: s, doc: o, indent: a, indentStep: u, options: { commentString: l, indentSeq: d, simpleKeys: y } } = r;
  let m = isNode(e) && e.comment || null;
  if (y) {
    if (m)
      throw new Error("With simple keys, key nodes cannot have comments");
    if (isCollection(e) || !isNode(e) && typeof e == "object") {
      const $ = "With simple keys, collection cannot be used as a key value";
      throw new Error($);
    }
  }
  let _ = !y && (!e || m && t == null && !r.inFlow || isCollection(e) || (isScalar(e) ? e.type === Scalar.BLOCK_FOLDED || e.type === Scalar.BLOCK_LITERAL : typeof e == "object"));
  r = Object.assign({}, r, {
    allNullValues: !1,
    implicitKey: !_ && (y || !s),
    indent: a + u
  });
  let b = !1, w = !1, f = stringify(e, r, () => b = !0, () => w = !0);
  if (!_ && !r.inFlow && f.length > 1024) {
    if (y)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    _ = !0;
  }
  if (r.inFlow) {
    if (s || t == null)
      return b && n && n(), f === "" ? "?" : _ ? `? ${f}` : f;
  } else if (s && !y || t == null && _)
    return f = `? ${f}`, m && !b ? f += lineComment(f, r.indent, l(m)) : w && i && i(), f;
  b && (m = null), _ ? (m && (f += lineComment(f, r.indent, l(m))), f = `? ${f}
${a}:`) : (f = `${f}:`, m && (f += lineComment(f, r.indent, l(m))));
  let g, c, h;
  isNode(t) ? (g = !!t.spaceBefore, c = t.commentBefore, h = t.comment) : (g = !1, c = null, h = null, t && typeof t == "object" && (t = o.createNode(t))), r.implicitKey = !1, !_ && !m && isScalar(t) && (r.indentAtStart = f.length + 1), w = !1, !d && u.length >= 2 && !r.inFlow && !_ && isSeq(t) && !t.flow && !t.tag && !t.anchor && (r.indent = r.indent.substring(2));
  let S = !1;
  const p = stringify(t, r, () => S = !0, () => w = !0);
  let v = " ";
  if (m || g || c) {
    if (v = g ? `
` : "", c) {
      const $ = l(c);
      v += `
${indentComment($, r.indent)}`;
    }
    p === "" && !r.inFlow ? v === `
` && h && (v = `

`) : v += `
${r.indent}`;
  } else if (!_ && isCollection(t)) {
    const $ = p[0], O = p.indexOf(`
`), C = O !== -1, j = r.inFlow ?? t.flow ?? t.items.length === 0;
    if (C || !j) {
      let F = !1;
      if (C && ($ === "&" || $ === "!")) {
        let B = p.indexOf(" ");
        $ === "&" && B !== -1 && B < O && p[B + 1] === "!" && (B = p.indexOf(" ", B + 1)), (B === -1 || O < B) && (F = !0);
      }
      F || (v = `
${r.indent}`);
    }
  } else (p === "" || p[0] === `
`) && (v = "");
  return f += v + p, r.inFlow ? S && n && n() : h && !S ? f += lineComment(f, r.indent, l(h)) : w && i && i(), f;
}
function warn(e, t) {
  (e === "debug" || e === "warn") && console.warn(t);
}
const MERGE_KEY = "<<", merge = {
  identify: (e) => e === MERGE_KEY || typeof e == "symbol" && e.description === MERGE_KEY,
  default: "key",
  tag: "tag:yaml.org,2002:merge",
  test: /^<<$/,
  resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
    addToJSMap: addMergeToJSMap
  }),
  stringify: () => MERGE_KEY
}, isMergeKey = (e, t) => (merge.identify(t) || isScalar(t) && (!t.type || t.type === Scalar.PLAIN) && merge.identify(t.value)) && e?.doc.schema.tags.some((r) => r.tag === merge.tag && r.default);
function addMergeToJSMap(e, t, r) {
  if (r = e && isAlias(r) ? r.resolve(e.doc) : r, isSeq(r))
    for (const n of r.items)
      mergeValue(e, t, n);
  else if (Array.isArray(r))
    for (const n of r)
      mergeValue(e, t, n);
  else
    mergeValue(e, t, r);
}
function mergeValue(e, t, r) {
  const n = e && isAlias(r) ? r.resolve(e.doc) : r;
  if (!isMap(n))
    throw new Error("Merge sources must be maps or map aliases");
  const i = n.toJSON(null, e, Map);
  for (const [s, o] of i)
    t instanceof Map ? t.has(s) || t.set(s, o) : t instanceof Set ? t.add(s) : Object.prototype.hasOwnProperty.call(t, s) || Object.defineProperty(t, s, {
      value: o,
      writable: !0,
      enumerable: !0,
      configurable: !0
    });
  return t;
}
function addPairToJSMap(e, t, { key: r, value: n }) {
  if (isNode(r) && r.addToJSMap)
    r.addToJSMap(e, t, n);
  else if (isMergeKey(e, r))
    addMergeToJSMap(e, t, n);
  else {
    const i = toJS(r, "", e);
    if (t instanceof Map)
      t.set(i, toJS(n, i, e));
    else if (t instanceof Set)
      t.add(i);
    else {
      const s = stringifyKey(r, i, e), o = toJS(n, s, e);
      s in t ? Object.defineProperty(t, s, {
        value: o,
        writable: !0,
        enumerable: !0,
        configurable: !0
      }) : t[s] = o;
    }
  }
  return t;
}
function stringifyKey(e, t, r) {
  if (t === null)
    return "";
  if (typeof t != "object")
    return String(t);
  if (isNode(e) && r?.doc) {
    const n = createStringifyContext(r.doc, {});
    n.anchors = /* @__PURE__ */ new Set();
    for (const s of r.anchors.keys())
      n.anchors.add(s.anchor);
    n.inFlow = !0, n.inStringifyKey = !0;
    const i = e.toString(n);
    if (!r.mapKeyWarned) {
      let s = JSON.stringify(i);
      s.length > 40 && (s = s.substring(0, 36) + '..."'), warn(r.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${s}. Set mapAsMap: true to use object keys.`), r.mapKeyWarned = !0;
    }
    return i;
  }
  return JSON.stringify(t);
}
function createPair(e, t, r) {
  const n = createNode(e, void 0, r), i = createNode(t, void 0, r);
  return new Pair(n, i);
}
class Pair {
  constructor(t, r = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR }), this.key = t, this.value = r;
  }
  clone(t) {
    let { key: r, value: n } = this;
    return isNode(r) && (r = r.clone(t)), isNode(n) && (n = n.clone(t)), new Pair(r, n);
  }
  toJSON(t, r) {
    const n = r?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    return addPairToJSMap(r, n, this);
  }
  toString(t, r, n) {
    return t?.doc ? stringifyPair(this, t, r, n) : JSON.stringify(this);
  }
}
function stringifyCollection(e, t, r) {
  return (t.inFlow ?? e.flow ? stringifyFlowCollection : stringifyBlockCollection)(e, t, r);
}
function stringifyBlockCollection({ comment: e, items: t }, r, { blockItemPrefix: n, flowChars: i, itemIndent: s, onChompKeep: o, onComment: a }) {
  const { indent: u, options: { commentString: l } } = r, d = Object.assign({}, r, { indent: s, type: null });
  let y = !1;
  const m = [];
  for (let b = 0; b < t.length; ++b) {
    const w = t[b];
    let f = null;
    if (isNode(w))
      !y && w.spaceBefore && m.push(""), addCommentBefore(r, m, w.commentBefore, y), w.comment && (f = w.comment);
    else if (isPair(w)) {
      const c = isNode(w.key) ? w.key : null;
      c && (!y && c.spaceBefore && m.push(""), addCommentBefore(r, m, c.commentBefore, y));
    }
    y = !1;
    let g = stringify(w, d, () => f = null, () => y = !0);
    f && (g += lineComment(g, s, l(f))), y && f && (y = !1), m.push(n + g);
  }
  let _;
  if (m.length === 0)
    _ = i.start + i.end;
  else {
    _ = m[0];
    for (let b = 1; b < m.length; ++b) {
      const w = m[b];
      _ += w ? `
${u}${w}` : `
`;
    }
  }
  return e ? (_ += `
` + indentComment(l(e), u), a && a()) : y && o && o(), _;
}
function stringifyFlowCollection({ items: e }, t, { flowChars: r, itemIndent: n }) {
  const { indent: i, indentStep: s, flowCollectionPadding: o, options: { commentString: a } } = t;
  n += s;
  const u = Object.assign({}, t, {
    indent: n,
    inFlow: !0,
    type: null
  });
  let l = !1, d = 0;
  const y = [];
  for (let b = 0; b < e.length; ++b) {
    const w = e[b];
    let f = null;
    if (isNode(w))
      w.spaceBefore && y.push(""), addCommentBefore(t, y, w.commentBefore, !1), w.comment && (f = w.comment);
    else if (isPair(w)) {
      const c = isNode(w.key) ? w.key : null;
      c && (c.spaceBefore && y.push(""), addCommentBefore(t, y, c.commentBefore, !1), c.comment && (l = !0));
      const h = isNode(w.value) ? w.value : null;
      h ? (h.comment && (f = h.comment), h.commentBefore && (l = !0)) : w.value == null && c?.comment && (f = c.comment);
    }
    f && (l = !0);
    let g = stringify(w, u, () => f = null);
    b < e.length - 1 && (g += ","), f && (g += lineComment(g, n, a(f))), !l && (y.length > d || g.includes(`
`)) && (l = !0), y.push(g), d = y.length;
  }
  const { start: m, end: _ } = r;
  if (y.length === 0)
    return m + _;
  if (!l) {
    const b = y.reduce((w, f) => w + f.length + 2, 2);
    l = t.options.lineWidth > 0 && b > t.options.lineWidth;
  }
  if (l) {
    let b = m;
    for (const w of y)
      b += w ? `
${s}${i}${w}` : `
`;
    return `${b}
${i}${_}`;
  } else
    return `${m}${o}${y.join(" ")}${o}${_}`;
}
function addCommentBefore({ indent: e, options: { commentString: t } }, r, n, i) {
  if (n && i && (n = n.replace(/^\n+/, "")), n) {
    const s = indentComment(t(n), e);
    r.push(s.trimStart());
  }
}
function findPair(e, t) {
  const r = isScalar(t) ? t.value : t;
  for (const n of e)
    if (isPair(n) && (n.key === t || n.key === r || isScalar(n.key) && n.key.value === r))
      return n;
}
class YAMLMap extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:map";
  }
  constructor(t) {
    super(MAP, t), this.items = [];
  }
  /**
   * A generic collection parsing method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static from(t, r, n) {
    const { keepUndefined: i, replacer: s } = n, o = new this(t), a = (u, l) => {
      if (typeof s == "function")
        l = s.call(r, u, l);
      else if (Array.isArray(s) && !s.includes(u))
        return;
      (l !== void 0 || i) && o.items.push(createPair(u, l, n));
    };
    if (r instanceof Map)
      for (const [u, l] of r)
        a(u, l);
    else if (r && typeof r == "object")
      for (const u of Object.keys(r))
        a(u, r[u]);
    return typeof t.sortMapEntries == "function" && o.items.sort(t.sortMapEntries), o;
  }
  /**
   * Adds a value to the collection.
   *
   * @param overwrite - If not set `true`, using a key that is already in the
   *   collection will throw. Otherwise, overwrites the previous value.
   */
  add(t, r) {
    let n;
    isPair(t) ? n = t : !t || typeof t != "object" || !("key" in t) ? n = new Pair(t, t?.value) : n = new Pair(t.key, t.value);
    const i = findPair(this.items, n.key), s = this.schema?.sortMapEntries;
    if (i) {
      if (!r)
        throw new Error(`Key ${n.key} already set`);
      isScalar(i.value) && isScalarValue(n.value) ? i.value.value = n.value : i.value = n.value;
    } else if (s) {
      const o = this.items.findIndex((a) => s(n, a) < 0);
      o === -1 ? this.items.push(n) : this.items.splice(o, 0, n);
    } else
      this.items.push(n);
  }
  delete(t) {
    const r = findPair(this.items, t);
    return r ? this.items.splice(this.items.indexOf(r), 1).length > 0 : !1;
  }
  get(t, r) {
    const i = findPair(this.items, t)?.value;
    return (!r && isScalar(i) ? i.value : i) ?? void 0;
  }
  has(t) {
    return !!findPair(this.items, t);
  }
  set(t, r) {
    this.add(new Pair(t, r), !0);
  }
  /**
   * @param ctx - Conversion context, originally set in Document#toJS()
   * @param {Class} Type - If set, forces the returned collection type
   * @returns Instance of Type, Map, or Object
   */
  toJSON(t, r, n) {
    const i = n ? new n() : r?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    r?.onCreate && r.onCreate(i);
    for (const s of this.items)
      addPairToJSMap(r, i, s);
    return i;
  }
  toString(t, r, n) {
    if (!t)
      return JSON.stringify(this);
    for (const i of this.items)
      if (!isPair(i))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(i)} instead`);
    return !t.allNullValues && this.hasAllNullValues(!1) && (t = Object.assign({}, t, { allNullValues: !0 })), stringifyCollection(this, t, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: t.indent || "",
      onChompKeep: n,
      onComment: r
    });
  }
}
class YAMLSeq extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:seq";
  }
  constructor(t) {
    super(SEQ, t), this.items = [];
  }
  add(t) {
    this.items.push(t);
  }
  /**
   * Removes a value from the collection.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   *
   * @returns `true` if the item was found and removed.
   */
  delete(t) {
    const r = asItemIndex(t);
    return typeof r != "number" ? !1 : this.items.splice(r, 1).length > 0;
  }
  get(t, r) {
    const n = asItemIndex(t);
    if (typeof n != "number")
      return;
    const i = this.items[n];
    return !r && isScalar(i) ? i.value : i;
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   */
  has(t) {
    const r = asItemIndex(t);
    return typeof r == "number" && r < this.items.length;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   *
   * If `key` does not contain a representation of an integer, this will throw.
   * It may be wrapped in a `Scalar`.
   */
  set(t, r) {
    const n = asItemIndex(t);
    if (typeof n != "number")
      throw new Error(`Expected a valid index, not ${t}.`);
    const i = this.items[n];
    isScalar(i) && isScalarValue(r) ? i.value = r : this.items[n] = r;
  }
  toJSON(t, r) {
    const n = [];
    r?.onCreate && r.onCreate(n);
    let i = 0;
    for (const s of this.items)
      n.push(toJS(s, String(i++), r));
    return n;
  }
  toString(t, r, n) {
    return t ? stringifyCollection(this, t, {
      blockItemPrefix: "- ",
      flowChars: { start: "[", end: "]" },
      itemIndent: (t.indent || "") + "  ",
      onChompKeep: n,
      onComment: r
    }) : JSON.stringify(this);
  }
  static from(t, r, n) {
    const { replacer: i } = n, s = new this(t);
    if (r && Symbol.iterator in Object(r)) {
      let o = 0;
      for (let a of r) {
        if (typeof i == "function") {
          const u = r instanceof Set ? a : String(o++);
          a = i.call(r, u, a);
        }
        s.items.push(createNode(a, void 0, n));
      }
    }
    return s;
  }
}
function asItemIndex(e) {
  let t = isScalar(e) ? e.value : e;
  return t && typeof t == "string" && (t = Number(t)), typeof t == "number" && Number.isInteger(t) && t >= 0 ? t : null;
}
function createPairs(e, t, r) {
  const { replacer: n } = r, i = new YAMLSeq(e);
  i.tag = "tag:yaml.org,2002:pairs";
  let s = 0;
  if (t && Symbol.iterator in Object(t))
    for (let o of t) {
      typeof n == "function" && (o = n.call(t, String(s++), o));
      let a, u;
      if (Array.isArray(o))
        if (o.length === 2)
          a = o[0], u = o[1];
        else
          throw new TypeError(`Expected [key, value] tuple: ${o}`);
      else if (o && o instanceof Object) {
        const l = Object.keys(o);
        if (l.length === 1)
          a = l[0], u = o[a];
        else
          throw new TypeError(`Expected tuple with one key, not ${l.length} keys`);
      } else
        a = o;
      i.items.push(createPair(a, u, r));
    }
  return i;
}
class YAMLOMap extends YAMLSeq {
  constructor() {
    super(), this.add = YAMLMap.prototype.add.bind(this), this.delete = YAMLMap.prototype.delete.bind(this), this.get = YAMLMap.prototype.get.bind(this), this.has = YAMLMap.prototype.has.bind(this), this.set = YAMLMap.prototype.set.bind(this), this.tag = YAMLOMap.tag;
  }
  /**
   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJSON(t, r) {
    if (!r)
      return super.toJSON(t);
    const n = /* @__PURE__ */ new Map();
    r?.onCreate && r.onCreate(n);
    for (const i of this.items) {
      let s, o;
      if (isPair(i) ? (s = toJS(i.key, "", r), o = toJS(i.value, s, r)) : s = toJS(i, "", r), n.has(s))
        throw new Error("Ordered maps must not include duplicate keys");
      n.set(s, o);
    }
    return n;
  }
  static from(t, r, n) {
    const i = createPairs(t, r, n), s = new this();
    return s.items = i.items, s;
  }
}
YAMLOMap.tag = "tag:yaml.org,2002:omap";
class YAMLSet extends YAMLMap {
  constructor(t) {
    super(t), this.tag = YAMLSet.tag;
  }
  add(t) {
    let r;
    isPair(t) ? r = t : t && typeof t == "object" && "key" in t && "value" in t && t.value === null ? r = new Pair(t.key, null) : r = new Pair(t, null), findPair(this.items, r.key) || this.items.push(r);
  }
  /**
   * If `keepPair` is `true`, returns the Pair matching `key`.
   * Otherwise, returns the value of that Pair's key.
   */
  get(t, r) {
    const n = findPair(this.items, t);
    return !r && isPair(n) ? isScalar(n.key) ? n.key.value : n.key : n;
  }
  set(t, r) {
    if (typeof r != "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof r}`);
    const n = findPair(this.items, t);
    n && !r ? this.items.splice(this.items.indexOf(n), 1) : !n && r && this.items.push(new Pair(t));
  }
  toJSON(t, r) {
    return super.toJSON(t, r, Set);
  }
  toString(t, r, n) {
    if (!t)
      return JSON.stringify(this);
    if (this.hasAllNullValues(!0))
      return super.toString(Object.assign({}, t, { allNullValues: !0 }), r, n);
    throw new Error("Set items must all have null values");
  }
  static from(t, r, n) {
    const { replacer: i } = n, s = new this(t);
    if (r && Symbol.iterator in Object(r))
      for (let o of r)
        typeof i == "function" && (o = i.call(r, o, o)), s.items.push(createPair(o, null, n));
    return s;
  }
}
YAMLSet.tag = "tag:yaml.org,2002:set";
new Set("0123456789ABCDEFabcdef");
new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
new Set(",[]{}");
new Set(` ,[]{}
\r	`);
function decodeImplVars(e) {
  const t = {};
  for (const [r, n] of Object.entries(e.varInstances)) {
    const i = [];
    for (const s of n) {
      const o = e.varTypes[s[0]], a = e.variables[s[1]];
      let u = a.i, l = a.n;
      if (s.length > 2) {
        const y = [], m = [], _ = (s.length - 2) / 2, b = s.slice(2, 2 + _);
        for (const w of b) {
          const f = e.subscripts[w];
          y.push(f.i), m.push(f.n);
        }
        u += `[${y.join(",")}]`, l += `[${m.join(",")}]`;
      }
      const d = {
        varId: u,
        varName: l,
        varType: o,
        varIndex: a.x,
        subscriptIndices: s.length > 2 ? s.slice(2 + (s.length - 2) / 2) : void 0
      };
      i.push(d);
    }
    t[r] = i;
  }
  return t;
}
function getImplVars(e) {
  const t = decodeImplVars(e), r = /* @__PURE__ */ new Map(), n = [];
  function i(s, o) {
    const a = [];
    for (const u of o) {
      if (u.varType === "lookup" || u.varType === "data")
        continue;
      const d = `ModelImpl_${u.varId}`;
      r.set(d, u), a.push(d);
    }
    n.push({
      title: s,
      fn: s,
      datasetKeys: a
    });
  }
  return i("initConstants", t.constants || []), i("initLevels", t.initVars || []), i("evalLevels", t.levelVars || []), i("evalAux", t.auxVars || []), {
    implVars: r,
    implVarGroups: n
  };
}
function getInputVars(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e) {
    const n = r.varId, i = {
      inputId: r.inputId,
      varId: n,
      varName: r.varName,
      defaultValue: r.defaultValue,
      minValue: r.minValue,
      maxValue: r.maxValue,
      value: createInputValue(n, r.defaultValue)
    };
    t.set(n, i);
  }
  return t;
}
function setInputsForScenario(e, t) {
  function r(l, d) {
    d < l.minValue ? (console.warn(
      `WARNING: Scenario input value ${d} is < min value (${l.minValue}) for input '${l.varName}'`
    ), d = l.minValue) : d > l.maxValue && (console.warn(
      `WARNING: Scenario input value ${d} is > max value (${l.maxValue}) for input '${l.varName}'`
    ), d = l.maxValue), l.value.set(d);
  }
  function n(l) {
    l.value.reset();
  }
  function i(l) {
    l.value.set(l.minValue);
  }
  function s(l) {
    l.value.set(l.maxValue);
  }
  function o() {
    e.forEach(n);
  }
  function a() {
    e.forEach(i);
  }
  function u() {
    e.forEach(s);
  }
  switch (t.kind) {
    case "all-inputs": {
      switch (t.position) {
        case "at-default":
          o();
          break;
        case "at-minimum":
          a();
          break;
        case "at-maximum":
          u();
          break;
      }
      break;
    }
    case "input-settings": {
      o();
      for (const l of t.settings) {
        const d = e.get(l.inputVarId);
        if (d)
          switch (l.kind) {
            case "position":
              switch (l.position) {
                case "at-default":
                  n(d);
                  break;
                case "at-minimum":
                  i(d);
                  break;
                case "at-maximum":
                  s(d);
                  break;
                default:
                  assertNeverExports.assertNever(l.position);
              }
              break;
            case "value":
              r(d, l.value);
              break;
            default:
              assertNeverExports.assertNever(l);
          }
        else
          console.log(`No model input for scenario input ${l.inputVarId}`);
      }
      break;
    }
    default:
      assertNeverExports.assertNever(t);
  }
}
function getOutputVars(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e) {
    const n = r.varId, i = datasetKeyForOutputVar(void 0, n);
    t.set(i, {
      datasetKey: i,
      sourceName: void 0,
      varId: n,
      varName: r.varName
    });
  }
  return t;
}
function datasetKeyForOutputVar(e, t) {
  return `Model_${t}`;
}
const inputSpecs = [{ inputId: "1", varId: "_initial_contact_rate", varName: "Initial Contact Rate", defaultValue: 2.5, minValue: 0, maxValue: 5 }, { inputId: "2", varId: "_infectivity_i", varName: "Infectivity i", defaultValue: 0.25, minValue: -2, maxValue: 2 }, { inputId: "3", varId: "_average_duration_of_illness_d", varName: "Average Duration of Illness d", defaultValue: 2, minValue: 0, maxValue: 10 }], outputSpecs = [{ varId: "_infection_rate", varName: "Infection Rate" }, { varId: "_infectious_population_i", varName: "Infectious Population I" }, { varId: "_recovered_population_r", varName: "Recovered Population R" }, { varId: "_recovery_rate", varName: "Recovery Rate" }, { varId: "_susceptible_population_s", varName: "Susceptible Population S" }], encodedImplVars = { subscripts: [], variables: [{ n: "Average Duration of Illness d", i: "_average_duration_of_illness_d", x: 1 }, { n: "FINAL TIME", i: "_final_time", x: 2 }, { n: "INITIAL TIME", i: "_initial_time", x: 3 }, { n: "Infectivity i", i: "_infectivity_i", x: 4 }, { n: "Initial Contact Rate", i: "_initial_contact_rate", x: 5 }, { n: "SAVEPER", i: "_saveper", x: 6 }, { n: "TIME STEP", i: "_time_step", x: 7 }, { n: "Total Population P", i: "_total_population_p", x: 8 }, { n: "Recovered Population R", i: "_recovered_population_r", x: 9 }, { n: "Infectious Population I", i: "_infectious_population_i", x: 10 }, { n: "Susceptible Population S", i: "_susceptible_population_s", x: 11 }, { n: "Recovery Rate", i: "_recovery_rate", x: 12 }, { n: "Contact Rate c", i: "_contact_rate_c", x: 13 }, { n: "Infection Rate", i: "_infection_rate", x: 14 }], varTypes: ["const", "level", "aux"], varInstances: { constants: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]], lookupVars: [], dataVars: [], initVars: [[1, 8], [1, 9], [1, 10]], levelVars: [[1, 9], [1, 8], [1, 10]], auxVars: [[2, 11], [2, 12], [2, 13]] } }, modelSizeInBytes = 7601, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=e=>e?typeof Symbol.observable=="symbol"&&typeof e[Symbol.observable]=="function"?e===e[Symbol.observable]():typeof e["@@observable"]=="function"?e===e["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function e(t,r){const i=t.deserialize.bind(t),o=t.serialize.bind(t);return{deserialize(a){return r.deserialize(a,i)},serialize(a){return r.serialize(a,o)}}}serializers.extendSerializer=e;const n={deserialize(t){return Object.assign(Error(t.message),{name:t.name,stack:t.stack})},serialize(t){return{__error_marker:"$$error",message:t.message,name:t.name,stack:t.stack}}},s=t=>t&&typeof t=="object"&&"__error_marker"in t&&t.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(t){return s(t)?n.deserialize(t):t},serialize(t){return t instanceof Error?n.serialize(t):t}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const e=requireSerializers();let n=e.DefaultSerializer;function s(i){n=e.extendSerializer(n,i)}common.registerSerializer=s;function t(i){return n.deserialize(i)}common.deserialize=t;function r(i){return n.serialize(i)}return common.serialize=r,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const e=requireSymbols();function n(r){return!(!r||typeof r!="object")}function s(r){return r&&typeof r=="object"&&r[e.$transferable]}transferable.isTransferDescriptor=s;function t(r,i){if(!i){if(!n(r))throw Error();i=[r]}return{[e.$transferable]:!0,send:r,transferables:i}}return transferable.Transfer=t,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.WorkerMessageType=e.MasterMessageType=void 0,(function(n){n.cancel="cancel",n.run="run"})(e.MasterMessageType||(e.MasterMessageType={})),(function(n){n.error="error",n.init="init",n.result="result",n.running="running",n.uncaughtError="uncaughtError"})(e.WorkerMessageType||(e.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const e=function(){const r=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!r)},n=function(r,i){self.postMessage(r,i)},s=function(r){const i=a=>{r(a.data)},o=()=>{self.removeEventListener("message",i)};return self.addEventListener("message",i),o};return implementation_browser.default={isWorkerRuntime:e,postMessageToMaster:n,subscribeToMasterMessages:s},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const e=function(){return!!(typeof self<"u"&&self.postMessage)},n=function(o){self.postMessage(o)};let s=!1;const t=new Set,r=function(o){return s||(self.addEventListener("message",(c=>{t.forEach(l=>l(c.data))})),s=!0),t.add(o),()=>t.delete(o)};return implementation_tinyWorker.default={isWorkerRuntime:e,postMessageToMaster:n,subscribeToMasterMessages:r},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var e=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(a){return a&&a.__esModule?a:{default:a}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const n=e(requireWorker_threads());function s(a){if(!a)throw Error("Invariant violation: MessagePort to parent is not available.");return a}const t=function(){return!n.default().isMainThread},r=function(c,l){s(n.default().parentPort).postMessage(c,l)},i=function(c){const l=n.default().parentPort;if(!l)throw Error("Invariant violation: MessagePort to parent is not available.");const d=g=>{c(g)},p=()=>{s(l).off("message",d)};return s(l).on("message",d),p};function o(){n.default()}return implementation_worker_threads.default={isWorkerRuntime:t,postMessageToMaster:r,subscribeToMasterMessages:i,testImplementation:o},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var e=implementation&&implementation.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(implementation,"__esModule",{value:!0});const n=e(requireImplementation_browser()),s=e(requireImplementation_tinyWorker()),t=e(requireImplementation_worker_threads()),r=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function i(){try{return t.default.testImplementation(),t.default}catch{return s.default}}return implementation.default=r?i():n.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(e){var n=worker&&worker.__awaiter||function(u,f,v,w){function O(k){return k instanceof v?k:new v(function(B){B(k)})}return new(v||(v=Promise))(function(k,B){function A(R){try{z(w.next(R))}catch(W){B(W)}}function P(R){try{z(w.throw(R))}catch(W){B(W)}}function z(R){R.done?k(R.value):O(R.value).then(A,P)}z((w=w.apply(u,f||[])).next())})},s=worker&&worker.__importDefault||function(u){return u&&u.__esModule?u:{default:u}};Object.defineProperty(e,"__esModule",{value:!0}),e.expose=e.isWorkerRuntime=e.Transfer=e.registerSerializer=void 0;const t=s(requireIsObservable()),r=requireCommon(),i=requireTransferable(),o=requireMessages(),a=s(requireImplementation());var c=requireCommon();Object.defineProperty(e,"registerSerializer",{enumerable:!0,get:function(){return c.registerSerializer}});var l=requireTransferable();Object.defineProperty(e,"Transfer",{enumerable:!0,get:function(){return l.Transfer}}),e.isWorkerRuntime=a.default.isWorkerRuntime;let d=!1;const p=new Map,g=u=>u&&u.type===o.MasterMessageType.cancel,_=u=>u&&u.type===o.MasterMessageType.run,I=u=>t.default(u)||T(u);function T(u){return u&&typeof u=="object"&&typeof u.subscribe=="function"}function E(u){return i.isTransferDescriptor(u)?{payload:u.send,transferables:u.transferables}:{payload:u,transferables:void 0}}function S(){const u={type:o.WorkerMessageType.init,exposed:{type:"function"}};a.default.postMessageToMaster(u)}function y(u){const f={type:o.WorkerMessageType.init,exposed:{type:"module",methods:u}};a.default.postMessageToMaster(f)}function h(u,f){const{payload:v,transferables:w}=E(f),O={type:o.WorkerMessageType.error,uid:u,error:r.serialize(v)};a.default.postMessageToMaster(O,w)}function m(u,f,v){const{payload:w,transferables:O}=E(v),k={type:o.WorkerMessageType.result,uid:u,complete:f?!0:void 0,payload:w};a.default.postMessageToMaster(k,O)}function L(u,f){const v={type:o.WorkerMessageType.running,uid:u,resultType:f};a.default.postMessageToMaster(v)}function b(u){try{const f={type:o.WorkerMessageType.uncaughtError,error:r.serialize(u)};a.default.postMessageToMaster(f)}catch(f){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,f,`\nOriginal error:`,u)}}function M(u,f,v){return n(this,void 0,void 0,function*(){let w;try{w=f(...v)}catch(k){return h(u,k)}const O=I(w)?"observable":"promise";if(L(u,O),I(w)){const k=w.subscribe(B=>m(u,!1,r.serialize(B)),B=>{h(u,r.serialize(B)),p.delete(u)},()=>{m(u,!0),p.delete(u)});p.set(u,k)}else try{const k=yield w;m(u,!0,r.serialize(k))}catch(k){h(u,r.serialize(k))}})}function q(u){if(!a.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(d)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(d=!0,typeof u=="function")a.default.subscribeToMasterMessages(f=>{_(f)&&!f.method&&M(f.uid,u,f.args.map(r.deserialize))}),S();else if(typeof u=="object"&&u){a.default.subscribeToMasterMessages(v=>{_(v)&&v.method&&M(v.uid,u[v.method],v.args.map(r.deserialize))});const f=Object.keys(u).filter(v=>typeof u[v]=="function");y(f)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${u}`);a.default.subscribeToMasterMessages(f=>{if(g(f)){const v=f.uid,w=p.get(v);w&&(w.unsubscribe(),p.delete(v))}})}e.expose=q,typeof self<"u"&&typeof self.addEventListener=="function"&&a.default.isWorkerRuntime()&&(self.addEventListener("error",u=>{setTimeout(()=>b(u.error||u),250)}),self.addEventListener("unhandledrejection",u=>{const f=u.reason;f&&typeof f.message=="string"&&setTimeout(()=>b(f),250)})),typeof process<"u"&&typeof process.on=="function"&&a.default.isWorkerRuntime()&&(process.on("uncaughtException",u=>{setTimeout(()=>b(u),250)}),process.on("unhandledRejection",u=>{u&&typeof u.message=="string"&&setTimeout(()=>b(u),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(e){var n;let s=1;for(const t of e){s+=2;const r=((n=t.subscriptIndices)==null?void 0:n.length)||0;s+=r}return s}function encodeVarIndices(e,n){let s=0;n[s++]=e.length;for(const t of e){n[s++]=t.varIndex;const r=t.subscriptIndices,i=r?.length||0;n[s++]=i;for(let o=0;o<i;o++)n[s++]=r[o]}}function getEncodedLookupBufferLengths(e){var n,s;let t=1,r=0;for(const i of e){const o=i.varRef.varSpec;if(o===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");t+=2;const a=((n=o.subscriptIndices)==null?void 0:n.length)||0;t+=a,t+=2,r+=((s=i.points)==null?void 0:s.length)||0}return{lookupIndicesLength:t,lookupsLength:r}}function encodeLookups(e,n,s){let t=0;n[t++]=e.length;let r=0;for(const i of e){const o=i.varRef.varSpec;n[t++]=o.varIndex;const a=o.subscriptIndices,c=a?.length||0;n[t++]=c;for(let l=0;l<c;l++)n[t++]=a[l];i.points!==void 0?(n[t++]=r,n[t++]=i.points.length,s?.set(i.points,r),r+=i.points.length):(n[t++]=-1,n[t++]=0)}}function decodeLookups(e,n){const s=[];let t=0;const r=e[t++];for(let i=0;i<r;i++){const o=e[t++],a=e[t++],c=a>0?Array(a):void 0;for(let _=0;_<a;_++)c[_]=e[t++];const l=e[t++],d=e[t++],p={varIndex:o,subscriptIndices:c};let g;l>=0?n?g=n.slice(l,l+d):g=new Float64Array(0):g=void 0,s.push({varRef:{varSpec:p},points:g})}return s}function resolveVarRef(e,n,s){if(!n.varSpec){if(e===void 0)throw new Error(`Unable to resolve ${s} variable references by name or identifier when model listing is unavailable`);if(n.varId){const t=e?.getSpecForVarId(n.varId);if(t)n.varSpec=t;else throw new Error(`Failed to resolve ${s} variable reference for varId=${n.varId}`)}else{const t=e?.getSpecForVarName(n.varName);if(t)n.varSpec=t;else throw new Error(`Failed to resolve ${s} variable reference for varName=\'${n.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(e,n,s){this.view=s>0?new Int32Array(e,n,s):void 0,this.offsetInBytes=n,this.lengthInElements=s}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(e,n,s){this.view=s>0?new Float64Array(e,n,s):void 0,this.offsetInBytes=n,this.lengthInElements=s}},BufferedRunModelParams=class{constructor(e){this.listing=e,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(e,n){this.inputs.lengthInElements!==0&&((e===void 0||e.length<this.inputs.lengthInElements)&&(e=n(this.inputs.lengthInElements)),e.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(e,n){this.outputIndices.lengthInElements!==0&&((e===void 0||e.length<this.outputIndices.lengthInElements)&&(e=n(this.outputIndices.lengthInElements)),e.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(e){this.outputs.view!==void 0&&(e.length>this.outputs.view.length?this.outputs.view.set(e.subarray(0,this.outputs.view.length)):this.outputs.view.set(e))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(e){this.extras.view[0]=e}finalizeOutputs(e){this.outputs.view&&e.updateFromBuffer(this.outputs.view,e.seriesLength),e.runTimeInMillis=this.getElapsedTime()}updateFromParams(e,n,s){const t=e.length,r=n.varIds.length*n.seriesLength;let i;const o=n.varSpecs;o!==void 0&&o.length>0?i=getEncodedVarIndicesLength(o):i=0;let a,c;if(s?.lookups!==void 0&&s.lookups.length>0){for(const M of s.lookups)resolveVarRef(this.listing,M.varRef,"lookup");const b=getEncodedLookupBufferLengths(s.lookups);a=b.lookupsLength,c=b.lookupIndicesLength}else a=0,c=0;let l=0;function d(b,M){const q=l,u=b==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,f=Math.round(M*u),v=Math.ceil(f/8)*8;return l+=v,q}const p=d("int32",headerLengthInElements),g=d("float64",extrasLengthInElements),_=d("float64",t),I=d("float64",r),T=d("int32",i),E=d("float64",a),S=d("int32",c),y=l;if(this.encoded===void 0||this.encoded.byteLength<y){const b=Math.ceil(y*1.2);this.encoded=new ArrayBuffer(b),this.header.update(this.encoded,p,headerLengthInElements)}const h=this.header.view;let m=0;h[m++]=g,h[m++]=extrasLengthInElements,h[m++]=_,h[m++]=t,h[m++]=I,h[m++]=r,h[m++]=T,h[m++]=i,h[m++]=E,h[m++]=a,h[m++]=S,h[m++]=c,this.inputs.update(this.encoded,_,t),this.extras.update(this.encoded,g,extrasLengthInElements),this.outputs.update(this.encoded,I,r),this.outputIndices.update(this.encoded,T,i),this.lookups.update(this.encoded,E,a),this.lookupIndices.update(this.encoded,S,c);const L=this.inputs.view;for(let b=0;b<e.length;b++){const M=e[b];typeof M=="number"?L[b]=M:L[b]=M.get()}this.outputIndices.view&&encodeVarIndices(o,this.outputIndices.view),c>0&&encodeLookups(s.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(e){const n=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(e.byteLength<n)throw new Error("Buffer must be long enough to contain header section");this.encoded=e,this.header.update(this.encoded,0,headerLengthInElements);const t=this.header.view;let r=0;const i=t[r++],o=t[r++],a=t[r++],c=t[r++],l=t[r++],d=t[r++],p=t[r++],g=t[r++],_=t[r++],I=t[r++],T=t[r++],E=t[r++],S=o*Float64Array.BYTES_PER_ELEMENT,y=c*Float64Array.BYTES_PER_ELEMENT,h=d*Float64Array.BYTES_PER_ELEMENT,m=g*Int32Array.BYTES_PER_ELEMENT,L=I*Float64Array.BYTES_PER_ELEMENT,b=E*Int32Array.BYTES_PER_ELEMENT,M=n+S+y+h+m+L+b;if(e.byteLength<M)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,i,o),this.inputs.update(this.encoded,a,c),this.outputs.update(this.encoded,l,d),this.outputIndices.update(this.encoded,p,g),this.lookups.update(this.encoded,_,I),this.lookupIndices.update(this.encoded,T,E)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(e,n){if(n&&n.length<e*2)throw new Error(`Lookup data array length must be >= 2*size (length=${n.length} size=${e}`);this.originalData=n,this.originalSize=e,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(e,n){if(n){if(n.length<e*2)throw new Error(`Lookup data array length must be >= 2*size (length=${n.length} size=${e}`);const s=e*2;if((this.dynamicData===void 0||s>this.dynamicData.length)&&(this.dynamicData=new Float64Array(s)),this.dynamicSize=e,e>0){const t=n.subarray(0,s);this.dynamicData.set(t)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(e,n){return this.getValue(e,!1,n)}getValueForY(e){if(this.invertedData===void 0){const n=this.activeSize*2,s=this.activeData,t=Array(n);for(let r=0;r<n;r+=2)t[r]=s[r+1],t[r+1]=s[r];this.invertedData=t}return this.getValue(e,!0,"interpolate")}getValue(e,n,s){if(this.activeSize===0)return _NA_;const t=n?this.invertedData:this.activeData,r=this.activeSize*2,i=!n;let o;i&&e>=this.lastInput?o=this.lastHitIndex:o=0;for(let a=o;a<r;a+=2){const c=t[a];if(c>=e){if(i&&(this.lastInput=e,this.lastHitIndex=a),a===0||c===e)return t[a+1];switch(s){default:case"interpolate":{const l=t[a-2],d=t[a-1],p=t[a+1],g=c-l,_=p-d;return d+_/g*(e-l)}case"forward":return t[a+1];case"backward":return t[a-1]}}}return i&&(this.lastInput=e,this.lastHitIndex=r),t[r-1]}getValueForGameTime(e,n){if(this.activeSize<=0)return n;const s=this.activeData[0];return e<s?n:this.getValue(e,!1,"backward")}getValueBetweenTimes(e,n){if(this.activeSize===0)return _NA_;const s=this.activeData,t=this.activeSize*2;switch(n){case"forward":{e=Math.floor(e);for(let r=0;r<t;r+=2)if(s[r]>=e)return s[r+1];return s[t-1]}case"backward":{e=Math.floor(e);for(let r=2;r<t;r+=2)if(s[r]>=e)return s[r-1];return t>=4?s[t-3]:s[1]}case"interpolate":default:{if(e-Math.floor(e)>0){let r=`GET DATA BETWEEN TIMES was called with an input value (${e}) that has a fractional part. `;throw r+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",r+="results that may differ from those produced by SDEverywhere.",new Error(r)}for(let r=2;r<t;r+=2){const i=s[r];if(i>=e){const o=s[r-2],a=s[r-1],c=s[r+1],l=i-o,d=c-a;return a+d/l*(e-o)}}return s[t-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let e;const n=new Map,s=new Map;return{setContext(t){e=t},ABS(t){return Math.abs(t)},ARCCOS(t){return Math.acos(t)},ARCSIN(t){return Math.asin(t)},ARCTAN(t){return Math.atan(t)},COS(t){return Math.cos(t)},EXP(t){return Math.exp(t)},GAME(t,r){return t?t.getValueForGameTime(e.currentTime,r):r},INTEG(t,r){return t+r*e.timeStep},INTEGER(t){return Math.trunc(t)},LN(t){return Math.log(t)},MAX(t,r){return Math.max(t,r)},MIN(t,r){return Math.min(t,r)},MODULO(t,r){return t%r},POW(t,r){return Math.pow(t,r)},POWER(t,r){return Math.pow(t,r)},PULSE(t,r){return pulse(e,t,r)},PULSE_TRAIN(t,r,i,o){const a=Math.floor((o-t)/i);for(let c=0;c<=a;c++)if(e.currentTime<=o&&pulse(e,t+c*i,r))return 1;return 0},QUANTUM(t,r){return r<=0?t:r*Math.trunc(t/r)},RAMP(t,r,i){return e.currentTime>r?e.currentTime<i||r>i?t*(e.currentTime-r):t*(i-r):0},SIN(t){return Math.sin(t)},SQRT(t){return Math.sqrt(t)},STEP(t,r){return e.currentTime+e.timeStep/2>r?t:0},TAN(t){return Math.tan(t)},VECTOR_SORT_ORDER(t,r,i){if(r>t.length)throw new Error(`VECTOR SORT ORDER input vector length (${t.length}) must be >= size (${r})`);let o=s.get(r);if(o===void 0){o=Array(r);for(let l=0;l<r;l++)o[l]={x:0,ind:0};s.set(r,o)}let a=n.get(r);a===void 0&&(a=Array(r),n.set(r,a));for(let l=0;l<r;l++)o[l].x=t[l],o[l].ind=l;const c=i>0?1:-1;o.sort((l,d)=>{let p;return l.x<d.x?p=-1:l.x>d.x?p=1:p=0,p*c});for(let l=0;l<r;l++)a[l]=o[l].ind;return a},XIDZ(t,r,i){return Math.abs(r)<EPSILON?i:t/r},ZIDZ(t,r){return Math.abs(r)<EPSILON?0:t/r},createLookup(t,r){return new JsModelLookup(t,r)},LOOKUP(t,r){return t?t.getValueForX(r,"interpolate"):_NA_},LOOKUP_FORWARD(t,r){return t?t.getValueForX(r,"forward"):_NA_},LOOKUP_BACKWARD(t,r){return t?t.getValueForX(r,"backward"):_NA_},LOOKUP_INVERT(t,r){return t?t.getValueForY(r):_NA_},WITH_LOOKUP(t,r){return r?r.getValueForX(t,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(t,r,i){let o;return i>=1?o="forward":i<=-1?o="backward":o="interpolate",t?t.getValueBetweenTimes(r,o):_NA_}}}function pulse(e,n,s){const t=e.currentTime+e.timeStep/2;return s===0&&(s=e.timeStep),t>n&&t<n+s?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(e){if(isWeb)return self.performance.now()-e;{const n=process.hrtime(e);return(n[0]*1e9+n[1])/1e6}}var BaseRunnableModel=class{constructor(e){this.startTime=e.startTime,this.endTime=e.endTime,this.saveFreq=e.saveFreq,this.numSavePoints=e.numSavePoints,this.outputVarIds=e.outputVarIds,this.modelListing=e.modelListing,this.onRunModel=e.onRunModel}runModel(e){var n;let s=e.getInputs();s===void 0&&(e.copyInputs(this.inputs,c=>(this.inputs=new Float64Array(c),this.inputs)),s=this.inputs);let t=e.getOutputIndices();t===void 0&&e.getOutputIndicesLength()>0&&(e.copyOutputIndices(this.outputIndices,c=>(this.outputIndices=new Int32Array(c),this.outputIndices)),t=this.outputIndices);const r=e.getOutputsLength();(this.outputs===void 0||this.outputs.length<r)&&(this.outputs=new Float64Array(r));const i=this.outputs,o=perfNow();(n=this.onRunModel)==null||n.call(this,s,i,{outputIndices:t,lookups:e.getLookups()});const a=perfElapsed(o);e.storeOutputs(i),e.storeElapsedTime(a)}terminate(){}};function initJsModel(e){let n=e.getModelFunctions();n===void 0&&(n=getJsModelFunctions(),e.setModelFunctions(n));const s=e.getInitialTime(),t=e.getFinalTime(),r=e.getTimeStep(),i=e.getSaveFreq(),o=Math.round((t-s)/i)+1;return new BaseRunnableModel({startTime:s,endTime:t,saveFreq:i,numSavePoints:o,outputVarIds:e.outputVarIds,modelListing:e.modelListing,onRunModel:(a,c,l)=>{runJsModel(e,s,t,r,i,o,a,c,l?.outputIndices,l?.lookups)}})}function runJsModel(e,n,s,t,r,i,o,a,c,l,d){let p=n;e.setTime(p);const g={timeStep:t,currentTime:p};if(e.getModelFunctions().setContext(g),e.initConstants(),l!==void 0)for(const y of l)e.setLookup(y.varRef.varSpec,y.points);o?.length>0&&e.setInputs(y=>o[y]),e.initLevels();const _=Math.round((s-n)/t),I=s;let T=0,E=0,S=0;for(;T<=_;){if(e.evalAux(),p%r<1e-6){S=0;const y=h=>{const m=S*i+E;a[m]=p<=I?h:void 0,S++};if(c!==void 0){let h=0;const m=c[h++];for(let L=0;L<m;L++){const b=c[h++],M=c[h++];let q;M>0&&(q=c.subarray(h,h+M),h+=M);const u={varIndex:b,subscriptIndices:q};e.storeOutput(u,y)}}else e.storeOutputs(y);E++}if(T===_)break;e.evalLevels(),p+=t,e.setTime(p),g.currentTime=p,T++}}var WasmBuffer=class{constructor(e,n,s,t){this.wasmModule=e,this.numElements=n,this.byteOffset=s,this.heapArray=t}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var e,n;this.heapArray&&((n=(e=this.wasmModule)._free)==null||n.call(e,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(e,n){const t=n*4,r=e._malloc(t),i=r/4,o=e.HEAP32.subarray(i,i+n);return new WasmBuffer(e,n,r,o)}function createFloat64WasmBuffer(e,n){const t=n*8,r=e._malloc(t),i=r/8,o=e.HEAPF64.subarray(i,i+n);return new WasmBuffer(e,n,r,o)}var WasmModel=class{constructor(e){this.wasmModule=e;function n(s){return e.cwrap(s,"number",[])()}this.startTime=n("getInitialTime"),this.endTime=n("getFinalTime"),this.saveFreq=n("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=e.outputVarIds,this.modelListing=e.modelListing,this.wasmSetLookup=e.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=e.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(e){var n,s,t,r,i,o,a;const c=e.getLookups();if(c!==void 0)for(const _ of c){const I=_.varRef.varSpec,T=((n=I.subscriptIndices)==null?void 0:n.length)||0;let E;T>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<T)&&((s=this.lookupSubIndicesBuffer)==null||s.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,T)),this.lookupSubIndicesBuffer.getArrayView().set(I.subscriptIndices),E=this.lookupSubIndicesBuffer.getAddress()):E=0;let S,y;if(_.points){const m=_.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<m)&&((t=this.lookupDataBuffer)==null||t.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,m)),this.lookupDataBuffer.getArrayView().set(_.points),S=this.lookupDataBuffer.getAddress(),y=m/2}else S=0,y=0;const h=I.varIndex;this.wasmSetLookup(h,E,S,y)}e.copyInputs((r=this.inputsBuffer)==null?void 0:r.getArrayView(),_=>{var I;return(I=this.inputsBuffer)==null||I.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,_),this.inputsBuffer.getArrayView()});let l;e.getOutputIndicesLength()>0?(e.copyOutputIndices((i=this.outputIndicesBuffer)==null?void 0:i.getArrayView(),_=>{var I;return(I=this.outputIndicesBuffer)==null||I.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,_),this.outputIndicesBuffer.getArrayView()}),l=this.outputIndicesBuffer):l=void 0;const d=e.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<d)&&((o=this.outputsBuffer)==null||o.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,d));const p=perfNow();this.wasmRunModel(((a=this.inputsBuffer)==null?void 0:a.getAddress())||0,this.outputsBuffer.getAddress(),l?.getAddress()||0);const g=perfElapsed(p);e.storeOutputs(this.outputsBuffer.getArrayView()),e.storeElapsedTime(g)}terminate(){var e,n,s;(e=this.inputsBuffer)==null||e.dispose(),this.inputsBuffer=void 0,(n=this.outputsBuffer)==null||n.dispose(),this.outputsBuffer=void 0,(s=this.outputIndicesBuffer)==null||s.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(e){return new WasmModel(e)}function createRunnableModel(e){switch(e.kind){case"js":return initJsModel(e);case"wasm":return initWasmModel(e);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const e=await initGeneratedModel();return runnableModel=createRunnableModel(e),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(e){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(e),runnableModel.runModel(params),Transfer(e)}};function exposeModelWorker(e){initGeneratedModel=e,expose(modelWorker)}let _average_duration_of_illness_d,_contact_rate_c,_final_time,_infection_rate,_infectious_population_i,_infectivity_i,_initial_contact_rate,_initial_time,_recovered_population_r,_recovery_rate,_saveper,_susceptible_population_s,_time_step,_total_population_p,_time;function setTime(e){_time=e}let controlParamsInitialized=!1;function initControlParamsIfNeeded(){if(!controlParamsInitialized){if(fns===void 0)throw new Error("Must call setModelFunctions() before running the model");if(initConstants(),_initial_time===void 0)throw new Error("INITIAL TIME must be defined as a constant value");if(_time_step===void 0)throw new Error("TIME STEP must be defined as a constant value");if(_final_time===void 0||_saveper===void 0){if(setTime(_initial_time),fns.setContext({timeStep:_time_step,currentTime:_time}),initLevels(),evalAux(),_final_time===void 0)throw new Error("FINAL TIME must be defined");if(_saveper===void 0)throw new Error("SAVEPER must be defined")}controlParamsInitialized=!0}}function getInitialTime(){return initControlParamsIfNeeded(),_initial_time}function getFinalTime(){return initControlParamsIfNeeded(),_final_time}function getTimeStep(){return initControlParamsIfNeeded(),_time_step}function getSaveFreq(){return initControlParamsIfNeeded(),_saveper}let fns;function getModelFunctions(){return fns}function setModelFunctions(e){fns=e}function initConstants0(){_average_duration_of_illness_d=2,_final_time=200,_initial_time=0,_infectivity_i=.25,_initial_contact_rate=2.5,_saveper=1,_time_step=.0625,_total_population_p=1e4}function initConstants(){initConstants0()}function initLevels0(){_recovered_population_r=0,_infectious_population_i=1,_susceptible_population_s=_total_population_p-_infectious_population_i-_recovered_population_r}function initLevels(){initLevels0()}function evalAux0(){_recovery_rate=_infectious_population_i/_average_duration_of_illness_d,_contact_rate_c=_initial_contact_rate,_infection_rate=_contact_rate_c*_infectivity_i*_susceptible_population_s*_infectious_population_i/_total_population_p}function evalAux(){evalAux0()}function evalLevels0(){_infectious_population_i=fns.INTEG(_infectious_population_i,_infection_rate-_recovery_rate),_recovered_population_r=fns.INTEG(_recovered_population_r,_recovery_rate),_susceptible_population_s=fns.INTEG(_susceptible_population_s,-_infection_rate)}function evalLevels(){evalLevels0()}function setInputs(e){_initial_contact_rate=e(0),_infectivity_i=e(1),_average_duration_of_illness_d=e(2)}function setLookup(e,n){throw new Error("The setLookup function was not enabled for the generated model. Set the customLookups property in the spec/config file to allow for overriding lookups at runtime.")}const outputVarIds=["_infection_rate","_infectious_population_i","_recovered_population_r","_recovery_rate","_susceptible_population_s"],outputVarNames=["Infection Rate","Infectious Population I","Recovered Population R","Recovery Rate","Susceptible Population S"];function storeOutputs(e){e(_infection_rate),e(_infectious_population_i),e(_recovered_population_r),e(_recovery_rate),e(_susceptible_population_s)}function storeOutput(e,n){throw new Error("The storeOutput function was not enabled for the generated model. Set the customOutputs property in the spec/config file to allow for capturing arbitrary variables at runtime.")}const modelListing=void 0;async function loadGeneratedModel(){return{kind:"js",outputVarIds,outputVarNames,modelListing,getInitialTime,getFinalTime,getTimeStep,getSaveFreq,getModelFunctions,setModelFunctions,setTime,setInputs,setLookup,storeOutputs,storeOutput,initConstants,initLevels,evalAux,evalLevels}}exposeModelWorker(loadGeneratedModel)})();\n';
class BundleModelRunner {
  /**
   * @param modelSpec The spec for the bundled model.
   * @param inputMap The model inputs.
   * @param modelRunner The model runner.
   */
  constructor(t, r, n) {
    this.modelSpec = t, this.inputMap = r, this.modelRunner = n, this.inputs = [...r.values()].map((i) => i.value), this.outputs = n.createOutputs();
  }
  async runModelForScenario(t, r) {
    return setInputsForScenario(this.inputMap, t), r[0]?.startsWith("ModelImpl") ? this.runModelWithImplOutputs(r) : this.runModelWithNormalOutputs(r);
  }
  async runModelWithNormalOutputs(t) {
    this.outputs = await this.modelRunner.runModel(this.inputs, this.outputs);
    const r = this.outputs.runTimeInMillis, n = /* @__PURE__ */ new Map();
    for (const i of t) {
      const s = this.modelSpec.outputVars.get(i);
      if (s)
        if (s.sourceName === void 0) {
          const o = this.outputs.getSeriesForVar(s.varId);
          o && n.set(i, datasetFromPoints(o.points));
        } else
          console.error("Static data sources not yet handled in default model check bundle");
    }
    return {
      datasetMap: n,
      modelRunTime: r
    };
  }
  async runModelWithImplOutputs(t) {
    const r = [];
    for (const l of t) {
      const d = this.modelSpec.implVars.get(l);
      d && r.push(d);
    }
    const n = this.outputs.startTime, i = this.outputs.endTime, s = this.outputs.saveFreq;
    let o = createImplOutputs(r, n, i, s);
    o = await this.modelRunner.runModel(this.inputs, o);
    const a = o.runTimeInMillis, u = /* @__PURE__ */ new Map();
    for (const l of t) {
      const d = this.modelSpec.implVars.get(l), y = o.getSeriesForVar(d.varId);
      y && u.set(l, datasetFromPoints(y.points));
    }
    return {
      datasetMap: u,
      modelRunTime: a
    };
  }
}
function datasetFromPoints(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e)
    r.y !== void 0 && t.set(r.x, r.y);
  return t;
}
function createImplOutputs(e, t, r, n) {
  const i = [], s = [];
  for (const a of e)
    i.push(a.varId), s.push({
      varIndex: a.varIndex,
      subscriptIndices: a.subscriptIndices
    });
  const o = new Outputs(i, t, r, n);
  return o.varSpecs = s, o;
}
const VERSION = 1;
class BundleModel {
  /**
   * @param modelSpec The spec for the bundled model.
   * @param bundleModelRunner The bundle model runner.
   */
  constructor(t, r) {
    this.modelSpec = t, this.bundleModelRunner = r;
  }
  // from CheckBundleModel interface
  async getDatasetsForScenario(t, r) {
    return this.bundleModelRunner.runModelForScenario(t, r);
  }
  // from CheckBundleModel interface
  // TODO: This function should be optional
  async getGraphDataForScenario() {
  }
  // from CheckBundleModel interface
  // TODO: This function should be optional
  getGraphLinksForScenario() {
    return [];
  }
}
async function initBundleModel(e, t) {
  const r = await spawnAsyncModelRunner({ source: modelWorkerJs }), n = new BundleModelRunner(e, t, r);
  return new BundleModel(e, n);
}
function createBundle() {
  const e = getInputVars(inputSpecs), t = getOutputVars(outputSpecs), { implVars: r, implVarGroups: n } = getImplVars(encodedImplVars), i = {
    modelSizeInBytes,
    dataSizeInBytes,
    inputVars: e,
    outputVars: t,
    implVars: r,
    implVarGroups: n
    // TODO: startTime and endTime are optional; the comparison graphs work OK if
    // they are undefined.  The main benefit of using these is to set a specific
    // range for the x-axis on the comparison graphs, so maybe we should find
    // another way to allow these to be defined.
    // startTime,
    // endTime
  };
  return {
    version: VERSION,
    modelSpec: i,
    initModel: () => initBundleModel(i, e)
  };
}
export {
  createBundle
};

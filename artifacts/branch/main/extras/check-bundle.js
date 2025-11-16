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
    constructor(n, s) {
      var o, i;
      typeof n == "string" && s && s._baseURL ? n = new URL(n, s._baseURL) : typeof n == "string" && !isAbsoluteURL(n) && getBundleURLCached().match(/^file:\/\//i) && (n = new URL(n, getBundleURLCached().replace(/\/[^\/]+$/, "/")), (!((o = s?.CORSWorkaround) !== null && o !== void 0) || o) && (n = createSourceBlobURL(`importScripts(${JSON.stringify(n)});`))), typeof n == "string" && isAbsoluteURL(n) && (!((i = s?.CORSWorkaround) !== null && i !== void 0) || i) && (n = createSourceBlobURL(`importScripts(${JSON.stringify(n)});`)), super(n, s);
    }
  }
  class t extends e {
    constructor(n, s) {
      const o = window.URL.createObjectURL(n);
      super(o, s);
    }
    static fromText(n, s) {
      const o = new window.Blob([n], { type: "text/javascript" });
      return new t(o, s);
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
  const r = getCallsites().find((i) => {
    const l = i.getFileName();
    return !!(l && !l.match(t) && !l.match(/[\/\\]master[\/\\]implementation/) && !l.match(/^internal\/process/));
  }), n = r ? r.getFileName() : null;
  let s = n || null;
  return s && s.startsWith("file:") && (s = fileURLToPath(s)), s ? path.join(path.dirname(s), e) : e;
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
        const s = t;
        super(s, Object.assign(Object.assign({}, r), { eval: !0 }));
      }
      this.mappedEventListeners = /* @__PURE__ */ new WeakMap(), allWorkers.push(this);
    }
    addEventListener(t, r) {
      const n = (s) => {
        r({ data: s });
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
    constructor(i, l) {
      const c = l && l.fromSource ? null : process.platform === "win32" ? `file:///${resolveScriptPath(i).replace(/\\/g, "/")}` : resolveScriptPath(i);
      if (c)
        c.match(/\.tsx?$/i) && detectTsNode() ? super(new Function(createTsNodeModule(resolveScriptPath(i))), [], { esm: !0 }) : c.match(/\.asar[\/\\]/) ? super(c.replace(/\.asar([\/\\])/, ".asar.unpacked$1"), [], { esm: !0 }) : super(c, [], { esm: !0 });
      else {
        const a = i;
        super(new Function(a), [], { esm: !0 });
      }
      t.push(this), this.emitter = new EventEmitter(), this.onerror = (a) => this.emitter.emit("error", a), this.onmessage = (a) => this.emitter.emit("message", a);
    }
    addEventListener(i, l) {
      this.emitter.addListener(i, l);
    }
    removeEventListener(i, l) {
      this.emitter.removeListener(i, l);
    }
    terminate() {
      return t = t.filter((i) => i !== this), super.terminate();
    }
  }
  const n = () => {
    Promise.all(t.map((o) => o.terminate())).then(() => process.exit(0), () => process.exit(1)), t = [];
  };
  process.on("SIGINT", () => n()), process.on("SIGTERM", () => n());
  class s extends r {
    constructor(i, l) {
      super(Buffer.from(i).toString("utf-8"), Object.assign(Object.assign({}, l), { fromSource: !0 }));
    }
    static fromText(i, l) {
      return new r(i, Object.assign(Object.assign({}, l), { fromSource: !0 }));
    }
  }
  return {
    blob: s,
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
  var e = 1e3, t = e * 60, r = t * 60, n = r * 24, s = n * 7, o = n * 365.25;
  ms = function(u, d) {
    d = d || {};
    var f = typeof u;
    if (f === "string" && u.length > 0)
      return i(u);
    if (f === "number" && isFinite(u))
      return d.long ? c(u) : l(u);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(u)
    );
  };
  function i(u) {
    if (u = String(u), !(u.length > 100)) {
      var d = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        u
      );
      if (d) {
        var f = parseFloat(d[1]), p = (d[2] || "ms").toLowerCase();
        switch (p) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return f * o;
          case "weeks":
          case "week":
          case "w":
            return f * s;
          case "days":
          case "day":
          case "d":
            return f * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return f * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return f * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return f * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return f;
          default:
            return;
        }
      }
    }
  }
  function l(u) {
    var d = Math.abs(u);
    return d >= n ? Math.round(u / n) + "d" : d >= r ? Math.round(u / r) + "h" : d >= t ? Math.round(u / t) + "m" : d >= e ? Math.round(u / e) + "s" : u + "ms";
  }
  function c(u) {
    var d = Math.abs(u);
    return d >= n ? a(u, d, n, "day") : d >= r ? a(u, d, r, "hour") : d >= t ? a(u, d, t, "minute") : d >= e ? a(u, d, e, "second") : u + " ms";
  }
  function a(u, d, f, p) {
    var h = d >= f * 1.5;
    return Math.round(u / f) + " " + p + (h ? "s" : "");
  }
  return ms;
}
var common, hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function e(t) {
    n.debug = n, n.default = n, n.coerce = a, n.disable = l, n.enable = o, n.enabled = c, n.humanize = requireMs(), n.destroy = u, Object.keys(t).forEach((d) => {
      n[d] = t[d];
    }), n.names = [], n.skips = [], n.formatters = {};
    function r(d) {
      let f = 0;
      for (let p = 0; p < d.length; p++)
        f = (f << 5) - f + d.charCodeAt(p), f |= 0;
      return n.colors[Math.abs(f) % n.colors.length];
    }
    n.selectColor = r;
    function n(d) {
      let f, p = null, h, I;
      function m(...b) {
        if (!m.enabled)
          return;
        const w = m, g = Number(/* @__PURE__ */ new Date()), v = g - (f || g);
        w.diff = v, w.prev = f, w.curr = g, f = g, b[0] = n.coerce(b[0]), typeof b[0] != "string" && b.unshift("%O");
        let E = 0;
        b[0] = b[0].replace(/%([a-zA-Z%])/g, (y, k) => {
          if (y === "%%")
            return "%";
          E++;
          const M = n.formatters[k];
          if (typeof M == "function") {
            const S = b[E];
            y = M.call(w, S), b.splice(E, 1), E--;
          }
          return y;
        }), n.formatArgs.call(w, b), (w.log || n.log).apply(w, b);
      }
      return m.namespace = d, m.useColors = n.useColors(), m.color = n.selectColor(d), m.extend = s, m.destroy = n.destroy, Object.defineProperty(m, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => p !== null ? p : (h !== n.namespaces && (h = n.namespaces, I = n.enabled(d)), I),
        set: (b) => {
          p = b;
        }
      }), typeof n.init == "function" && n.init(m), m;
    }
    function s(d, f) {
      const p = n(this.namespace + (typeof f > "u" ? ":" : f) + d);
      return p.log = this.log, p;
    }
    function o(d) {
      n.save(d), n.namespaces = d, n.names = [], n.skips = [];
      const f = (typeof d == "string" ? d : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const p of f)
        p[0] === "-" ? n.skips.push(p.slice(1)) : n.names.push(p);
    }
    function i(d, f) {
      let p = 0, h = 0, I = -1, m = 0;
      for (; p < d.length; )
        if (h < f.length && (f[h] === d[p] || f[h] === "*"))
          f[h] === "*" ? (I = h, m = p, h++) : (p++, h++);
        else if (I !== -1)
          h = I + 1, m++, p = m;
        else
          return !1;
      for (; h < f.length && f[h] === "*"; )
        h++;
      return h === f.length;
    }
    function l() {
      const d = [
        ...n.names,
        ...n.skips.map((f) => "-" + f)
      ].join(",");
      return n.enable(""), d;
    }
    function c(d) {
      for (const f of n.skips)
        if (i(d, f))
          return !1;
      for (const f of n.names)
        if (i(d, f))
          return !0;
      return !1;
    }
    function a(d) {
      return d instanceof Error ? d.stack || d.message : d;
    }
    function u() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return n.enable(n.load()), n;
  }
  return common = e, common;
}
var hasRequiredBrowser;
function requireBrowser() {
  return hasRequiredBrowser || (hasRequiredBrowser = 1, (function(e, t) {
    t.formatArgs = n, t.save = s, t.load = o, t.useColors = r, t.storage = i(), t.destroy = /* @__PURE__ */ (() => {
      let c = !1;
      return () => {
        c || (c = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
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
      let c;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(c[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function n(c) {
      if (c[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + c[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const a = "color: " + this.color;
      c.splice(1, 0, a, "color: inherit");
      let u = 0, d = 0;
      c[0].replace(/%[a-zA-Z%]/g, (f) => {
        f !== "%%" && (u++, f === "%c" && (d = u));
      }), c.splice(d, 0, a);
    }
    t.log = console.debug || console.log || (() => {
    });
    function s(c) {
      try {
        c ? t.storage.setItem("debug", c) : t.storage.removeItem("debug");
      } catch {
      }
    }
    function o() {
      let c;
      try {
        c = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !c && typeof process < "u" && "env" in process && (c = process.env.DEBUG), c;
    }
    function i() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = requireCommon()(t);
    const { formatters: l } = e.exports;
    l.j = function(c) {
      try {
        return JSON.stringify(c);
      } catch (a) {
        return "[UnexpectedJSONParseError]: " + a.message;
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
    const s = n ? getMethod(n, t) : void 0;
    switch (t) {
      case "next":
        s && s.call(n, r);
        break;
      case "error":
        if (closeSubscription(e), s)
          s.call(n, r);
        else
          throw r;
        break;
      case "complete":
        closeSubscription(e), s && s.call(n);
        break;
    }
  } catch (s) {
    hostReportError(s);
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
    } catch (s) {
      n.error(s);
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
    for (const s of [t, ...r])
      n = s(n);
    return n;
  }
  tap(t, r, n) {
    const s = typeof t != "object" || t === null ? {
      next: t,
      error: r,
      complete: n
    } : t;
    return new Observable((o) => this.subscribe({
      next(i) {
        s.next && s.next(i), o.next(i);
      },
      error(i) {
        s.error && s.error(i), o.error(i);
      },
      complete() {
        s.complete && s.complete(), o.complete();
      },
      start(i) {
        s.start && s.start(i);
      }
    }));
  }
  forEach(t) {
    return new Promise((r, n) => {
      if (typeof t != "function") {
        n(new TypeError(t + " is not a function"));
        return;
      }
      function s() {
        o.unsubscribe(), r(void 0);
      }
      const o = this.subscribe({
        next(i) {
          try {
            t(i, s);
          } catch (l) {
            n(l), o.unsubscribe();
          }
        },
        error(i) {
          n(i);
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
      next(s) {
        let o = s;
        try {
          o = t(s);
        } catch (i) {
          return n.error(i);
        }
        n.next(o);
      },
      error(s) {
        n.error(s);
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
      next(s) {
        try {
          if (!t(s))
            return;
        } catch (o) {
          return n.error(o);
        }
        n.next(s);
      },
      error(s) {
        n.error(s);
      },
      complete() {
        n.complete();
      }
    }));
  }
  reduce(t, r) {
    if (typeof t != "function")
      throw new TypeError(t + " is not a function");
    const n = getSpecies(this), s = arguments.length > 1;
    let o = !1, i = r;
    return new n((l) => this.subscribe({
      next(c) {
        const a = !o;
        if (o = !0, !a || s)
          try {
            i = t(i, c);
          } catch (u) {
            return l.error(u);
          }
        else
          i = c;
      },
      error(c) {
        l.error(c);
      },
      complete() {
        if (!o && !s)
          return l.error(new TypeError("Cannot reduce an empty sequence"));
        l.next(i), l.complete();
      }
    }));
  }
  concat(...t) {
    const r = getSpecies(this);
    return new r((n) => {
      let s, o = 0;
      function i(l) {
        s = l.subscribe({
          next(c) {
            n.next(c);
          },
          error(c) {
            n.error(c);
          },
          complete() {
            o === t.length ? (s = void 0, n.complete()) : i(r.from(t[o++]));
          }
        });
      }
      return i(this), () => {
        s && (s.unsubscribe(), s = void 0);
      };
    });
  }
  flatMap(t) {
    if (typeof t != "function")
      throw new TypeError(t + " is not a function");
    const r = getSpecies(this);
    return new r((n) => {
      const s = [], o = this.subscribe({
        next(l) {
          let c;
          if (t)
            try {
              c = t(l);
            } catch (u) {
              return n.error(u);
            }
          else
            c = l;
          const a = r.from(c).subscribe({
            next(u) {
              n.next(u);
            },
            error(u) {
              n.error(u);
            },
            complete() {
              const u = s.indexOf(a);
              u >= 0 && s.splice(u, 1), i();
            }
          });
          s.push(a);
        },
        error(l) {
          n.error(l);
        },
        complete() {
          i();
        }
      });
      function i() {
        o.closed && s.length === 0 && n.complete();
      }
      return () => {
        s.forEach((l) => l.unsubscribe()), o.unsubscribe();
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
      const s = n.call(t);
      if (Object(s) !== s)
        throw new TypeError(s + " is not an object");
      return isObservable(s) && s.constructor === r ? s : new r((o) => s.subscribe(o));
    }
    if (hasSymbol("iterator")) {
      const s = getMethod(t, SymbolIterator);
      if (s)
        return new r((o) => {
          enqueue(() => {
            if (!o.closed) {
              for (const i of s.call(t))
                if (o.next(i), o.closed)
                  return;
              o.complete();
            }
          });
        });
    }
    if (Array.isArray(t))
      return new r((s) => {
        enqueue(() => {
          if (!s.closed) {
            for (const o of t)
              if (s.next(o), s.closed)
                return;
            s.complete();
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
          for (const s of t)
            if (n.next(s), n.closed)
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
  return new Observable((s) => {
    r || (r = e.subscribe(t));
    const o = t.subscribe(s);
    return n++, () => {
      n--, o.unsubscribe(), n === 0 && (unsubscribe(r), r = void 0);
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
  return [new Promise((o) => {
    e ? o(t) : r = o;
  }), (o) => {
    e = !0, t = o, r(t);
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
      const n = this, s = Object.assign(Object.assign({}, r), {
        complete() {
          r.complete(), n.onCompletion();
        },
        error(o) {
          r.error(o), n.onError(o);
        },
        next(o) {
          r.next(o), n.onNext(o);
        }
      });
      try {
        return this.initHasRun = !0, t(s);
      } catch (o) {
        s.error(o);
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
    const n = t || returnInput, s = r || fail;
    let o = !1;
    return new Promise((i, l) => {
      const c = (u) => {
        if (!o) {
          o = !0;
          try {
            i(s(u));
          } catch (d) {
            l(d);
          }
        }
      }, a = (u) => {
        try {
          i(n(u));
        } catch (d) {
          c(d);
        }
      };
      if (this.initHasRun || this.subscribe({ error: c }), this.state === "fulfilled")
        return i(n(this.firstValue));
      if (this.state === "rejected")
        return o = !0, i(s(this.rejection));
      this.fulfillmentCallbacks.push(a), this.rejectionCallbacks.push(c);
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
      const n = (o) => {
        r.next(o), r.complete();
      }, s = (o) => {
        r.error(o);
      };
      t.then(n, s);
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
    const s = ((o) => {
      if (debugMessages$1("Message from worker:", o.data), !(!o.data || o.data.uid !== t)) {
        if (isJobStartMessage(o.data))
          n = o.data.resultType;
        else if (isJobResultMessage(o.data))
          n === "promise" ? (typeof o.data.payload < "u" && r.next(deserialize(o.data.payload)), r.complete(), e.removeEventListener("message", s)) : (o.data.payload && r.next(deserialize(o.data.payload)), o.data.complete && (r.complete(), e.removeEventListener("message", s)));
        else if (isJobErrorMessage(o.data)) {
          const i = deserialize(o.data.error);
          r.error(i), e.removeEventListener("message", s);
        }
      }
    });
    return e.addEventListener("message", s), () => {
      if (n === "observable" || !n) {
        const o = {
          type: MasterMessageType.cancel,
          uid: t
        };
        e.postMessage(o);
      }
      e.removeEventListener("message", s);
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
    const n = nextJobUID++, { args: s, transferables: o } = prepareArguments(r), i = {
      type: MasterMessageType.run,
      uid: n,
      method: t,
      args: s
    };
    debugMessages$1("Sending command to run function to worker:", i);
    try {
      e.postMessage(i, o);
    } catch (l) {
      return ObservablePromise.from(Promise.reject(l));
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
var __awaiter$1 = function(e, t, r, n) {
  function s(o) {
    return o instanceof r ? o : new r(function(i) {
      i(o);
    });
  }
  return new (r || (r = Promise))(function(o, i) {
    function l(u) {
      try {
        a(n.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        a(n.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function a(u) {
      u.done ? o(u.value) : s(u.value).then(l, c);
    }
    a((n = n.apply(e, t || [])).next());
  });
};
const debugMessages = DebugLogger("threads:master:messages"), debugSpawn = DebugLogger("threads:master:spawn"), debugThreadUtils = DebugLogger("threads:master:thread-utils"), isInitMessage = (e) => e && e.type === "init", isUncaughtErrorMessage = (e) => e && e.type === "uncaughtError", initMessageTimeout = typeof process < "u" && process.env.THREADS_WORKER_INIT_TIMEOUT ? Number.parseInt(process.env.THREADS_WORKER_INIT_TIMEOUT, 10) : 1e4;
function withTimeout(e, t, r) {
  return __awaiter$1(this, void 0, void 0, function* () {
    let n;
    const s = new Promise((i, l) => {
      n = setTimeout(() => l(Error(r)), t);
    }), o = yield Promise.race([
      e,
      s
    ]);
    return clearTimeout(n), o;
  });
}
function receiveInitMessage(e) {
  return new Promise((t, r) => {
    const n = ((s) => {
      debugMessages("Message from worker before finishing initialization:", s.data), isInitMessage(s.data) ? (e.removeEventListener("message", n), t(s.data)) : isUncaughtErrorMessage(s.data) && (e.removeEventListener("message", n), r(deserialize(s.data.error)));
    });
    e.addEventListener("message", n);
  });
}
function createEventObservable(e, t) {
  return new Observable((r) => {
    const n = ((o) => {
      const i = {
        type: WorkerEventType.message,
        data: o.data
      };
      r.next(i);
    }), s = ((o) => {
      debugThreadUtils("Unhandled promise rejection event in thread:", o);
      const i = {
        type: WorkerEventType.internalError,
        error: Error(o.reason)
      };
      r.next(i);
    });
    e.addEventListener("message", n), e.addEventListener("unhandledrejection", s), t.then(() => {
      const o = {
        type: WorkerEventType.termination
      };
      e.removeEventListener("message", n), e.removeEventListener("unhandledrejection", s), r.next(o), r.complete();
    });
  });
}
function createTerminator(e) {
  const [t, r] = createPromiseWithResolver();
  return { terminate: () => __awaiter$1(this, void 0, void 0, function* () {
    debugThreadUtils("Terminating worker"), yield e.terminate(), r();
  }), termination: t };
}
function setPrivateThreadProps(e, t, r, n) {
  const s = r.filter((o) => o.type === WorkerEventType.internalError).map((o) => o.error);
  return Object.assign(e, {
    [$errors]: s,
    [$events]: r,
    [$terminate]: n,
    [$worker]: t
  });
}
function spawn(e, t) {
  return __awaiter$1(this, void 0, void 0, function* () {
    debugSpawn("Initializing new thread");
    const r = initMessageTimeout, s = (yield withTimeout(receiveInitMessage(e), r, `Timeout: Did not receive an init message from worker after ${r}ms. Make sure the worker calls expose().`)).exposed, { termination: o, terminate: i } = createTerminator(e), l = createEventObservable(e, o);
    if (s.type === "function") {
      const c = createProxyFunction(e);
      return setPrivateThreadProps(c, e, l, i);
    } else if (s.type === "module") {
      const c = createProxyModule(e, s.methods);
      return setPrivateThreadProps(c, e, l, i);
    } else {
      const c = s.type;
      throw Error(`Worker init message states unexpected type of expose(): ${c}`);
    }
  });
}
const BlobWorker = getWorkerImplementation().blob, Worker$1 = getWorkerImplementation().default, isWorkerRuntime$2 = function e() {
  const t = typeof self < "u" && typeof Window < "u" && self instanceof Window;
  return !!(typeof self < "u" && self.postMessage && !t);
}, postMessageToMaster$2 = function e(t, r) {
  self.postMessage(t, r);
}, subscribeToMasterMessages$2 = function e(t) {
  const r = (s) => {
    t(s.data);
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
    messageHandlers.forEach((s) => s(n.data));
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
  const n = (o) => {
    t(o);
  }, s = () => {
    assertMessagePort(r).off("message", n);
  };
  return assertMessagePort(r).on("message", n), s;
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
var ok = function(e) {
  return new Ok(e);
}, err = function(e) {
  return new Err(e);
}, Ok = (
  /** @class */
  (function() {
    function e(t) {
      var r = this;
      this.value = t, this.match = function(n, s) {
        return n(r.value);
      };
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
    }, e.prototype.asyncAndThen = function(t) {
      return t(this.value);
    }, e.prototype.asyncMap = function(t) {
      return ResultAsync.fromPromise(t(this.value));
    }, e.prototype.unwrapOr = function(t) {
      return this.value;
    }, e.prototype._unsafeUnwrap = function() {
      return this.value;
    }, e.prototype._unsafeUnwrapErr = function() {
      throw new Error("Called `_unsafeUnwrapErr` on an Ok");
    }, e;
  })()
), Err = (
  /** @class */
  (function() {
    function e(t) {
      var r = this;
      this.error = t, this.match = function(n, s) {
        return s(r.error);
      };
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
    }, e.prototype.asyncAndThen = function(t) {
      return errAsync(this.error);
    }, e.prototype.asyncMap = function(t) {
      return errAsync(this.error);
    }, e.prototype.unwrapOr = function(t) {
      return t;
    }, e.prototype._unsafeUnwrap = function() {
      throw new Error("Called `_unsafeUnwrap` on an Err");
    }, e.prototype._unsafeUnwrapErr = function() {
      return this.error;
    }, e;
  })()
);
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function __awaiter(e, t, r, n) {
  function s(o) {
    return o instanceof r ? o : new r(function(i) {
      i(o);
    });
  }
  return new (r || (r = Promise))(function(o, i) {
    function l(u) {
      try {
        a(n.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        a(n.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function a(u) {
      u.done ? o(u.value) : s(u.value).then(l, c);
    }
    a((n = n.apply(e, [])).next());
  });
}
function __generator(e, t) {
  var r = { label: 0, sent: function() {
    if (o[0] & 1) throw o[1];
    return o[1];
  }, trys: [], ops: [] }, n, s, o, i;
  return i = { next: l(0), throw: l(1), return: l(2) }, typeof Symbol == "function" && (i[Symbol.iterator] = function() {
    return this;
  }), i;
  function l(a) {
    return function(u) {
      return c([a, u]);
    };
  }
  function c(a) {
    if (n) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (n = 1, s && (o = a[0] & 2 ? s.return : a[0] ? s.throw || ((o = s.return) && o.call(s), 0) : s.next) && !(o = o.call(s, a[1])).done) return o;
      switch (s = 0, o && (a = [a[0] & 2, o.value]), a[0]) {
        case 0:
        case 1:
          o = a;
          break;
        case 4:
          return r.label++, { value: a[1], done: !1 };
        case 5:
          r.label++, s = a[1], a = [0];
          continue;
        case 7:
          a = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (o = r.trys, !(o = o.length > 0 && o[o.length - 1]) && (a[0] === 6 || a[0] === 2)) {
            r = 0;
            continue;
          }
          if (a[0] === 3 && (!o || a[1] > o[0] && a[1] < o[3])) {
            r.label = a[1];
            break;
          }
          if (a[0] === 6 && r.label < o[1]) {
            r.label = o[1], o = a;
            break;
          }
          if (o && r.label < o[2]) {
            r.label = o[2], r.ops.push(a);
            break;
          }
          o[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      a = t.call(e, r);
    } catch (u) {
      a = [6, u], s = 0;
    } finally {
      n = o = 0;
    }
    if (a[0] & 5) throw a[1];
    return { value: a[0] ? a[1] : void 0, done: !0 };
  }
}
var logWarning = function(e) {
  if (typeof process != "object" || process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
    var t = "\x1B[33m%s\x1B[0m", r = ["[neverthrow]", e].join(" - ");
    console.warn(t, r);
  }
}, ResultAsync = (
  /** @class */
  (function() {
    function e(t) {
      this._promise = t;
    }
    return e.fromPromise = function(t, r) {
      var n = t.then(function(o) {
        return new Ok(o);
      });
      if (r)
        n = n.catch(function(o) {
          return new Err(r(o));
        });
      else {
        var s = [
          "`fromPromise` called without a promise rejection handler",
          "Ensure that you are catching promise rejections yourself, or pass a second argument to `fromPromise` to convert a caught exception into an `Err` instance"
        ].join(" - ");
        logWarning(s);
      }
      return new e(n);
    }, e.prototype.map = function(t) {
      var r = this;
      return new e(this._promise.then(function(n) {
        return __awaiter(r, void 0, void 0, function() {
          var s;
          return __generator(this, function(o) {
            switch (o.label) {
              case 0:
                return n.isErr() ? [2, new Err(n.error)] : (s = Ok.bind, [4, t(n.value)]);
              case 1:
                return [2, new (s.apply(Ok, [void 0, o.sent()]))()];
            }
          });
        });
      }));
    }, e.prototype.mapErr = function(t) {
      var r = this;
      return new e(this._promise.then(function(n) {
        return __awaiter(r, void 0, void 0, function() {
          var s;
          return __generator(this, function(o) {
            switch (o.label) {
              case 0:
                return n.isOk() ? [2, new Ok(n.value)] : (s = Err.bind, [4, t(n.error)]);
              case 1:
                return [2, new (s.apply(Err, [void 0, o.sent()]))()];
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
), errAsync = function(e) {
  return new ResultAsync(Promise.resolve(new Err(e)));
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
  const s = {}, o = () => n, i = (c) => {
    var a;
    c !== n && (n = c, (a = s.onSet) == null || a.call(s));
  };
  return { varId: e, get: o, set: i, reset: () => {
    i(t);
  }, callbacks: s };
}
var Series = class T {
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
    return new T(this.varId, t);
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
    for (let s = 0; s < e.length; s++) {
      const o = new Array(this.seriesLength);
      for (let l = 0; l < this.seriesLength; l++)
        o[l] = { x: t + l * n, y: 0 };
      const i = e[s];
      this.varSeries[s] = new Series(i, o);
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
    return r.isOk() ? ok(void 0) : err(r.error);
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
  const n = r.varIds.length, s = r.seriesLength;
  if (t < s || e.length < n * s)
    return err("invalid-point-count");
  for (let o = 0; o < n; o++) {
    const i = r.varSeries[o];
    let l = t * o;
    for (let c = 0; c < s; c++)
      i.points[c].y = validateNumber(e[l]), l++;
  }
  return ok(r);
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
    const s = ((t = n.subscriptIndices) == null ? void 0 : t.length) || 0;
    r += s;
  }
  return r;
}
function encodeVarIndices(e, t) {
  let r = 0;
  t[r++] = e.length;
  for (const n of e) {
    t[r++] = n.varIndex;
    const s = n.subscriptIndices, o = s?.length || 0;
    t[r++] = o;
    for (let i = 0; i < o; i++)
      t[r++] = s[i];
  }
}
function getEncodedLookupBufferLengths(e) {
  var t, r;
  let n = 1, s = 0;
  for (const o of e) {
    const i = o.varRef.varSpec;
    if (i === void 0)
      throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");
    n += 2;
    const l = ((t = i.subscriptIndices) == null ? void 0 : t.length) || 0;
    n += l, n += 2, s += ((r = o.points) == null ? void 0 : r.length) || 0;
  }
  return {
    lookupIndicesLength: n,
    lookupsLength: s
  };
}
function encodeLookups(e, t, r) {
  let n = 0;
  t[n++] = e.length;
  let s = 0;
  for (const o of e) {
    const i = o.varRef.varSpec;
    t[n++] = i.varIndex;
    const l = i.subscriptIndices, c = l?.length || 0;
    t[n++] = c;
    for (let a = 0; a < c; a++)
      t[n++] = l[a];
    o.points !== void 0 ? (t[n++] = s, t[n++] = o.points.length, r?.set(o.points, s), s += o.points.length) : (t[n++] = -1, t[n++] = 0);
  }
}
function decodeLookups(e, t) {
  const r = [];
  let n = 0;
  const s = e[n++];
  for (let o = 0; o < s; o++) {
    const i = e[n++], l = e[n++], c = l > 0 ? Array(l) : void 0;
    for (let p = 0; p < l; p++)
      c[p] = e[n++];
    const a = e[n++], u = e[n++], d = {
      varIndex: i,
      subscriptIndices: c
    };
    let f;
    a >= 0 ? t ? f = t.slice(a, a + u) : f = new Float64Array(0) : f = void 0, r.push({
      varRef: {
        varSpec: d
      },
      points: f
    });
  }
  return r;
}
var ModelListing = class {
  constructor(e) {
    this.varSpecs = /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    for (const s of e.dimensions) {
      const o = s.id, i = [];
      for (let l = 0; l < s.subIds.length; l++)
        i.push({
          id: s.subIds[l],
          index: l
        });
      t.set(o, {
        id: o,
        subscripts: i
      });
    }
    function r(s) {
      const o = t.get(s);
      if (o === void 0)
        throw new Error(`No dimension info found for id=${s}`);
      return o;
    }
    const n = /* @__PURE__ */ new Set();
    for (const s of e.variables) {
      const o = varIdWithoutSubscripts(s.id);
      if (!n.has(o)) {
        const l = (s.dimIds || []).map(r);
        if (l.length > 0) {
          const c = [];
          for (const u of l)
            c.push(u.subscripts);
          const a = cartesianProductOf(c);
          for (const u of a) {
            const d = u.map((h) => h.id).join(","), f = u.map((h) => h.index), p = `${o}[${d}]`;
            this.varSpecs.set(p, {
              varIndex: s.index,
              subscriptIndices: f
            });
          }
        } else
          this.varSpecs.set(o, {
            varIndex: s.index
          });
        n.add(o);
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
    for (const s of t) {
      const o = this.varSpecs.get(s);
      o !== void 0 ? r.push(o) : console.warn(`WARNING: No output var spec found for id=${s}`);
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
    (t, r) => t.map((n) => r.map((s) => n.concat([s]))).reduce((n, s) => n.concat(s), []),
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
    const n = t[2].split(",").map((s) => sdeVarIdForVensimName(s));
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
    const n = e.length, s = t.varIds.length * t.seriesLength;
    let o;
    const i = t.varSpecs;
    i !== void 0 && i.length > 0 ? o = getEncodedVarIndicesLength(i) : o = 0;
    let l, c;
    if (r?.lookups !== void 0 && r.lookups.length > 0) {
      for (const y of r.lookups)
        resolveVarRef(this.listing, y.varRef, "lookup");
      const _ = getEncodedLookupBufferLengths(r.lookups);
      l = _.lookupsLength, c = _.lookupIndicesLength;
    } else
      l = 0, c = 0;
    let a = 0;
    function u(_, y) {
      const k = a, M = _ === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, S = Math.round(y * M), L = Math.ceil(S / 8) * 8;
      return a += L, k;
    }
    const d = u("int32", headerLengthInElements), f = u("float64", extrasLengthInElements), p = u("float64", n), h = u("float64", s), I = u("int32", o), m = u("float64", l), b = u("int32", c), w = a;
    if (this.encoded === void 0 || this.encoded.byteLength < w) {
      const _ = Math.ceil(w * 1.2);
      this.encoded = new ArrayBuffer(_), this.header.update(this.encoded, d, headerLengthInElements);
    }
    const g = this.header.view;
    let v = 0;
    g[v++] = f, g[v++] = extrasLengthInElements, g[v++] = p, g[v++] = n, g[v++] = h, g[v++] = s, g[v++] = I, g[v++] = o, g[v++] = m, g[v++] = l, g[v++] = b, g[v++] = c, this.inputs.update(this.encoded, p, n), this.extras.update(this.encoded, f, extrasLengthInElements), this.outputs.update(this.encoded, h, s), this.outputIndices.update(this.encoded, I, o), this.lookups.update(this.encoded, m, l), this.lookupIndices.update(this.encoded, b, c);
    const E = this.inputs.view;
    for (let _ = 0; _ < e.length; _++) {
      const y = e[_];
      typeof y == "number" ? E[_] = y : E[_] = y.get();
    }
    this.outputIndices.view && encodeVarIndices(i, this.outputIndices.view), c > 0 && encodeLookups(r.lookups, this.lookupIndices.view, this.lookups.view);
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
    let s = 0;
    const o = n[s++], i = n[s++], l = n[s++], c = n[s++], a = n[s++], u = n[s++], d = n[s++], f = n[s++], p = n[s++], h = n[s++], I = n[s++], m = n[s++], b = i * Float64Array.BYTES_PER_ELEMENT, w = c * Float64Array.BYTES_PER_ELEMENT, g = u * Float64Array.BYTES_PER_ELEMENT, v = f * Int32Array.BYTES_PER_ELEMENT, E = h * Float64Array.BYTES_PER_ELEMENT, _ = m * Int32Array.BYTES_PER_ELEMENT, y = t + b + w + g + v + E + _;
    if (e.byteLength < y)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, o, i), this.inputs.update(this.encoded, l, c), this.outputs.update(this.encoded, a, u), this.outputIndices.update(this.encoded, d, f), this.lookups.update(this.encoded, p, h), this.lookupIndices.update(this.encoded, I, m);
  }
};
async function spawnAsyncModelRunner(e) {
  return e.path ? spawnAsyncModelRunnerWithWorker(new Worker$1(e.path)) : spawnAsyncModelRunnerWithWorker(BlobWorker.fromText(e.source));
}
async function spawnAsyncModelRunnerWithWorker(e) {
  const t = await spawn(e), r = await t.initModel(), n = r.modelListing ? new ModelListing(r.modelListing) : void 0, s = new BufferedRunModelParams(n);
  let o = !1, i = !1;
  return {
    createOutputs: () => new Outputs(r.outputVarIds, r.startTime, r.endTime, r.saveFreq),
    runModel: async (l, c, a) => {
      if (i)
        throw new Error("Async model runner has already been terminated");
      if (o)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      o = !0, s.updateFromParams(l, c, a);
      let u;
      try {
        u = await t.runModel(Transfer(s.getEncodedBuffer()));
      } finally {
        o = !1;
      }
      return s.updateFromEncodedBuffer(u), s.finalizeOutputs(c), c;
    },
    terminate: () => i ? Promise.resolve() : (i = !0, Thread.terminate(t))
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
var assertNeverExports = requireAssertNever();
function getInputVars(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e) {
    const n = r.varId, s = {
      inputId: r.inputId,
      varId: n,
      varName: r.varName,
      defaultValue: r.defaultValue,
      minValue: r.minValue,
      maxValue: r.maxValue,
      value: createInputValue(n, r.defaultValue)
    };
    t.set(n, s);
  }
  return t;
}
function setInputsForScenario(e, t) {
  function r(a, u) {
    u < a.minValue ? (console.warn(
      `WARNING: Scenario input value ${u} is < min value (${a.minValue}) for input '${a.varName}'`
    ), u = a.minValue) : u > a.maxValue && (console.warn(
      `WARNING: Scenario input value ${u} is > max value (${a.maxValue}) for input '${a.varName}'`
    ), u = a.maxValue), a.value.set(u);
  }
  function n(a) {
    a.value.reset();
  }
  function s(a) {
    a.value.set(a.minValue);
  }
  function o(a) {
    a.value.set(a.maxValue);
  }
  function i() {
    e.forEach(n);
  }
  function l() {
    e.forEach(s);
  }
  function c() {
    e.forEach(o);
  }
  switch (t.kind) {
    case "all-inputs": {
      switch (t.position) {
        case "at-default":
          i();
          break;
        case "at-minimum":
          l();
          break;
        case "at-maximum":
          c();
          break;
      }
      break;
    }
    case "input-settings": {
      i();
      for (const a of t.settings) {
        const u = e.get(a.inputVarId);
        if (u)
          switch (a.kind) {
            case "position":
              switch (a.position) {
                case "at-default":
                  n(u);
                  break;
                case "at-minimum":
                  s(u);
                  break;
                case "at-maximum":
                  o(u);
                  break;
                default:
                  assertNeverExports.assertNever(a.position);
              }
              break;
            case "value":
              r(u, a.value);
              break;
            default:
              assertNeverExports.assertNever(a);
          }
        else
          console.log(`No model input for scenario input ${a.inputVarId}`);
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
    const n = r.varId, s = datasetKeyForOutputVar(void 0, n);
    t.set(s, {
      datasetKey: s,
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
const inputSpecs = [{ inputId: "1", varId: "_initial_contact_rate", varName: "Initial Contact Rate", defaultValue: 2.5, minValue: 0, maxValue: 5 }, { inputId: "2", varId: "_infectivity_i", varName: "Infectivity i", defaultValue: 0.25, minValue: -2, maxValue: 2 }, { inputId: "3", varId: "_average_duration_of_illness_d", varName: "Average Duration of Illness d", defaultValue: 2, minValue: 0, maxValue: 10 }], outputSpecs = [{ varId: "_infection_rate", varName: "Infection Rate" }, { varId: "_infectious_population_i", varName: "Infectious Population I" }, { varId: "_recovered_population_r", varName: "Recovered Population R" }, { varId: "_recovery_rate", varName: "Recovery Rate" }, { varId: "_susceptible_population_s", varName: "Susceptible Population S" }], modelSizeInBytes = 7601, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=e=>e?typeof Symbol.observable=="symbol"&&typeof e[Symbol.observable]=="function"?e===e[Symbol.observable]():typeof e["@@observable"]=="function"?e===e["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function e(t,r){const i=t.deserialize.bind(t),o=t.serialize.bind(t);return{deserialize(a){return r.deserialize(a,i)},serialize(a){return r.serialize(a,o)}}}serializers.extendSerializer=e;const n={deserialize(t){return Object.assign(Error(t.message),{name:t.name,stack:t.stack})},serialize(t){return{__error_marker:"$$error",message:t.message,name:t.name,stack:t.stack}}},s=t=>t&&typeof t=="object"&&"__error_marker"in t&&t.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(t){return s(t)?n.deserialize(t):t},serialize(t){return t instanceof Error?n.serialize(t):t}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const e=requireSerializers();let n=e.DefaultSerializer;function s(i){n=e.extendSerializer(n,i)}common.registerSerializer=s;function t(i){return n.deserialize(i)}common.deserialize=t;function r(i){return n.serialize(i)}return common.serialize=r,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const e=requireSymbols();function n(r){return!(!r||typeof r!="object")}function s(r){return r&&typeof r=="object"&&r[e.$transferable]}transferable.isTransferDescriptor=s;function t(r,i){if(!i){if(!n(r))throw Error();i=[r]}return{[e.$transferable]:!0,send:r,transferables:i}}return transferable.Transfer=t,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.WorkerMessageType=e.MasterMessageType=void 0,(function(n){n.cancel="cancel",n.run="run"})(e.MasterMessageType||(e.MasterMessageType={})),(function(n){n.error="error",n.init="init",n.result="result",n.running="running",n.uncaughtError="uncaughtError"})(e.WorkerMessageType||(e.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const e=function(){const r=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!r)},n=function(r,i){self.postMessage(r,i)},s=function(r){const i=a=>{r(a.data)},o=()=>{self.removeEventListener("message",i)};return self.addEventListener("message",i),o};return implementation_browser.default={isWorkerRuntime:e,postMessageToMaster:n,subscribeToMasterMessages:s},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const e=function(){return!!(typeof self<"u"&&self.postMessage)},n=function(o){self.postMessage(o)};let s=!1;const t=new Set,r=function(o){return s||(self.addEventListener("message",(c=>{t.forEach(l=>l(c.data))})),s=!0),t.add(o),()=>t.delete(o)};return implementation_tinyWorker.default={isWorkerRuntime:e,postMessageToMaster:n,subscribeToMasterMessages:r},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var e=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(a){return a&&a.__esModule?a:{default:a}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const n=e(requireWorker_threads());function s(a){if(!a)throw Error("Invariant violation: MessagePort to parent is not available.");return a}const t=function(){return!n.default().isMainThread},r=function(c,l){s(n.default().parentPort).postMessage(c,l)},i=function(c){const l=n.default().parentPort;if(!l)throw Error("Invariant violation: MessagePort to parent is not available.");const d=g=>{c(g)},p=()=>{s(l).off("message",d)};return s(l).on("message",d),p};function o(){n.default()}return implementation_worker_threads.default={isWorkerRuntime:t,postMessageToMaster:r,subscribeToMasterMessages:i,testImplementation:o},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var e=implementation&&implementation.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(implementation,"__esModule",{value:!0});const n=e(requireImplementation_browser()),s=e(requireImplementation_tinyWorker()),t=e(requireImplementation_worker_threads()),r=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function i(){try{return t.default.testImplementation(),t.default}catch{return s.default}}return implementation.default=r?i():n.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(e){var n=worker&&worker.__awaiter||function(u,f,v,w){function O(k){return k instanceof v?k:new v(function(B){B(k)})}return new(v||(v=Promise))(function(k,B){function A(R){try{z(w.next(R))}catch(W){B(W)}}function P(R){try{z(w.throw(R))}catch(W){B(W)}}function z(R){R.done?k(R.value):O(R.value).then(A,P)}z((w=w.apply(u,f||[])).next())})},s=worker&&worker.__importDefault||function(u){return u&&u.__esModule?u:{default:u}};Object.defineProperty(e,"__esModule",{value:!0}),e.expose=e.isWorkerRuntime=e.Transfer=e.registerSerializer=void 0;const t=s(requireIsObservable()),r=requireCommon(),i=requireTransferable(),o=requireMessages(),a=s(requireImplementation());var c=requireCommon();Object.defineProperty(e,"registerSerializer",{enumerable:!0,get:function(){return c.registerSerializer}});var l=requireTransferable();Object.defineProperty(e,"Transfer",{enumerable:!0,get:function(){return l.Transfer}}),e.isWorkerRuntime=a.default.isWorkerRuntime;let d=!1;const p=new Map,g=u=>u&&u.type===o.MasterMessageType.cancel,_=u=>u&&u.type===o.MasterMessageType.run,I=u=>t.default(u)||T(u);function T(u){return u&&typeof u=="object"&&typeof u.subscribe=="function"}function E(u){return i.isTransferDescriptor(u)?{payload:u.send,transferables:u.transferables}:{payload:u,transferables:void 0}}function S(){const u={type:o.WorkerMessageType.init,exposed:{type:"function"}};a.default.postMessageToMaster(u)}function y(u){const f={type:o.WorkerMessageType.init,exposed:{type:"module",methods:u}};a.default.postMessageToMaster(f)}function h(u,f){const{payload:v,transferables:w}=E(f),O={type:o.WorkerMessageType.error,uid:u,error:r.serialize(v)};a.default.postMessageToMaster(O,w)}function m(u,f,v){const{payload:w,transferables:O}=E(v),k={type:o.WorkerMessageType.result,uid:u,complete:f?!0:void 0,payload:w};a.default.postMessageToMaster(k,O)}function L(u,f){const v={type:o.WorkerMessageType.running,uid:u,resultType:f};a.default.postMessageToMaster(v)}function b(u){try{const f={type:o.WorkerMessageType.uncaughtError,error:r.serialize(u)};a.default.postMessageToMaster(f)}catch(f){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,f,`\nOriginal error:`,u)}}function M(u,f,v){return n(this,void 0,void 0,function*(){let w;try{w=f(...v)}catch(k){return h(u,k)}const O=I(w)?"observable":"promise";if(L(u,O),I(w)){const k=w.subscribe(B=>m(u,!1,r.serialize(B)),B=>{h(u,r.serialize(B)),p.delete(u)},()=>{m(u,!0),p.delete(u)});p.set(u,k)}else try{const k=yield w;m(u,!0,r.serialize(k))}catch(k){h(u,r.serialize(k))}})}function q(u){if(!a.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(d)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(d=!0,typeof u=="function")a.default.subscribeToMasterMessages(f=>{_(f)&&!f.method&&M(f.uid,u,f.args.map(r.deserialize))}),S();else if(typeof u=="object"&&u){a.default.subscribeToMasterMessages(v=>{_(v)&&v.method&&M(v.uid,u[v.method],v.args.map(r.deserialize))});const f=Object.keys(u).filter(v=>typeof u[v]=="function");y(f)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${u}`);a.default.subscribeToMasterMessages(f=>{if(g(f)){const v=f.uid,w=p.get(v);w&&(w.unsubscribe(),p.delete(v))}})}e.expose=q,typeof self<"u"&&typeof self.addEventListener=="function"&&a.default.isWorkerRuntime()&&(self.addEventListener("error",u=>{setTimeout(()=>b(u.error||u),250)}),self.addEventListener("unhandledrejection",u=>{const f=u.reason;f&&typeof f.message=="string"&&setTimeout(()=>b(f),250)})),typeof process<"u"&&typeof process.on=="function"&&a.default.isWorkerRuntime()&&(process.on("uncaughtException",u=>{setTimeout(()=>b(u),250)}),process.on("unhandledRejection",u=>{u&&typeof u.message=="string"&&setTimeout(()=>b(u),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(e){var n;let s=1;for(const t of e){s+=2;const r=((n=t.subscriptIndices)==null?void 0:n.length)||0;s+=r}return s}function encodeVarIndices(e,n){let s=0;n[s++]=e.length;for(const t of e){n[s++]=t.varIndex;const r=t.subscriptIndices,i=r?.length||0;n[s++]=i;for(let o=0;o<i;o++)n[s++]=r[o]}}function getEncodedLookupBufferLengths(e){var n,s;let t=1,r=0;for(const i of e){const o=i.varRef.varSpec;if(o===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");t+=2;const a=((n=o.subscriptIndices)==null?void 0:n.length)||0;t+=a,t+=2,r+=((s=i.points)==null?void 0:s.length)||0}return{lookupIndicesLength:t,lookupsLength:r}}function encodeLookups(e,n,s){let t=0;n[t++]=e.length;let r=0;for(const i of e){const o=i.varRef.varSpec;n[t++]=o.varIndex;const a=o.subscriptIndices,c=a?.length||0;n[t++]=c;for(let l=0;l<c;l++)n[t++]=a[l];i.points!==void 0?(n[t++]=r,n[t++]=i.points.length,s?.set(i.points,r),r+=i.points.length):(n[t++]=-1,n[t++]=0)}}function decodeLookups(e,n){const s=[];let t=0;const r=e[t++];for(let i=0;i<r;i++){const o=e[t++],a=e[t++],c=a>0?Array(a):void 0;for(let _=0;_<a;_++)c[_]=e[t++];const l=e[t++],d=e[t++],p={varIndex:o,subscriptIndices:c};let g;l>=0?n?g=n.slice(l,l+d):g=new Float64Array(0):g=void 0,s.push({varRef:{varSpec:p},points:g})}return s}function resolveVarRef(e,n,s){if(!n.varSpec){if(e===void 0)throw new Error(`Unable to resolve ${s} variable references by name or identifier when model listing is unavailable`);if(n.varId){const t=e?.getSpecForVarId(n.varId);if(t)n.varSpec=t;else throw new Error(`Failed to resolve ${s} variable reference for varId=${n.varId}`)}else{const t=e?.getSpecForVarName(n.varName);if(t)n.varSpec=t;else throw new Error(`Failed to resolve ${s} variable reference for varName=\'${n.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(e,n,s){this.view=s>0?new Int32Array(e,n,s):void 0,this.offsetInBytes=n,this.lengthInElements=s}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(e,n,s){this.view=s>0?new Float64Array(e,n,s):void 0,this.offsetInBytes=n,this.lengthInElements=s}},BufferedRunModelParams=class{constructor(e){this.listing=e,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(e,n){this.inputs.lengthInElements!==0&&((e===void 0||e.length<this.inputs.lengthInElements)&&(e=n(this.inputs.lengthInElements)),e.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(e,n){this.outputIndices.lengthInElements!==0&&((e===void 0||e.length<this.outputIndices.lengthInElements)&&(e=n(this.outputIndices.lengthInElements)),e.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(e){this.outputs.view!==void 0&&(e.length>this.outputs.view.length?this.outputs.view.set(e.subarray(0,this.outputs.view.length)):this.outputs.view.set(e))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(e){this.extras.view[0]=e}finalizeOutputs(e){this.outputs.view&&e.updateFromBuffer(this.outputs.view,e.seriesLength),e.runTimeInMillis=this.getElapsedTime()}updateFromParams(e,n,s){const t=e.length,r=n.varIds.length*n.seriesLength;let i;const o=n.varSpecs;o!==void 0&&o.length>0?i=getEncodedVarIndicesLength(o):i=0;let a,c;if(s?.lookups!==void 0&&s.lookups.length>0){for(const M of s.lookups)resolveVarRef(this.listing,M.varRef,"lookup");const b=getEncodedLookupBufferLengths(s.lookups);a=b.lookupsLength,c=b.lookupIndicesLength}else a=0,c=0;let l=0;function d(b,M){const q=l,u=b==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,f=Math.round(M*u),v=Math.ceil(f/8)*8;return l+=v,q}const p=d("int32",headerLengthInElements),g=d("float64",extrasLengthInElements),_=d("float64",t),I=d("float64",r),T=d("int32",i),E=d("float64",a),S=d("int32",c),y=l;if(this.encoded===void 0||this.encoded.byteLength<y){const b=Math.ceil(y*1.2);this.encoded=new ArrayBuffer(b),this.header.update(this.encoded,p,headerLengthInElements)}const h=this.header.view;let m=0;h[m++]=g,h[m++]=extrasLengthInElements,h[m++]=_,h[m++]=t,h[m++]=I,h[m++]=r,h[m++]=T,h[m++]=i,h[m++]=E,h[m++]=a,h[m++]=S,h[m++]=c,this.inputs.update(this.encoded,_,t),this.extras.update(this.encoded,g,extrasLengthInElements),this.outputs.update(this.encoded,I,r),this.outputIndices.update(this.encoded,T,i),this.lookups.update(this.encoded,E,a),this.lookupIndices.update(this.encoded,S,c);const L=this.inputs.view;for(let b=0;b<e.length;b++){const M=e[b];typeof M=="number"?L[b]=M:L[b]=M.get()}this.outputIndices.view&&encodeVarIndices(o,this.outputIndices.view),c>0&&encodeLookups(s.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(e){const n=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(e.byteLength<n)throw new Error("Buffer must be long enough to contain header section");this.encoded=e,this.header.update(this.encoded,0,headerLengthInElements);const t=this.header.view;let r=0;const i=t[r++],o=t[r++],a=t[r++],c=t[r++],l=t[r++],d=t[r++],p=t[r++],g=t[r++],_=t[r++],I=t[r++],T=t[r++],E=t[r++],S=o*Float64Array.BYTES_PER_ELEMENT,y=c*Float64Array.BYTES_PER_ELEMENT,h=d*Float64Array.BYTES_PER_ELEMENT,m=g*Int32Array.BYTES_PER_ELEMENT,L=I*Float64Array.BYTES_PER_ELEMENT,b=E*Int32Array.BYTES_PER_ELEMENT,M=n+S+y+h+m+L+b;if(e.byteLength<M)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,i,o),this.inputs.update(this.encoded,a,c),this.outputs.update(this.encoded,l,d),this.outputIndices.update(this.encoded,p,g),this.lookups.update(this.encoded,_,I),this.lookupIndices.update(this.encoded,T,E)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(e,n){if(n&&n.length<e*2)throw new Error(`Lookup data array length must be >= 2*size (length=${n.length} size=${e}`);this.originalData=n,this.originalSize=e,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(e,n){if(n){if(n.length<e*2)throw new Error(`Lookup data array length must be >= 2*size (length=${n.length} size=${e}`);const s=e*2;if((this.dynamicData===void 0||s>this.dynamicData.length)&&(this.dynamicData=new Float64Array(s)),this.dynamicSize=e,e>0){const t=n.subarray(0,s);this.dynamicData.set(t)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(e,n){return this.getValue(e,!1,n)}getValueForY(e){if(this.invertedData===void 0){const n=this.activeSize*2,s=this.activeData,t=Array(n);for(let r=0;r<n;r+=2)t[r]=s[r+1],t[r+1]=s[r];this.invertedData=t}return this.getValue(e,!0,"interpolate")}getValue(e,n,s){if(this.activeSize===0)return _NA_;const t=n?this.invertedData:this.activeData,r=this.activeSize*2,i=!n;let o;i&&e>=this.lastInput?o=this.lastHitIndex:o=0;for(let a=o;a<r;a+=2){const c=t[a];if(c>=e){if(i&&(this.lastInput=e,this.lastHitIndex=a),a===0||c===e)return t[a+1];switch(s){default:case"interpolate":{const l=t[a-2],d=t[a-1],p=t[a+1],g=c-l,_=p-d;return d+_/g*(e-l)}case"forward":return t[a+1];case"backward":return t[a-1]}}}return i&&(this.lastInput=e,this.lastHitIndex=r),t[r-1]}getValueForGameTime(e,n){if(this.activeSize<=0)return n;const s=this.activeData[0];return e<s?n:this.getValue(e,!1,"backward")}getValueBetweenTimes(e,n){if(this.activeSize===0)return _NA_;const s=this.activeData,t=this.activeSize*2;switch(n){case"forward":{e=Math.floor(e);for(let r=0;r<t;r+=2)if(s[r]>=e)return s[r+1];return s[t-1]}case"backward":{e=Math.floor(e);for(let r=2;r<t;r+=2)if(s[r]>=e)return s[r-1];return t>=4?s[t-3]:s[1]}case"interpolate":default:{if(e-Math.floor(e)>0){let r=`GET DATA BETWEEN TIMES was called with an input value (${e}) that has a fractional part. `;throw r+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",r+="results that may differ from those produced by SDEverywhere.",new Error(r)}for(let r=2;r<t;r+=2){const i=s[r];if(i>=e){const o=s[r-2],a=s[r-1],c=s[r+1],l=i-o,d=c-a;return a+d/l*(e-o)}}return s[t-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let e;const n=new Map,s=new Map;return{setContext(t){e=t},ABS(t){return Math.abs(t)},ARCCOS(t){return Math.acos(t)},ARCSIN(t){return Math.asin(t)},ARCTAN(t){return Math.atan(t)},COS(t){return Math.cos(t)},EXP(t){return Math.exp(t)},GAME(t,r){return t?t.getValueForGameTime(e.currentTime,r):r},INTEG(t,r){return t+r*e.timeStep},INTEGER(t){return Math.trunc(t)},LN(t){return Math.log(t)},MAX(t,r){return Math.max(t,r)},MIN(t,r){return Math.min(t,r)},MODULO(t,r){return t%r},POW(t,r){return Math.pow(t,r)},POWER(t,r){return Math.pow(t,r)},PULSE(t,r){return pulse(e,t,r)},PULSE_TRAIN(t,r,i,o){const a=Math.floor((o-t)/i);for(let c=0;c<=a;c++)if(e.currentTime<=o&&pulse(e,t+c*i,r))return 1;return 0},QUANTUM(t,r){return r<=0?t:r*Math.trunc(t/r)},RAMP(t,r,i){return e.currentTime>r?e.currentTime<i||r>i?t*(e.currentTime-r):t*(i-r):0},SIN(t){return Math.sin(t)},SQRT(t){return Math.sqrt(t)},STEP(t,r){return e.currentTime+e.timeStep/2>r?t:0},TAN(t){return Math.tan(t)},VECTOR_SORT_ORDER(t,r,i){if(r>t.length)throw new Error(`VECTOR SORT ORDER input vector length (${t.length}) must be >= size (${r})`);let o=s.get(r);if(o===void 0){o=Array(r);for(let l=0;l<r;l++)o[l]={x:0,ind:0};s.set(r,o)}let a=n.get(r);a===void 0&&(a=Array(r),n.set(r,a));for(let l=0;l<r;l++)o[l].x=t[l],o[l].ind=l;const c=i>0?1:-1;o.sort((l,d)=>{let p;return l.x<d.x?p=-1:l.x>d.x?p=1:p=0,p*c});for(let l=0;l<r;l++)a[l]=o[l].ind;return a},XIDZ(t,r,i){return Math.abs(r)<EPSILON?i:t/r},ZIDZ(t,r){return Math.abs(r)<EPSILON?0:t/r},createLookup(t,r){return new JsModelLookup(t,r)},LOOKUP(t,r){return t?t.getValueForX(r,"interpolate"):_NA_},LOOKUP_FORWARD(t,r){return t?t.getValueForX(r,"forward"):_NA_},LOOKUP_BACKWARD(t,r){return t?t.getValueForX(r,"backward"):_NA_},LOOKUP_INVERT(t,r){return t?t.getValueForY(r):_NA_},WITH_LOOKUP(t,r){return r?r.getValueForX(t,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(t,r,i){let o;return i>=1?o="forward":i<=-1?o="backward":o="interpolate",t?t.getValueBetweenTimes(r,o):_NA_}}}function pulse(e,n,s){const t=e.currentTime+e.timeStep/2;return s===0&&(s=e.timeStep),t>n&&t<n+s?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(e){if(isWeb)return self.performance.now()-e;{const n=process.hrtime(e);return(n[0]*1e9+n[1])/1e6}}var BaseRunnableModel=class{constructor(e){this.startTime=e.startTime,this.endTime=e.endTime,this.saveFreq=e.saveFreq,this.numSavePoints=e.numSavePoints,this.outputVarIds=e.outputVarIds,this.modelListing=e.modelListing,this.onRunModel=e.onRunModel}runModel(e){var n;let s=e.getInputs();s===void 0&&(e.copyInputs(this.inputs,c=>(this.inputs=new Float64Array(c),this.inputs)),s=this.inputs);let t=e.getOutputIndices();t===void 0&&e.getOutputIndicesLength()>0&&(e.copyOutputIndices(this.outputIndices,c=>(this.outputIndices=new Int32Array(c),this.outputIndices)),t=this.outputIndices);const r=e.getOutputsLength();(this.outputs===void 0||this.outputs.length<r)&&(this.outputs=new Float64Array(r));const i=this.outputs,o=perfNow();(n=this.onRunModel)==null||n.call(this,s,i,{outputIndices:t,lookups:e.getLookups()});const a=perfElapsed(o);e.storeOutputs(i),e.storeElapsedTime(a)}terminate(){}};function initJsModel(e){let n=e.getModelFunctions();n===void 0&&(n=getJsModelFunctions(),e.setModelFunctions(n));const s=e.getInitialTime(),t=e.getFinalTime(),r=e.getTimeStep(),i=e.getSaveFreq(),o=Math.round((t-s)/i)+1;return new BaseRunnableModel({startTime:s,endTime:t,saveFreq:i,numSavePoints:o,outputVarIds:e.outputVarIds,modelListing:e.modelListing,onRunModel:(a,c,l)=>{runJsModel(e,s,t,r,i,o,a,c,l?.outputIndices,l?.lookups)}})}function runJsModel(e,n,s,t,r,i,o,a,c,l,d){let p=n;e.setTime(p);const g={timeStep:t,currentTime:p};if(e.getModelFunctions().setContext(g),e.initConstants(),l!==void 0)for(const y of l)e.setLookup(y.varRef.varSpec,y.points);o?.length>0&&e.setInputs(y=>o[y]),e.initLevels();const _=Math.round((s-n)/t),I=s;let T=0,E=0,S=0;for(;T<=_;){if(e.evalAux(),p%r<1e-6){S=0;const y=h=>{const m=S*i+E;a[m]=p<=I?h:void 0,S++};if(c!==void 0){let h=0;const m=c[h++];for(let L=0;L<m;L++){const b=c[h++],M=c[h++];let q;M>0&&(q=c.subarray(h,h+M),h+=M);const u={varIndex:b,subscriptIndices:q};e.storeOutput(u,y)}}else e.storeOutputs(y);E++}if(T===_)break;e.evalLevels(),p+=t,e.setTime(p),g.currentTime=p,T++}}var WasmBuffer=class{constructor(e,n,s,t){this.wasmModule=e,this.numElements=n,this.byteOffset=s,this.heapArray=t}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var e,n;this.heapArray&&((n=(e=this.wasmModule)._free)==null||n.call(e,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(e,n){const t=n*4,r=e._malloc(t),i=r/4,o=e.HEAP32.subarray(i,i+n);return new WasmBuffer(e,n,r,o)}function createFloat64WasmBuffer(e,n){const t=n*8,r=e._malloc(t),i=r/8,o=e.HEAPF64.subarray(i,i+n);return new WasmBuffer(e,n,r,o)}var WasmModel=class{constructor(e){this.wasmModule=e;function n(s){return e.cwrap(s,"number",[])()}this.startTime=n("getInitialTime"),this.endTime=n("getFinalTime"),this.saveFreq=n("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=e.outputVarIds,this.modelListing=e.modelListing,this.wasmSetLookup=e.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=e.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(e){var n,s,t,r,i,o,a;const c=e.getLookups();if(c!==void 0)for(const _ of c){const I=_.varRef.varSpec,T=((n=I.subscriptIndices)==null?void 0:n.length)||0;let E;T>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<T)&&((s=this.lookupSubIndicesBuffer)==null||s.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,T)),this.lookupSubIndicesBuffer.getArrayView().set(I.subscriptIndices),E=this.lookupSubIndicesBuffer.getAddress()):E=0;let S,y;if(_.points){const m=_.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<m)&&((t=this.lookupDataBuffer)==null||t.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,m)),this.lookupDataBuffer.getArrayView().set(_.points),S=this.lookupDataBuffer.getAddress(),y=m/2}else S=0,y=0;const h=I.varIndex;this.wasmSetLookup(h,E,S,y)}e.copyInputs((r=this.inputsBuffer)==null?void 0:r.getArrayView(),_=>{var I;return(I=this.inputsBuffer)==null||I.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,_),this.inputsBuffer.getArrayView()});let l;e.getOutputIndicesLength()>0?(e.copyOutputIndices((i=this.outputIndicesBuffer)==null?void 0:i.getArrayView(),_=>{var I;return(I=this.outputIndicesBuffer)==null||I.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,_),this.outputIndicesBuffer.getArrayView()}),l=this.outputIndicesBuffer):l=void 0;const d=e.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<d)&&((o=this.outputsBuffer)==null||o.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,d));const p=perfNow();this.wasmRunModel(((a=this.inputsBuffer)==null?void 0:a.getAddress())||0,this.outputsBuffer.getAddress(),l?.getAddress()||0);const g=perfElapsed(p);e.storeOutputs(this.outputsBuffer.getArrayView()),e.storeElapsedTime(g)}terminate(){var e,n,s;(e=this.inputsBuffer)==null||e.dispose(),this.inputsBuffer=void 0,(n=this.outputsBuffer)==null||n.dispose(),this.outputsBuffer=void 0,(s=this.outputIndicesBuffer)==null||s.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(e){return new WasmModel(e)}function createRunnableModel(e){switch(e.kind){case"js":return initJsModel(e);case"wasm":return initWasmModel(e);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const e=await initGeneratedModel();return runnableModel=createRunnableModel(e),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(e){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(e),runnableModel.runModel(params),Transfer(e)}};function exposeModelWorker(e){initGeneratedModel=e,expose(modelWorker)}let _average_duration_of_illness_d,_contact_rate_c,_final_time,_infection_rate,_infectious_population_i,_infectivity_i,_initial_contact_rate,_initial_time,_recovered_population_r,_recovery_rate,_saveper,_susceptible_population_s,_time_step,_total_population_p,_time;function setTime(e){_time=e}let controlParamsInitialized=!1;function initControlParamsIfNeeded(){if(!controlParamsInitialized){if(fns===void 0)throw new Error("Must call setModelFunctions() before running the model");if(initConstants(),_initial_time===void 0)throw new Error("INITIAL TIME must be defined as a constant value");if(_time_step===void 0)throw new Error("TIME STEP must be defined as a constant value");if(_final_time===void 0||_saveper===void 0){if(setTime(_initial_time),fns.setContext({timeStep:_time_step,currentTime:_time}),initLevels(),evalAux(),_final_time===void 0)throw new Error("FINAL TIME must be defined");if(_saveper===void 0)throw new Error("SAVEPER must be defined")}controlParamsInitialized=!0}}function getInitialTime(){return initControlParamsIfNeeded(),_initial_time}function getFinalTime(){return initControlParamsIfNeeded(),_final_time}function getTimeStep(){return initControlParamsIfNeeded(),_time_step}function getSaveFreq(){return initControlParamsIfNeeded(),_saveper}let fns;function getModelFunctions(){return fns}function setModelFunctions(e){fns=e}function initConstants0(){_average_duration_of_illness_d=2,_final_time=200,_initial_time=0,_infectivity_i=.25,_initial_contact_rate=2.5,_saveper=1,_time_step=.0625,_total_population_p=1e4}function initConstants(){initConstants0()}function initLevels0(){_recovered_population_r=0,_infectious_population_i=1,_susceptible_population_s=_total_population_p-_infectious_population_i-_recovered_population_r}function initLevels(){initLevels0()}function evalAux0(){_recovery_rate=_infectious_population_i/_average_duration_of_illness_d,_contact_rate_c=_initial_contact_rate,_infection_rate=_contact_rate_c*_infectivity_i*_susceptible_population_s*_infectious_population_i/_total_population_p}function evalAux(){evalAux0()}function evalLevels0(){_infectious_population_i=fns.INTEG(_infectious_population_i,_infection_rate-_recovery_rate),_recovered_population_r=fns.INTEG(_recovered_population_r,_recovery_rate),_susceptible_population_s=fns.INTEG(_susceptible_population_s,-_infection_rate)}function evalLevels(){evalLevels0()}function setInputs(e){_initial_contact_rate=e(0),_infectivity_i=e(1),_average_duration_of_illness_d=e(2)}function setLookup(e,n){throw new Error("The setLookup function was not enabled for the generated model. Set the customLookups property in the spec/config file to allow for overriding lookups at runtime.")}const outputVarIds=["_infection_rate","_infectious_population_i","_recovered_population_r","_recovery_rate","_susceptible_population_s"],outputVarNames=["Infection Rate","Infectious Population I","Recovered Population R","Recovery Rate","Susceptible Population S"];function storeOutputs(e){e(_infection_rate),e(_infectious_population_i),e(_recovered_population_r),e(_recovery_rate),e(_susceptible_population_s)}function storeOutput(e,n){throw new Error("The storeOutput function was not enabled for the generated model. Set the customOutputs property in the spec/config file to allow for capturing arbitrary variables at runtime.")}const modelListing=void 0;async function loadGeneratedModel(){return{kind:"js",outputVarIds,outputVarNames,modelListing,getInitialTime,getFinalTime,getTimeStep,getSaveFreq,getModelFunctions,setModelFunctions,setTime,setInputs,setLookup,storeOutputs,storeOutput,initConstants,initLevels,evalAux,evalLevels}}exposeModelWorker(loadGeneratedModel)})();\n', VERSION = 1;
class BundleModel {
  /**
   * @param modelSpec The spec for the bundled model.
   * @param inputMap The model inputs.
   * @param modelRunner The model runner.
   */
  constructor(t, r, n) {
    this.modelSpec = t, this.inputMap = r, this.modelRunner = n, this.inputs = [...r.values()].map((s) => s.value), this.outputs = n.createOutputs();
  }
  // from CheckBundleModel interface
  async getDatasetsForScenario(t, r) {
    const n = /* @__PURE__ */ new Map();
    setInputsForScenario(this.inputMap, t), this.outputs = await this.modelRunner.runModel(this.inputs, this.outputs);
    const s = this.outputs.runTimeInMillis;
    for (const o of r) {
      const i = this.modelSpec.outputVars.get(o);
      if (i)
        if (i.sourceName === void 0) {
          const l = this.outputs.getSeriesForVar(i.varId);
          l && n.set(o, datasetFromPoints(l.points));
        } else
          console.error("Static data sources not yet handled in default model check bundle");
    }
    return {
      datasetMap: n,
      modelRunTime: s
    };
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
  const r = await spawnAsyncModelRunner({ source: modelWorkerJs });
  return new BundleModel(e, t, r);
}
function datasetFromPoints(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e)
    r.y !== void 0 && t.set(r.x, r.y);
  return t;
}
function createBundle() {
  const e = getInputVars(inputSpecs), t = getOutputVars(outputSpecs), r = {
    modelSizeInBytes,
    dataSizeInBytes,
    inputVars: e,
    outputVars: t,
    implVars: /* @__PURE__ */ new Map()
    // TODO: startTime and endTime are optional; the comparison graphs work OK if
    // they are undefined.  The main benefit of using these is to set a specific
    // range for the x-axis on the comparison graphs, so maybe we should find
    // another way to allow these to be defined.
    // startTime,
    // endTime
  };
  return {
    version: VERSION,
    modelSpec: r,
    initModel: () => initBundleModel(r, e)
  };
}
export {
  createBundle
};

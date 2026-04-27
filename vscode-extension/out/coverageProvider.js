"use strict";
/**
 * coverageProvider.ts
 *
 * Fetches endpoint coverage data from the Httrace API and caches it.
 * The cache is invalidated when a new fetch succeeds or when the configuration
 * changes. All fetch errors are reported back to the caller — the extension
 * decides whether to surface them as UI messages.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverageProvider = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_1 = require("url");
class CoverageProvider {
    constructor() {
        this._cache = null;
    }
    /**
     * Fetch coverage from the Httrace API.
     *
     * @param apiUrl  Base URL of the API, e.g. "https://api.httrace.com"
     * @param apiKey  Httrace API key (ht_…)
     * @param service Service name to query coverage for
     * @returns Resolved CoverageResult on success
     * @throws Error with a human-readable message on network or API failure
     */
    async fetchCoverage(apiUrl, apiKey, service) {
        const raw = await this._get(apiUrl, "/v1/coverage", { service }, apiKey);
        const result = {
            service: raw.service,
            endpoints: raw.endpoints,
            total_captures: raw.total_captures,
            fetchedAt: new Date(),
        };
        this._cache = result;
        return result;
    }
    /** Return the last successfully fetched result without making a network call. */
    get cached() {
        return this._cache;
    }
    /** Discard any cached data (e.g. after a config change). */
    invalidate() {
        this._cache = null;
    }
    // ── Private helpers ────────────────────────────────────────────────────────
    _get(baseUrl, pathname, query, apiKey) {
        return new Promise((resolve, reject) => {
            let url;
            try {
                url = new url_1.URL(pathname, baseUrl);
            }
            catch {
                reject(new Error(`Invalid Httrace API URL: ${baseUrl}`));
                return;
            }
            Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
            const isHttps = url.protocol === "https:";
            const transport = isHttps ? https : http;
            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: "GET",
                headers: {
                    "x-api-key": apiKey,
                    "Accept": "application/json",
                    "User-Agent": "httrace-vscode/0.1.0",
                },
            };
            const req = transport.request(options, (res) => {
                let body = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => { body += chunk; });
                res.on("end", () => {
                    if (!res.statusCode || res.statusCode >= 400) {
                        reject(new Error(`Httrace API returned ${res.statusCode}: ${body.slice(0, 200)}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(body));
                    }
                    catch {
                        reject(new Error("Httrace API returned invalid JSON"));
                    }
                });
            });
            req.on("error", (err) => {
                reject(new Error(`Network error reaching Httrace API: ${err.message}`));
            });
            req.setTimeout(8000, () => {
                req.destroy();
                reject(new Error("Httrace API request timed out after 8 s"));
            });
            req.end();
        });
    }
}
exports.CoverageProvider = CoverageProvider;
//# sourceMappingURL=coverageProvider.js.map
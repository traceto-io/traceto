"use strict";
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
exports.HttptraceClient = void 0;
/**
 * Httrace API client — thin wrapper around Node.js https module.
 * No external dependencies, only Node built-ins.
 */
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_1 = require("url");
class HttptraceClient {
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    async request(method, path, params, body, timeoutMs = 30000) {
        const url = new url_1.URL(path, this.baseUrl.replace(/\/$/, '') + '/');
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                url.searchParams.set(k, v);
            }
        }
        const bodyStr = body ? JSON.stringify(body) : undefined;
        const options = {
            method,
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'httrace-vscode/0.2.0',
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr).toString() } : {}),
            },
            timeout: timeoutMs,
        };
        return new Promise((resolve, reject) => {
            const lib = url.protocol === 'https:' ? https : http;
            const req = lib.request(options, (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const raw = Buffer.concat(chunks).toString('utf-8');
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(`API error ${res.statusCode}: ${raw.slice(0, 200)}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(raw));
                    }
                    catch {
                        reject(new Error(`Invalid JSON response: ${raw.slice(0, 200)}`));
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
            if (bodyStr)
                req.write(bodyStr);
            req.end();
        });
    }
    async getCoverage(service) {
        return this.request('GET', '/v1/coverage', { service });
    }
    async getChanges(service) {
        return this.request('GET', '/v1/changes', { service });
    }
    async generateTests(service, format) {
        return this.request('POST', '/v1/generate-tests', { service, format }, undefined, 60000);
    }
    async replayTraffic(service, targetBaseUrl, limit = 50) {
        return this.request('POST', '/v1/replay', { service, target_base_url: targetBaseUrl, limit: String(limit) }, undefined, 120000);
    }
}
exports.HttptraceClient = HttptraceClient;
//# sourceMappingURL=api.js.map
"use strict";
/**
 * Httrace VS Code Extension — entry point.
 *
 * Commands registered:
 *   httrace.generateTests   — generate test files from captured traffic
 *   httrace.showDiff        — show API schema drift in the Output panel
 *   httrace.replayTraffic   — replay captures against a target URL
 *   httrace.showCoverage    — show coverage QuickPick + refresh tree view
 *   httrace.refreshCoverage — force a coverage refresh
 *   httrace.configure       — open Httrace settings
 *
 * Passive features:
 *   - Status bar item shows live endpoint + capture count
 *   - Coverage tree view in the Httrace activity bar panel
 *   - Inline "✓ N captures" decorations on route definitions
 *   - Background polling every N seconds (configurable)
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const coverageProvider_1 = require("./coverageProvider");
const coverage_tree_1 = require("./coverage-tree");
const generate_1 = require("./commands/generate");
const diff_1 = require("./commands/diff");
const replay_1 = require("./commands/replay");
const coverage_1 = require("./decorations/coverage");
const SUPPORTED_LANGS = new Set(["python", "javascript", "typescript", "go", "ruby"]);
// ── Module-level state ─────────────────────────────────────────────────────────
let legacyProvider;
let treeProvider;
let statusBarItem;
let pollTimer;
let lastEndpoints = [];
// ── Config helper ──────────────────────────────────────────────────────────────
function cfg() {
    const c = vscode.workspace.getConfiguration("httrace");
    return {
        apiKey: c.get("apiKey", "").trim(),
        apiUrl: c.get("apiUrl", "https://api.httrace.com"),
        serviceName: c.get("serviceName", "").trim(),
        pollInterval: c.get("pollIntervalSeconds", 60) * 1000,
        showInlineDecos: c.get("showInlineDecorations", true),
    };
}
// ── Coverage refresh ───────────────────────────────────────────────────────────
async function refreshCoverage(showNotification = false) {
    const { apiKey, apiUrl, serviceName } = cfg();
    if (!apiKey || !serviceName) {
        statusBarItem.text = "$(beaker) Httrace: not configured";
        statusBarItem.tooltip = "Click to open Httrace settings";
        statusBarItem.command = "httrace.configure";
        statusBarItem.show();
        return;
    }
    try {
        statusBarItem.text = "$(sync~spin) Httrace";
        // Use legacy provider for coverage (tested, reliable)
        const result = await legacyProvider.fetchCoverage(apiUrl, apiKey, serviceName);
        lastEndpoints = result.endpoints;
        treeProvider.update(serviceName, lastEndpoints);
        const epCount = lastEndpoints.length;
        const capCount = result.total_captures;
        statusBarItem.text = `$(beaker) ${epCount} endpoints · ${capCount} captures`;
        statusBarItem.tooltip = `Httrace: ${serviceName} — ${epCount} endpoints, ${capCount} captures\nLast refresh: ${new Date().toLocaleTimeString()}`;
        statusBarItem.command = "httrace.showCoverage";
        statusBarItem.show();
        // Apply inline decorations to the active editor
        const { showInlineDecos } = cfg();
        const editor = vscode.window.activeTextEditor;
        if (editor && showInlineDecos && SUPPORTED_LANGS.has(editor.document.languageId)) {
            (0, coverage_1.applyDecorations)(editor, lastEndpoints);
        }
        if (showNotification) {
            vscode.window.showInformationMessage(`Httrace: ${epCount} endpoint${epCount !== 1 ? "s" : ""} for ${serviceName} (${capCount} captures)`);
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        statusBarItem.text = "$(warning) Httrace";
        statusBarItem.tooltip = `Error: ${msg}`;
        statusBarItem.show();
        if (showNotification) {
            vscode.window.showErrorMessage(`Httrace: coverage fetch failed — ${msg}`);
        }
    }
}
// ── Coverage QuickPick ─────────────────────────────────────────────────────────
async function showCoverageQuickPick() {
    const { apiKey, apiUrl, serviceName } = cfg();
    if (!apiKey || !serviceName) {
        const action = await vscode.window.showWarningMessage("Httrace: configure your API key and service name first.", "Open Settings");
        if (action === "Open Settings") {
            vscode.commands.executeCommand("httrace.configure");
        }
        return;
    }
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Httrace: fetching coverage…", cancellable: false }, async () => {
        try {
            const result = await legacyProvider.fetchCoverage(apiUrl, apiKey, serviceName);
            lastEndpoints = result.endpoints;
            treeProvider.update(serviceName, lastEndpoints);
            if (!result.endpoints.length) {
                vscode.window.showInformationMessage("Httrace: no endpoints captured yet.");
                return;
            }
            const items = result.endpoints
                .sort((a, b) => b.captures - a.captures)
                .map(ep => ({
                label: `$(${ep.captures > 0 ? "pass" : "circle-outline"})  ${ep.method} ${ep.path}`,
                description: `${ep.captures} capture${ep.captures !== 1 ? "s" : ""}`,
                detail: `Status codes: ${ep.statuses.sort((x, y) => x - y).join(", ")}`,
            }));
            await vscode.window.showQuickPick(items, {
                title: `Httrace Coverage — ${serviceName} (${result.total_captures} total)`,
                placeHolder: "Search endpoints…",
                matchOnDescription: true,
                matchOnDetail: true,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Httrace: ${msg}`);
        }
    });
}
// ── Polling ────────────────────────────────────────────────────────────────────
function restartPolling(context) {
    if (pollTimer !== undefined)
        clearInterval(pollTimer);
    const { apiKey, pollInterval } = cfg();
    if (!apiKey)
        return;
    void refreshCoverage(false);
    pollTimer = setInterval(() => {
        const editor = vscode.window.activeTextEditor;
        if (editor && SUPPORTED_LANGS.has(editor.document.languageId)) {
            void refreshCoverage(false);
        }
    }, pollInterval);
}
// ── Activation ─────────────────────────────────────────────────────────────────
function activate(context) {
    legacyProvider = new coverageProvider_1.CoverageProvider();
    treeProvider = new coverage_tree_1.CoverageTreeProvider();
    // ── Tree view ──────────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.window.createTreeView("httrace.coverageView", {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
    }));
    // ── Status bar ─────────────────────────────────────────────────────────────
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(beaker) Httrace";
    statusBarItem.command = "httrace.showCoverage";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // ── Commands ───────────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand("httrace.generateTests", generate_1.generateTests), vscode.commands.registerCommand("httrace.showDiff", diff_1.showDiff), vscode.commands.registerCommand("httrace.replayTraffic", replay_1.replayTraffic), vscode.commands.registerCommand("httrace.showCoverage", showCoverageQuickPick), vscode.commands.registerCommand("httrace.refreshCoverage", () => refreshCoverage(true)), vscode.commands.registerCommand("httrace.configure", () => vscode.commands.executeCommand("workbench.action.openSettings", "httrace")));
    // ── Editor events ──────────────────────────────────────────────────────────
    context.subscriptions.push(
    // Re-apply decorations when switching tabs
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor || !cfg().showInlineDecos)
            return;
        if (SUPPORTED_LANGS.has(editor.document.languageId) && lastEndpoints.length) {
            (0, coverage_1.applyDecorations)(editor, lastEndpoints);
        }
    }), 
    // Re-apply after a save (code may have changed)
    vscode.workspace.onDidSaveTextDocument(doc => {
        const editor = vscode.window.activeTextEditor;
        if (editor?.document === doc && cfg().showInlineDecos && lastEndpoints.length) {
            (0, coverage_1.applyDecorations)(editor, lastEndpoints);
        }
    }), 
    // Re-apply when visible editors change (split panes, etc.)
    vscode.window.onDidChangeVisibleTextEditors(editors => {
        if (!cfg().showInlineDecos || !lastEndpoints.length)
            return;
        for (const editor of editors) {
            if (SUPPORTED_LANGS.has(editor.document.languageId)) {
                (0, coverage_1.applyDecorations)(editor, lastEndpoints);
            }
        }
    }), 
    // Restart polling when settings change
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration("httrace")) {
            legacyProvider.invalidate();
            restartPolling(context);
        }
    }));
    restartPolling(context);
}
function deactivate() {
    if (pollTimer !== undefined) {
        clearInterval(pollTimer);
        pollTimer = undefined;
    }
    // Clear decorations from all visible editors
    for (const editor of vscode.window.visibleTextEditors) {
        (0, coverage_1.clearDecorations)(editor);
    }
}
//# sourceMappingURL=extension.js.map
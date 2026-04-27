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
exports.replayTraffic = replayTraffic;
/**
 * Httrace: Replay Traffic
 *
 * Prompts for a target URL, calls POST /v1/replay, and shows results
 * in a VS Code output channel with a summary notification.
 */
const vscode = __importStar(require("vscode"));
const api_1 = require("../api");
let _outputChannel;
function getChannel() {
    if (!_outputChannel) {
        _outputChannel = vscode.window.createOutputChannel('Httrace: Replay');
    }
    return _outputChannel;
}
async function replayTraffic() {
    const config = vscode.workspace.getConfiguration('httrace');
    const apiKey = config.get('apiKey', '').trim();
    const apiUrl = config.get('apiUrl', 'https://api.httrace.com');
    const service = config.get('serviceName', '').trim();
    if (!apiKey || !service) {
        const action = await vscode.window.showWarningMessage('Httrace: API key or service name not configured.', 'Open Settings');
        if (action === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'httrace');
        }
        return;
    }
    const targetUrl = await vscode.window.showInputBox({
        prompt: 'Target base URL to replay traffic against',
        placeHolder: 'https://staging.myapp.com',
        validateInput: (v) => {
            if (!v.startsWith('http://') && !v.startsWith('https://')) {
                return 'URL must start with http:// or https://';
            }
            return undefined;
        },
    });
    if (!targetUrl)
        return;
    const limitStr = await vscode.window.showInputBox({
        prompt: 'Number of recent captures to replay (1–200)',
        value: '50',
        validateInput: (v) => {
            const n = parseInt(v);
            if (isNaN(n) || n < 1 || n > 200)
                return 'Enter a number between 1 and 200';
            return undefined;
        },
    });
    const limit = parseInt(limitStr || '50');
    const ch = getChannel();
    ch.clear();
    ch.show(true);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Httrace: Replaying ${limit} captures for ${service} → ${targetUrl}…`,
        cancellable: false,
    }, async () => {
        try {
            const client = new api_1.HttptraceClient(apiKey, apiUrl);
            const data = await client.replayTraffic(service, targetUrl, limit);
            const { total, passed, failed, duration_ms, differences } = data;
            ch.appendLine(`Httrace Replay — ${service}`);
            ch.appendLine(`Target: ${targetUrl}`);
            ch.appendLine(`${'─'.repeat(60)}`);
            ch.appendLine(`Replayed: ${new Date().toLocaleString()}`);
            ch.appendLine('');
            if (!total) {
                ch.appendLine(data.message || 'No captures to replay.');
                return;
            }
            const passSymbol = failed === 0 ? '✓' : '✗';
            ch.appendLine(`${passSymbol}  ${passed}/${total} passed  (${failed} failed, ${duration_ms}ms total)`);
            ch.appendLine('');
            if (differences.length) {
                ch.appendLine(`Differences (${differences.length}):`);
                ch.appendLine('');
                for (const d of differences) {
                    const statusInfo = d.status_match
                        ? `${d.replay_status}`
                        : `${d.original_status} → ${d.replay_status ?? '—'} ✗`;
                    ch.appendLine(`  ${d.method.padEnd(7)} ${d.path}`);
                    ch.appendLine(`           Status: ${statusInfo}`);
                    if (d.body_diff)
                        ch.appendLine(`           Body:   ${d.body_diff}`);
                    if (d.error)
                        ch.appendLine(`           Error:  ${d.error}`);
                    ch.appendLine('');
                }
            }
            ch.appendLine(`${'─'.repeat(60)}`);
            ch.appendLine(`${passed}/${total} requests matched.`);
            if (failed === 0) {
                vscode.window.showInformationMessage(`✓ Httrace Replay: All ${total} requests matched ${targetUrl}`);
            }
            else {
                vscode.window.showWarningMessage(`Httrace Replay: ${failed}/${total} differences against ${targetUrl}. See Output panel.`);
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            ch.appendLine(`✗  Error: ${msg}`);
            vscode.window.showErrorMessage(`Httrace: Replay failed — ${msg}`);
        }
    });
}
//# sourceMappingURL=replay.js.map
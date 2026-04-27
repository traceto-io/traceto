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
exports.generateTests = generateTests;
/**
 * Httrace: Generate Integration Tests
 *
 * Calls POST /v1/generate-tests, writes files to the configured output
 * directory inside the workspace, and opens the generated files.
 */
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const api_1 = require("../api");
async function generateTests() {
    const config = vscode.workspace.getConfiguration('httrace');
    const apiKey = config.get('apiKey', '').trim();
    const apiUrl = config.get('apiUrl', 'https://api.httrace.com');
    const service = config.get('serviceName', '').trim();
    const format = config.get('testFormat', 'pytest');
    const outputDir = config.get('outputDirectory', 'tests/integration');
    if (!apiKey) {
        const action = await vscode.window.showWarningMessage('Httrace: API key not configured.', 'Open Settings');
        if (action === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'httrace.apiKey');
        }
        return;
    }
    if (!service) {
        const entered = await vscode.window.showInputBox({
            prompt: 'Enter the Httrace service name',
            placeHolder: 'my-api',
        });
        if (!entered)
            return;
        await config.update('serviceName', entered, vscode.ConfigurationTarget.Workspace);
    }
    const svcName = service || config.get('serviceName', '');
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Httrace: Generating ${format} tests for ${svcName}…`,
        cancellable: false,
    }, async () => {
        try {
            const client = new api_1.HttptraceClient(apiKey, apiUrl);
            const data = await client.generateTests(svcName, format);
            if (!data.generated) {
                vscode.window.showWarningMessage(`Httrace: No captures found for service '${svcName}'. ` +
                    'Make sure the middleware is installed and receiving traffic.');
                return;
            }
            // Write files to workspace
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                vscode.window.showErrorMessage('Httrace: No workspace folder open.');
                return;
            }
            const outDir = path.join(workspaceRoot, outputDir);
            fs.mkdirSync(outDir, { recursive: true });
            const openFiles = [];
            for (const fileInfo of data.files) {
                const filename = path.basename(fileInfo.file);
                const code = data.code[fileInfo.file] || '';
                const filePath = path.join(outDir, filename);
                fs.writeFileSync(filePath, code, 'utf-8');
                openFiles.push(filePath);
            }
            // Open the first generated file
            if (openFiles.length > 0) {
                const doc = await vscode.workspace.openTextDocument(openFiles[0]);
                await vscode.window.showTextDocument(doc);
            }
            const qualifier = data.lang ? ` (${data.lang})` : '';
            vscode.window.showInformationMessage(`✓ Httrace: ${data.generated} test file${data.generated !== 1 ? 's' : ''} generated${qualifier} → ${outputDir}/`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Httrace: Generate failed — ${msg}`);
        }
    });
}
//# sourceMappingURL=generate.js.map
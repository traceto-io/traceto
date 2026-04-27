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
exports.CoverageTreeItem = exports.CoverageTreeProvider = void 0;
/**
 * Tree data provider for the Httrace Coverage sidebar view.
 * Shows endpoints grouped by method with capture counts.
 */
const vscode = __importStar(require("vscode"));
class CoverageTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._endpoints = [];
        this._service = '';
    }
    update(service, endpoints) {
        this._service = service;
        this._endpoints = endpoints;
        this._onDidChangeTreeData.fire();
    }
    clear() {
        this._endpoints = [];
        this._service = '';
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root: group by METHOD
            if (!this._endpoints.length) {
                return [new CoverageTreeItem('No coverage data — configure your API key', 'info', vscode.TreeItemCollapsibleState.None)];
            }
            const methods = [...new Set(this._endpoints.map(e => e.method))].sort();
            return methods.map(m => {
                const eps = this._endpoints.filter(e => e.method === m);
                const total = eps.reduce((s, e) => s + e.captures, 0);
                const item = new CoverageTreeItem(m, 'method', vscode.TreeItemCollapsibleState.Expanded);
                item.description = `${eps.length} endpoint${eps.length !== 1 ? 's' : ''} · ${total} captures`;
                item.methodGroup = m;
                return item;
            });
        }
        if (element.methodGroup) {
            return this._endpoints
                .filter(e => e.method === element.methodGroup)
                .sort((a, b) => a.path.localeCompare(b.path))
                .map(ep => {
                const label = ep.path;
                const item = new CoverageTreeItem(label, ep.has_tests ? 'endpoint-tested' : 'endpoint-untested', vscode.TreeItemCollapsibleState.None);
                item.description = `${ep.captures} captures · ${(ep.statuses || []).join(', ')}`;
                item.tooltip = `${ep.method} ${ep.path}\n${ep.captures} captures\n${ep.has_tests ? '✓ tests generated' : '○ no tests yet'}`;
                item.iconPath = new vscode.ThemeIcon(ep.has_tests ? 'pass' : 'circle-outline', ep.has_tests
                    ? new vscode.ThemeColor('testing.iconPassed')
                    : new vscode.ThemeColor('disabledForeground'));
                return item;
            });
        }
        return [];
    }
}
exports.CoverageTreeProvider = CoverageTreeProvider;
class CoverageTreeItem extends vscode.TreeItem {
    constructor(label, kind, collapsibleState) {
        super(label, collapsibleState);
        this.kind = kind;
        this.contextValue = kind;
    }
}
exports.CoverageTreeItem = CoverageTreeItem;
//# sourceMappingURL=coverage-tree.js.map
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class VSCExpress {
    constructor(context, webRootPath) {
        this._webRootAbsolutePath = path.join(context.extensionPath, webRootPath);
    }
    /**
     * Open a specific page in VS Code
     *
     * @param path The relative path of the page in web root.
     * @param title The title of the page. The default is an empty string.
     * @param viewColumn The view column to open the page in. The default is
     * vscode.ViewColumn.Two.
     */
    open(filePath, title = '', viewColumn = vscode.ViewColumn.Two, options) {
        options = options || { enableScripts: true, enableCommandUris: true };
        filePath = path.join(this._webRootAbsolutePath, filePath);
        const context = new VSCExpressPanelContext(filePath, title, viewColumn, options);
        return context.panel;
    }
    close(filePath) {
        filePath = path.join(this._webRootAbsolutePath, filePath);
        if (VSCExpress.webviewPanelList[filePath]) {
            VSCExpress.webviewPanelList[filePath].dispose();
            delete VSCExpress.webviewPanelList[filePath];
        }
    }
}
VSCExpress.webviewPanelList = {};
exports.VSCExpress = VSCExpress;
class VSCExpressPanelContext {
    constructor(filePath, title, viewColumn, options) {
        this.filePath = filePath;
        this.title = title || filePath;
        this.viewColumn = viewColumn || vscode.ViewColumn.Two;
        this.options = options || {};
        const fileUrl = vscode.Uri.file(filePath).with({ scheme: 'vscode-resource' });
        let html = fs.readFileSync(filePath, 'utf8');
        if (/(<head(\s.*)?>)/.test(html)) {
            html = html.replace(/(<head(\s.*)?>)/, `$1<base href="${fileUrl.toString()}">`);
        }
        else if (/(<html(\s.*)?>)/.test(html)) {
            html = html.replace(/(<html(\s.*)?>)/, `$1<head><base href="${fileUrl.toString()}"></head>`);
        }
        else {
            html = `<head><base href="${fileUrl.toString()}"></head>${html}`;
        }
        if (!VSCExpress.webviewPanelList[this.filePath]) {
            this.panel = vscode.window.createWebviewPanel('VSCExpress', this.title, this.viewColumn, this.options);
            this.panel.webview.html = html;
            this.panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                // tslint:disable-next-line:no-any
                const payload = { code: 0 };
                try {
                    const result = yield vscode.commands.executeCommand.apply(null, [message.command, ...message.parameter]);
                    payload.result = result;
                }
                catch (error) {
                    payload.message = error.message;
                }
                this.panel.webview.postMessage({ messageId: message.messageId, payload });
            }));
            this.panel.onDidDispose(() => {
                delete VSCExpress.webviewPanelList[this.filePath];
            }, this);
            VSCExpress.webviewPanelList[this.filePath] = this.panel;
        }
        else {
            this.panel = VSCExpress.webviewPanelList[this.filePath];
            this.panel.title = this.title;
            this.panel.webview.html = html;
        }
    }
}
exports.VSCExpressPanelContext = VSCExpressPanelContext;

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
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const path = require("path");
const vscode = require("vscode");
class ContentProvider {
    constructor(webRootAbsolutePath) {
        this._serverPort = 0;
        this.app = express();
        this._server = http.createServer(this.app);
        const port = this._server.listen(0).address().port;
        this._serverPort = port;
        console.log(`Starting express server on port: ${port}`);
        this.app.use('/', express.static(webRootAbsolutePath));
        this.app.use(bodyParser.json());
    }
    _getUri(path) {
        return `http://127.0.0.1:${this._serverPort}${path}`;
    }
    provideTextDocumentContent(path) {
        return `<html>
      <body style="margin: 0; padding: 0; height: 100%; overflow: hidden;">
          <iframe src="${this._getUri(path)}" width="100%" height="100%" frameborder="0" style="position:absolute; left: 0; right: 0; bottom: 0; top: 0px;"/>
      </body>
      </html>`;
    }
}
class VSCExpress {
    /**
     * Create an HTTP server in VS Code for user interface of VS Code extension.
     *
     * @param context The collection of utilities private to the extension.
     * @param webRootPath The relative web root path.
     */
    constructor(context, webRootPath) {
        const webRootAbsolutePath = path.join(context.extensionPath, webRootPath);
        VSCExpress.contentProvider =
            VSCExpress.contentProvider || new ContentProvider(webRootAbsolutePath);
        VSCExpress.contentProvider.app.get('/command', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = req.query.data;
                const command = JSON.parse(data);
                yield vscode.commands.executeCommand.apply(null, command);
                return res.json({ code: 0, message: null });
            }
            catch (error) {
                console.log(error);
                return res.json({ code: 1, message: error.message });
            }
        }));
    }
    /**
     * Open a specific page in VS Code
     *
     * @param path The relative path of the page in web root.
     * @param title The title of the page. The default is an empty string.
     * @param viewColumn The view column to open the page in. The default is
     * vscode.ViewColumn.Two.
     */
    open(path, title = '', viewColumn = vscode.ViewColumn.Two, options) {
        options = options || {
            enableScripts: true,
            enableCommandUris: true
        };
        new VSCExpressPanelContext(path, title, viewColumn, options);
    }
}
VSCExpress.webviewPanelList = {};
exports.VSCExpress = VSCExpress;
class VSCExpressPanelContext {
    constructor(path, title, viewColumn, options) {
        this.path = path;
        this.title = title || path;
        this.viewColumn = viewColumn || vscode.ViewColumn.Two;
        this.options = options || {};
        const html = VSCExpress.contentProvider.provideTextDocumentContent(path);
        if (!VSCExpress.webviewPanelList[this.path]) {
            this.panel = vscode.window.createWebviewPanel('VSCExpress', this.title, this.viewColumn, this.options);
            this.panel.webview.html = html;
            this.panel.onDidDispose(() => {
                delete VSCExpress.webviewPanelList[this.path];
            }, this);
            VSCExpress.webviewPanelList[this.path] = this.panel;
        }
        else {
            this.panel = VSCExpress.webviewPanelList[this.path];
            this.panel.title = this.title;
            this.panel.webview.html = html;
        }
    }
}
exports.VSCExpressPanelContext = VSCExpressPanelContext;
//# sourceMappingURL=index.js.map
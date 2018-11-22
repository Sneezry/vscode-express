import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as net from "net";
import * as path from 'path';
import * as vscode from 'vscode';

class ContentProvider {
  private _server: http.Server;
  private _serverPort = 0;

  app = express();

  constructor(webRootAbsolutePath: string) {
    this._server = http.createServer(this.app);
    const port = (this._server.listen(0).address() as net.AddressInfo).port;
    this._serverPort = port;
    console.log(`Starting express server on port: ${port}`);

    this.app.use('/', express.static(webRootAbsolutePath));
    this.app.use(bodyParser.json());
  }

  private _getUri(path: string): string {
    if (path.substr(0, 1) !== '/') {
      path = '/' + path;
    }
    
    return `http://127.0.0.1:${this._serverPort}${path}`;
  }

  provideTextDocumentContent(path: string) {
    return `<html>
      <body style="margin: 0; padding: 0; height: 100%; overflow: hidden;">
          <iframe src="${
        this._getUri(
            path)}" width="100%" height="100%" frameborder="0" style="position:absolute; left: 0; right: 0; bottom: 0; top: 0px;"/>
      </body>
      </html>`;
  }
}

export class VSCExpress {
  static contentProvider: ContentProvider;
  static webviewPanelList: {[uri: string]: vscode.WebviewPanel} = {};

  /**
   * Create an HTTP server in VS Code for user interface of VS Code extension.
   *
   * @param context The collection of utilities private to the extension.
   * @param webRootPath The relative web root path.
   */
  constructor(context: vscode.ExtensionContext, webRootPath: string) {
    const webRootAbsolutePath = path.join(context.extensionPath, webRootPath);

    VSCExpress.contentProvider =
        VSCExpress.contentProvider || new ContentProvider(webRootAbsolutePath);
    VSCExpress.contentProvider.app.get(
        '/command', async (req: express.Request, res: express.Response) => {
          try {
            const data = req.query.data;
            const command = JSON.parse(data);
            const result = await vscode.commands.executeCommand.apply(null, command);
            return res.json({code: 0, message: null, result});
          } catch (error) {
            console.log(error);
            return res.json({code: 1, message: error.message});
          }
        });
  }

  /**
   * Open a specific page in VS Code
   *
   * @param path The relative path of the page in web root.
   * @param title The title of the page. The default is an empty string.
   * @param viewColumn The view column to open the page in. The default is
   * vscode.ViewColumn.Two.
   */
  open(
      path: string, title = '',
      viewColumn: vscode.ViewColumn = vscode.ViewColumn.Two, options?: vscode.WebviewOptions) {
    options = options || {
      enableScripts: true,
      enableCommandUris: true
    }
    
    new VSCExpressPanelContext(path, title, viewColumn, options);
  }
}

export class VSCExpressPanelContext {
  private path: string;
  private title: string|undefined;
  private viewColumn: vscode.ViewColumn;
  private options: vscode.WebviewOptions;

  panel: vscode.WebviewPanel;

  constructor(path: string, title?: string, viewColumn?: vscode.ViewColumn, options?: vscode.WebviewOptions) {
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
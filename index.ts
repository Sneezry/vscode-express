import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as uuid from 'uuid';
import * as vscode from 'vscode';

class ContentProvider implements vscode.TextDocumentContentProvider {
  private _server: http.Server;
  private _serverPort = 0;

  app = express();

  constructor(webRootAbsolutePath: string) {
    this._server = http.createServer(this.app);
    const port = this._server.listen(0).address().port;
    this._serverPort = port;
    console.log(`Starting express server on port: ${port}`);

    this.app.use('/', express.static(webRootAbsolutePath));
    this.app.use(bodyParser.json());
  }

  private _getUri(uri: vscode.Uri): string {
    return `http://127.0.0.1:${this._serverPort}${uri.path}`;
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    return `<html>
      <body style="margin: 0; padding: 0; height: 100%; overflow: hidden;">
          <iframe src="${
        this._getUri(
            uri)}" width="100%" height="100%" frameborder="0" style="position:absolute; left: 0; right: 0; bottom: 0; top: 0px;"/>
      </body>
      </html>`;
  }
}

export class VSCExpress {
  private static contentProvider: ContentProvider;
  private static contentProtocol: string;

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
            await vscode.commands.executeCommand.apply(null, command);
            return res.json({code: 0, message: null});
          } catch (error) {
            console.log(error);
            return res.json({code: 1, message: error.message});
          }
        });

    VSCExpress.contentProtocol = VSCExpress.contentProtocol || uuid();

    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(
            VSCExpress.contentProtocol, VSCExpress.contentProvider));
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
      viewColumn: vscode.ViewColumn = vscode.ViewColumn.Two) {
    const uri = `${VSCExpress.contentProtocol}://${path}`;
    vscode.commands.executeCommand(
        'vscode.previewHtml', uri, vscode.ViewColumn.One, title);
  }
}
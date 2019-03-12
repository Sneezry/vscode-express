import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface VSCExpressCommandResponsePayload {
  code: number;
  // tslint:disable-next-line:no-any
  result?: any;
  message?: string;
}

export class VSCExpress {
  static webviewPanelList: {[uri: string]: vscode.WebviewPanel} = {};
  private _webRootAbsolutePath: string;

  constructor(context: vscode.ExtensionContext, webRootPath: string) {
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
  open(
      filePath: string, title = '',
      viewColumn: vscode.ViewColumn = vscode.ViewColumn.Two,
      options?: vscode.WebviewPanelOptions&vscode.WebviewOptions) {
    options = options || {enableScripts: true, enableCommandUris: true};

    filePath = path.join(this._webRootAbsolutePath, filePath);
    const context =
        new VSCExpressPanelContext(filePath, title, viewColumn, options);
    return context.panel;
  }

  close(filePath: string) {
    filePath = path.join(this._webRootAbsolutePath, filePath);
    if (VSCExpress.webviewPanelList[filePath]) {
      VSCExpress.webviewPanelList[filePath].dispose();
      delete VSCExpress.webviewPanelList[filePath];
    }
  }
}

export class VSCExpressPanelContext {
  private filePath: string;
  private title: string|undefined;
  private viewColumn: vscode.ViewColumn;
  private options: vscode.WebviewOptions;

  panel: vscode.WebviewPanel;

  constructor(
      filePath: string, title?: string, viewColumn?: vscode.ViewColumn,
      options?: vscode.WebviewPanelOptions&vscode.WebviewOptions) {
    const _location:
        {href: string, search?: string, hash?: string} = {href: filePath};
    const _hash = filePath.split('#')[1];
    filePath = filePath.split('#')[0];
    const _search = filePath.split('?')[1];
    filePath = filePath.split('?')[0];
    if (_hash) {
      _location.hash = '#' + _hash;
    }
    if (_search) {
      _location.search = '?' + _search;
    }
    this.filePath = filePath;
    this.title = title || filePath;
    this.viewColumn = viewColumn || vscode.ViewColumn.Two;
    this.options = options || {};

    const fileUrl = vscode.Uri.file(filePath).with({scheme: 'vscode-resource'});
    let locationInject = '';
    if (_location) {
      locationInject =
          `<script>var _location=${JSON.stringify(_location)}</script>`;
    }

    let html = fs.readFileSync(filePath, 'utf8');
    if (/(<head(\s.*)?>)/.test(html)) {
      html = html.replace(
          /(<head(\s.*)?>)/,
          `$1<base href="${fileUrl.toString()}">${locationInject}`);
    } else if (/(<html(\s.*)?>)/.test(html)) {
      html = html.replace(
          /(<html(\s.*)?>)/,
          `$1<head><base href="${fileUrl.toString()}">${
              locationInject}</head>`);
    } else {
      html = `<head><base href="${fileUrl.toString()}">${
          locationInject}</head>${html}`;
    }

    if (!VSCExpress.webviewPanelList[this.filePath]) {
      this.panel = vscode.window.createWebviewPanel(
          'VSCExpress', this.title, this.viewColumn, this.options);
      this.panel.webview.html = html;
      this.panel.webview.onDidReceiveMessage(async message => {
        const payload: VSCExpressCommandResponsePayload = {code: 0};
        try {
          const result = await vscode.commands.executeCommand.apply(
              null, [message.command as string, ...message.parameter]);
          payload.result = result;
        } catch (error) {
          payload.message = error.message;
        }
        this.panel.webview.postMessage({messageId: message.messageId, payload});
      });
      this.panel.onDidDispose(() => {
        delete VSCExpress.webviewPanelList[this.filePath];
      }, this);
      VSCExpress.webviewPanelList[this.filePath] = this.panel;
    } else {
      this.panel = VSCExpress.webviewPanelList[this.filePath];
      this.panel.title = this.title;
      this.panel.webview.html = html;
    }
  }
}
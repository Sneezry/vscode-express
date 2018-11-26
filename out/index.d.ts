import * as vscode from 'vscode';
declare class ContentProvider {
    private _server;
    private _serverPort;
    app: import("express-serve-static-core").Express;
    constructor(webRootAbsolutePath: string);
    private _getUri;
    provideTextDocumentContent(path: string): string;
}
export declare class VSCExpress {
    static contentProvider: ContentProvider;
    static webviewPanelList: {
        [uri: string]: vscode.WebviewPanel;
    };
    /**
     * Create an HTTP server in VS Code for user interface of VS Code extension.
     *
     * @param context The collection of utilities private to the extension.
     * @param webRootPath The relative web root path.
     */
    constructor(context: vscode.ExtensionContext, webRootPath: string);
    /**
     * Open a specific page in VS Code
     *
     * @param path The relative path of the page in web root.
     * @param title The title of the page. The default is an empty string.
     * @param viewColumn The view column to open the page in. The default is
     * vscode.ViewColumn.Two.
     */
    open(path: string, title?: string, viewColumn?: vscode.ViewColumn, options?: vscode.WebviewPanelOptions & vscode.WebviewOptions): void;
}
export declare class VSCExpressPanelContext {
    private path;
    private title;
    private viewColumn;
    private options;
    panel: vscode.WebviewPanel;
    constructor(path: string, title?: string, viewColumn?: vscode.ViewColumn, options?: vscode.WebviewPanelOptions & vscode.WebviewOptions);
}
export {};

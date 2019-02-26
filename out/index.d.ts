import * as vscode from 'vscode';
export interface VSCExpressCommandResponsePayload {
    code: number;
    result?: any;
    message?: string;
}
export declare class VSCExpress {
    static webviewPanelList: {
        [uri: string]: vscode.WebviewPanel;
    };
    private _webRootAbsolutePath;
    constructor(context: vscode.ExtensionContext, webRootPath: string);
    /**
     * Open a specific page in VS Code
     *
     * @param path The relative path of the page in web root.
     * @param title The title of the page. The default is an empty string.
     * @param viewColumn The view column to open the page in. The default is
     * vscode.ViewColumn.Two.
     */
    open(filePath: string, title?: string, viewColumn?: vscode.ViewColumn, options?: vscode.WebviewPanelOptions & vscode.WebviewOptions): vscode.WebviewPanel;
    close(filePath: string): void;
}
export declare class VSCExpressPanelContext {
    private filePath;
    private title;
    private viewColumn;
    private options;
    panel: vscode.WebviewPanel;
    constructor(filePath: string, title?: string, viewColumn?: vscode.ViewColumn, options?: vscode.WebviewPanelOptions & vscode.WebviewOptions);
}

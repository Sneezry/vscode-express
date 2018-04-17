import * as vscode from 'vscode';
export declare class VSCExpress {
    private static contentProvider;
    private static contentProtocol;
    constructor(context: vscode.ExtensionContext, webRootPath: string);
}

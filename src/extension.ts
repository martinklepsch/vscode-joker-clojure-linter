'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from "path";
import * as vscode from 'vscode';
import {spawn, ChildProcess} from "child_process";

const OUTPUT_REGEXP = /.+:([0-9]+)+:([0-9]+): (.+)/
let diagnosticCollection: vscode.DiagnosticCollection

type JokerMessage = {
    line: number;
    text: string;
    at: number;
}

function parseJokerLine(jokerOutput: string): JokerMessage | null {
    const matches = OUTPUT_REGEXP.exec(jokerOutput);

    if (!matches) { 
        console.warn("joker: could not parse output:", jokerOutput)
        return null; }

    const message = {
        line: parseInt(matches[1]),
        text: matches[3],
        at: parseInt(matches[2]) - 1
    }

    if (!message.line) { 
        console.warn("joker: could not find line number:", jokerOutput)
        return null; }

    return message
}

function parseDocumentDiagnostics(document: vscode.TextDocument, message: JokerMessage): vscode.Diagnostic {
    var errorLine = document.lineAt(message.line - 1).text;

    var rangeLine = message.line - 1;
    let rangeStart = new vscode.Position(rangeLine, message.at);
    let rangeEnd = new vscode.Position(rangeLine, message.at + 4);
    let range = new vscode.Range(rangeStart, rangeEnd);
    let severity = message.text.includes("error") ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
    let diag = new vscode.Diagnostic(range, message.text, severity);

    // console.log("parsed diag:", diag)

    return diag
}

function lintDocument(document: vscode.TextDocument, warnOnError: Boolean = false) {
    // let lualinterConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('clojurelinter');
    // if (!lualinterConfig.get("enable")) {
    //     return;
    // }

    if (document.languageId !== "clojure") { return; }

    let jokerProc: ChildProcess = spawn("joker", ["--lint", document.fileName]);
    jokerProc.stdout.setEncoding("utf8");
    let diags: vscode.Diagnostic[] = []
    
    jokerProc.stderr.on("data", (data: Buffer) => {
        if (data.length != 0) { 
            for (let jokerLine of data.toString().split(/\r?\n/)) {
                if (jokerLine.length != 0) {
                    let msg = parseJokerLine(jokerLine)
                    if (msg != null) {
                        let diag = parseDocumentDiagnostics(document, msg);
                        diags.push(diag)
                    }
                }
            }
        }
    });

    jokerProc.stderr.on("error", error => {
        vscode.window.showErrorMessage("joker" + " error: " + error);
    });

    jokerProc.on("exit", (code: number, signal: string) => {
        if (diags.length == 0) {
            diagnosticCollection.delete(document.uri)
        } else {
            // console.log("diags:", diags)
            diagnosticCollection.set(document.uri, diags);
        }
    });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "clojure-formatter" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });
    context.subscriptions.push(disposable);

    diagnosticCollection = vscode.languages.createDiagnosticCollection('clojure');
    context.subscriptions.push(diagnosticCollection);

    vscode.workspace.onDidSaveTextDocument(document => lintDocument(document, true));
    vscode.workspace.onDidChangeTextDocument(event => lintDocument(event.document));
    vscode.workspace.onDidOpenTextDocument(document => lintDocument(document));
    vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor) => lintDocument(editor.document));

}

// this method is called when your extension is deactivated
export function deactivate() {
}
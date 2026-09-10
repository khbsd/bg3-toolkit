import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as util from "util";
import { getWorkspacePath } from "../utils/ws_utils";
import { HtmlData } from "../utils/html_utils";

export class ToolkitWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "toolkitWebviewView";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      console.log("message recieved: ", data.message);
    });
  }

  /**
   *
   * examples:
   * https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/src/extension.ts
   * https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/media/main.js
   *
   */

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const htmlUri = path.resolve(
      __dirname,
      "..",
      "..",
      "src",
      "webview",
      "html",
      "main.html",
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "js",
        "main.js",
      ),
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "css",
        "main.css",
      ),
    );

    // TODO: make regex for these string values, ie Regex(${HtmlData.Nonce}) etc etc
    Object.values(HtmlData).forEach((value) => {
      if (typeof value === "string") {
        console.log("HtmlData:", value);
      }
    });

    // Use a nonce to only allow a specific script to be run.
    const nonce = this.getNonce();
    const csp = webview.cspSource;

    // TODO: replace this with a series of String.replace() calls with more verbose
    // names
    let html = "";
    try {
      html = util.format(
        fs.readFileSync(htmlUri.toString()).toString(),
        csp,
        nonce,
        styleMainUri,
        getWorkspacePath(),
        nonce,
        scriptUri,
      );
    } catch (err) {
      console.log(err);
    }

    return html;
  }

  getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

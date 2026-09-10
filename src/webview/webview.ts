import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as util from "util";
import { getWorkspacePath } from "../utils/ws_utils";
import { HtmlDataUtils, HtmlData, HtmlDataObj } from "../utils/html_utils";

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

  private _getHtmlForWebview(webview: vscode.Webview) {
    const hd: HtmlDataUtils = new HtmlDataUtils();

    // Use a nonce to only allow a specific script to be run.
    const nonce = hd.getNonce();

    // file to read html from
    const htmlUri = path.resolve(
      __dirname,
      "..",
      "..",
      "src",
      "webview",
      "html",
      "main.html",
    );

    // path to js script
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "js",
        "main.js",
      ),
    );

    // path to css file
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "css",
        "main.css",
      ),
    );

    // content security policy or whatever. who cares.
    const csp = webview.cspSource;

    // make this data into an array for hd.getObjs()
    const data: string[] = [];
    {
      data[HtmlData.Nonce] = nonce;
      data[HtmlData.ScriptSrc] = scriptUri.toString();
      data[HtmlData.StyleSrc] = styleMainUri.toString();
      data[HtmlData.CspSrc] = csp;
      data[HtmlData.WorkspacePath] = getWorkspacePath();
    }

    let html = "";
    try {
      html = fs.readFileSync(htmlUri.toString()).toString();
    } catch (err) {
      console.log(err);
      return "";
    }

    // programmatically find and replace the placeholder values from the html file we read
    for (let obj of hd.getObjs(data)) {
      html = html.replaceAll("${" + obj.name + "}", obj.data);
    }

    return html;
  }
}

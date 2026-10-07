import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { EOL } from "os";
import * as util from "util";
import { HtmlData, HtmlDataUtils } from "../utils/html";
import { getWorkspacePath } from "../utils/ws";
import { Config } from "../utils/config";

let webview: ConsoleWebviewViewProvider | undefined = undefined;
const openingText = "hi !! i love you!";
const consoleTags: string[] = [
  '<p class="line">',
  "</p>",
  "<br>"
];
const enum ConsoleTags {
  OpenPTag,
  ClosePTag,
  LineBreak
}

export class ConsoleWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "consoleWebviewView";
  private _view?: vscode.WebviewView;
  isModWorkspace: boolean;
  consoleText: string;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    isModWorkspace?: boolean,
  ) {
    this.isModWorkspace = isModWorkspace ?? true;
    this.consoleText = openingText;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    this._view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    this._view.webview.html = this._getHtmlForWebview(this._view.webview);

    webview = this;

    this._view.webview.onDidReceiveMessage(async (data) => {
      console.log("message recieved: ", data.msg);
      if (data.type === "copy" && this.consoleText !== openingText) {
        let cbText = this.consoleText;
        consoleTags.forEach((tag) => {
          if (tag === consoleTags[ConsoleTags.ClosePTag]) {
            cbText = cbText.replaceAll(tag, EOL);
          } else {
            cbText = cbText.replaceAll(tag, "");
          }
        });
        vscode.env.clipboard.writeText(cbText);
      } else if (data.type === "clear") {
        clearWebviewLog();
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview,) {
    const wv: vscode.Webview = webview;
    const hd: HtmlDataUtils = new HtmlDataUtils();
    const nonce = hd.getNonce();
    let htmlUri: string;

    // file to read html from
    if (!this.isModWorkspace) {
      htmlUri = path.resolve(
        __dirname,
        "..",
        "..",
        "src",
        "webview",
        "html",
        "no_mod_workspace.html",
      );
    } else {
      htmlUri = path.resolve(
        __dirname,
        "..",
        "..",
        "src",
        "webview",
        "html",
        "console.html",
      );
    }

    // path to js script
    const scriptUri = wv.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "js",
        "console.js",
      ),
    );

    // path to css file
    const styleMainUri = wv.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "css",
        "console.css",
      ),
    );

    // content security policy or whatever. who cares.
    const csp = wv.cspSource;

    // make this data into an array for hd.getObjs()
    const data: string[] = [];
    {
      data[HtmlData.Nonce] = nonce;
      data[HtmlData.ScriptSrc] = scriptUri.toString();
      data[HtmlData.StyleSrc] = styleMainUri.toString();
      data[HtmlData.CspSrc] = csp;
      data[HtmlData.WorkspacePath] = getWorkspacePath();
      data[HtmlData.LogText] = this.consoleText;
    }

    let html = "";
    try {
      html = fs.readFileSync(htmlUri.toString()).toString();
    } catch (err) {
      console.log(err);
      return "";
    }
    return hd.formatHtml(html, data);
  }

  public updateConsoleText(text?: string): void {
    const conf: Config = new Config();
    if (text !== undefined) {
      text = consoleTags[ConsoleTags.OpenPTag] + text + consoleTags[ConsoleTags.ClosePTag];
      if (this.consoleText === openingText) {
        this.consoleText = text;
      } else {
        this.consoleText = this.consoleText.concat(consoleTags[ConsoleTags.LineBreak] + text);
      }
    }

    let textArray: string[] = this.consoleText.split(consoleTags[ConsoleTags.LineBreak]);
    if (textArray.length > conf.consoleLineLimit) {
      textArray = textArray.slice(textArray.length - conf.consoleLineLimit);
      this.consoleText = textArray.join(consoleTags[ConsoleTags.LineBreak]);
    }

    if (this._view !== undefined) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
    this._view?.webview.postMessage("scroll-update");
  }
}

export function consoleWebviewLog(...args: any): void {
  let text: string = util.format(...args);

  console.log(...args);
  webview?.updateConsoleText(text);
}

export function clearWebviewLog(): void {
  if (webview !== undefined) {
    webview.consoleText = openingText;
  }
  webview?.updateConsoleText();
}
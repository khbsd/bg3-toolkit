import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as vscode from "vscode";

import { EOL } from "os";
import { Config } from "../utils/config";
import { HtmlData, HtmlDataUtils } from "../utils/html";

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
  consoleText: string;

  hd: HtmlDataUtils = new HtmlDataUtils();
  nonce = this.hd.getNonce();

  htmlUri: string = "";
  scriptUri: string = "";
  styleMainUri: string = "";

  constructor(
    private readonly _extensionUri: vscode.Uri
  ) {
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

    this.htmlUri = path.resolve(
      __dirname,
      "..",
      "..",
      "src",
      "webview",
      "html",
      "console.html",
    );

    // path to js script
    this.scriptUri = this._view?.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "js",
        "console.js",
      ),
    ).toString();

    // path to css file
    this.styleMainUri = this._view?.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "css",
        "console.css",
      ),
    ).toString();

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

  private _getHtmlForWebview(webview: vscode.Webview) {
    // content security policy or whatever. who cares.
    const csp = webview.cspSource;

    // make this data into an array for hd.getObjs()
    const data: string[] = [];
    {
      data[HtmlData.Nonce] = this.nonce;
      data[HtmlData.ScriptSrc] = this.scriptUri;
      data[HtmlData.StyleSrc] = this.styleMainUri;
      data[HtmlData.CspSrc] = csp;
      data[HtmlData.LogText] = this.consoleText;
    }

    let html = "";
    try {
      html = fs.readFileSync(this.htmlUri).toString();
    } catch (err) {
      console.log(err);
      return "";
    }
    return this.hd.formatHtml(html, data);
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
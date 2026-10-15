import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { getNames } from "../utils/enum";
import { getModPath } from "../utils/file";
import { HtmlData, HtmlDataUtils } from "../utils/html";
import { FileFormats } from "../utils/ls-formats/formats";
import { convertAll, pack } from "../utils/ls-formats/junction";
import { unpackChoose } from "../utils/ls-formats/pak";
import { Version64, Version64Parts } from "../utils/version";
import { getWorkspacePath } from "../utils/ws";
import { consoleWebviewLog } from "./console";

function versionStringNotEmpty(version: string[]): boolean {
  for (const v of version) {
    if (v.length !== 0) {
      return true;
    }
  }
  return false;
}

export class ToolkitWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "toolkitWebviewView";
  private _view?: vscode.WebviewView;
  isModWorkspace: boolean;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    isModWorkspace?: boolean,
  ) {
    this.isModWorkspace = isModWorkspace ?? true;
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

    this._view.webview.onDidReceiveMessage(async (data) => {
      if (data.type === "version-load") {
        let version: number[] = [];
        const v64: Version64 = new Version64();

        if (!versionStringNotEmpty(data.version)) {
          version = v64.getVersionInMeta();
          for (let i = 0; i < version.length; i++) {
            //console.log(version[i]);
            this._view?.webview.postMessage({ content: version[i], type: getNames(Version64Parts)[i] });
          }
        }

        //console.log(version);
        return;
      } else if (data.type === "version-update") {
        const v64: Version64 = new Version64();
        console.log(data.version);
        let version: bigint[] = [0n, 0n, 0n, 0n];

        for (let i = 0; i < data.version.length; i++) {
          let ver: bigint = 0n;
          try {
            ver = BigInt(data.version[i]);
          } catch (err) {
            //console.log(err);
            this._view?.webview.postMessage({ content: version[i], type: getNames(Version64Parts)[i] });
          }

          version[i] = ver;
        }
        v64.updateVersionInMeta(v64.version64Build(version));

      } else if (data.type === "debug") {
        consoleWebviewLog("message received: " + data.msg);
      }

      if (getNames(FileFormats).includes(data.type)) {
        consoleWebviewLog("message received: " + data.msg);
        const type: FileFormats =
          FileFormats[data.type as keyof typeof FileFormats];
        if (type === FileFormats.unpak) {
          await unpackChoose();
          return;
        } else if (type === FileFormats.pak) {
          pack();
        } else if (type !== FileFormats.count && type !== FileFormats.none) {
          convertAll(getWorkspacePath(), type);
        } else {
          consoleWebviewLog("unrecognized type");
        }
      }

    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
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
        "toolkit.html",
      );
    }

    // path to js script
    const scriptUri = wv.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "js",
        "toolkit.js",
      ),
    );

    // path to css file
    const styleMainUri = wv.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "css",
        "toolkit.css",
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
      data[HtmlData.WorkspacePath] = getModPath(getWorkspacePath());
    }

    let html = "";
    try {
      html = fs.readFileSync(htmlUri).toString();
    } catch (err) {
      consoleWebviewLog(err);
      return "";
    }
    return hd.formatHtml(html, data);
  }
}

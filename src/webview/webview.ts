import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { getWorkspacePath } from "../utils/ws_utils";
import { HtmlDataUtils, HtmlData } from "../utils/html_utils";
import * as eutils from "../utils/enum_utils";
import * as futils from "../utils/file_utils";
import { Lsx, Lsf } from "../utils/ls-utils/lsx";
import { Pak, Unpak } from "../utils/ls-utils/pak";
import { Loca, Xml } from "../utils/ls-utils/loca_xml";
import * as formats from "../utils/ls-utils/formats";
import { FileFormats } from "../utils/ls-utils/formats";

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

    webviewView.webview.onDidReceiveMessage(async (data) => {
      console.log("message recieved: ", data.message);
      if (data.type === "unpack") {
        let pakPath: string | undefined;
        let unpakPath: string | undefined;
        while (pakPath === undefined) {
          pakPath = await vscode.window
            .showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: false,
              canSelectMany: false,
              filters: { "PAK Files": ["pak"] },
              title: "Select a .pak file to unpack",
            })
            .then((p) => p?.toString());

          if (pakPath === undefined) {
            let warning;
            await vscode.window
              .showWarningMessage(
                "You must select a pak!",
                "oops",
                "never mind",
              )
              .then((value) => {
                warning = value;
              });
            if (warning !== "oops") {
              return;
            }
          }
        }
        while (unpakPath === undefined) {
          unpakPath = await vscode.window
            .showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              title: "Select a location to unpack to",
            })
            .then((p) => p?.toString());
          if (unpakPath === undefined) {
            let warning;
            await vscode.window
              .showWarningMessage(
                "You must select a destination!",
                "oops",
                "never mind",
              )
              .then((value) => {
                warning = value;
              });
            if (warning !== "oops") {
              return;
            }
          }
        }

        let unpak = new Unpak(pakPath, unpakPath);
        unpak.unpack();
        return;
      }
      switch (FileFormats[data.type as keyof typeof FileFormats]) {
        case FileFormats.pak: {
          let pak = new Pak(getWorkspacePath());
          pak.build();
          break;
        }
        case FileFormats.lsx: {
          let lsx = new Lsx(getWorkspacePath());
          lsx.convertModDir();
          break;
        }
        case FileFormats.xml: {
          let xml = new Xml(getWorkspacePath());
          xml.convertModDir();
          break;
        }
        case FileFormats.lsf: {
          let lsf = new Lsf(getWorkspacePath());
          lsf.convertModDir();
          break;
        }
        case FileFormats.loca: {
          let loca = new Loca(getWorkspacePath());
          loca.convertModDir();
          break;
        }
      }
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
    return hd.formatHtml(html, data);
  }
}

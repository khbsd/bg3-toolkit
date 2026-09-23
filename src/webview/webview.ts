import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { getWorkspacePath } from "../utils/ws";
import { HtmlDataUtils, HtmlData } from "../utils/html";
import { Pak, Unpak } from "../utils/ls-formats/pak";
import { FileFormats } from "../utils/ls-formats/formats";
import { ConvertAll } from "../registrar/junction";
import { Config } from "../utils/config";

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

    this._view.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    this._view.webview.html = this._getHtmlForWebview(this._view.webview);

    this._view.webview.onDidReceiveMessage(async (data) => {
      console.log("message recieved: ", data.message);
      const type: FileFormats =
        FileFormats[data.type as keyof typeof FileFormats];
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
      if (data.type === "debug") {
        let editor = vscode.window.activeTextEditor;
        let selection = vscode.window.activeTextEditor?.selection;
        if (selection !== undefined && editor !== undefined) {
          let word =
            vscode.window.activeTextEditor?.document.getWordRangeAtPosition(
              selection?.active,
            );
          console.log(word);
          console.log(editor.document.getText(word));
        }

        console.log(selection?.active);
        return;
      }
      if (type === FileFormats.pak) {
        let pak = new Pak(getWorkspacePath());
        pak.build();
      } else {
        new ConvertAll(getWorkspacePath(), type);
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const wv: vscode.Webview = webview;
    const hd: HtmlDataUtils = new HtmlDataUtils();
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
    const scriptUri = wv.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "js",
        "main.js",
      ),
    );

    // path to css file
    const styleMainUri = wv.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview",
        "css",
        "main.css",
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

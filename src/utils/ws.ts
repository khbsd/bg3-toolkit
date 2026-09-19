import * as vscode from "vscode";
import * as path from "path";
import * as futils from "./file";
import { Config } from "./config";

/**
 * returns your workspace path. if you have set a value for the "custom mod path" setting, will return that instead
 * @param short boolean
 * @returns string
 */
export function getWorkspacePath(short: boolean = false): string {
  let wsPath = "";
  const conf: Config = new Config();
  if (conf.customModPath.length > 0) {
    console.log(conf.customModPath)
    wsPath = conf.customModPath;
  } else {
    if (
      vscode.workspace.workspaceFolders?.length !== undefined &&
      vscode.workspace.workspaceFolders.length > 0
    ) {
      wsPath = vscode.workspace.workspaceFolders[0].uri.toString();
    } else {
      wsPath = "home";
    }
  }

  if (short) {
    let wsPathShortSlice = wsPath.split(path.sep).slice(-1);
    let wsPathShort: string = "";
    wsPathShortSlice.map(
      (p) => (wsPathShort.concat(p, path.sep, "")),
    );
    return wsPathShort;
  }
  return futils.fixPath(wsPath);
}

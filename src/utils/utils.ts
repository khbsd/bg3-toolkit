import * as vscode from "vscode";
import * as path from "path";

export function getWorkspacePath(short: boolean = false): string {
  let wsPath = "";
  if (
    vscode.workspace.workspaceFolders?.length !== undefined &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    wsPath = vscode.workspace.workspaceFolders[0].uri.toString();
  } else {
    wsPath = "home";
  }

  let wsPathShortSlice = wsPath.split(path.sep).slice(-1);
  let wsPathShort: string = "";
  wsPathShortSlice.forEach(
    (p) => (wsPathShort = wsPathShort.concat(p, path.sep, "")),
  );
  if (short) {
    return wsPathShort;
  }
  return wsPath;
}

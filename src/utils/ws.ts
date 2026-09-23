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
    console.log(conf.customModPath);
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
    wsPathShortSlice.map((p) => wsPathShort.concat(p, path.sep, ""));
    return wsPathShort;
  }
  return futils.fixPath(wsPath);
}

export async function replaceInFiles(
  files: vscode.Uri[],
  findText: string,
  replaceText: string,
): Promise<void> {
  const re: RegExp = new RegExp(findText, "gi");
  let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
  let editedDocs: vscode.TextDocument[] = [];

  for (const f of files) {
    const doc = await vscode.workspace.openTextDocument(f.path);

    let match: RegExpExecArray | null;
    while ((match = re.exec(doc.getText())) !== null) {
      const range = new vscode.Range(
        doc.positionAt(match.index),
        doc.positionAt(match.index + match[0].length),
      );
      edit.replace(f, range, replaceText);
      editedDocs.push(doc);
    }
  }

  if (await vscode.workspace.applyEdit(edit)) {
    editedDocs.forEach(async (doc) => {
      console.log(doc.fileName, " saved");
      doc.save();
    });
  }
}

// keeping because this might be nice to have later, though idk for what
export function insertAt(replaceText: string, selection: vscode.Selection) {
  const editor = vscode.window.activeTextEditor;

  if (editor) {
    editor.edit((editBuilder) => {
      editBuilder.replace(selection, replaceText);
    });
  }
}

export function getSelectionOrCursorWord(): string {
  const e = vscode.window.activeTextEditor;
  if (e === undefined) {
    return "";
  }

  let selected: string = e.document.getText(e.selection);
  if (selected.length === 0) {
    selected = e.document.getText(
      e.document.getWordRangeAtPosition(e.selection.active),
    );
  }

  return selected;
}

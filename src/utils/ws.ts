import * as path from "path";
import * as vscode from "vscode";
import * as futils from "./file";

import { consoleWebviewLog } from "../webview/console";
import { getConf } from "./config";

/**
 * English (US) 	      en
 * Simplified Chinese 	zh-cn
 * Traditional Chinese 	zh-tw
 * French 	            fr
 * German 	            de
 * Italian 	            it
 * Spanish 	            es
 * Japanese 	          ja
 * Korean 	            ko
 * Russian 	            ru
 * Portuguese (Brazil) 	pt-br
 * Turkish 	            tr
 * Polish 	            pl
 * Czech 	              cs  // not supported by game
 * Hungarian 	          hu
 * Ukranian             ukr // not supported by vscode
 */

export type DisplayLanguage = {
  iso: string;
  name: string;
};

export function getDisplayLanguageName(): DisplayLanguage {
  let dl: DisplayLanguage = { iso: vscode.env.language, name: "" };
  switch (dl.iso) {
    case "de":
      dl.name = "German";
    default:
    case "en":
      dl.name = "English";
    case "es":
      dl.name = "Spanish";
    case "fr":
      dl.name = "French";
    case "hu":
      dl.name = "Hungarian";
    case "it":
      dl.name = "Italian";
    case "ja":
      dl.name = "Japanese";
    case "ko":
      dl.name = "Korean";
    case "pl":
      dl.name = "Polish";
    case "pt-br":
      dl.name = "BrazilianPortuguese";
    case "ru":
      dl.name = "Russian";
    case "tr":
      dl.name = "Turkish";
    case "zh-cn":
      dl.name = "Chinese";
    case "zh-tw":
      dl.name = "ChineseTraditional";
  }
  return dl;
}

/**
 * returns your workspace path. if you have set a value for the "custom mod path" setting, will return that instead
 * @param short boolean
 * @returns string
 */
export function getWorkspacePath(short: boolean = false): string {
  let wsPath = "";
  const customModPath: string = getConf().customModPath;
  if (customModPath.length > 0) {
    wsPath = customModPath;
  } else {
    if (
      vscode.workspace.workspaceFolders?.length !== undefined &&
      vscode.workspace.workspaceFolders.length > 0
    ) {
      wsPath = vscode.workspace.workspaceFolders[0].uri.toString();
      if (wsPath.includes("%")) {
        wsPath = decodeURIComponent(wsPath);
      }
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
      consoleWebviewLog(doc.fileName + " saved");
      doc.save();
    });
  }
}

// keeping because this might be nice to have later, though idk for what
export async function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    consoleWebviewLog("waiting for: " + time + "ms");
    setTimeout(resolve, time);
  });
}

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

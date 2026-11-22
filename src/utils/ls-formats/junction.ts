import * as fs from "fs";
import * as vscode from "vscode";

import { getConf } from "../config";
import { fixPath } from "../file";
import { getWorkspacePath } from "../ws";
import { FileFormats, LsFile } from "./formats";
import { Loca, Xml } from "./loca_xml";
import { Lsf, Lsx } from "./lsx";
import { Pak, Unpak } from "./pak";

export function convertAll(dirPath: string, type: FileFormats) {
  if (fs.statSync(dirPath).isFile()) {
    convert(new LsFile(dirPath));
    return;
  }

  let c = undefined;
  switch (type) {
    case FileFormats.lsx:
      c = new Lsx(dirPath);
      break;
    default:
    case FileFormats.lsf:
      c = new Lsf(dirPath);
      break;
    case FileFormats.xml:
      c = new Xml(dirPath);
      break;
    case FileFormats.loca:
      c = new Loca(dirPath);
      break;
  }

  if (c !== undefined) {
    c.convertModDir();
  }
}

export function convert(file: LsFile) {
  let c = undefined;
  switch (FileFormats[file.ext as keyof typeof FileFormats]) {
    case FileFormats.lsx:
      c = new Lsx(file.path);
      break;
    default:
    case FileFormats.lsf:
      c = new Lsf(file.path);
      break;
    case FileFormats.xml:
      c = new Xml(file.path);
      break;
    case FileFormats.loca:
      c = new Loca(file.path);
      break;
    case FileFormats.pak:
      Unpak(file.path);
      return;
  }
  if (c !== undefined) {
    c.convertFile(file);
  }
}

export function pack(wsPath?: string) {
  wsPath = wsPath ?? getWorkspacePath();
  console.log(wsPath);
  new Pak(wsPath).build();
}

export async function unpackGameData(): Promise<void> {
  let pakPathUri: vscode.Uri[] | undefined;
  let unPakPathUri: vscode.Uri[] | undefined;
  let gameData: string = getConf().gameDataPath;

  if (gameData.length === 0) {
    gameData = getWorkspacePath();
  }

  let gameDataUri: vscode.Uri = vscode.Uri.parse(gameData);

  while (pakPathUri === undefined) {
    pakPathUri = await vscode.window.showOpenDialog({
      defaultUri: gameDataUri,
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: true,
      filters: { ".pak": [FileFormats[FileFormats.pak]] },
      title: "Select .pak file(s) to unpack",
    });

    if (pakPathUri === undefined) {
      let warning;
      await vscode.window
        .showWarningMessage("You must select something!", "oops", "never mind")
        .then((value) => {
          warning = value;
        });
      if (warning !== "oops") {
        return;
      }
    }
  }

  while (unPakPathUri === undefined) {
    unPakPathUri = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: "Select a destination for unpacked game data",
    });

    if (unPakPathUri === undefined) {
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

  if (pakPathUri === undefined || unPakPathUri === undefined) {
    return;
  }

  vscode.window.showInformationMessage(
    "this may take a minute depending on your computers specs!",
  );

  const unPakPath: string = fixPath(unPakPathUri.toString());
  for (let pak of pakPathUri) {
    Unpak(fixPath(pak.toString()), unPakPath);
  }
}

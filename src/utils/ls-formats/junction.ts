import * as fs from "fs";
import * as vscode from "vscode";

import { Config } from "../config";
import { fixPath, getFiles } from "../file";
import { getWorkspacePath } from "../ws";
import { File, FileFormats } from "./formats";
import { Loca, Xml } from "./loca_xml";
import { Lsf, Lsx } from "./lsx";
import { Pak, Unpak } from "./pak";

export function convertAll(dirPath: string, type: FileFormats) {
  if (fs.statSync(dirPath).isFile()) {
    convert(new File(dirPath));
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

export function convert(file: File) {
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
  const conf: Config = new Config();
  let pakPath: any | undefined;
  let unPakPath: any | undefined;
  let gameData: string = conf.gameDataPath;

  if (gameData.length === 0) {
    gameData = getWorkspacePath();
  }

  let gameDataUri: vscode.Uri = vscode.Uri.parse(gameData);

  while (pakPath === undefined) {
    pakPath = await vscode.window
      .showOpenDialog({
        defaultUri: gameDataUri,
        canSelectFiles: true,
        canSelectFolders: true,
        canSelectMany: true,
        title: "Select .pak file(s) to unpack",
      })
      .then((p) => p);

    if (pakPath === undefined) {
      let warning;
      await vscode.window
        .showWarningMessage(
          "You must select something!",
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

  while (unPakPath === undefined) {
    unPakPath = await vscode.window
      .showOpenDialog({
        defaultUri: gameDataUri,
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: "Select a destination for unpacked game data",
      })
      .then((p) => p);

    if (unPakPath === undefined) {
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

  if (pakPath === undefined || unPakPath === undefined) {
    return;
  }

  unPakPath = fixPath(unPakPath);

  if (Array.isArray(pakPath)) {
    for (let pak of pakPath) {
      Unpak(fixPath(pak.toString()), unPakPath);
    }
  } else if (fs.statSync(pakPath).isFile()) {
    Unpak(fixPath(pakPath.toString()), unPakPath);
  } else if (fs.statSync(pakPath).isDirectory()) {
    for (const pak of getFiles(fixPath(pakPath.toString()), { type: FileFormats.pak, forUnpackingGameFiles: true })) {
      Unpak(pak.path, unPakPath);
    }
  }
}

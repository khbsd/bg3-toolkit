import * as fs from "fs";
import * as path from "path";
//import * as vscode from "vscode";
import { FileFormats } from "../ls-formats/formats";
import { Uuid } from "../uuid_handle";
import { getWorkspacePath } from "../ws";
import { addOpeningClosingTags, XmlFileTags } from "../xml";

export class ModTemplate {
  author: string;
  name: string;
  modUuid: string;
  iconUuid: string;

  constructor(author: string, name: string) {
    this.author = author;
    this.name = name;

    let uuid = new Uuid();
    this.modUuid = uuid.get();
    this.iconUuid = uuid.get();
  }
}

export enum TemplateFolders {
  Localization,
  Mods,
  Public,
  Scripts,
}

export class TemplateFolder {
  path: string;
  name: string;
  stats: fs.Stats | undefined = undefined;

  constructor(name: string, wsPath?: string) {
    this.name = name;
    this.path = path.join(wsPath ?? getWorkspacePath(), this.name);
    try {
      this.stats = fs.statSync(this.path);
    } catch (err) {}
  }
}

export class TemplateFile extends TemplateFolder {
  ext: FileFormats;
  content: string;

  constructor(
    name: string,
    ext: FileFormats,
    opts?: { wsPath?: string; content?: string },
  ) {
    super(name + "." + FileFormats[ext], opts?.wsPath);
    this.ext = ext;
    this.content = opts?.content ?? "";
  }

  public setContent(content: string) {
    this.content = content;
  }
}

export async function makeModTemplate(wsPath: string): Promise<void> {
  /*const name: string | undefined = await vscode.window.showInputBox({
    title: "mod name?",
  });*/
  const name = "test";
  if (name === undefined) {
    return;
  }

  wsPath = path.join(wsPath, name);

  try {
    if (fs.statSync(wsPath).isDirectory()) {
      fs.rmdirSync(wsPath);
      console.log("removed");
    }
  } catch (err) {
    console.log(wsPath, "doesnt exist, making");
  }

  const folders = mainFolders(wsPath);
  for (const folder of folders) {
    if (folder.stats === undefined) {
      fs.mkdirSync(folder.path, { recursive: true });
    }
  }

  mainFiles(wsPath);

  const locaText = addOpeningClosingTags([" "], new XmlFileTags());
}

export function mainFolders(wsPath: string): TemplateFolder[] {
  let folders: TemplateFolder[] = [];
  for (let folder of Object.values(TemplateFolders)) {
    folder = folder as keyof typeof TemplateFolders;

    if (folder.length > 1) {
      folders.push(new TemplateFolder(folder, wsPath));
    }
  }
  return folders;
}

export function mainFiles(wsPath: string) {
  let templatesPath: string = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "src",
    "utils",
    "templates",
    "files",
  );

  for (const file of fs.readdirSync(templatesPath, { withFileTypes: true })) {
    console.log(file);
  }
}

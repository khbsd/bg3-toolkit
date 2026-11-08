import * as fs from "fs";
import * as path from "path";
import { Uuid } from "../uuid_handle";
import {
  DisplayLanguage,
  getDisplayLanguageName,
  getWorkspacePath,
} from "../ws";

enum ModVars {
  Author,
  IconUuid,
  Language,
  ModUuid,
  Name,
}

export enum TemplateFolders {
  Localization,
  Mods,
  Public,
  Scripts,
}

export type TemplateDds = {
  width: number;
  height?: number;
  name?: string;
  path: string;
};

export class TemplateFolder {
  path: string;
  name: string;
  stats: fs.Stats | undefined = undefined;

  constructor(folderPath: string) {
    this.name = path.basename(folderPath);
    this.path = folderPath;
    try {
      this.stats = fs.statSync(this.path);
    } catch (err) {}
  }
}

export class TemplateFile extends TemplateFolder {
  content: string;
  path: string;

  constructor(filePath: string, content?: string) {
    super(path.dirname(filePath));
    this.path = filePath;
    this.content = content ?? "";
  }

  public setContent(content: string) {
    this.content = content;
  }
}

export class ModTemplate {
  author: string;
  name: string;
  modUuid: string;
  iconUuid: string;
  workspacePath: string;

  language: DisplayLanguage;

  modPaths: string[] = [
    "Localization/${Language}/${Name}_Loca.xml",
    "Mods/${Name}/meta.lsx",
  ];

  itemPaths_Dds: TemplateDds[] = [
    { width: 380, path: "Public/Game/GUI/Assets/Tooltips/Icons/abilities.dds" },
    { width: 380, path: "Public/Game/GUI/Assets/Tooltips/ItemIcons/icons.dds" },
    {
      width: 144,
      path: "Public/Game/GUI/Assets/ControllerUIicons/skills_png/abilities.dds",
    },
    {
      width: 144,
      path: "Public/Game/GUI/Assets/ControllerUIicons/items_png/items.dds",
    },
    {
      width: 256,
      height: 64,
      path: "Public/${Name}/Assets/Textures/Icons/${Name}_Icons.dds",
    },
  ];
  itemPaths_files: string[] = [
    "Public/${Name}/Content/UI/[PAK]_UI/_merged.lsx",
    "Public/${Name}/GUI/Icons_Items.lsx",
    "Public/${Name}/Stats/Generated/Data/${Name}_Stats.txt",
    "Public/${Name}/Stats/Generated/TreasureTable.txt",
  ];

  scriptPaths: string[] = [
    "Mods/${Name}/ScriptExtender/Config.json",
    "Mods/${Name}/ScriptExtender/Lua/BootstrapClient.lua",
    "Mods/${Name}/ScriptExtender/Lua/BootstrapServer.lua",
    "Mods/${Name}/ScriptExtender/Lua/Server/${Name}.lua",
  ];

  assetPaths: string[] = [
    "Generated/Public/${Name}/Assets/DDS",
    "Generated/Public/${Name}/Assets/GR2",
    "Public/${Name}/Content/Assets/Characters/[PAK]_Armor/Materials",
    "Public/${Name}/Content/Assets/Characters/[PAK]_Armor/Meshes",
    "Public/${Name}/Content/Assets/Characters/[PAK]_Armor/Textures",
  ];

  constructor(author: string, name: string, wsPath?: string) {
    this.author = author;
    this.name = name;

    let uuid = new Uuid();
    this.modUuid = uuid.uuid;
    this.iconUuid = uuid.get();
    this.language = getDisplayLanguageName();
    this.workspacePath = wsPath ?? path.join(getWorkspacePath(), this.name);
  }
}

export function format(text: string): string {
  
  return text;
}

/**
 *
 * @param folder: ```TemplateFolder``` attempt to make a folder. does not if it exists.
 */
export async function makeModFolder(folder: TemplateFolder) {
  if (folder.stats?.isDirectory()) {
    return;
  }
  fs.mkdir(folder.path, { recursive: true }, (err) => {
    console.log(err);
  });
}

/**
 *
 * @param file: ```TemplateFile``` attempt to make a file. does not if it exists.
 */
export async function makeModFile(file: TemplateFile) {
  if (file.stats?.isFile()) {
    return;
  }

  fs.writeFile(file.path, file.content, (err) => {
    console.log(err);
  });
}

export async function makeModTemplate(): Promise<void> {
  /*const modName: string | undefined = await vscode.window.showInputBox({
    title: "mod name?",
  });*/
  /*const authorName: string | undefined = await vscode.window.showInputBox({
    title: "author name?",
  });*/
  const modName = "test";
  const authorName = "kayaaaaaaa";
  if (authorName === undefined || modName === undefined) {
    return;
  }

  let mt = new ModTemplate(authorName, modName);

  for (let file of mt.modPaths) {
    let f = new TemplateFile(mt.workspacePath);
  }
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

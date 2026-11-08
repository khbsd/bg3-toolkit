import * as fs from "fs";
import * as path from "path";
import { Uuid } from "../uuid_handle";
import { getDisplayLanguageName, getWorkspacePath } from "../ws";
import { getTemplateText } from "../xml";

const templatesPath: string = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "src",
  "utils",
  "templates",
  "files",
);

// maybe unneeded
enum ModVars {
  author,
  iconUuid,
  language,
  modUuid,
  name,
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

export interface TemplateFolder {
  path: string;
}

export class TemplateFolder {
  name?: string;
  path: string;
  stats?: fs.Stats | undefined = undefined;

  constructor(tf: TemplateFolder) {
    this.name = path.basename(tf.path);
    this.path = tf.path;
    try {
      this.stats = fs.statSync(this.path);
    } catch (err) {}
  }
}

export interface TemplateFile {
  path: string;
  content: string;
}

export class TemplateFile extends TemplateFolder {
  content: string;

  constructor(tf: TemplateFile) {
    super({ path: tf.path });
    this.content = tf.content ?? "";
  }
}

export class ModTemplate {
  // named this way so they align with the names of the placeholders
  author: string;
  name: string;
  modUuid: string;
  iconUuid: string;
  language: string;
  workspacePath: string;

  modPaths: TemplateFile[] = [
    {
      path: "Localization/${language}/${name}_Loca.xml",
      content: getTemplateText(),
    },
    {
      path: "Mods/${name}/meta.lsx",
      content: path.join(templatesPath, "meta_lsx.txt"),
    },
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
      path: "Public/${name}/Assets/Textures/Icons/${name}_Icons.dds",
    },
  ];
  itemPaths_files: TemplateFile[] = [
    {
      path: "Public/${name}/Content/UI/[PAK]_UI/_merged.lsx",
      content: path.join(templatesPath, "_merged_lsf.txt"),
    },
    {
      path: "Public/${name}/GUI/Icons_Items.lsx",
      content: path.join(templatesPath, "icons_items.txt"),
    },
    {
      path: "Public/${name}/RootTemplates/${name}.lsx",
      content: path.join(templatesPath, "root_template_lsf.txt"),
    },
    {
      path: "Public/${name}/Stats/Generated/Data/${name}_Stats.txt",
      content: "",
    },
    { path: "Public/${name}/Stats/Generated/TreasureTable.txt", content: "" },
  ];

  // TODO: change from string[] to TemplateFile[]
  // need to set up .txt placeholder files for a couple of them
  scriptPaths: string[] = [
    "Mods/${name}/ScriptExtender/Config.json",
    "Mods/${name}/ScriptExtender/Lua/BootstrapClient.lua",
    "Mods/${name}/ScriptExtender/Lua/BootstrapServer.lua",
    "Mods/${name}/ScriptExtender/Lua/Server/${name}.lua",
  ];

  // TODO: change from string[] to TemplateFolder[]
  assetPaths: string[] = [
    "Generated/Public/${name}/Assets/DDS",
    "Generated/Public/${name}/Assets/GR2",
    "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Materials",
    "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Meshes",
    "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Textures",
  ];

  constructor(author: string, name: string, wsPath?: string) {
    this.author = author;
    this.name = name;

    let uuid = new Uuid();
    this.modUuid = uuid.uuid;
    this.iconUuid = uuid.get();
    this.language = getDisplayLanguageName().name;
    this.workspacePath = wsPath ?? path.join(getWorkspacePath(), this.name);
  }
}

// if it has the content property: TemplateFile
// if it has the width property: TemplateDds
// if it has neither: TemplateFolder
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
}

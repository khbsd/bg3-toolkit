import * as fs from "fs";
import * as path from "path";

import { consoleWebviewLog } from "../../webview/console";
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

const modFiles: TemplateFile[] = [
  {
    path: "Localization/${language}/${name}_Loca.xml",
    content: getTemplateText(),
  },
  {
    path: "Mods/${name}/meta.lsx",
    content: path.join(templatesPath, "meta_lsx.txt"),
  },
];

const itemDds: TemplateDds[] = [
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
const itemFiles: TemplateFile[] = [
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

const scriptFiles: TemplateFile[] = [
  {
    path: "Mods/${name}/ScriptExtender/Config.json",
    content: path.join(templatesPath, "config_json.txt"),
  },
  {
    path: "Mods/${name}/ScriptExtender/Lua/BootstrapClient.lua",
    content: "",
  },
  {
    path: "Mods/${name}/ScriptExtender/Lua/BootstrapServer.lua",
    content: "",
  },
  { path: "Mods/${name}/ScriptExtender/Lua/Server/${name}.lua", content: "" },
];

// TODO: change from string[] to TemplateFolder[]
const assetPaths: TemplateFolder[] = [
  { path: "Generated/Public/${name}/Assets/DDS" },
  { path: "Generated/Public/${name}/Assets/GR2" },
  { path: "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Materials" },
  { path: "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Meshes" },
  { path: "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Textures" },
];

enum ModInfoType {
  dds,
  file,
  folder,
}

// maybe unneeded
enum ModVars {
  author,
  iconUuid,
  language,
  modUuid,
  name,
}

export interface TemplateDds {
  width: number;
  height?: number;
  name?: string;
  path: string;
}

export class TemplateDds {
  constructor(td: TemplateDds) {}
}

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

export type ModOptions = {
  wsPath?: string;
  assets?: boolean;
  items?: boolean;
  scripting?: boolean;
};

export class ModTemplate {
  // named this way so they align with the names of the placeholders
  author: string;
  name: string;
  modUuid: string;
  iconUuid: string;
  language: string;
  workspacePath: string;
  seVersion: number = 33; // latest version as of typing this. dynamically updated
  opts?: {
    assets?: boolean;
    items?: boolean;
    scripting?: boolean;
  };

  modFiles: TemplateFile[] = [];
  modImages: TemplateDds[] = [];
  modPaths: TemplateFolder[] = [];

  constructor(author: string, name: string, opts?: ModOptions) {
    this.author = author;
    this.name = name;
    this.opts = opts;
    if (this.opts?.assets === true) {
      this.opts.items = true;
    }

    let uuid = new Uuid();
    this.modUuid = uuid.uuid;
    this.iconUuid = uuid.get();
    this.language = getDisplayLanguageName().name;
    this.workspacePath =
      opts?.wsPath ?? path.join(getWorkspacePath(), this.name);

    this.getSeVersion().then((ver) => {
      this.seVersion = ver;
    });

    this.format();
  }

  // do path placeholders first and then any content
  private format(): void {
    function _f(mt: ModTemplate, text: string): string {
      for (const attr of Object.keys(mt)) {
        const key = attr as keyof typeof mt;
        let attrVal = mt[key];
        if (typeof attrVal === "string") {
          const ph = "${" + key + "}";
          while (text.includes(ph)) {
            text = text.replace("${" + key + "}", attrVal);
          }
        }
      }
      console.log(text);
      return text;
    }

    // TODO: add workspace path to file.path
    function _addFiles(mt: ModTemplate, files: TemplateFile[]) {
      for (let file of files) {
        // check for path here, then get content
        for (let attr of Object.keys(file)) {
          const key = attr as keyof typeof file;
          if (file[key] === "string") {
            //@ts-ignore
            file[key] = _f(mt, file[key]);
          }
        }
        mt.modFiles.push(new TemplateFile(file));
      }
    }
    function _addDds(mt: ModTemplate, files: TemplateDds[]) {
      for (const image of files) {
        mt.modImages.push(new TemplateDds(image));
      }
    }
    function _addPaths(mt: ModTemplate, folders: TemplateFolder[]) {
      for (const folder of folders) {
        for (let attr of Object.keys(folder)) {
          const key = attr as keyof typeof folder;
          if (typeof folder[key] === "string") {
            // @ts-ignore
            folder[key] = _f(mt, folder[key]);
          }
        }
        mt.modPaths.push(new TemplateFolder(folder));
      }
    }

    _addFiles(this, modFiles);
    if (this.opts?.assets) {
      _addFiles(this, itemFiles);
      _addDds(this, itemDds);
      _addPaths(this, assetPaths);
    } else if (this.opts?.items && !this.opts?.assets) {
      _addFiles(this, itemFiles);
      _addDds(this, itemDds);
    }
    if (this.opts?.scripting) {
      _addFiles(this, scriptFiles);
    }
    console.log(this);
  }

  private async getSeVersion(): Promise<number> {
    let ver: number = 33;
    try {
      let res: Response = await fetch(
        "https://api.github.com/repos/Norbyte/bg3se/releases/latest",
        { method: "GET" },
      );

      let gitData: string | any = await res.json();
      ver = Number(gitData.tag_name.slice(1));
      consoleWebviewLog("found latest bg3se version:", ver);
    } catch (err) {
      consoleWebviewLog(err);
    }

    //console.log("http req", req);
    return ver;
  }
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
  const modName = "MOD_NAME";
  const authorName = "kayaaaaaaa";
  if (authorName === undefined || modName === undefined) {
    return;
  }

  let mt = new ModTemplate(authorName, modName, {
    assets: true,
    scripting: true,
  });
}

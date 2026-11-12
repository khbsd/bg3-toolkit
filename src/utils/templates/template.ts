import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { consoleWebviewLog } from "../../webview/console";
import { getModPath } from "../file";
import { getMetaFile, getModInfoFromMeta } from "../meta";
import { Handle, Uuid } from "../uuid_handle";
import { getDisplayLanguageName, getWorkspacePath } from "../ws";
import { generateDds } from "./dds";

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
    content: path.join(templatesPath, "loca_xml.txt"),
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
    content: path.join(templatesPath, "icons_items_lsx.txt"),
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

export interface TemplateDds {
  width: number;
  height?: number;
}

export class TemplateDds extends TemplateFolder {
  width: number;
  height?: number;
  constructor(td: TemplateDds) {
    super({ path: td.path });
    this.width = td.width;
    if (td.height === undefined) {
      this.height = this.width;
    }
  }
}

export type ModOptions = {
  wsPath?: string;
  assets?: boolean;
  items?: boolean;
  scripting?: boolean;
  modUuid?: string;
  iconUuid?: string;
  name: string;
  author: string;
};

// TODO: if a metafile already exists, grab it and use it for these fields
// same for iconUuid
export class ModTemplate {
  // named this way so they align with the names of the placeholders
  author: string;
  name: string;
  modUuid: string;
  iconUuid: string;
  initHandle: string;
  language: string;
  wsPath: string;
  seVersion: number = 33; // latest version as of typing this. dynamically updated
  opts?: {
    assets?: boolean;
    items?: boolean;
    scripting?: boolean;
  };

  modFiles: TemplateFile[] = [];
  modImages: TemplateDds[] = [];
  modPaths: TemplateFolder[] = [];

  constructor(opts: ModOptions) {
    this.author = opts.author;
    this.name = opts.name;
    this.opts = opts;
    if (this.opts?.assets === true) {
      this.opts.items = true;
    }

    const uuid = new Uuid();
    const handle = new Handle();
    this.modUuid = opts?.modUuid ?? uuid.uuid;
    this.iconUuid = opts?.iconUuid ?? uuid.get();
    this.initHandle = handle.handle;
    this.language = getDisplayLanguageName().name;
    this.wsPath = opts?.wsPath ?? path.join(getWorkspacePath(), this.name);
  }

  public format(): void {
    function _f(mt: ModTemplate, text: string): string {
      for (const attr of Object.keys(mt)) {
        const key = attr as keyof typeof mt;
        let val = mt[key];
        if (typeof val === "string" || typeof val === "number") {
          text = text.replaceAll("${" + key + "}", val.toString());
        }
      }
      return text;
    }

    function _resolveModPath(text: string, wsPath: string): string {
      if (!text.includes(wsPath)) {
        text = path.join(wsPath, text);
      }
      return text;
    }

    function _addFiles(mt: ModTemplate, files: TemplateFile[]) {
      for (let file of files) {
        file.path = _f(mt, _resolveModPath(file.path, mt.wsPath));
        if (file.content.length > 0) {
          file.content = _f(
            mt,
            fs.readFileSync(path.normalize(file.content)).toString(),
          );
        }
        mt.modFiles.push(new TemplateFile(file));
      }
    }
    function _addDds(mt: ModTemplate, files: TemplateDds[]) {
      for (const image of files) {
        image.path = _f(mt, _resolveModPath(image.path, mt.wsPath));
        mt.modImages.push(new TemplateDds(image));
      }
    }
    function _addPaths(mt: ModTemplate, folders: TemplateFolder[]) {
      for (const folder of folders) {
        folder.path = _f(mt, _resolveModPath(folder.path, mt.wsPath));
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

  public async getSeVersion() {
    try {
      let res: Response = await fetch(
        "https://api.github.com/repos/Norbyte/bg3se/releases/latest",
        { method: "GET" },
      );

      let gitData: string | any = await res.json();
      this.seVersion = Number(gitData.tag_name.slice(1));
      consoleWebviewLog("found latest bg3se version:", this.seVersion);
    } catch (err) {
      consoleWebviewLog(err);
    }
  }

  public async build() {
    for (const file of this.modFiles) {
      if (file.stats?.isFile()) {
        continue;
      }

      fs.mkdirSync(path.dirname(file.path), { recursive: true });
      fs.writeFileSync(file.path, file.content, { flag: "wx" });
    }

    for (const folder of this.modPaths) {
      if (folder.stats?.isDirectory()) {
        continue;
      }

      fs.mkdir(folder.path, { recursive: true }, (err) => {
        console.log(err);
      });
    }

    for (const image of this.modImages) {
      generateDds(image.width, {
        height: image.height,
        name: image.name,
        path: image.path,
      });
    }
  }
}

// TODO: symlinking, partial mod recreation too
// ie, should be able to determine if mod exists, what parts exist, and use its name and uuid
export async function makeModTemplate(): Promise<void> {
  const v = vscode;
  const yesNo: string[] = ["yes", "no"];
  let modOpts: ModOptions = { name: "beep", author: "boop" };

  let mf = getMetaFile();
  if (mf !== undefined) {
    modOpts = getModInfoFromMeta(mf);
    return;
  } else {
  }

  console.log(getModPath(getWorkspacePath()));

  /*
  modOpts.name =
    (await vscode.window.showInputBox({
      title: "mod name?",
    })) ?? "";
  modOpts.author =
    (await vscode.window.showInputBox({
      title: "author name?",
    })) ?? "";
  if (modOpts.name.length === 0 || modOpts.author === undefined) {
    return;
  }
  
  let q = await vscode.window.showQuickPick(yesNo, {
    title: "assets?",
    prompt: "will this mod add custom assets?",
  });
  modOpts.assets = q === "yes";

  if (!modOpts.assets) {
    q = await vscode.window.showQuickPick(yesNo, {
      title: "items?",
      prompt: "will this mod add custom items?",
    });
    modOpts.items = q === "yes";
  } else {
    modOpts.items = modOpts.assets;
  }

  q = await vscode.window.showQuickPick(yesNo, {
    title: "scripting?",
    prompt: "will this mod use script extender scripting?",
  });
  modOpts.scripting = q === "yes";
  */

  let mt = new ModTemplate(modOpts);
  await mt.getSeVersion();
  mt.format();
  mt.build();
}

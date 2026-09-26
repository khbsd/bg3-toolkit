import * as vscode from "vscode";

export class Config extends Object {
  protected _config = vscode.workspace.getConfiguration("bg3-toolkit");

  // these are just garbo values that let me programmatically assign them in the constructor
  // "pRoPeRty has nO inItiAlIzeR aNd iS NoT dEfInItely aSsIgNEd in ThE coNsTrucToR." go to hell
  doNotPackEditables: boolean = false;
  conversionExcludeFiles: string[] = [];
  conversionExcludePaths: string[] = [];
  conversionNeededDirectories: string[] = [];
  customModPath: string = "";
  gameDataPath: string = "";
  installedModsPath: string = "";
  mergedLocalizationName: string = "";
  mergedLocalizationAllowDuplicates: boolean = false;

  constructor() {
    super();
    for (const obj of Object.keys(this._config)) {
      if (this.hasOwnProperty(obj)) {
        let cfg: any = this._config.get(obj);
        if (Array.isArray(Reflect.get(this, obj))) {
          cfg = cfg.split(",").map((f: any) => f.trim());
        }
        Reflect.set(this, obj, cfg);
      }
    }
  }
}

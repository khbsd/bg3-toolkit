import * as vscode from "vscode";

export class Config extends Object {
  protected _config = vscode.workspace.getConfiguration("bg3-toolkit");

  // these are just garbo values that let me programmatically assign them in the constructor
  doNotPackEditables: boolean = false;
  conversionExcludeFiles: string[] = [];
  conversionExcludePaths: string[] = [];
  conversionNeededDirectories: string[] = [];
  constructor() {
    super();
    for (const obj of Object.keys(this._config)) {
      if (this.hasOwnProperty(obj)) {
        let c: any = this._config.get(obj);
        if (Array.isArray(Reflect.get(this, obj))) {
          c = c.split(",").map((f: any) => f.trim());
        }
        Reflect.set(this, obj, c);
      }
    }
  }
}

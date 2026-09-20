import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';

export class Registrar {
  getCommandList(): vscode.Disposable[] {
    let commands: vscode.Disposable[] = [];

    for (const f of fs.readdirSync(path.join(__dirname, "commands"))) {
      const tempPath = path.join(__dirname, "commands", f);
      if (path.extname(tempPath) === ".js") {
        const c = require(tempPath);
        const disposable = new c.Command().get();
        commands.push(disposable);
      }
    }

    return commands;
  }
}

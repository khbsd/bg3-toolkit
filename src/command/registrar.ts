import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';

export class Registrar {
  getCommandList(): vscode.Disposable[] {
    let cmdPath = path.join(__dirname, "commands");
    let dir = fs.readdirSync(cmdPath);

    let commands: vscode.Disposable[] = [];
    for (let f of dir) {
      let tempPath = path.join(__dirname, "commands", f);
      if (path.extname(tempPath) === ".js") {
        let c = require(tempPath);
        let disposable = new c.Command().get();
        commands.push(disposable);
      }
    }

    return commands;
  }
}

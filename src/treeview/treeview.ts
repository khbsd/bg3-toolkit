import * as vscode from 'vscode';
import * as path from 'path';

export class ToolkitTreeProvider implements vscode.TreeDataProvider<ToolkitTreeView> {
  constructor(private workspaceRoot: string | undefined) {}
  getTreeItem(element: ToolkitTreeView): vscode.TreeItem {
    console.log(this.workspaceRoot);
    console.log(element);
    return element;
  }
  getChildren(element?: ToolkitTreeView): Thenable<ToolkitTreeView[]> {
    console.log(this.workspaceRoot);
    console.log(element);

    return Promise.resolve([]);
 }
}

class ToolkitTreeView extends vscode.TreeItem {
  constructor (public readonly path: string) {
      super(path);
  }

  tkIconPath: vscode.Uri = vscode.Uri.parse(__filename.concat('..', '..', 'resources', 'icon', 'icon.svg'));
  // icon attribution:
  // - square brackets ("[", "]"): https://github.com/tonsky/FiraCode, Fira Code OFL license
  // - d20 vector: https://opensvg.dev/icons/action?prefix=fa-solid&icon=dice-d20, by dave gandy (c) CC BY 4.0

  iconPath = {
    light: this.tkIconPath,
    dark: this.tkIconPath
  };

  iconCheck(): void {
    console.log(this.tkIconPath);
  }
}

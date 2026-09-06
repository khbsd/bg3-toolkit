import * as vscode from 'vscode';
import * as path from 'path';

export class WorkspaceTreeViewProvider implements vscode.TreeDataProvider<ToolkitTreeView> {
  constructor(private workspaceRoot: string) {}
  getTreeItem(element: ToolkitTreeView): vscode.TreeItem {
    return element;
  }
  getChildren(element?: ToolkitTreeView): Thenable<ToolkitTreeView[]> {
    if (element) {
      element.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      return Promise.resolve([element]);
    }
    else {
      return Promise.resolve([]);
    }
  }
}

class ToolkitTreeView extends vscode.TreeItem {
  constructor (public readonly path: string, public collapse: vscode.TreeItemCollapsibleState) {
    path = path ?? __dirname;
    super(path, collapse);
    this.label = path;
    this.description = path;
    this.collapsibleState = collapse;
  }

  tkIconPath: vscode.Uri = vscode.Uri.parse(__filename.concat(path.join('..', '..', 'resources', 'icon', 'icon.svg')));
  // icon attribution:
  // - square brackets ("[", "]"): https://github.com/tonsky/FiraCode, Fira Code OFL license
  // - d20 vector: https://opensvg.dev/icons/action?prefix=fa-solid&icon=dice-d20, by dave gandy (c) CC BY 4.0

  iconPath = {
    light: this.tkIconPath,
    dark: this.tkIconPath
  };
}

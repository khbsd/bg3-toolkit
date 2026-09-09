// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();
  let window = vscode.window;

  document.querySelector(".pack-button").addEventListener("click", () => {
    vscode.postMessage({ type: "pack", message: "packing files" });
  });
  // TODO: this
  /*document.querySelector(".pack-button").addEventListener("click", () => {
    vscode.postMessage({ type: "unpack", message: "select a .pak fi" });
  });*/
  document.querySelector(".lsx-button").addEventListener("click", () => {
    vscode.postMessage({ type: "lsx", message: "converting lsx files" });
  });
  document.querySelector(".lsf-button").addEventListener("click", () => {
    vscode.postMessage({ type: "lsf", message: "converting lsf files" });
  });
  document.querySelector(".locaxml-button").addEventListener("click", () => {
    vscode.postMessage({
      type: "loca.xml",
      message: "converting loca.xml files",
    });
  });
  document.querySelector(".loca-button").addEventListener("click", () => {
    vscode.postMessage({ type: "loca", message: "converting loca files" });
  });
})();

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();
  let window = vscode.window;

  document.querySelector(".pack-button").addEventListener("click", () => {
    vscode.postMessage({ type: "pak", message: "packing files" });
  });
  document.querySelector(".unpack-button").addEventListener("click", () => {
    vscode.postMessage({
      type: "unpack",
      message: "select a .pak file and its destination",
    });
  });
  document.querySelector(".lsx-button").addEventListener("click", () => {
    vscode.postMessage({ type: "lsx", message: "converting lsx files" });
  });
  document.querySelector(".lsf-button").addEventListener("click", () => {
    vscode.postMessage({ type: "lsf", message: "converting lsf files" });
  });
  document.querySelector(".xml-button").addEventListener("click", () => {
    vscode.postMessage({
      type: "xml",
      message: "converting xml files",
    });
  });
  document.querySelector(".loca-button").addEventListener("click", () => {
    vscode.postMessage({ type: "loca", message: "converting loca files" });
  });
})();

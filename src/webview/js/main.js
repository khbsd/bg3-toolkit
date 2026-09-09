// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();
  let window = vscode.window;

  document.querySelector(".pack-button").addEventListener("click", () => {
    vscode.postMessage({ type: "beep", message: "boop" });
  });
})();

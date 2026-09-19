// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();
  let window = vscode.window;

  const buttonInfo = [
    { class: ".pack-button", type: "pak", msg: "packing files" },
    {
      class: ".unpack-button",
      type: "unpack",
      msg: "select a .pak file and its destination",
    },
    { class: ".lsx-button", type: "lsx", msg: "converting lsx files" },
    { class: ".lsf-button", type: "lsf", msg: "converting lsf files" },
    { class: ".xml-button", type: "xml", msg: "converting xml files" },
    { class: ".loca-button", type: "loca", msg: "converting loca files" },
    { class: ".debug", type: "debug", msg: "de bug clicked 🐛" },
  ];

  let listenersAdded = false;

  for (let i = 0; i < buttonInfo.length && !listenersAdded; i++) {
    let b = buttonInfo[i];
    document.querySelector(b.class).addEventListener("click", () => {
      vscode.postMessage({ type: b.type, message: b.msg });
    });

    listenersAdded = buttonInfo.length - 1 === i;
  }
})();

(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();

  const buttonInfo = [
    {
      class: ".copy-button",
      listener: "click",
      type: "copy",
      msg: "copying log text",
    },
    {
      class: ".clear-button",
      listener: "click",
      type: "clear",
      msg: "clearing log text",
    },
  ];

  let listenersAdded = false;

  for (let i = 0; i < buttonInfo.length && !listenersAdded; i++) {
    let b = buttonInfo[i];
    document.querySelector(b.class).addEventListener(b.listener, () => {
      vscode.postMessage(b);
    });

    listenersAdded = buttonInfo.length - 1 === i;
  }
})();

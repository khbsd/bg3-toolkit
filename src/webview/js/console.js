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
  
  for (let i = 0, listenersAdded = false; i < buttonInfo.length && !listenersAdded; i++) {
    let b = buttonInfo[i];
    document.querySelector(b.class).addEventListener(b.listener, () => {
      vscode.postMessage(b);
    });

    listenersAdded = buttonInfo.length - 1 === i;
  }

  window.addEventListener("message", (event) => {
    if (event.data === "scroll-update") {
      document.getElementById("console").scrollTo(0, 1000000000000);
      vscode.postMessage({ msg: "scroll updated" })
    }
  });
})();

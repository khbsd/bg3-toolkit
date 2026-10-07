(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();
  let window = vscode.window;

  const buttonInfo = [
    {
      class: ".pack-button",
      listener: "click",
      type: "pak",
      msg: "packing files",
    },
    {
      class: ".unpack-button",
      listener: "click",
      type: "unpack",
      msg: "select a .pak file and its destination",
    },
    {
      class: ".lsx-button",
      listener: "click",
      type: "lsx",
      msg: "converting lsx files",
    },
    {
      class: ".lsf-button",
      listener: "click",
      type: "lsf",
      msg: "converting lsf files",
    },
    {
      class: ".xml-button",
      listener: "click",
      type: "xml",
      msg: "converting xml files",
    },
    {
      class: ".loca-button",
      listener: "click",
      type: "loca",
      msg: "converting loca files",
    },
    {
      class: ".debug",
      listener: "click",
      type: "debug",
      msg: "de bug clicked 🐛",
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

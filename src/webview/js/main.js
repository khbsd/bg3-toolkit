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
      class: ".lsx",
      listener: "mouseenter",
      type: "text-button-lsx-mouseenter",
      msg: ".lsx-button-highlight",
    },
    {
      class: ".lsf",
      listener: "mouseenter",
      type: "text-button-lsf-mouseenter",
      msg: ".lsf-button-highlight",
    },
    {
      class: ".lsx",
      listener: "mouseleave",
      type: "text-button-lsx-mouseleave",
      msg: ".lsx-button",
    },
    {
      class: ".lsf",
      listener: "mouseleave",
      type: "text-button-lsf-mouseleave",
      msg: ".lsf-button",
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
      vscode.postMessage({ type: b.type, message: b.msg });
    });

    listenersAdded = buttonInfo.length - 1 === i;
  }
})();

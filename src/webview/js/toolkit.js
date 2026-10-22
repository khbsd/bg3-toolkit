(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();

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
      type: "unpak",
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

  const versionInfo = [
    {
      class: ".major",
      listener: "input",
      type: "version",
      msg: "major version changed",
      version: [],
    },
    {
      class: ".minor",
      listener: "input",
      type: "version",
      msg: "minor version changed",
      version: [],
    },
    {
      class: ".revision",
      listener: "input",
      type: "version",
      msg: "revision version changed",
      version: [],
    },
    {
      class: ".build",
      listener: "input",
      type: "version",
      msg: "build version changed",
      version: [],
    },
  ];

  let msg = {
    type: "version-load",
    version: [],
    msg: "mod version found, doing",
  };
  for (let i = 0; i < versionInfo.length; i++) {
    msg.version.push(document.querySelector(versionInfo[i].class).innerText);
  }
  vscode.postMessage(msg);

  window.addEventListener("message", (event) => {
    if (
      event.data.type === "major" ||
      event.data.type === "minor" ||
      event.data.type === "revision" ||
      event.data.type === "build"
    ) {
      let val = (document.querySelector("." + event.data.type).value =
        event.data.content);

      while (val.charAt(0) === "0" && val.length >= 2) {
        document.querySelector("." + event.data.type).value = val =
          val.slice(1);
      }
    }
  });

  for (
    let i = 0, buttonListenersAdded = false;
    i < buttonInfo.length && !buttonListenersAdded;
    i++
  ) {
    let b = buttonInfo[i];
    document.querySelector(b.class).addEventListener(b.listener, () => {
      vscode.postMessage(b);
    });

    buttonListenersAdded = buttonInfo.length - 1 === i;
  }

  for (
    let i = 0, versionListenersAdded = false;
    i < versionInfo.length && !versionListenersAdded;
    i++
  ) {
    let v = versionInfo[i];
    document.querySelector(v.class).addEventListener(v.listener, () => {
      try {
        Number(document.querySelector(v.class).value);
      } catch (err) {
        document.querySelector(v.class).value = 0;
        return;
      }
      let msg = {
        type: "version-update",
        version: [],
      };
      for (let i = 0; i < versionInfo.length; i++) {
        let val = document.querySelector(versionInfo[i].class).value;
        msg.version.push(val);
        //vscode.postMessage(val);
      }
      vscode.postMessage(msg);
    });
    versionListenersAdded = versionInfo.length - 1 === i;
  }
})();

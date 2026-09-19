import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";

import * as futils from "../file";
import { Lsx } from "./lsx";
import { Xml } from "./loca_xml";
import { FileFormats, ConvertCommon } from "./formats";

export class Pak extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, { type: FileFormats.pak, modPath: modPath });
  }

  public build() {
    let builder = new lsPak.PakBuilder();
    new Lsx(this.wsPath).convertModDir();
    new Xml(this.wsPath).convertModDir();

    for (let file of this.files) {
      let fContents = fs.readFileSync(file.path);
      console.log(
        "adding file: ",
        futils.getRelativeModPath(this.modPath, file.path),
      );
      try {
        builder.add_file(
          futils.getRelativeModPath(this.modPath, file.path),
          new Uint8Array(fContents),
        );
      } catch (err) {
        console.log(err);
      }
    }

    try {
      let packed = builder.pack();
      let modDestPath = path.join(
        this.wsPath,
        futils.getModName(this.modPath) + ".pak",
      );

      // console.log("packing file: ", modDestPath);
      fs.writeFileSync(modDestPath, Buffer.from(packed), { flag: "w+" });
    } catch (err) {
      console.log(err);
    }
  }
}

// doesnt need to extend anything since its all contained in the pak
export class Unpak {
  wsPath: string;
  unpakPath: string;
  constructor(wsPath: string, unpakPath?: string) {
    this.wsPath = futils.fixPath(wsPath);
    this.unpakPath = unpakPath ?? path.resolve(this.wsPath, "..");
  }

  public unpack(): void {
    if (
      !path.basename(this.wsPath).includes("." + FileFormats[FileFormats.pak])
    ) {
      return;
    }
    let unpacked: lsPak.ModFile[];

    console.log(".pak file found at " + this.wsPath + ", unpacking");

    try {
      unpacked = lsPak.unpack(fs.readFileSync(this.wsPath));
      console.log(unpacked);
    } catch (err) {
      console.log(err);
      return;
    }

    for (const file of unpacked) {
      console.log(file);
      let fullPath: string = path.join(
        futils.getModPath(path.resolve(this.wsPath, "..")),
        file.extract_path(),
      );
      try {
        fs.writeFileSync(fullPath, Buffer.from(file.extract_contents()), {
          flag: "w",
        });
        console.log(fullPath);
      } catch (err) {
        console.log(err);
      }
    }
  }
}

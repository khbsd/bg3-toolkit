import * as formats from "../utils/ls-utils/formats";
import { getWorkspacePath } from "../utils/ws_utils";
import { FileFormats, File } from "../utils/ls-utils/formats";
import { Lsx, Lsf } from "../utils/ls-utils/lsx";
import { Pak, Unpak } from "../utils/ls-utils/pak";
import { Loca, Xml } from "../utils/ls-utils/loca_xml";

export class ConvertCommand {
  file: File;
  constructor(path: string) {
    this.file = new File(path);
    this._convert();
  }

  private _convert() {
    switch (FileFormats[this.file.out_ext as keyof typeof FileFormats]) {
      case FileFormats.lsx:
        let lsx = new Lsx(getWorkspacePath());
        lsx.convertFile(this.file);
        break;
      default:
      case FileFormats.lsf:
        let lsf = new Lsf(getWorkspacePath());
        lsf.convertFile(this.file);
        break;
      case FileFormats.xml:
        let xml = new Lsx(getWorkspacePath());
        xml.convertFile(this.file);
        break;
      case FileFormats.loca:
        let loca = new Lsx(getWorkspacePath());
        loca.convertFile(this.file);
        break;
    }
  }
}

export class ConvertAllCommand {}

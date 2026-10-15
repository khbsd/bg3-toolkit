import * as fs from "fs";

import { consoleWebviewLog } from "../webview/console";
import { getMetaFile } from "./file";

export enum Version64Parts {
  major,
  minor,
  revision,
  build,
  count,
}

export type Version64Part = {
  shift: bigint,
  mask: bigint,
};

export var Version64Def: Version64Part[] = [];
{
  Version64Def[Version64Parts.major] = {
    shift: BigInt(55),
    mask: BigInt(0xFF),
  };
  Version64Def[Version64Parts.minor] = {
    shift: BigInt(47),
    mask: BigInt(0xFF),
  };
  Version64Def[Version64Parts.revision] = {
    shift: BigInt(31),
    mask: BigInt(0xFFFF),
  };
  Version64Def[Version64Parts.build] = {
    shift: BigInt(0),
    mask: BigInt(0x7FFFFFFF),
  };
}

/**
 * class with tools for working with the version64 versioning format.
 */
export class Version64 {
  def: Version64Part[] = Version64Def;
  /**
   * good to use with "matchAll"
   *
   */
  re: RegExp = new RegExp(/type="int64"\s+value="(?<version>[\d]+)/, "g");

  /**
   *
   * @param nums an ```array``` of ```bigint```s in the order of your version; ie version 1.0.8.0 would be ```[1, 0, 8, 0]```.
   * also accepts a string representing the version, ie ```"1.0.8.0"```
   * @returns ```bigint``` in version64 format representing your version, ie ```36028814198833152```
   */
  public version64Build(nums: bigint[] | string): bigint {
    let version: bigint = 0n;

    if (typeof nums === "string") {
      nums = nums.split(".").map((n) => BigInt(n));
    }

    for (let i = 0; i < Version64Parts.count; i++) {
      version |= nums[i] << this.def[i].shift;
    }

    return version;
  };

  /**
   *
   * @param version a ```bigint``` or ```number``` representing your version number, ie ```36028814198833152```.
   * also accepts a ```string``` representing the version, ie ```"36028814198833152"```
   * @returns an ```array``` of ```number```s representing each part of the version number, so ```[major, minor, revision, build]```;
   * ie ```[1, 0, 8, 0]```
   *
   * can be descriptively accessed using the ```Version64Parts enum```, ie ```array[Version64Parts.revision]``` would be equal to ```8```
   */
  public version64Extract(version: bigint | string | number): number[] {
    let nums: number[] = [];

    if (typeof version === "string" || typeof version === "number") {
      version = BigInt(version);
    }

    for (let i = 0; i < Version64Parts.count; i++) {
      let part: Version64Part = this.def[i];
      nums.push(Number((version >> part.shift) & part.mask));
    }

    return nums;
  }

  public getVersionInMeta(): number[] {
    const metaPath: string = getMetaFile()?.path ?? "";
    let metaFileContents: string = fs.readFileSync(metaPath).toString();
    let firstResult = "";

    for (const result of metaFileContents.matchAll(this.re)) {
      if (firstResult.length === 0) {
        firstResult = result.groups?.version ?? "";
      }

      if (firstResult !== result.groups?.version) {
        break;
      }
    }
    return this.version64Extract(BigInt(firstResult));
  }

  public updateVersionInMeta(version: bigint | string): void {
    if (typeof version === "bigint") {
      version = version.toString();
    }

    const metaPath: string = getMetaFile()?.path ?? "";
    let metaFileContents: string = fs.readFileSync(metaPath).toString();

    let logged: boolean = false;
    for (const result of metaFileContents.matchAll(this.re)) {
      if (result.groups === undefined) {
        return;
      }
      const resultVersion = result.groups.version;
      const line = result[0].slice(0, result[0].length - resultVersion.length);
      if (!logged) {
        consoleWebviewLog("replacing", resultVersion, "with", version);
        logged = true;
      }
      metaFileContents = metaFileContents.replace(line + resultVersion, line + version);
    }
    fs.writeFileSync(metaPath, metaFileContents, { flag: "w" });
  }
}

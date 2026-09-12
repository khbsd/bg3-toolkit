import * as fs from "fs";
import * as path from "path";

export enum EditableFileType {
  lsx,
  lsfx,
  lsfex,
  xml,
}

export enum NonEditableFileType {
  lsf,
  lsb,
  lsj,
  loca,
}

export type FileTypeObj = {
  name: string;
  value: number;
  data: string;
}

export class FileFormats {
  constructor() {}
  public getEditableNames(): string[] {
    let names: string[] = [];
    Object.values(EditableFileType).forEach((value) => {
      if (typeof value === "string") {
        names.push(value);
      }
    });

    return names;
  }

  public getEditableValues(): number[] {
    let values: number[] = [];
    Object.values(EditableFileType).forEach((value) => {
      if (typeof value === "number") {
        values.push(value);
      }
    });

    return values;
  }

  public getEditableObjs(fillVals: string[]): FileTypeObj[] {
    let obj: FileTypeObj[] = [];
    let names: string[] = this.getEditableNames();
    let values: number[] = this.getEditableValues();
    for (let value of values) {
      let tempobj: FileTypeObj = {
        name: names[value],
        value: value,
        data: fillVals[value],
      };
      obj.push(tempobj);
    }
    return obj;
  }

  public getNonEditableNames(): string[] {
    let names: string[] = [];
    Object.values(NonEditableFileType).forEach((value) => {
      if (typeof value === "string") {
        names.push(value);
      }
    });

    return names;
  }

  public getNonEditableValues(): number[] {
    let values: number[] = [];
    Object.values(NonEditableFileType).forEach((value) => {
      if (typeof value === "number") {
        values.push(value);
      }
    });

    return values;
  }
}

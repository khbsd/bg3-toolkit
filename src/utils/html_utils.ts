export enum HtmlData {
  Nonce,
  ScriptSrc,
  StyleSrc,
  CspSrc,
  WorkspacePath,
}

export type HtmlDataObj = {
  name: string;
  value: number;
  data: string;
};

export class HtmlDataUtils {
  constructor() {}

  public getNames(): string[] {
    let names: string[] = [];
    Object.values(HtmlData).forEach((value) => {
      if (typeof value === "string") {
        names.push(value);
      }
    });

    return names;
  }

  public getValues(): number[] {
    let values: number[] = [];
    Object.values(HtmlData).forEach((value) => {
      if (typeof value === "number") {
        values.push(value);
      }
    });

    return values;
  }

  public getObjs(fillVals: string[]): HtmlDataObj[] {
    let obj: HtmlDataObj[] = [];
    let names: string[] = this.getNames();
    let values: number[] = this.getValues();
    for (let value of values) {
      let tempobj: HtmlDataObj = {
        name: names[value],
        value: value,
        data: fillVals[value],
      };
      obj.push(tempobj);
    }
    return obj;
  }

  public getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

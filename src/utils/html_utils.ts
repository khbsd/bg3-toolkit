import * as eutils from "./enum_utils";
export enum HtmlData {
  Nonce,
  ScriptSrc,
  StyleSrc,
  CspSrc,
  WorkspacePath,
  count,
}

export class HtmlDataUtils {
  constructor() {}

  public getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public formatHtml(html: string, fv: string[]): string {
    // programmatically find and replace the placeholder values from the html file we read
    for (let obj of eutils.getObjFromEnum(HtmlData, fv)) {
      if (obj.data) {
        html = html.replaceAll("${" + obj.name + "}", obj.data);
      }
    }
    return html;
  }
}

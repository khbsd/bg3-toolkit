export const chars: string[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
];

const illegal = "fag";
const value_length: number = 36;
const dash_pos: number[] = [8, 13, 18, 23];

export enum UuidHandle {
  Uuid,
  Enum,
}

export function getChar(): string {
  return chars[Math.floor(Math.random() * chars.length)];
}

export class Uuid {
  re: RegExp;
  uuid: string;
  constructor() {
    this.re = /(?<uuid>[A-Ga-g\d]{8}-(?:[A-Ga-g\d]{4}-){3}[A-Ga-g\d]{12})/;
    this.uuid = this.get();
  }

  public get(): string {
    let uuid: string = "";
    for (let p = 0; p < value_length; p++) {
      if (dash_pos.includes(p)) {
        uuid += "-";
      } else {
        uuid += getChar();
      }
    }
    if (uuid.includes(illegal)) {
      return this.get();
    }
    return uuid;
  }
}

export class Handle {
  re: RegExp;
  handle: string;
  constructor() {
    this.re = /(?<handle>[hH][A-Ga-g\d]{36})/;
    this.handle = this.get();
  }

  public get(): string {
    let handle: string = "h";
    for (let p = 0; p < value_length; p++) {
      handle += getChar();
    }

    if (handle.includes(illegal)) {
      handle = this.get();
    }
    return handle;
  }
}

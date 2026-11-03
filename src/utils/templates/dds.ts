import * as fs from "fs";
import * as path from "path";
import { getWorkspacePath } from "../ws";

const UINT_MAX: number = 4294967295;

const DDS_HEIGHT_OFFSET: number = 12;
const DDS_WIDTH_OFFSET: number = 16;
const DDS_PITCH_OFFSET: number = 20;

export function getPitch(height: number, width: number) {
  return Math.floor(Math.max(1, width / 4) * Math.max(1, height / 4));
}

/*
 * @param val number, but capped at 4294967295 (uint32 max)
 * @returns number[], array of 4 numbers that can be mapped to 4 bytes. least to most significant.
 */
export function toFourByte(val: number): number[] {
  if (val > UINT_MAX) {
    val = UINT_MAX;
  }

  let hexVal: string = val.toString(16);
  let hexVals: string[] = [];
  let intVals: number[] = [];

  while (hexVal.length < 8) {
    hexVal = "0" + hexVal;
  }

  let rmVals: number[] = [];
  hexVals = hexVal.split("");
  for (let valCounter = 0; valCounter < hexVal.length; valCounter++) {
    hexVals[valCounter] += hexVals[valCounter + 1];
    rmVals.push(valCounter + 1);
    valCounter++;
  }

  rmVals.toReversed().forEach((v) => {
    hexVals.splice(v, 1);
  });

  hexVals.forEach((byte) => {
    intVals.push(Number("0x" + byte));
  });
  return intVals.toReversed();
}

export function generateDds(
  height: number,
  width?: number,
  name?: string,
): void {
  if (width === undefined) {
    width = height;
  }
  let header: Buffer | undefined;
  let data: Buffer | undefined;
  let ddsBuf: number[] = [];

  const pitch: number = getPitch(height, width);
  const pitchBytes: number[] = toFourByte(pitch);
  const widthBytes: number[] = toFourByte(width);
  const heightBytes: number[] = toFourByte(height);

  try {
    header = fs.readFileSync(
      path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "src",
        "utils",
        "templates",
        "dds",
        "header",
      ),
    );
    data = fs.readFileSync(
      path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "src",
        "utils",
        "templates",
        "dds",
        "data",
      ),
    );
  } catch (err) {
    console.log(err);
  }

  if (header === undefined || data === undefined) {
    return;
  }

  header.forEach((byte) => {
    ddsBuf.push(byte);
  });

  for (let i = 0; i < 4; i++) {
    ddsBuf[DDS_WIDTH_OFFSET + i] = widthBytes[i];
    ddsBuf[DDS_HEIGHT_OFFSET + i] = heightBytes[i];
    ddsBuf[DDS_PITCH_OFFSET + i] = pitchBytes[i];
  }

  for (let i = 0; i < pitch; i++) {
    for (const byte of data) {
      ddsBuf.push(byte);
    }
  }

  try {
    fs.writeFileSync(
      path.join(getWorkspacePath(), "test.dds"),
      Buffer.from(ddsBuf),
      {
        flag: "w+",
      },
    );
  } catch (err) {
    console.log(err);
  }
}

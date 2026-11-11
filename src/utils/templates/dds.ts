import * as fs from "fs";
import * as path from "path";
import { getWorkspacePath } from "../ws";

const UINT_MAX: number = 4294967295;
const BYTE_SECTIONS: number = 4; // also good for certificate generation
const DDS_HEIGHT_OFFSET: number = 12;
const DDS_WIDTH_OFFSET: number = 16;
const DDS_PITCH_OFFSET: number = 20;

const filesDir: string = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "src",
  "utils",
  "templates",
  "dds",
);

export function getPitch(height: number, width: number) {
  return Math.floor(Math.max(1, width / 4) * Math.max(1, height / 4));
}

/**
 * @param val number, but capped at 4294967295 (uint32 max)
 * @returns number[], array of 4 numbers that can be mapped to 4 bytes, little endian.
 */
export function toFourByte(val: number): number[] {
  val = Math.min(UINT_MAX, val);

  let hexVal: string = val.toString(16);
  while (hexVal.length < 8) {
    hexVal = "0" + hexVal;
  }

  const hexVals: string[] = hexVal.split("");
  let intVals: number[] = [];
  for (let valCounter = hexVal.length; valCounter > 1; valCounter -= 2) {
    intVals.push(
      Number("0x" + hexVals[valCounter - 2] + hexVals[valCounter - 1]),
    );
  }

  return intVals;
}

/**
 *
 * @param width number of pixels wide
 * @param opts object with properties ```height: number``` and ```name: string```.
 * if ```height``` is not specified, will use ```width``` as ```height```.
 * if ```name``` is not specified, will use ```"image"``` as ```name```.
 * @returns void
 */
export function generateDds(
  width: number,
  opts?: {
    height?: number;
    name?: string;
    path?: string;
  },
): void {
  try {
    if (opts?.path !== undefined && fs.statSync(opts.path).isFile()) {
      return;
    }
  } catch (err) {}

  if (opts === undefined) {
    opts = {
      height: width,
      name: "image",
    };
  }
  if (opts.height === undefined) {
    opts.height = width;
  }
  if (opts.name === undefined) {
    opts.name = "test";
  }
  const imagePath: string =
    opts?.path ?? path.join(getWorkspacePath(), opts?.name + ".dds");
  let header: number[] | undefined;
  let data: number[] | undefined;
  let ddsBuf: number[] = [];

  const pitch: number = getPitch(opts.height, width);
  const pitchBytes: number[] = toFourByte(pitch);
  const widthBytes: number[] = toFourByte(width);
  const heightBytes: number[] = toFourByte(opts.height);

  try {
    header = Array.from(fs.readFileSync(path.resolve(filesDir, "header")));
    data = Array.from(fs.readFileSync(path.resolve(filesDir, "data")));
  } catch (err) {
    console.log(err);

    if (header === undefined || data === undefined) {
      return;
    }
  }

  ddsBuf = ddsBuf.concat(header);

  for (let i = 0; i < BYTE_SECTIONS; i++) {
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
    fs.mkdirSync(path.dirname(imagePath), { recursive: true });
    fs.writeFileSync(imagePath, Buffer.from(ddsBuf), {
      flag: "w+",
    });
  } catch (err) {
    console.log(err);
  }
}

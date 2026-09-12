import { EnumType } from "typescript";


// TODO: use these funcs instead of specific ones

export type EnumObj = {
  name: string;
  value: number;
  data: string | object;
};

export function getNames(e: object): string[] {
  let names: string[] = [];
  Object.values(e).forEach((value) => {
    if (typeof value === "string") {
      names.push(value);
    }
  });

  return names;
}

export function getValues(e: object): number[] {
  let values: number[] = [];
  Object.values(e).forEach((value) => {
    if (typeof value === "number") {
      values.push(value);
    }
  });

  return values;
}

export function getObjFromEnum(
  e: Object,
  fillVals?: string[] | object,
): EnumObj[] {
  let names: string[] = getNames(e);
  let values: number[] = getValues(e);

  let obj: EnumObj[] = [];
  for (let value of values) {
    let fv: string | object = e;
    if (fillVals && Array.isArray(fillVals)) {
      fv = fillVals[value];
    }
    let tempobj: EnumObj = {
      name: names[value],
      value: value,
      data: fv,
    };
    obj.push(tempobj);
  }
  return obj;
}

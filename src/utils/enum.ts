export type EnumObj = {
  name: string;
  value: number;
  data: string | undefined;
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

export function objFromName(n: string, e: object): EnumObj | undefined {
  let obj: EnumObj | undefined;
  let names = getNames(e);
  let values = getValues(e);

  for (let value of values) {
    if (names[value] === n) {
      obj = {
        name: names[value],
        value: value,
        data: undefined,
      };
      break;
    }
  }
  return obj;
}

export function objFromValue(v: number, e: object): EnumObj | undefined {
  let obj: EnumObj | undefined;
  let names = getNames(e);
  let values = getValues(e);

  for (let value of values) {
    if (value === v) {
      obj = {
        name: names[value],
        value: value,
        data: undefined,
      };
      break;
    }
  }
  return obj;
}

export function getObjFromEnum(e: Object, fillVals?: string[]): EnumObj[] {
  let names: string[] = getNames(e);
  let values: number[] = getValues(e);

  let obj: EnumObj[] = [];
  for (let value of values) {
    let fv: string = "";
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

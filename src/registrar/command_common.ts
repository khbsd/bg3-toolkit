export type commandContext = {
  key: string;
  value: any;
};

export class CommandCommon {
  contexts: commandContext[] = [];
  constructor(cmdCtx?: commandContext[]) {
    if (cmdCtx !== undefined) {
      for (let ctx of cmdCtx) {
        ctx.key = "bg3-toolkit." + ctx.key;
        this.contexts.push(ctx);
      }
    }
  }
}

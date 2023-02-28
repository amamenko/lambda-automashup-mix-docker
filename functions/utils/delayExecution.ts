export const delayExecution = (ms: number) =>
  new Promise<void>((resolve, reject) => {
    setTimeout((item: string) => resolve(), ms);
  });

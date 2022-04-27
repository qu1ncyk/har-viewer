export function sleep(ms: number, throws = false): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(throws ? reject : resolve, ms);
  });
}
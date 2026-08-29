/**
 * "3 devices" / "1 device". Without it a count of one reads "1 devices".
 */
export const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

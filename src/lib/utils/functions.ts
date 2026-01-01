/**
 * Capitalise the first character of the string. Does not check if the string
 * is already capitalised.
 *
 * @param str The string to capitalise.
 */
export const capitalised = <T extends string, O extends Capitalize<T>>(
  str: T,
) => {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as O;
};

/**
 * Wait for a given amount of milliseconds.
 *
 * @param ms Amount of milliseconds to sleep.
 */
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms)) as Promise<void>;

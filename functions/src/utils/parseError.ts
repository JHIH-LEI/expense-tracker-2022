/**
 * @param errorTarget
 * @returns false or stringify object
 */
export function parseError(errorTarget: any) {
  try {
    if (typeof errorTarget !== "string") {
      return false;
    }
    return JSON.parse(errorTarget);
  } catch (err) {
    return false;
  }
}

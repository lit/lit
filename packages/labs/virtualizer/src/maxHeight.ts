/**
 * Creates a dummy div with the given height and returns the height of the dummy div.
 * The returned height may become null if the height is not supported.
 *
 * @param height the height to set
 * @returns in case the height is supported, the height of the dummy div, otherwise 0
 */
export const setHeight = (height: number) => {
  const div = document.createElement("div");
  div.style.display = "hidden";
  div.style.height = height + "px";
  document.body.prepend(div);
  const returnHeight = div.clientHeight;
  div.remove();
  return returnHeight;
}

/**
 * Trail and error approach to find the maximum supported height of a div.
 * This depends on the browser and the device.
 * @returns the maximum supported height of a div
 */
export const getMaxSupportedCssHeight = () => {
  const tooBig = Math.pow(2, 53);
  let supportedHeight: number = 800000;
  let lower: number;
  let upper: number;
  for (lower = 1, upper = 1; setHeight(upper); upper *= 2) {
    lower = upper;
    if (upper >= tooBig) {
      supportedHeight = setHeight(upper);
      return supportedHeight;
    }

  }
  while (lower <= upper) {
    var mid = Math.floor((lower + upper) / 2);
    if (setHeight(mid)) {
      if (!setHeight(mid + 1)) {
        supportedHeight = setHeight(mid);
        break;
      } else {
        lower = mid + 1;
      }
    } else {
      upper = mid - 1;
    }
  }
  return supportedHeight;
}
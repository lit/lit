export function mark(
  enabled: boolean,
  ...params: Parameters<typeof performance.mark>
) {
  if (enabled) {
    return performance.mark(...params);
  }
  return undefined;
}

export function measure(
  enabled: boolean,
  ...params: Parameters<typeof performance.measure>
) {
  if (enabled) {
    return performance.measure(...params);
  }
  return undefined;
}

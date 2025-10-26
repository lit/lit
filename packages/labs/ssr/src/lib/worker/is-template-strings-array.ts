export function isTemplateStringsArray(
  value: unknown
): value is TemplateStringsArray {
  return (
    Array.isArray(value) &&
    value.hasOwnProperty('raw') &&
    Array.isArray((value as unknown as TemplateStringsArray).raw)
  );
}

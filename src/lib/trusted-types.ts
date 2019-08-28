function getTrustedTypes(): TrustedTypePolicyFactory {
  // tslint:disable-next-line
  return (window as any).TrustedTypes || (window as any).trustedTypes;
}

/**
 * Checks whether the value is a Trusted Types object instance.
 */
export function isTrustedValue(value: unknown): boolean {
  const trustedTypes = getTrustedTypes();
  if (trustedTypes === undefined)
    return false;
  else {
    return trustedTypes.isHTML(value) || trustedTypes.isScriptURL(value) ||
        trustedTypes.isURL(value) || trustedTypes.isScript(value);
  }
}

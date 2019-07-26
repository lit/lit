function getTrustedTypes() {
  // tslint:disable-next-line
  return (window as any).TrustedTypes;
}

const rules = {
  createHTML(s: string): string {
    return s;
  },
};
let policy: typeof rules|undefined;

/**
 * Turns the value to trusted HTML. If the application uses Trusted Types the
 * value is transformed into TrustedHTML, which can be assigned to execution
 * sink. If the application doesn't use Trusted Types, the return value is the
 * same as the argument.
 */
export function dangerouslyTurnToTrustedHTML(value: string): string {
  const TrustedTypes = getTrustedTypes();
  if (!policy && TrustedTypes !== undefined) {
    policy = TrustedTypes.createPolicy('lit-html', rules);
  }

  if (!policy) {
    return value;
  } else {
    return policy.createHTML(value);
  }
}

/**
 * Checks whether the value is a Trusted Types object instance.
 */
export function isTrustedValue(value: unknown): boolean {
  const TrustedTypes = getTrustedTypes();
  if (TrustedTypes === undefined)
    return false;
  else {
    return TrustedTypes.isHTML(value) || TrustedTypes.isScriptURL(value) ||
        TrustedTypes.isURL(value) || TrustedTypes.isScript(value);
  }
}

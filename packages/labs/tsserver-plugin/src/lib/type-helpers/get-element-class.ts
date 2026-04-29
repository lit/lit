import type ts from 'typescript';

/**
 * Gets the type of the element with the given tagname off the
 * HTMLElementTagNameMap. Supports both custom and built-in elements.
 * Returns undefined if not found.
 */
export const getElementClassType = (
  tagname: string,
  checker: ts.TypeChecker,
  typescript: typeof ts
): ts.Type | undefined => {
  // Use the type checker to get the symbol for the ambient/global
  // HTMLElementTagNameMap type.
  const tagNameMapSymbol = checker.resolveName(
    'HTMLElementTagNameMap',
    undefined,
    typescript.SymbolFlags.Interface,
    false
  );

  if (tagNameMapSymbol !== undefined) {
    const tagNameMapType = checker.getDeclaredTypeOfSymbol(tagNameMapSymbol);
    const propertySymbol = checker.getPropertyOfType(tagNameMapType, tagname);

    if (propertySymbol?.valueDeclaration) {
      // We found the property on HTMLElementTagNameMap, like `div: HTMLDivElement`.
      // Now we need to get the type of that property.
      return checker.getTypeOfSymbolAtLocation(
        propertySymbol,
        propertySymbol.valueDeclaration
      );
    }
  }
  return undefined;
};

/**
 * Gets the 'HTMLElement' global type. Useful as a fallback for
 * getElementClassType.
 */
export const getHTMLElementType = (
  checker: ts.TypeChecker,
  typescript: typeof ts
): ts.Type | undefined => {
  const htmlElementSymbol = checker.resolveName(
    'HTMLElement',
    undefined,
    typescript.SymbolFlags.Interface,
    false
  );
  if (htmlElementSymbol === undefined) {
    // Probably we're in a program that doesn't have lib.dom.d.ts available,
    // so we can't do much useful.
    return undefined;
  }
  return checker.getDeclaredTypeOfSymbol(htmlElementSymbol);
};

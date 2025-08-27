import type * as ts from 'typescript';

/**
 * Given a type of a binding expression, return the type that we should
 * type check against.
 *
 * This is usually the same as just returning the type, however, lit-html's
 * rendering behavior does have a few special values.
 *
 * The `noChange` and `nothing` symbols are always allowed in any binding.
 *
 * DirectiveResults should be type checked as the return type of the `render`
 * method on the directive class.
 *
 * TODO: Move into the analyzer.
 */
export function getLitExpressionType(
  type: ts.Type,
  typescript: typeof ts,
  program: ts.Program
): ts.Type {
  const checker: ExtendedTypeChecker = program.getTypeChecker();
  const specialType = isSpecialValue(type, typescript);
  // nothing and noChange are assignable to anything in a binding.
  if (specialType === SpecialValuesEnum.SentinelSymbol) {
    return checker.getAnyType();
  }
  // Unwrap a DirectiveResult to get the type it renders as.
  if (specialType === SpecialValuesEnum.DirectiveResult) {
    const directiveResultType = getRenderTypeFromDirectiveResult(
      type,
      typescript,
      checker
    );
    if (directiveResultType) {
      return getLitExpressionType(directiveResultType, typescript, program);
    }
    return type;
  }
  // If our checker can't create new unions, we can't do anything more.
  if (checker.getUnionType == null) {
    return type;
  }
  // Apply the same transform through a union.
  if (type.isUnion()) {
    // Check if any of the types are special. If not, we can early exit.
    let hasSpecial = false;
    for (const subtype of type.types) {
      const subtypeSpecial = isSpecialValue(subtype, typescript);
      if (subtypeSpecial !== SpecialValuesEnum.NormalType) {
        hasSpecial = true;
        break;
      }
    }
    if (!hasSpecial) {
      return type;
    }
    // Some subtlety in unions. If any of the types of a union are a sentinel
    // value, we want to exclude them from the resulting union. But we want
    // to transform directives in place.
    const newSubtypes = [];
    for (const subtype of type.types) {
      const specialType = isSpecialValue(subtype, typescript);
      if (specialType === SpecialValuesEnum.SentinelSymbol) {
        continue;
      }
      const newSubtype = getLitExpressionType(subtype, typescript, program);
      newSubtypes.push(newSubtype);
    }
    if (newSubtypes.length === 0) {
      // If we filtered out all types, we return any.
      return checker.getAnyType();
    }
    if (newSubtypes.length === 1) {
      return newSubtypes[0];
    }
    return checker.getUnionType(newSubtypes);
  }
  return type;
}

interface ExtendedTypeChecker extends ts.TypeChecker {
  getUnionType?(types: Array<ts.Type>): ts.Type;
}

function isTypeReference(
  type: ts.Type,
  typescript: typeof ts
): type is ts.TypeReference {
  return (
    (type.flags & typescript.TypeFlags.Object) !== 0 &&
    !!(type as ts.TypeReference).target
  );
}

function getRenderTypeFromDirectiveResult(
  type: ts.Type,
  typescript: typeof ts,
  checker: ExtendedTypeChecker
): ts.Type | undefined {
  if (!isTypeReference(type, typescript)) {
    return undefined;
  }
  // So, we have a DirectiveResult<{new (...): ActualDirective}
  // and we want to get ReturnType<ActualDirective['render']>
  const constructorTypes = checker.getTypeArguments(type);
  if (!constructorTypes || constructorTypes.length === 0) {
    return undefined;
  }
  const finalTypes = [];
  for (const constructorType of constructorTypes) {
    const constructSignatures = constructorType.getConstructSignatures();
    for (const signature of constructSignatures) {
      const actualDirectiveType = checker.getReturnTypeOfSignature(signature);
      if (actualDirectiveType == null) {
        continue;
      }
      const renderMethod = actualDirectiveType.getProperty('render');
      if (renderMethod == null) {
        continue;
      }
      const renderType = checker.getTypeOfSymbol(renderMethod);
      const callSignatures = renderType.getCallSignatures();
      for (const callSignature of callSignatures) {
        finalTypes.push(callSignature.getReturnType());
      }
    }
  }
  if (finalTypes.length === 0) {
    return undefined;
  }
  if (finalTypes.length === 1) {
    return finalTypes[0];
  }
  if (checker.getUnionType != null) {
    // Return a union of the types if we can.
    return checker.getUnionType(finalTypes);
  }
  return finalTypes[0];
}

export const SpecialValuesEnum = {
  NormalType: 0 as const,
  SentinelSymbol: 1 as const,
  DirectiveResult: 2 as const,
};
export type SpecialValuesEnum =
  (typeof SpecialValuesEnum)[keyof typeof SpecialValuesEnum];

export function isSpecialValue(
  type: ts.Type,
  typescript: typeof ts
): SpecialValuesEnum {
  const escapedName = type.symbol?.getEscapedName();
  if (
    escapedName !== 'noChange' &&
    escapedName !== 'nothing' &&
    escapedName !== 'DirectiveResult'
  ) {
    return SpecialValuesEnum.NormalType;
  }
  // Is it declared inside of lit-html?
  const declarations = type.symbol.declarations;
  if (declarations) {
    let isInsideLitHtml = false;
    for (const decl of declarations) {
      const sourceFile = decl.getSourceFile();
      if (sourceFile.fileName.includes('lit-html')) {
        isInsideLitHtml = true;
        break;
      }
    }
    if (isInsideLitHtml === false) {
      return SpecialValuesEnum.NormalType;
    }
  }
  if (escapedName === 'DirectiveResult') {
    return SpecialValuesEnum.DirectiveResult;
  }
  // Is it a unique symbol?
  if (type.flags & typescript.TypeFlags.UniqueESSymbol) {
    return SpecialValuesEnum.SentinelSymbol;
  }
  return SpecialValuesEnum.NormalType;
}

import ts from 'typescript';

/**
 * Creates the statement:
 *
 * ```ts
 * import * as <namespace> from "<moduleSpecifier>"
 * ```
 */
const importNamespaceDeclaration = (
  factory: ts.NodeFactory,
  namespace: ts.Identifier,
  moduleSpecifier: ts.StringLiteral
) =>
  factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamespaceImport(namespace)
    ),
    moduleSpecifier,
    undefined
  );

/**
 * Add Parts constructors import.
 *
 * ```ts
 * import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
 * const { AttributePart: _$LH_AttributePart, PropertyPart: _$LH_PropertyPart, BooleanAttributePart: _$LH_BooleanAttributePart, EventPart: _$LH_EventPart } = litHtmlPrivate_1._$LH;
 * ```
 */
export const addPartConstructorImport = (
  node: ts.SourceFile,
  factory: ts.NodeFactory
): ts.SourceFile => {
  const uniqueLitHtmlPrivateIdentifier =
    factory.createUniqueName('litHtmlPrivate');
  return factory.updateSourceFile(node, [
    ...([
      importNamespaceDeclaration(
        factory,
        uniqueLitHtmlPrivateIdentifier,
        factory.createStringLiteral('lit-html/private-ssr-support.js')
      ),
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createObjectBindingPattern([
                factory.createBindingElement(
                  undefined,
                  factory.createIdentifier('AttributePart'),
                  factory.createIdentifier('_$LH_AttributePart'),
                  undefined
                ),
                factory.createBindingElement(
                  undefined,
                  factory.createIdentifier('PropertyPart'),
                  factory.createIdentifier('_$LH_PropertyPart'),
                  undefined
                ),
                factory.createBindingElement(
                  undefined,
                  factory.createIdentifier('BooleanAttributePart'),
                  factory.createIdentifier('_$LH_BooleanAttributePart'),
                  undefined
                ),
                factory.createBindingElement(
                  undefined,
                  factory.createIdentifier('EventPart'),
                  factory.createIdentifier('_$LH_EventPart'),
                  undefined
                ),
              ]),
              undefined,
              undefined,
              factory.createPropertyAccessExpression(
                uniqueLitHtmlPrivateIdentifier,
                factory.createIdentifier('_$LH')
              )
            ),
          ],
          ts.NodeFlags.Const
        )
      ),
    ] as ts.Statement[]),
    ...node.statements,
  ]);
};

/**
 * From a variable name, a preparedHtml string, and a list of parts, return
 * the AST defining a CompiledTemplate.
 *
 * Creates:
 *
 * ```ts
 * const <variableName> = { h: (i => i) `<preparedHtml>`, parts: <parts> };
 * ```
 */
export const createCompiledTemplate = ({
  f,
  variableName,
  preparedHtml,
  parts,
  secrityBrand,
}: {
  f: ts.NodeFactory;
  variableName: ts.Identifier;
  preparedHtml: string;
  parts: ts.ArrayLiteralExpression;
  secrityBrand: ts.Identifier;
}) =>
  f.createVariableStatement(
    undefined,
    f.createVariableDeclarationList(
      [
        f.createVariableDeclaration(
          variableName,
          undefined,
          undefined,
          f.createObjectLiteralExpression([
            f.createPropertyAssignment(
              'h',
              f.createTaggedTemplateExpression(
                secrityBrand,
                undefined,
                f.createNoSubstitutionTemplateLiteral(preparedHtml)
              )
            ),
            f.createPropertyAssignment('parts', parts),
          ])
        ),
      ],
      ts.NodeFlags.Const
    )
  );

/**
 * Assigns an identity function to the security brand identifier.
 *
 * Returns the following:
 *
 * ```ts
 * const <securityBrandIdent> = i => i;
 * ```
 */
export const createSecurityBrandTagFunction = ({
  f,
  securityBrandIdent,
}: {
  f: ts.NodeFactory;
  securityBrandIdent: ts.Identifier;
}) => {
  return f.createVariableStatement(
    undefined,
    f.createVariableDeclarationList(
      [
        f.createVariableDeclaration(
          securityBrandIdent,
          undefined,
          undefined,
          f.createArrowFunction(
            undefined,
            undefined,
            [
              f.createParameterDeclaration(
                undefined,
                undefined,
                f.createIdentifier('i'),
                undefined,
                undefined,
                undefined
              ),
            ],
            undefined,
            f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            f.createIdentifier('i')
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
};

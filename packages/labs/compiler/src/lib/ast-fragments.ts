import ts from 'typescript';

export const PartType = {
  ATTRIBUTE: 1,
  CHILD: 2,
  PROPERTY: 3,
  BOOLEAN_ATTRIBUTE: 4,
  EVENT: 5,
  ELEMENT: 6,
  COMMENT_PART: 7,
} as const;
export type PartType = (typeof PartType)[keyof typeof PartType];

export type TemplatePart =
  | {
      type: typeof PartType.CHILD | typeof PartType.COMMENT_PART;
      index: number;
    }
  | {
      type: PartType;
      index: number;
      name: string;
      strings: Array<string>;
      tagName: string;
      ctorType: PartType;
    }
  | {
      type: typeof PartType.ELEMENT;
      index: number;
    };

// These constructors have been renamed to reduce the chance of a naming collision.
const AttributePartConstructors = {
  [PartType.ATTRIBUTE]: '_$LH_AttributePart',
  [PartType.PROPERTY]: '_$LH_PropertyPart',
  [PartType.BOOLEAN_ATTRIBUTE]: '_$LH_BooleanAttributePart',
  [PartType.EVENT]: '_$LH_EventPart',
} as const;

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
  securityBrand: ts.Statement,
  factory: ts.NodeFactory
): ts.SourceFile => {
  const uniqueLitHtmlPrivateIdentifier =
    factory.createUniqueName('litHtmlPrivate');
  const brandIdx = node.statements.indexOf(securityBrand);
  if (brandIdx === -1) {
    throw new Error(
      `Internal Error: Could not find security brand declaration.`
    );
  }
  // Instead of adding the Part constructor import at the top of the file, add
  // it immediately before the security brand. This keeps comments on the top of
  // the file.
  const beforeSecurityBrand = node.statements.slice(0, brandIdx);
  const afterSecurtyBrand = node.statements.slice(brandIdx);
  return factory.updateSourceFile(node, [
    ...beforeSecurityBrand,
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
    ...afterSecurtyBrand,
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
  securityBrand,
}: {
  f: ts.NodeFactory;
  variableName: ts.Identifier;
  preparedHtml: string;
  parts: ts.ArrayLiteralExpression;
  securityBrand: ts.Identifier;
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
                securityBrand,
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
 * Creates a CompiledTemplateResult with the shape:
 *
 * ```ts
 * {['_$litType$']: <variableName>, values: [...<templateExpression>]}
 * ```
 *
 * where `templateExpression` contains the dynamic value expressions in the
 * original `html` tagged template.
 */
export const createCompiledTemplateResult = ({
  f,
  variableName,
  templateExpression,
}: {
  f: ts.NodeFactory;
  variableName: ts.Identifier;
  templateExpression: ts.TemplateLiteral;
}) =>
  f.createObjectLiteralExpression([
    f.createPropertyAssignment(
      f.createComputedPropertyName(f.createStringLiteral('_$litType$')),
      variableName
    ),
    f.createPropertyAssignment(
      'values',
      f.createArrayLiteralExpression(
        ts.isNoSubstitutionTemplateLiteral(templateExpression)
          ? []
          : templateExpression.templateSpans.map((s) => s.expression)
      )
    ),
  ]);

/**
 * Create the source code for the TemplateParts for the CompiledTemplate.
 *
 * As an example output, a single BooleanAttributePart looks something like:
 *
 * ```ts
 * [{ type: 1, index: 0, name: "data-attr", strings: ["", ""], ctor: _$LH_BooleanAttributePart }]
 * ```
 */
export const createTemplateParts = ({
  f,
  parts,
}: {
  f: ts.NodeFactory;
  parts: TemplatePart[];
}) =>
  f.createArrayLiteralExpression(
    parts.map((part) => {
      const partProperties = [
        f.createPropertyAssignment('type', f.createNumericLiteral(part.type)),
        f.createPropertyAssignment('index', f.createNumericLiteral(part.index)),
      ];
      if (
        part.type === PartType.ATTRIBUTE &&
        (part.ctorType === PartType.ATTRIBUTE ||
          part.ctorType === PartType.BOOLEAN_ATTRIBUTE ||
          part.ctorType === PartType.PROPERTY ||
          part.ctorType === PartType.EVENT)
      ) {
        partProperties.push(
          f.createPropertyAssignment('name', f.createStringLiteral(part.name)),
          f.createPropertyAssignment(
            'strings',
            f.createArrayLiteralExpression(
              part.strings.map((s) => f.createStringLiteral(s))
            )
          ),
          f.createPropertyAssignment(
            'ctor',
            f.createIdentifier(AttributePartConstructors[part.ctorType])
          )
        );
      }
      return f.createObjectLiteralExpression(partProperties);
    })
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

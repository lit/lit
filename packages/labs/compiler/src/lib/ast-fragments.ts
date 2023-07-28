/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
      type:
        | typeof PartType.CHILD
        | typeof PartType.COMMENT_PART
        | typeof PartType.ELEMENT;
      index: number;
    }
  | {
      type: PartType;
      index: number;
      name: string;
      strings: Array<string>;
      tagName: string;
      ctorType: PartType;
    };

const attributePartConstructors = {
  [PartType.ATTRIBUTE]: 'AttributePart',
  [PartType.PROPERTY]: 'PropertyPart',
  [PartType.BOOLEAN_ATTRIBUTE]: 'BooleanAttributePart',
  [PartType.EVENT]: 'EventPart',
} as const;

// These constructors have been renamed to reduce the chance of a naming collision.
export interface AttributePartConstructorAliases {
  AttributePart?: ts.Identifier;
  PropertyPart?: ts.Identifier;
  BooleanAttributePart?: ts.Identifier;
  EventPart?: ts.Identifier;
}

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
 * Add Parts constructors import. To avoid identifier collisions, each part
 * constructor is mapped to a unique identifier that must be provided. If no
 * identifier is provided for a part, then the part will not be emitted.
 *
 * This uses a namespace import for g3 compatibility.
 *
 * ```ts
 * import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
 * const { AttributePart: <AttributePart alias>, PropertyPart: <PropertyPart alias>, BooleanAttributePart: <BooleanAttributePart alias>, EventPart: <EventPart alias> } = litHtmlPrivate_1._$LH;
 * ```
 */
export const addPartConstructorImport = ({
  factory,
  sourceFile,
  securityBrand,
  partIdentifiers,
}: {
  sourceFile: ts.SourceFile;
  securityBrand: ts.Statement;
  factory: ts.NodeFactory;
  partIdentifiers: AttributePartConstructorAliases;
}): ts.SourceFile => {
  const uniqueLitHtmlPrivateIdentifier =
    factory.createUniqueName('litHtmlPrivate');
  const brandIdx = sourceFile.statements.indexOf(securityBrand);
  if (brandIdx === -1) {
    throw new Error(
      `Internal Error: Could not find security brand declaration.`
    );
  }
  // Add parts import immediately before the security brand.
  const beforeSecurityBrand = sourceFile.statements.slice(0, brandIdx);
  const afterSecurtyBrand = sourceFile.statements.slice(brandIdx);

  const partConstructors = [
    'AttributePart',
    'PropertyPart',
    'BooleanAttributePart',
    'EventPart',
  ] as const;
  const partsObjectBinding = partConstructors
    .map((part) => {
      const identifierAlias = partIdentifiers[part];
      if (!identifierAlias) {
        return undefined;
      }
      return factory.createBindingElement(
        undefined,
        factory.createIdentifier(part),
        identifierAlias,
        undefined
      );
    })
    .filter((i): i is ts.BindingElement => i !== undefined);

  return factory.updateSourceFile(sourceFile, [
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
              factory.createObjectBindingPattern(partsObjectBinding),
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
 * From a variable name, preparedHtml string, and a list of parts, return the
 * AST defining a CompiledTemplate.
 *
 * Creates:
 *
 * ```ts
 * const <variableName> = { h: <securityBrand> `<preparedHtml>`, parts: <parts> };
 * ```
 */
export const createCompiledTemplate = ({
  f,
  variableName,
  securityBrand,
  preparedHtml,
  parts,
}: {
  f: ts.NodeFactory;
  variableName: ts.Identifier;
  securityBrand: ts.Identifier;
  preparedHtml: string;
  parts: ts.ArrayLiteralExpression;
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
 * {['_$litType$']: <variableName>, values: <templateExpression.expressions>}
 * ```
 *
 * where `templateExpression` contains the dynamic values from the original
 * `html` tagged template.
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
 * Create the TemplateParts array.
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
  partIdentifiers,
}: {
  f: ts.NodeFactory;
  parts: TemplatePart[];
  partIdentifiers: AttributePartConstructorAliases;
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
        const ctorAlias =
          partIdentifiers[attributePartConstructors[part.ctorType]];
        if (ctorAlias === undefined) {
          throw new Error(
            `Internal Error: Part ctor alias identifier was not passed.`
          );
        }
        partProperties.push(
          f.createPropertyAssignment('name', f.createStringLiteral(part.name)),
          f.createPropertyAssignment(
            'strings',
            f.createArrayLiteralExpression(
              part.strings.map((s) => f.createStringLiteral(s))
            )
          ),
          f.createPropertyAssignment('ctor', ctorAlias)
        );
      }
      return f.createObjectLiteralExpression(partProperties);
    })
  );

/**
 * Create an identity function to be the security brand for the preparedHtml.
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

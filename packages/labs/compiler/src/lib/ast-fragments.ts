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

export const AttributeKind = {
  ATTRIBUTE: 1,
  PROPERTY: 3,
  BOOLEAN_ATTRIBUTE: 4,
  EVENT: 5,
} as const;

export type AttributeKind = (typeof AttributeKind)[keyof typeof AttributeKind];
export type TemplatePart =
  | {
      type:
        | typeof PartType.CHILD
        | typeof PartType.COMMENT_PART
        | typeof PartType.ELEMENT;
      index: number;
    }
  | {
      type: typeof PartType.ATTRIBUTE;
      index: number;
      name: string;
      strings: Array<string>;
      ctorType: AttributeKind;
    };
const attributePartConstructors = {
  [AttributeKind.ATTRIBUTE]: 'AttributePart',
  [AttributeKind.PROPERTY]: 'PropertyPart',
  [AttributeKind.BOOLEAN_ATTRIBUTE]: 'BooleanAttributePart',
  [AttributeKind.EVENT]: 'EventPart',
} as const;

/**
 * Mapping of part constructors to a unique identifier alias. If undefined, the
 * constructor will not be imported.
 */
export interface AttributePartConstructorAliases {
  AttributePart?: ts.Identifier;
  PropertyPart?: ts.Identifier;
  BooleanAttributePart?: ts.Identifier;
  EventPart?: ts.Identifier;
}

/**
 * An array of names for the attribute constructors that are exported from the
 * module `"lit-html/private-ssr-support.js"` via the `_$LH` object.
 */
const attributePartConstructorNames = Object.values(attributePartConstructors);

/**
 * Creates the statement:
 *
 * ```ts
 * import * as <namespace> from "<moduleSpecifier>"
 * ```
 */
const createImportNamespaceDeclaration = (
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
 * constructor is mapped to a unique identifier. Imports are added as requested
 * by the parameters in the `attributePartConstructorNameMap`. If no identifier
 * is provided for a part, then the part will be ignored. This helps keep file
 * size down and prevents the creation of unusued identifiers.
 *
 * This uses a namespace import for g3 compatibility.
 *
 * ```ts
 * import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
 * const { AttributePart: <AttributePart alias>, PropertyPart: <PropertyPart alias>, BooleanAttributePart: <BooleanAttributePart alias>, EventPart: <EventPart alias> } = litHtmlPrivate_1._$LH;
 * ```
 *
 * @param options
 * @param {ts.NodeFactory} options.factory
 * Factory for updating and creating AST nodes.
 * @param {ts.SourceFile} options.sourceFile
 * The sourcefile to add the parts constructor import.
 * @param {ts.Statement} options.securityBrand
 * the tag function declaration for the security brand.
 * @param {AttributePartConstructorAliases} options.attributePartConstructorNameMap
 * a map to the unique identifier for each attribute part constructor.
 */
export const addPartConstructorImport = ({
  factory,
  sourceFile,
  securityBrand,
  attributePartConstructorNameMap,
}: {
  sourceFile: ts.SourceFile;
  securityBrand: ts.Statement;
  factory: ts.NodeFactory;
  attributePartConstructorNameMap: AttributePartConstructorAliases;
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

  // If the attributePartConstructorNameMap contains a unique identifier for a
  // given part constructor, then create an object binding. E.g., create an
  // array of `AttributePart as _A`, where `_A` is the unique identifier.
  const partsObjectBinding = attributePartConstructorNames
    .map((part) => {
      const identifierAlias = attributePartConstructorNameMap[part];
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

  if (partsObjectBinding.length === 0) {
    throw new Error(
      `Internal Error: Expect at least one attribute part constructor. Found none.`
    );
  }

  // Insert the part import into the file, immediately prior to the security
  // brand tag function declaration. This is a semi-arbitrary location to
  // generate the import, but it has the nice property of always being beneath
  // top-level license comments.
  return factory.updateSourceFile(sourceFile, [
    ...beforeSecurityBrand,
    ...([
      createImportNamespaceDeclaration(
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
 * [{ type: 1, index: 0, name: "data-attr", strings: ["", ""], ctor: _B }]
 * ```
 */
export const createTemplateParts = ({
  f,
  parts,
  attributePartConstructorNameMap,
}: {
  f: ts.NodeFactory;
  parts: TemplatePart[];
  attributePartConstructorNameMap: AttributePartConstructorAliases;
}) =>
  f.createArrayLiteralExpression(
    parts.map((part) => {
      const partProperties = [
        f.createPropertyAssignment('type', f.createNumericLiteral(part.type)),
        f.createPropertyAssignment('index', f.createNumericLiteral(part.index)),
      ];
      if (part.type === PartType.ATTRIBUTE) {
        const ctorAlias =
          attributePartConstructorNameMap[
            attributePartConstructors[part.ctorType]
          ];
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

/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

export const PartType = {
  CHILD: 2,
} as const;

export type PartType = (typeof PartType)[keyof typeof PartType];

export type TemplatePart = {
  type: typeof PartType.CHILD;
  index: number;
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

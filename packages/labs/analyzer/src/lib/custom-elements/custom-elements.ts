/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing native custom elements (i.e. `HTMLElement`)
 * subclasses.
 */

import ts from 'typescript';
import {
  ClassMemberInfo,
  getClassMembers,
  getHeritage,
} from '../javascript/classes.js';
import {
  AnalyzerInterface,
  Attribute,
  CustomElementDeclaration,
  CustomElementField,
  Event,
  NamedDescribed,
} from '../model.js';
import {addEventsToMap} from './events.js';
import {
  parseNodeJSDocInfo,
  parseNamedTypedJSDocInfo,
} from '../javascript/jsdoc.js';
import {addJSDocAttributeToMap} from './attributes.js';

const _isCustomElementClassDeclaration = (
  t: ts.BaseType,
  analyzer: AnalyzerInterface
): boolean => {
  const declarations = t.getSymbol()?.getDeclarations();
  return (
    declarations?.some(
      (declaration) =>
        (ts.isInterfaceDeclaration(declaration) &&
          declaration.name?.text === 'HTMLElement') ||
        isCustomElementSubclass(declaration, analyzer)
    ) === true
  );
};

export type CustomElementClassDeclaration = ts.ClassDeclaration & {
  _customElementBrand: never;
};

export const isCustomElementSubclass = (
  node: ts.Node,
  analyzer: AnalyzerInterface
): node is CustomElementClassDeclaration => {
  if (!ts.isClassLike(node)) {
    return false;
  }
  if (getTagName(node) !== undefined) {
    return true;
  }
  const checker = analyzer.program.getTypeChecker();
  const type = checker.getTypeAtLocation(node) as ts.InterfaceType;
  const baseTypes = checker.getBaseTypes(type);
  for (const t of baseTypes) {
    if (_isCustomElementClassDeclaration(t, analyzer)) {
      return true;
    }
  }
  return false;
};

export const getTagName = (
  node: ts.ClassDeclaration | ts.ClassExpression
): string | undefined => {
  const jsdocTag = ts
    .getJSDocTags(node)
    .find((tag) => tag.tagName.text.toLowerCase() === 'customelement');

  if (jsdocTag && typeof jsdocTag.comment === 'string') {
    return jsdocTag.comment.trim();
  }

  let tagName: string | undefined = undefined;

  // Otherwise, look for imperative define in the form of:
  // `customElements.define('x-foo', XFoo);`
  node.parent.forEachChild((child) => {
    if (
      ts.isExpressionStatement(child) &&
      ts.isCallExpression(child.expression) &&
      ts.isPropertyAccessExpression(child.expression.expression) &&
      child.expression.arguments.length >= 2
    ) {
      const [tagNameArg, ctorArg] = child.expression.arguments;
      const {expression, name} = child.expression.expression;
      if (
        ts.isIdentifier(expression) &&
        expression.text === 'customElements' &&
        ts.isIdentifier(name) &&
        name.text === 'define' &&
        ts.isStringLiteralLike(tagNameArg) &&
        ts.isIdentifier(ctorArg) &&
        ctorArg.text === node.name?.text
      ) {
        tagName = tagNameArg.text;
      }
    }
  });

  return tagName;
};

/**
 * Adds name, description, and summary info for a given jsdoc tag into the
 * provided map.
 */
const addNamedJSDocInfoToMap = (
  map: Map<string, NamedDescribed>,
  tag: ts.JSDocTag,
  analyzer: AnalyzerInterface
) => {
  const info = parseNamedTypedJSDocInfo(tag, analyzer);
  if (info !== undefined) {
    map.set(info.name, info);
  }
};

/**
 * Parses element metadata from jsDoc tags from a LitElement declaration into
 * Maps of <name, info>.
 */
export const getJSDocData = (
  node: ts.ClassDeclaration,
  analyzer: AnalyzerInterface,
  customElementFieldMap: Map<string, CustomElementField>
) => {
  const attributes = new Map<string, Attribute>();
  const events = new Map<string, Event>();
  const slots = new Map<string, NamedDescribed>();
  const cssProperties = new Map<string, NamedDescribed>();
  const cssParts = new Map<string, NamedDescribed>();
  const jsDocTags = ts.getJSDocTags(node);
  if (jsDocTags !== undefined) {
    for (const tag of jsDocTags) {
      switch (tag.tagName.text) {
        case 'attr':
        case 'attribute':
          addJSDocAttributeToMap(
            tag,
            attributes,
            analyzer,
            customElementFieldMap
          );
          break;
        case 'fires':
          addEventsToMap(tag, events, analyzer);
          break;
        case 'slot':
          addNamedJSDocInfoToMap(slots, tag, analyzer);
          break;
        case 'cssProp':
        case 'cssprop':
        case 'cssProperty':
        case 'cssproperty':
          addNamedJSDocInfoToMap(cssProperties, tag, analyzer);
          break;
        case 'cssPart':
        case 'csspart':
          addNamedJSDocInfoToMap(cssParts, tag, analyzer);
          break;
      }
    }
  }
  return {
    ...parseNodeJSDocInfo(node, analyzer),
    attributes,
    events,
    slots,
    cssProperties,
    cssParts,
  };
};

/**
 * Use this map to merge JSDoc `@attr` docs with those derived
 * from class-field docs
 */
export const getCustomElementFieldMapByAttribute = (members: ClassMemberInfo) =>
  new Map<string, CustomElementField>(
    Array.from(members.fieldMap, ([, field]) =>
      field instanceof CustomElementField && field.attribute
        ? [field.name, field]
        : []
    ).filter(
      (x: unknown[]): x is [string, CustomElementField] => x.length === 2
    )
  );

export const getCustomElementDeclaration = (
  node: CustomElementClassDeclaration,
  analyzer: AnalyzerInterface
): CustomElementDeclaration => {
  const members = getClassMembers(node, analyzer);
  const customElementFieldMap = getCustomElementFieldMapByAttribute(members);
  const {attributes, ...jsDocData} = getJSDocData(
    node,
    analyzer,
    customElementFieldMap
  );
  return new CustomElementDeclaration({
    tagname: getTagName(node),
    name: node.name?.text ?? '',
    node,
    ...jsDocData,
    getHeritage: () => getHeritage(node, analyzer),
    attributes,
    ...members,
  });
};

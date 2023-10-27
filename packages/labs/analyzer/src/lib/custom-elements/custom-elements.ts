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

import type ts from 'typescript';
import {getClassMembers, getHeritage} from '../javascript/classes.js';
import {
  AnalyzerInterface,
  CustomElementDeclaration,
  Event,
  NamedDescribed,
} from '../model.js';
import {addEventsToMap} from './events.js';
import {
  parseNodeJSDocInfo,
  parseNamedTypedJSDocInfo,
} from '../javascript/jsdoc.js';

const _isCustomElementClassDeclaration = (
  t: ts.BaseType,
  analyzer: AnalyzerInterface
): boolean => {
  const declarations = t.getSymbol()?.getDeclarations();
  return (
    declarations?.some(
      (declaration) =>
        (analyzer.typescript.isInterfaceDeclaration(declaration) &&
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
  if (!analyzer.typescript.isClassLike(node)) {
    return false;
  }
  if (getTagName(node, analyzer) !== undefined) {
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
  node: ts.ClassDeclaration | ts.ClassExpression,
  analyzer: AnalyzerInterface
): string | undefined => {
  const jsdocTag = analyzer.typescript
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
      analyzer.typescript.isExpressionStatement(child) &&
      analyzer.typescript.isCallExpression(child.expression) &&
      analyzer.typescript.isPropertyAccessExpression(
        child.expression.expression
      ) &&
      child.expression.arguments.length >= 2
    ) {
      const [tagNameArg, ctorArg] = child.expression.arguments;
      const {expression, name} = child.expression.expression;
      if (
        analyzer.typescript.isIdentifier(expression) &&
        expression.text === 'customElements' &&
        analyzer.typescript.isIdentifier(name) &&
        name.text === 'define' &&
        analyzer.typescript.isStringLiteralLike(tagNameArg) &&
        analyzer.typescript.isIdentifier(ctorArg) &&
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
  analyzer: AnalyzerInterface
) => {
  const events = new Map<string, Event>();
  const slots = new Map<string, NamedDescribed>();
  const cssProperties = new Map<string, NamedDescribed>();
  const cssParts = new Map<string, NamedDescribed>();
  const jsDocTags = analyzer.typescript.getJSDocTags(node);
  if (jsDocTags !== undefined) {
    for (const tag of jsDocTags) {
      switch (tag.tagName.text) {
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
    events,
    slots,
    cssProperties,
    cssParts,
  };
};

export const getCustomElementDeclaration = (
  node: CustomElementClassDeclaration,
  analyzer: AnalyzerInterface
): CustomElementDeclaration => {
  return new CustomElementDeclaration({
    tagname: getTagName(node, analyzer),
    name: node.name?.text ?? '',
    node,
    ...getJSDocData(node, analyzer),
    getHeritage: () => getHeritage(node, analyzer),
    ...getClassMembers(node, analyzer),
  });
};

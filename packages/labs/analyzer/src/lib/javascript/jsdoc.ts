/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing JSDoc comments
 */

import type ts from 'typescript';
import {createDiagnostic} from '../errors.js';
import {
  Described,
  TypedNamedDescribed,
  DeprecatableDescribed,
  AnalyzerInterface,
  CSSPropertyInfo,
} from '../model.js';

export type TypeScript = typeof ts;

/**
 * @fileoverview
 *
 * Utilities for parsing JSDoc comments.
 */

/**
 * Returns true if given node has a JSDoc tag
 */
export const hasJSDocTag = (ts: TypeScript, node: ts.Node, tag: string) => {
  return ts.getJSDocTags(node).some((t) => t.tagName.text === tag);
};

/**
 * Remove line feeds from JSDoc comments, so they are normalized to
 * unix `\n` line endings.
 */
const normalizeLineEndings = (s: string) => s.replace(/\r/g, '').trim();

// Regex for parsing name, type, and description from JSDoc comments
const parseNameTypeDescRE =
  /^\[?(?<name>[^{}[\]\s=]+)(?:=(?<defaultValue>[^\]]+))?\]?(?:\s+{(?<type>.*)})?(?:\s+-\s+)?(?<description>[\s\S]*)$/m;

// Regex for parsing type, name, and description from JSDoc comments
const parseTypeNameDescRE =
  /^\{(?<type>.+)\}\s+\[?(?<name>[^{}[\]\s=]+)(?:=(?<defaultValue>[^\]]+))?\]?(?:\s+-\s+)?(?<description>[\s\S]*)$/m;

const getJSDocTagComment = (tag: ts.JSDocTag, analyzer: AnalyzerInterface) => {
  let {comment} = tag;
  if (comment === undefined) {
    return undefined;
  }
  if (Array.isArray(comment)) {
    comment = comment.map((c) => c.text).join('');
  }
  if (typeof comment !== 'string') {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: tag,
        message: `JSDoc error: unsupported node type`,
      })
    );
    return undefined;
  }
  return normalizeLineEndings(comment).trim();
};

const isModuleJSDocTag = (tag: ts.JSDocTag) =>
  tag.tagName.text === 'module' ||
  tag.tagName.text === 'fileoverview' ||
  tag.tagName.text === 'packageDocumentation';

/**
 * Parses name, type, and description from JSDoc tag for things like `@fires`.
 *
 * Supports the following patterns following the tag (TS parses the tag for us):
 * * @fires event-name
 * * @fires event-name description
 * * @fires event-name - description
 * * @fires event-name: description
 * * @fires event-name {Type}
 * * @fires event-name {Type} description
 * * @fires event-name {Type} - description
 * * @fires event-name {Type}: description
 * * @fires {Type} event-name
 * * @fires {Type} event-name description
 * * @fires {Type} event-name - description
 * * @fires {Type} event-name: description
 * * @slot name
 * * @slot name description
 * * @slot name - description
 * * @slot name: description
 * * @cssProp [--name=default]
 * * @cssProp [--name=default] description
 * * @cssProp [--name=default] - description
 * * @cssProp [--name=default]: description
 * * @cssprop {<color>} [--name=default]
 * * @cssprop {<color>} [--name=default] description
 * * @cssprop {<color>} [--name=default] - description
 * * @cssprop {<color>} [--name=default]: description
 */
export const parseNamedTypedJSDocInfo = (
  tag: ts.JSDocTag,
  analyzer: AnalyzerInterface
) => {
  const comment = getJSDocTagComment(tag, analyzer);
  if (comment == undefined) {
    return undefined;
  }
  const regex =
    comment.charAt(0) === '{' ? parseTypeNameDescRE : parseNameTypeDescRE;
  const nameTypeDesc = comment.match(regex);
  if (nameTypeDesc === null) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: tag,
        message: `JSDoc error: unexpected JSDoc format`,
      })
    );
    return undefined;
  }
  const {name, type, defaultValue, description} = nameTypeDesc.groups!;
  const info: TypedNamedDescribed = {name};
  if (description.length > 0) {
    info.description = normalizeLineEndings(description);
  }
  if (defaultValue?.length > 0) {
    info.default = defaultValue;
  }
  if (tag.tagName.text.toLowerCase().startsWith('cssprop')) {
    (info as CSSPropertyInfo).syntax = type;
  } else {
    info.type = type;
  }
  return info;
};

/**
 * Parses the description from JSDoc tag for things like `@return`.
 */
export const parseJSDocDescription = (
  tag: ts.JSDocTag,
  analyzer: AnalyzerInterface
): Described | undefined => {
  const description = getJSDocTagComment(tag, analyzer);
  if (description == undefined || description.length === 0) {
    return {};
  }
  return {description};
};

/**
 * Add `@description`, `@summary`, and `@deprecated` JSDoc tag info to the
 * given info object.
 */
const addJSDocTagInfo = (
  info: DeprecatableDescribed,
  jsDocTags: readonly ts.JSDocTag[],
  analyzer: AnalyzerInterface
) => {
  for (const tag of jsDocTags) {
    const comment = getJSDocTagComment(tag, analyzer);
    switch (tag.tagName.text.toLowerCase()) {
      case 'description':
      case 'fileoverview':
      case 'packagedocumentation':
        if (comment !== undefined) {
          info.description = comment;
        }
        break;
      case 'summary':
        if (comment !== undefined) {
          info.summary = comment;
        }
        break;
      case 'deprecated':
        info.deprecated = comment !== undefined ? comment : true;
        break;
    }
  }
};

const moduleJSDocsMap = new WeakMap<ts.SourceFile, ts.JSDoc[]>();

/**
 * Returns the module-level JSDoc comment blocks for a given source file.
 *
 * Note that TS does not have a concept of module-level JSDoc; if it
 * exists, it will always be attached to the first statement in the module.
 *
 * Thus, we parse module-level documentation using the following heuristic:
 * - If the first statement only has one JSDoc block, it is only treated as
 *   module documentation if it contains a `@module`, `@fileoverview`, or
 *   `@packageDocumentation` tag. This is required to disambiguate a module
 *   description (with an undocumented first statement) from documentation
 *   for the first statement.
 * - If the first statement has more than one JSDoc block, we collect all
 *   but the last and use those, regardless of whether they contain one
 *   of the above module-designating tags (the last one is assumed to belong
 *   to the first statement).
 *
 * This function caches its result against the given sourceFile, since it is
 * needed both to find the module comment and to filter out module comments
 * node comments.
 */
const getModuleJSDocs = (typescript: TypeScript, sourceFile: ts.SourceFile) => {
  let moduleJSDocs = moduleJSDocsMap.get(sourceFile);
  if (moduleJSDocs !== undefined) {
    return moduleJSDocs;
  }
  // Get the first child in the sourceFile; note that returning the first child
  // from `ts.forEachChild` is more robust than `sourceFile.getChildAt(0)`,
  // since `forEachChild` flattens embedded arrays that the child APIs would
  // otherwise return.
  const firstChild = typescript.forEachChild(sourceFile, (n) => n);
  if (firstChild === undefined) {
    moduleJSDocs = [];
  } else {
    // Get the JSDoc blocks attached to the first child (they oddly show up
    // in the node's children)
    const jsDocs = firstChild.getChildren().filter(typescript.isJSDoc);
    // If there is more than one leading JSDoc block, grab all but the last,
    // otherwise grab the one (see heuristic above)
    moduleJSDocs = jsDocs.slice(0, jsDocs.length > 1 ? -1 : 1);
    // If there is only one leading JSDoc block, it must have a module tag
    if (jsDocs.length === 1 && !jsDocs[0].tags?.some(isModuleJSDocTag)) {
      moduleJSDocs = [];
    }
  }
  moduleJSDocsMap.set(sourceFile, moduleJSDocs!);
  return moduleJSDocs;
};

/**
 * Parse summary, description, and deprecated information from JSDoc comments on
 * a given node.
 */
export const parseNodeJSDocInfo = (
  node: ts.Node,
  analyzer: AnalyzerInterface
): DeprecatableDescribed => {
  const info: DeprecatableDescribed = {};
  const moduleJSDocs = getModuleJSDocs(
    analyzer.typescript,
    node.getSourceFile()
  );
  // Module-level docs (that are explicitly tagged as such) may be
  // attached to the first declaration if the declaration is undocumented,
  // so we filter those out since they shouldn't apply to a
  // declaration node
  const jsDocTags = analyzer.typescript
    .getJSDocTags(node)
    .filter(({parent}) => !moduleJSDocs.includes(parent as ts.JSDoc));
  if (jsDocTags !== undefined) {
    addJSDocTagInfo(info, jsDocTags, analyzer);
  }
  if (info.description === undefined) {
    const comment = normalizeLineEndings(
      node
        .getChildren()
        .filter(analyzer.typescript.isJSDoc)
        .filter((c) => !moduleJSDocs.includes(c))
        .map((n) => n.comment)
        .filter((c) => c !== undefined)
        .join('\n')
    );
    if (comment.length > 0) {
      info.description = comment;
    }
  }
  return info;
};

/**
 * Parse summary, description, and deprecated information from JSDoc comments on
 * a given source file.
 */
export const parseModuleJSDocInfo = (
  sourceFile: ts.SourceFile,
  analyzer: AnalyzerInterface
) => {
  const moduleJSDocs = getModuleJSDocs(analyzer.typescript, sourceFile);
  const info: DeprecatableDescribed = {};
  addJSDocTagInfo(
    info,
    moduleJSDocs.flatMap((m) => m.tags ?? []),
    analyzer
  );
  if (info.description === undefined) {
    const comment = moduleJSDocs
      .map((d) => d.comment)
      .filter((c) => c !== undefined)
      .join('\n');
    if (comment.length > 0) {
      info.description = comment;
    }
  }
  return info;
};

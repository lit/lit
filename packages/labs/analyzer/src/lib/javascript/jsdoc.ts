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

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {
  AnalyzerInterface,
  JSDocInfo,
  NamedJSDocInfo,
  NodeJSDocInfo,
} from '../model.js';

/**
 * @fileoverview
 *
 * Utilities for parsing JSDoc comments.
 */

/**
 * Remove line feeds from JSDoc summaries, so they are normalized to
 * unix `\n` line endings.
 */
const normalizeLineEndings = (s: string) => s.replace(/\r/g, '');

// Regex for parsing name, summary, and descriptions from JSDoc comments
const parseNameDescSummaryRE =
  /^\s*(?<name>[^\s:]+)(?:[\s\-:]+)?(?:(?<summary>[\s\S]+)\r?\n\r?\n)?(?<description>[\s\S]*)$/m;

// Regex for parsing summary and description from JSDoc comments
const parseDescSummaryRE =
  /^(?:(?<summary>[\s\S]+)\r?\n\r?\n)?(?<description>[\s\S]*)$/m;

/**
 * Parses name, summary, and description from JSDoc tag for things like @slot,
 * @cssPart, and @cssProp.
 *
 * Supports the following patterns following the tag (TS parses the tag for us):
 * * @slot name
 * * @slot name summary
 * * @slot name: summary
 * * @slot name - summary
 * * @slot name - summary...
 * *
 * * description (multiline)
 */
export const parseNamedJSDocInfo = (
  tag: ts.JSDocTag
): NamedJSDocInfo | undefined => {
  const {comment} = tag;
  if (comment == undefined) {
    return undefined;
  }
  if (typeof comment !== 'string') {
    throw new DiagnosticsError(tag, `Internal error: unsupported node type`);
  }
  const nameDescSummary = comment.trim().match(parseNameDescSummaryRE);
  if (nameDescSummary === null) {
    throw new DiagnosticsError(tag, 'Unexpected JSDoc format');
  }
  const {name, description, summary} = nameDescSummary.groups!;
  const v: NamedJSDocInfo = {name};
  if (summary !== undefined) {
    v.summary = summary;
  }
  if (description !== undefined) {
    v.description = normalizeLineEndings(description);
  }
  return v;
};

/**
 * Parses summary and description from JSDoc tag for things like @return.
 *
 * Supports the following patterns following the tag (TS parses the tag for us):
 * * @return summary
 * * @return summary...
 * *
 * * description (multiline)
 */
export const parseJSDocInfo = (tag: ts.JSDocTag): JSDocInfo | undefined => {
  const {comment} = tag;
  if (comment == undefined) {
    return undefined;
  }
  if (typeof comment !== 'string') {
    throw new DiagnosticsError(tag, `Internal error: unsupported node type`);
  }
  const descSummary = comment.trim().match(parseDescSummaryRE);
  if (descSummary === null) {
    throw new DiagnosticsError(tag, 'Unexpected JSDoc format');
  }
  const {description, summary} = descSummary.groups!;
  const v: JSDocInfo = {};
  if (summary !== undefined) {
    v.summary = normalizeLineEndings(summary);
  }
  if (description !== undefined) {
    v.description = normalizeLineEndings(description);
  }
  return v;
};

/**
 * Add `@description`, `@summary`, and `@deprecated` JSDoc tag info to the
 * given info object.
 */
const addJSDocTagInfo = (
  info: NodeJSDocInfo,
  jsDocTags: readonly ts.JSDocTag[]
) => {
  for (const tag of jsDocTags) {
    const {comment} = tag;
    if (comment !== undefined && typeof comment !== 'string') {
      throw new DiagnosticsError(tag, `Internal error: unsupported node type`);
    }
    switch (tag.tagName.text) {
      case 'description':
      case 'fileoverview':
      case 'packageDocumentation':
        if (comment !== undefined) {
          info.description = normalizeLineEndings(comment);
        }
        break;
      case 'summary':
        if (comment !== undefined) {
          info.summary = normalizeLineEndings(comment);
        }
        break;
      case 'deprecated':
        info.deprecated =
          comment !== undefined ? normalizeLineEndings(comment) : true;
        break;
    }
  }
};

/**
 * Description and/or summary info from freeform comment text in a
 * JSDoc comment block to the given info object.
 */
const addJSDocCommentInfo = (info: NodeJSDocInfo, comment: string) => {
  if (comment.length === 0) {
    return;
  }
  if (info.summary !== undefined) {
    info.description = normalizeLineEndings(comment);
  } else {
    const match = comment.match(parseDescSummaryRE);
    if (match === null) {
      info.description = normalizeLineEndings(comment);
    } else {
      const {summary, description} = match.groups!;
      info.summary = summary;
      info.description = normalizeLineEndings(description);
    }
  }
};

/**
 * Parse summary, description, and deprecated information from JSDoc comments on
 * a given node.
 */
export const parseNodeJSDocInfo = (
  node: ts.Node,
  analyzer: AnalyzerInterface
): NodeJSDocInfo => {
  const v: NodeJSDocInfo = {};
  const jsDocTags = ts.getJSDocTags(node);
  if (jsDocTags !== undefined) {
    addJSDocTagInfo(v, jsDocTags);
  }
  // If we didn't have a tagged @description, we'll use any untagged text as
  // the description. If we also didn't have a @summary and the untagged text
  // has a line break, we'll use the first chunk as the summary, and the
  // remainder as a description.
  if (v.description === undefined) {
    // Strangely, it only seems possible to get the untagged jsdoc comments
    // via the typechecker/symbol API
    const checker = analyzer.program.getTypeChecker();
    const symbol =
      checker.getSymbolAtLocation(node) ??
      checker.getTypeAtLocation(node).getSymbol();
    const comments = symbol?.getDocumentationComment(checker);
    if (comments !== undefined) {
      const comment = comments.map((c) => c.text).join('\n');
      addJSDocCommentInfo(v, comment);
    }
  }
  return v;
};

/**
 * Parse summary, description, and deprecated information from JSDoc comments on
 * a given source file.
 */
export const parseModuleJSDocInfo = (sourceFile: ts.SourceFile) => {
  const firstChild = ts.forEachChild(sourceFile, (n) => n);
  if (firstChild === undefined) {
    return {};
  }
  const jsDocs = firstChild.getChildren().filter(ts.isJSDoc);
  const moduleJSDocs = jsDocs.slice(0, jsDocs.length > 1 ? -1 : 1);
  const jsDocTags = moduleJSDocs.flatMap((d) => d.tags ?? []);
  if (
    jsDocs.length === 1 &&
    !jsDocTags.find(
      (t) =>
        t.tagName.text === 'module' ||
        t.tagName.text === 'fileoverview' ||
        t.tagName.text === 'packageDocumentation'
    )
  ) {
    return {};
  }
  const info: NodeJSDocInfo = {};
  addJSDocTagInfo(info, jsDocTags);
  if (info.description === undefined) {
    const comment = moduleJSDocs
      .map((d) => d.comment)
      .filter((c) => c !== undefined)
      .join('\n');
    addJSDocCommentInfo(info, comment);
  }
  return info;
};

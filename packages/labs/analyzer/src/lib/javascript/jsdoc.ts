/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {AnalyzerInterface, NamedJSDocInfo, NodeJSDocInfo} from '../model.js';

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
  /^\s*(?<name>[^\s:]+)([\s-:]+)?(?<summary>[^\n\r]+)?([\n\r]+(?<description>[\s\S]*))?$/m;

// Regex for parsing summary and description from JSDoc comments
const parseDescSummaryRE =
  /^\s*(?<summary>[^\n\r]+)\r?\n\r?\n(?<description>[\s\S]*)$/m;

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
export const parseNameDescSummary = (
  tag: ts.JSDocTag
): NamedJSDocInfo | undefined => {
  const {comment} = tag;
  if (comment == undefined) {
    return undefined;
  }
  if (typeof comment !== 'string') {
    throw new DiagnosticsError(tag, `Internal error: unsupported node type`);
  }
  const nameDescSummary = comment.match(parseNameDescSummaryRE);
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
    for (const tag of jsDocTags) {
      const {comment} = tag;
      if (comment !== undefined && typeof comment !== 'string') {
        throw new DiagnosticsError(
          tag,
          `Internal error: unsupported node type`
        );
      }
      switch (tag.tagName.text) {
        case 'description':
          if (comment !== undefined) {
            v.description = normalizeLineEndings(comment);
          }
          break;
        case 'summary':
          if (comment !== undefined) {
            v.summary = comment;
          }
          break;
        case 'deprecated':
          v.deprecated = comment !== undefined ? comment : true;
          break;
      }
    }
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
      if (v.summary !== undefined) {
        v.description = normalizeLineEndings(comment);
      } else {
        const info = comment.match(parseDescSummaryRE);
        if (info === null) {
          v.description = normalizeLineEndings(comment);
        } else {
          const {summary, description} = info.groups!;
          v.summary = summary;
          v.description = normalizeLineEndings(description);
        }
      }
    }
  }
  return v;
};

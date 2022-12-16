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
  JSDocInfo,
  NamedJSDocInfo,
  NamedTypedJSDocInfo,
  NodeJSDocInfo,
} from '../model.js';

/**
 * @fileoverview
 *
 * Utilities for parsing JSDoc comments.
 */

/**
 * Returns true if given node has a JSDoc tag
 */
export const hasJSDocTag = (node: ts.Node, tag: string) => {
  return ts.getJSDocTags(node).some((t) => t.tagName.text === tag);
};

/**
 * Remove line feeds from JSDoc summaries, so they are normalized to
 * unix `\n` line endings.
 */
const normalizeLineEndings = (s: string) => s.replace(/\r/g, '').trim();

// Regex for parsing name, type, summary, and descriptions from JSDoc comments
const parseNameTypeDescSummaryRE =
  /^(?<name>\S+)(?:\s+{(?<type>.*)})?(?:[\s\-:]+)?(?:(?<summary>(?:[^\n]+\n)+)\s*\n(?=\S))?(?<description>[\s\S]*)$/m;

// Regex for parsing name, summary, and descriptions from JSDoc comments
const parseNameDescSummaryRE =
  /^(?<name>[^\s:]+)(?:[\s\-:]+)?(?:(?<summary>(?:[^\n]+\n)+)\s*\n(?=\S))?(?<description>[\s\S]*)$/m;

// Regex for parsing summary and description from JSDoc comments
const parseDescSummaryRE =
  /^^(?:(?<summary>(?:[^\n]+\n)+)\s*\n(?=\S))?(?<description>[\s\S]*)$/m;

const getJSDocTagComment = (tag: ts.JSDocTag) => {
  let {comment} = tag;
  if (comment === undefined) {
    return undefined;
  }
  if (Array.isArray(comment)) {
    comment = comment.map((c) => c.text).join('');
  }
  if (typeof comment !== 'string') {
    throw new DiagnosticsError(tag, `Internal error: unsupported node type`);
  }
  return normalizeLineEndings(comment).trim();
};

/**
 * Parses name, type, summary, and description from JSDoc tag for things like
 * @fires.
 *
 * Supports the following patterns following the tag (TS parses the tag for us):
 * * @fires event-name
 * * @fires event-name description
 * * @fires event-name - description
 * * @fires event-name {Type}
 * * @fires event-name {Type} description
 * * @fires event-name {Type} - summary
 * *
 * * description
 */
export const parseNamedTypedJSDocInfo = (tag: ts.JSDocTag) => {
  const comment = getJSDocTagComment(tag);
  if (comment == undefined) {
    return undefined;
  }
  const nameDescSummary = comment.match(parseNameTypeDescSummaryRE);
  if (nameDescSummary === null) {
    throw new DiagnosticsError(tag, 'Unexpected JSDoc format');
  }
  const {name, type, description, summary} = nameDescSummary.groups!;
  const info: NamedTypedJSDocInfo = {name, type};
  if (summary !== undefined) {
    info.summary = normalizeLineEndings(summary);
  }
  if (description.length > 0) {
    info.description = normalizeLineEndings(description);
  }
  return info;
};

/**
 * Parses name, summary, and description from JSDoc tag for things like @slot,
 * @cssPart, and @cssProp.
 *
 * Supports the following patterns following the tag (TS parses the tag for us):
 * * @slot name
 * * @slot name description
 * * @slot name: description
 * * @slot name - description
 * * @slot name - summary...
 * *
 * * description (multiline)
 */
export const parseNamedJSDocInfo = (
  tag: ts.JSDocTag
): NamedJSDocInfo | undefined => {
  const comment = getJSDocTagComment(tag);
  if (comment == undefined) {
    return undefined;
  }
  const nameDescSummary = comment.match(parseNameDescSummaryRE);
  if (nameDescSummary === null) {
    throw new DiagnosticsError(tag, 'Unexpected JSDoc format');
  }
  const {name, description, summary} = nameDescSummary.groups!;
  const info: NamedJSDocInfo = {name};
  if (summary !== undefined) {
    info.summary = normalizeLineEndings(summary);
  }
  if (description.length > 0) {
    info.description = normalizeLineEndings(description);
  }
  return info;
};

/**
 * Parses summary and description from JSDoc tag for things like @return.
 *
 * Supports the following patterns following the tag (TS parses the tag for us):
 * * @return description
 * * @return summary...
 * *
 * * description (multiline)
 */
export const parseJSDocInfo = (tag: ts.JSDocTag): JSDocInfo | undefined => {
  const comment = getJSDocTagComment(tag);
  if (comment == undefined) {
    return undefined;
  }
  const descSummary = comment.match(parseDescSummaryRE);
  if (descSummary === null) {
    throw new DiagnosticsError(tag, 'Unexpected JSDoc format');
  }
  const {description, summary} = descSummary.groups!;
  const info: JSDocInfo = {};
  if (summary !== undefined) {
    info.summary = normalizeLineEndings(summary);
  }
  if (description.length > 0) {
    info.description = normalizeLineEndings(description);
  }
  return info;
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
    const comment = getJSDocTagComment(tag);
    switch (tag.tagName.text) {
      case 'description':
      case 'fileoverview':
      case 'packageDocumentation':
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

/**
 * Add description and/or summary info from freeform comment text in a
 * JSDoc comment block to the given info object.
 */
const addJSDocCommentInfo = (info: NodeJSDocInfo, comment: string) => {
  if (comment.length === 0) {
    return;
  }
  if (info.summary !== undefined && info.description === undefined) {
    info.description = comment;
  } else if (info.description !== undefined && info.summary === undefined) {
    info.summary = comment;
  } else {
    const match = comment.match(parseDescSummaryRE);
    if (match === null) {
      info.description = normalizeLineEndings(comment);
    } else {
      const {summary, description} = match.groups!;
      if (summary !== undefined) {
        info.summary = normalizeLineEndings(summary);
      }
      if (description.length > 0) {
        info.description = normalizeLineEndings(description);
      }
    }
  }
};

/**
 * Parse summary, description, and deprecated information from JSDoc comments on
 * a given node.
 */
export const parseNodeJSDocInfo = (node: ts.Node): NodeJSDocInfo => {
  const info: NodeJSDocInfo = {};
  const jsDocTags = ts.getJSDocTags(node);
  if (jsDocTags !== undefined) {
    addJSDocTagInfo(info, jsDocTags);
  }
  // If we didn't have a tagged @description, we'll use any untagged text as
  // the description. If we also didn't have a @summary and the untagged text
  // has a line break, we'll use the first chunk as the summary, and the
  // remainder as a description.
  if (info.description === undefined || info.summary === undefined) {
    const comment = normalizeLineEndings(
      node
        .getChildren()
        .filter(ts.isJSDoc)
        .map((n) => n.comment)
        .filter((c) => c !== undefined)
        .join('\n')
    );
    addJSDocCommentInfo(info, comment);
  }
  return info;
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

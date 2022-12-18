/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing with events
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {Event} from '../model.js';
import {AnalyzerInterface} from '../model.js';
import {getTypeForJSDocTag} from '../types.js';

/**
 * Returns an array of analyzer `Event` models for the given
 * ts.ClassDeclaration.
 */
export const addEventsToMap = (
  tag: ts.JSDocTag,
  events: Map<string, Event>,
  analyzer: AnalyzerInterface
) => {
  const {comment} = tag;
  if (comment === undefined) {
    return;
  } else if (typeof comment === 'string') {
    const result = parseFiresTagComment(comment);
    if (result === undefined) {
      throw new DiagnosticsError(
        tag,
        'The @fires annotation was not in a recognized form. ' +
          'Use `@fires event-name {Type} - Description`.'
      );
    }
    const {name, type, description} = result;
    events.set(name, {
      name,
      type: type ? getTypeForJSDocTag(tag, analyzer) : undefined,
      description,
    });
  } else {
    // TODO: when do we get a ts.NodeArray<ts.JSDocComment>?
    throw new DiagnosticsError(tag, `Internal error: unsupported node type`);
  }
};

const parseFiresTagComment = (comment: string) => {
  // Valid variants:
  // @fires event-name
  // @fires event-name The event description
  // @fires event-name - The event description
  // @fires event-name {EventType}
  // @fires event-name {EventType} The event description
  // @fires event-name {EventType} - The event description
  const eventCommentRegex =
    /^(?<name>\S+)(?:\s+{(?<type>.*)})?(?:\s+(?:-\s+)?(?<description>.+))?$/;
  const match = comment.match(eventCommentRegex);
  if (match === null) {
    return undefined;
  }
  const {name, type, description} = match.groups!;
  return {
    name,
    type,
    description,
  };
};

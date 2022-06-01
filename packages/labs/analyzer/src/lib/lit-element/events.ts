/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with events
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {Event, ProgramContext} from '../model.js';

import {LitClassDeclaration} from './lit-element.js';

export const getEvents = (
  node: LitClassDeclaration,
  programContext: ProgramContext
) => {
  const events = new Map<string, Event>();
  const jsDocTags = ts.getJSDocTags(node);
  if (jsDocTags !== undefined) {
    for (const tag of jsDocTags) {
      if (tag.tagName.text === 'fires') {
        const {comment} = tag;
        if (comment === undefined) {
          continue;
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
            type: type
              ? programContext.getTypeForConstructorName(type, tag)
              : undefined,
            description,
          });
        } else {
          // TODO: when do we get a ts.NodeArray<ts.JSDocComment>?
          throw new DiagnosticsError(
            tag,
            `Internal error: unsupported node type`
          );
        }
      }
    }
  }
  return events;
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

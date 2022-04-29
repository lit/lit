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
import {Event} from '../model.js';

import {LitClassDeclaration} from './lit-element.js';

export const getEvents = (node: LitClassDeclaration) => {
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
            // TODO(justinfagnani): report syntax error?
            continue;
          }
          const {name, type, description} = result;
          // TODO(justinfagnani): how do we dereference the event type name
          // into a TypeScript type? TypeScript will automatically do this for
          // jsdoc tags it understands, but unfortunately @fires is not one of
          // them.
          events.set(name, {
            name,
            typeString: type,
            description,
          });
        } else {
          // TODO: when do we get a ts.NodeArray<ts.JSDocComment>?
          throw new Error(`Internal error: unsupported node type`);
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
  return {
    name: match[1],
    type: match[2],
    description: match[3],
  };
};

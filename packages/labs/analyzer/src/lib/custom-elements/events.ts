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
import {parseNamedTypedJSDocInfo} from '../javascript/jsdoc.js';
import {Event} from '../model.js';
import {AnalyzerInterface} from '../model.js';
import {getTypeForTypeString} from '../types.js';

/**
 * Returns an array of analyzer `Event` models for the given
 * ts.ClassDeclaration.
 */
export const addEventsToMap = (
  tag: ts.JSDocTag,
  events: Map<string, Event>,
  analyzer: AnalyzerInterface
) => {
  const info = parseNamedTypedJSDocInfo(tag, analyzer);
  if (info === undefined) {
    return;
  }
  const {name, type, description, summary} = info;
  events.set(name, {
    name,
    type: type ? getTypeForTypeString(type, tag, analyzer) : undefined,
    description,
    summary,
  });
};

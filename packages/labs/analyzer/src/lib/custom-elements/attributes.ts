/**
 * @fileoverview
 *
 * Utilities for analyzing attributes
 */

import ts from 'typescript';
import {parseNamedTypedJSDocInfo} from '../javascript/jsdoc.js';
import {Attribute} from '../model.js';
import {AnalyzerInterface} from '../model.js';
import {getTypeForTypeString} from '../types.js';

/**
 * Returns an array of analyzer `Event` models for the given
 * ts.ClassDeclaration.
 */
export const addJSDocAttributeToMap = (
  tag: ts.JSDocTag,
  events: Map<string, Attribute>,
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
    default: info.default,
    summary,
  });
};

/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing attributes
 */

import ts from 'typescript';
import {parseNamedTypedJSDocInfo} from '../javascript/jsdoc.js';
import {Attribute, CustomElementField} from '../model.js';
import {AnalyzerInterface} from '../model.js';
import {getTypeForTypeString} from '../types.js';

const getAttributePropsFromField = (
  customElementFieldMap: Map<string, CustomElementField>,
  attribute: string
) => {
  const found = Array.from(customElementFieldMap.values()).find(
    (field) => field.attribute === attribute
  );
  if (found && !found.static) {
    const {
      attribute: _,
      name: fieldName,
      reflects,
      static: isStatic,
      privacy,
      source,
      readonly,
      ...rest
    } = found;
    return {...rest, fieldName};
  }
  return;
};

/**
 * Returns an array of analyzer `Attribute` models for the given
 * ts.ClassDeclaration.
 */
export const addJSDocAttributeToMap = (
  tag: ts.JSDocTag,
  attributes: Map<string, Attribute>,
  analyzer: AnalyzerInterface,
  customElementFieldMap: Map<string, CustomElementField>
) => {
  const info = parseNamedTypedJSDocInfo(tag, analyzer);
  if (info === undefined) {
    return;
  }
  const {name, type, description, summary} = info;
  const existingMember = getAttributePropsFromField(
    customElementFieldMap,
    name
  );
  attributes.set(name, {
    ...existingMember,
    name,
    type: type
      ? getTypeForTypeString(type, tag, analyzer)
      : existingMember?.type ?? undefined,
    description,
    default: info.default,
    summary,
  });
};

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
import {createDiagnostic} from '../errors.js';

const getAttributePropsFromField = (
  customElementFieldMap: Map<string, CustomElementField>,
  attribute: string
) => {
  const found = Array.from(customElementFieldMap.values()).find(
    (field) => field.attribute === attribute
  );
  if (found && !found.static) {
    const {
      // because we're excluding properties from `rest`
      /* eslint-disable @typescript-eslint/no-unused-vars */
      attribute,
      reflects,
      static: _,
      privacy,
      source,
      readonly,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      name: fieldName,
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
  if (attributes.has(name))
    // TODO(bennypowers): merge? retain? make configurable?
    // decide on an approach in cases when jsDoc attr overrides existing attr
    analyzer.addDiagnostic(
      createDiagnostic({
        category: analyzer.typescript.DiagnosticCategory.Warning,
        typescript: analyzer.typescript,
        node: tag,
        message: `attribute ${name} already exists, overwriting with JSDoc`,
      })
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

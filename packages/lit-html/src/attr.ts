/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {_$LH as litPrivate} from './lit-html.js';
import type {Template as LitTemplate} from './lit-html.js';
import {PartType} from './directive';
import {spread} from './directives/spread.js';

const Template = litPrivate._Template;
const AttributePart = litPrivate._AttributePart;
const PropertyPart = litPrivate._PropertyPart;
const BooleanAttributePart = litPrivate._BooleanAttributePart;
const EventPart = litPrivate._EventPart;

const templateCache = new WeakMap<TemplateStringsArray, LitTemplate>();

export const attr = (
  strings: TemplateStringsArray,
  ...values: Array<unknown>
) => {
  let template = templateCache.get(strings);
  if (template === undefined) {
    const stringsWithTag = [
      '<div ' + strings[0],
      ...strings.slice(1, -1),
      strings[strings.length - 1] + ' ></div>',
    ];
    templateCache.set(
      strings,
      (template = new Template({
        strings: stringsWithTag as unknown as TemplateStringsArray,
        values,
        _$litType$: 1,
      }))
    );
  }
  const spreadValues: {[key: string]: unknown} = {};
  let i = 0;
  for (const part of template.parts as Array<NonChildTemplatePart>) {
    const value = values[i++];
    const key = getPartKey(part);
    if (key === '') {
      // TODO: element part, recurse
    } else {
      spreadValues[key] = value;
    }
  }
  return spread(spreadValues);
};

type NonChildTemplatePart = AttributeTemplatePart | ElementTemplatePart;

type AttributeTemplatePart = {
  readonly type: typeof PartType.ATTRIBUTE;
  readonly index: number;
  readonly name: string;
  /** @internal */
  readonly ctor: typeof AttributePart;
  /** @internal */
  readonly strings: ReadonlyArray<string>;
};
type ElementTemplatePart = {
  readonly type: typeof PartType.ELEMENT;
  readonly index: number;
};

const getPartKey = (part: NonChildTemplatePart) => {
  switch (part.type) {
    case PartType.ATTRIBUTE: {
      const name = part.name;
      switch (part.ctor) {
        case AttributePart: {
          return name;
        }
        case PropertyPart: {
          return '.' + name;
        }
        case BooleanAttributePart: {
          return '?' + name;
        }
        case EventPart: {
          return '@' + name;
        }
      }
      break;
    }
    case PartType.ELEMENT: {
      // Attribute's cannot have an empty name, so we can use this
      return '';
    }
    default:
      part as void;
  }
  throw new Error();
};

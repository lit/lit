/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {noChange, nothing, _$LH as litHtmlPrivate} from '../lit-html.js';
import {
  directive,
  DirectiveParameters,
  PartInfo,
  PartType,
  Part,
  AttributePart,
  ElementPart,
  PropertyPart,
  BooleanAttributePart,
  EventPart,
} from '../directive.js';
import {AsyncDirective} from '../async-directive.js';
import {isDirectiveResult, setCommittedValue} from '../directive-helpers.js';

const {
  _AttributePart: AttributePartImpl,
  _PropertyPart: PropertyPartImpl,
  _BooleanAttributePart: BooleanAttributePartImpl,
  _EventPart: EventPartImpl,
} = litHtmlPrivate;

export interface SpreadValues {
  readonly [name: string]: unknown;
}

let i = 0;
class SpreadDirective extends AsyncDirective {
  _id = i++;
  _previousValues: Set<string> = new Set();
  _parts = new Map<string, Part>();

  _selfPart?: ElementPart;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error(
        'The `spread` directive must be used al element expression'
      );
    }
  }

  render(_values: SpreadValues) {
    // TODO for SSR
    throw new Error('Not implemented');
  }

  override update(
    elementPart: ElementPart,
    [values]: DirectiveParameters<this>
  ) {
    const {element, templateParts} = (this._selfPart ??= elementPart);

    this._cleanUp(values);

    // _flushSpread is set from a later spread directive that's removing
    // a value
    const flush = !!values._flushSpread;

    // Add or update properties
    for (const name in values) {
      const value = values[name];
      if (value != null) {
        let part = this._parts.get(name);
        if (part === undefined) {
          const m = /([.?@])?(.*)/.exec(name)!;
          const ctor =
            m[1] === '.'
              ? PropertyPartImpl
              : m[1] === '?'
              ? BooleanAttributePartImpl
              : m[1] === '@'
              ? EventPartImpl
              : AttributePartImpl;
          this._parts.set(
            name,
            (part = new ctor(
              element!,
              m[2],
              ['', ''],
              elementPart,
              templateParts,
              elementPart.options
            ))
          );
        }
        if (flush) {
          // Clear the commited value to reset dirty-checking
          setCommittedValue(part);
        }
        part._$setValue([value], undefined, 0);
      }
    }
    return noChange;
  }

  private _cleanUp(values?: SpreadValues) {
    // Remove old properties that no longer exist
    // We use forEach() instead of for-of so that re don't require down-level
    // iteration.
    const {element, templateParts} = this._selfPart!;

    const partsToReset = new Set<[Part, number]>();
    this._parts!.forEach((part, name) => {
      // If the name isn't in values or it's null/undefined
      if (values?.[name] == null) {
        const key = getPartKey(part);
        const partsAndIndices = templateParts.map((p, i) => [p, i] as const);
        const conflictingParts = partsAndIndices.filter(
          ([p]) =>
            p?.type !== PartType.CHILD &&
            p?.element === element &&
            (getPartKey(p) === key || getPartKey(p) === '')
        ) as Array<[NonChildPart, number]>;
        let foundSelfPart = false;
        const previousConflictingParts = conflictingParts.filter(
          ([p]) => !(foundSelfPart ||= p === this._selfPart)
        );
        // console.log(
        //   'remove',
        //   this._id,
        //   part.type,
        //   key,
        //   templateParts.length,
        //   conflictingParts.length,
        //   previousConflictingParts.length,
        // );

        // conflictingParts always contains our own part, so length must be > 1
        // to have conflicts
        if (conflictingParts.length > 1) {
          previousConflictingParts.forEach((cp) => partsToReset.add(cp));
        } else {
          // Clear the part, which will remove attributes and disconnect directives
          part._$setValue([nothing], undefined, 0);
          // We don't need to clear if there's a conflicting part that will
          // overwrite the value anyway
        }
        // Remove the part
        this._parts!.delete(name);
      }
    });

    // Reset any found conflicting parts
    const templateValues = this._selfPart!.values!;
    partsToReset.forEach(([cp, i]) => {
      // Clear the commited value to reset dirty-checking
      setCommittedValue(cp);
      // Reset the value to write it
      // TODO: this doesn't handle multi-valued attribute parts
      // We need to know the value index like TemplateInstance.update()
      const value = templateValues[i];

      if (
        isDirectiveResult(value) &&
        value._$litDirective$ === SpreadDirective
      ) {
        // If the conflicting part holds a spread directive we need to force
        // all bindings in the spread to re-write to the DOM
        value.values = [{...(value.values[0] as object), _flushSpread: true}];
      }
      cp._$setValue(templateValues, cp._$parent, i);
    });
  }

  override disconnected() {
    // TODO (justinfagnani): we don't really need to do this work for a
    // element/subtree disconnection, only if the directive instance itself is
    // removed from binding. Can we differentiate?
    this._cleanUp();
  }

  override reconnected() {
    // Nothing to do because we'll get an update?
  }
}

/**
 */
export const spread = directive(SpreadDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {SpreadDirective};

export const getPartKey = (part: Part) => {
  switch (part.type) {
    case PartType.CHILD: {
      return undefined;
    }
    case PartType.ATTRIBUTE: {
      return part.name;
    }
    case PartType.BOOLEAN_ATTRIBUTE: {
      return '?' + part.name;
    }
    case PartType.PROPERTY: {
      return '.' + part.name;
    }
    case PartType.EVENT: {
      return '@' + part.name;
    }
    case PartType.ELEMENT: {
      // Attribute's cannot have an empty name, so we can use this
      return '';
    }
    default:
      part as void;
      return undefined;
  }
};

type NonChildPart =
  | AttributePart
  | PropertyPart
  | BooleanAttributePart
  | EventPart
  | ElementPart;

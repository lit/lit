/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {noChange, EventPart} from 'lit-html';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from 'lit-html/directive.js';

export class Action extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.EVENT) {
      throw new Error(
        'The `action` directive must be used in an `@event` part'
      );
    }
  }

  render(_cb: (e: Event) => void) {
    return noChange;
  }
  update(_part: EventPart, [cb]: DirectiveParameters<this>) {
    return this.render(cb);
  }
}

export const action = directive(Action);

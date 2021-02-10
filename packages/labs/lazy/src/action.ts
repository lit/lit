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
import {LazyElement, ReactiveController} from './lazy-element.js';
import {EventPart} from 'lit-html';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from 'lit-html/directive.js';
import {patchEvent} from './orchestrator.js';

export class Action extends Directive {
  host: LazyElement<ReactiveController> | undefined;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.EVENT) {
      throw new Error(
        'The `action` directive must be used in an `@event` part'
      );
    }
  }

  render(cb: (e: Event) => void) {
    return cb;
  }

  private _listener?: (e: Event) => void;

  update(part: EventPart, [cb]: DirectiveParameters<this>) {
    if (this._listener === undefined) {
      const host = part.options?.host as LazyElement<ReactiveController>;
      if (host !== undefined) {
        this._listener = async (e: Event) => {
          if (!host.isBootstrapped) {
            patchEvent(e);
            await host.bootstrap();
          }
          if (host.isBootstrapped) {
            cb(e);
          }
        };
      }
    }
    return this.render(this._listener!);
  }
}

export const action = directive(Action);

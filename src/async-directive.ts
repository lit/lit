/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved.
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

import {Directive, Part, PartInfo} from './directive.js';
import {AttributePart as LegacyAttributePart, BooleanAttributePart as LegacyBooleanAttributePart, EventPart as LegacyEventPart, NodePart as LegacyNodePart, Part as LegacyPart, PropertyPart as LegacyPropertyPart,} from './lit-html.js';

/**
 * A superclass for directives that need to asynchronously update.
 */
export abstract class AsyncDirective extends Directive {
  private readonly _legacyPart: LegacyPart;
  private _renderedYet = false;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    this._legacyPart = (partInfo as Part).legacyPart;
  }

  private _legacyGetNode(): Node|undefined {
    if (this._legacyPart instanceof LegacyNodePart) {
      return this._legacyPart.startNode;
    } else if (this._legacyPart instanceof LegacyEventPart) {
      return this._legacyPart.element;
    } else if (this._legacyPart instanceof LegacyBooleanAttributePart) {
      return this._legacyPart.element;
    } else if (
        this._legacyPart instanceof LegacyPropertyPart ||
        this._legacyPart instanceof LegacyAttributePart) {
      return this._legacyPart.committer.element;
    }
    return undefined;
  }

  private _shouldRender() {
    if (!this._renderedYet) {
      this._renderedYet = true;
      return true;
    }
    const node = this._legacyGetNode();
    return !!(node?.isConnected);
  }

  setValue(value: unknown) {
    if (!this._shouldRender()) {
      // node is disconnected, do nothing.
      return;
    }

    this._legacyPart.setValue(value);
    this._legacyPart.commit();
  }

  /**
   * User callback for implementing logic to release any
   * resources/subscriptions that may have been retained by this directive.
   * Since directives may also be re-connected, `reconnected` should also be
   * implemented to restore the working state of the directive prior to the next
   * render.
   *
   * NOTE: In lit-html 1.x, the `disconnected` and `reconnected` callbacks WILL
   * NOT BE CALLED. The interface is provided here for forward-compatible
   * directive authoring only.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected disconnected() {
  }
  /**
   * User callback to restore the working state of the directive prior to the
   * next render. This should generally re-do the work that was undone in
   * `disconnected`.
   *
   * NOTE: In lit-html 1.x, the `disconnected` and `reconnected` callbacks WILL
   * NOT BE CALLED. The interface is provided here for forward-compatible
   * directive authoring only.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected reconnected() {
  }
}

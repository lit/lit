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
import * as legacyLit from './lit-html.js';

/**
 * A superclass for directives that need to asynchronously update.
 */
export abstract class AsyncDirective extends Directive {
  private readonly ddPart: legacyLit.Part;
  private renderedYet = false;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    this.ddPart = (partInfo as Part).legacyPart;
  }

  private ddGetNode(): Node|undefined {
    if (this.ddPart instanceof legacyLit.NodePart) {
      return this.ddPart.startNode;
    } else if (this.ddPart instanceof legacyLit.EventPart) {
      return this.ddPart.element;
    } else if (this.ddPart instanceof legacyLit.BooleanAttributePart) {
      return this.ddPart.element;
    } else if (
        this.ddPart instanceof legacyLit.PropertyPart ||
        this.ddPart instanceof legacyLit.AttributePart) {
      return this.ddPart.committer.element;
    }
    return undefined;
  }

  private shouldRender() {
    if (!this.renderedYet) {
      this.renderedYet = true;
      return true;
    }
    const node = this.ddGetNode();
    if (node != null && !node.isConnected) {
      // node is disconnected, do not render
      return false;
    }
    return true;
  }

  setValue(value: unknown) {
    if (!this.shouldRender()) {
      // node is disconnected, do nothing.
      return;
    }

    this.ddPart.setValue(value);
    this.ddPart.commit();
  }

  /**
   * User callback for implementing logic to release any
   * resources/subscriptions that may have been retained by this directive.
   * Since directives may also be re-connected, `reconnected` should also be
   * implemented to restore the working state of the directive prior to the next
   * render.
   *
   * NOTE: In lit-html 1.x, the `disconnected` and `reconnected` callbacks WILL NOT BE
   * CALLED. The interface is provided here for forward-compatible directive authoring only.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected disconnected() {
  }
  /**
   * User callback to restore the working state of the directive prior to the next
   * render. This should generally re-do the work that was undone in `disconnected`.
   *
   * NOTE: In lit-html 1.x, the `disconnected` and `reconnected` callbacks WILL NOT BE
   * CALLED. The interface is provided here for forward-compatible directive authoring only.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected reconnected() {
  }
}

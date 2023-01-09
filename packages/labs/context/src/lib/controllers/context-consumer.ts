/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent} from '../context-request-event.js';
import {Context, ContextType} from '../create-context.js';
import {ReactiveController, ReactiveElement} from 'lit';

/**
 * ContextConsumer is a ReactiveController which binds a custom-element's
 * lifecycle to the Context API. When an element is connected to the DOM it
 * will emit the context-request event, invoking the callback set on the
 * controller when the context request is satisfied. It will also call
 * the dispose method provided by the Context API when the element is
 * disconnected.
 */
export class ContextConsumer<
  C extends Context<unknown, unknown>,
  HostElement extends ReactiveElement
> implements ReactiveController
{
  private provided = false;

  public value?: ContextType<C> = undefined;

  constructor(
    protected host: HostElement,
    private context: C,
    private callback?: (value: ContextType<C>, dispose?: () => void) => void,
    private subscribe: boolean = false
  ) {
    this.host.addController(this);
  }

  private unsubscribe?: () => void;

  hostConnected(): void {
    this.dispatchRequest();
  }
  hostDisconnected(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  private dispatchRequest() {
    this.host.dispatchEvent(
      new ContextRequestEvent(
        this.context,
        (value, unsubscribe) => {
          // some providers will pass an unsubscribe function indicating they may provide future values
          if (this.unsubscribe) {
            // if the unsubscribe function changes this implies we have changed provider
            if (this.unsubscribe !== unsubscribe) {
              // cleanup the old provider
              this.provided = false;
              this.unsubscribe();
            }
            // if we don't support subscription, immediately unsubscribe
            if (!this.subscribe) {
              this.unsubscribe();
            }
          }

          // store the value so that it can be retrieved from the controller
          this.value = value;
          // schedule an update in case this value is used in a template
          this.host.requestUpdate();

          // only invoke callback if we are either expecting updates or have not yet
          // been provided a value
          if (!this.provided || this.subscribe) {
            this.provided = true;
            if (this.callback) {
              this.callback(value, unsubscribe);
            }
          }

          this.unsubscribe = unsubscribe;
        },
        this.subscribe
      )
    );
  }
}

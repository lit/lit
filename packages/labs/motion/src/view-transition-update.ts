/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { LitElement } from 'lit';

type Constructor<T> = new (...args: any[]) => T;

/** Extend a LitElement to use view transitions (if available) on DOM updates.
 *  DOM updates will wait for transition animations to finish before running. */
export const ViewTransitionUpdate =
    <T extends Constructor<LitElement>>(superClass: T) => {
        class LitElementTransition extends superClass {

            /** Holds the previous transition initiated by this component.
             *  The next DOM update won't be performed until this finishes (animation complete and interactive) */
            declare private lifecycleRenderTransition: ViewTransition;

            async performUpdate() {
                if (!(document as DocumentWithTransition).startViewTransition)
                    return super.performUpdate();

                if (this.lifecycleRenderTransition) {
                    try {
                        // Wait for the previous _animation_ to finish before starting the DOM update
                        await this.lifecycleRenderTransition.finished;
                    }
                    catch (e) {
                        // The promise can reject, but the DOM update should still happen
                        // see https://github.com/WICG/view-transitions/blob/main/explainer.md#error-handling
                        console.error('Error in transition animation', e);
                    }
                }

                this.lifecycleRenderTransition = (document as DocumentWithTransition).startViewTransition(
                    () => {
                        super.performUpdate();
                        return super.updateComplete; // Return a promise from the callback that resolves once the DOM update is done
                    });
            }
        }

        return LitElementTransition as Constructor<LitElement> & T;
    };


interface DocumentWithTransition
    extends Document {
    /** The startViewTransition() method of the View Transitions API starts a new view transition and returns a ViewTransition object to represent it.  
     When startViewTransition() is invoked, a sequence of steps is followed as explained in The view transition process. 
     @param callback A callback function typically invoked to update the DOM during the view transition process, which returns a Promise. The callback is invoked once the API has taken a screenshot of the current page. When the promise returned by the callback fulfills, the view transition begins in the next frame. If the promise returned by the callback rejects, the transition is abandoned.*/
    startViewTransition(callback: () => Promise<unknown>): ViewTransition;
}

interface ViewTransition {
    /** A Promise that fulfills once the transition animation is finished, and the new page view is visible and interactive to the user. */
    finished: Promise<unknown>;

    /** A Promise that fulfills once the pseudo-element tree is created and the transition animation is about to start. */
    ready: Promise<unknown>;

    /** A Promise that fulfills when the promise returned by the document.startViewTransition()'s callback fulfills. */
    updateCallbackDone: Promise<unknown>;

    /** Skips the animation part of the view transition, but doesn't skip running the document.startViewTransition() callback that updates the DOM. */
    skipTransition(): void;
}

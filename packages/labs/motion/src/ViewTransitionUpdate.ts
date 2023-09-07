import {LitElement} from 'lit';

/** Mixin to extend a LitElement to use view transitions (if available) on DOM updates */
export function ViewTransitionUpdate<TBase extends LitElement>(Base: TBase) {
    return class extends LitElement {
        private lifecycleRenderTransition: ViewTransition;
  
        async performUpdate() {
            if (!(document as DocumentWithTransition).startViewTransition)
                return await super.performUpdate();
    
            if (this.lifecycleRenderTransition)
                await this.lifecycleRenderTransition.finished;
    
            this.lifecycleRenderTransition = (document as DocumentWithTransition).startViewTransition(
                async () => 
                    await super.performUpdate());
        }
    };
  }

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

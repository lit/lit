import { directive } from '../lib/directive.js';
import { BooleanAttributePart } from '../lib/parts.js';

interface TrackAnimationData {
  trackedAnimations: string[];
  activeAnimations: Set<string>;
}

const dataForPart = new WeakMap<BooleanAttributePart, TrackAnimationData>();

/**
 * Tracks animations on an element, reflecting the state to a boolean attribute.
 *
 * @param trackedAnimations the animation name(s) to track
 * @example
 * ```js
 * html`<div ?animating=${trackAnimation('my-animation', 'my-other-animation')}></div>`
 * ```
 */
export const trackAnimation = directive((...trackedAnimations: string[]) => (part: BooleanAttributePart) => {
  if (!(part instanceof BooleanAttributePart)) {
    throw new Error('trackAnimation can only be used in a boolean attribute');
  }

  const cachedData = dataForPart.get(part);
  if (cachedData) {
    // re-render, only (potentially) update tracked animations
    cachedData.trackedAnimations = trackedAnimations;
    return;
  }

  // first render, set up listeners
  const data = { trackedAnimations, activeAnimations: new Set<string>() };
  dataForPart.set(part, data);

  const { element } = part;

  const onStart = (e: Event) => {
    const { animationName } = (e as AnimationEvent);

    if (e.target === element && data.trackedAnimations.includes(animationName)) {
      data.activeAnimations.add(animationName)
      part.setValue(true);
      part.commit();
    }
  };

  const onEndOrCancel = (e: Event) => {
    const { animationName } = (e as AnimationEvent);
    if (e.target === element && data.activeAnimations.has(animationName)) {
      data.activeAnimations.delete(animationName);

      if (data.activeAnimations.size === 0) {
        part.setValue(false);
        part.commit();
      }
    }
  };

  element.addEventListener('animationstart', onStart);
  // animationcancel is not implemented on all browsers
  // (https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/animationcancel_event)
  element.addEventListener('animationcancel', onEndOrCancel);
  element.addEventListener('animationend', onEndOrCancel);
});

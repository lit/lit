import { directive } from '../lib/directive.js';
import { BooleanAttributePart } from '../lib/parts.js';

interface TrackTransitionData {
  trackedProperties: string[];
  activeTransitions: Set<string>;
}

const dataForPart = new WeakMap<BooleanAttributePart, TrackTransitionData>();

/**
 * Tracks transitions on an element, reflecting the state to a boolean attribute.
 *
 * @param trackTransition the css property name(s) to track
 * @example
 * ```js
 * html`<div ?animating=${trackTransition('width', 'height')}></div>`
 * ```
 */
export const trackTransition = directive((...trackedProperties: string[]) => (part: BooleanAttributePart) => {
  if (!(part instanceof BooleanAttributePart)) {
    throw new Error('trackTransition can only be used in a boolean attribute');
  }

  const cachedData = dataForPart.get(part);
  if (cachedData) {
    // re-render, only (potentially) update tracked properties
    cachedData.trackedProperties = trackedProperties;
    return;
  }

  // first render, set up listeners
  const data = { trackedProperties, activeTransitions: new Set<string>() };
  dataForPart.set(part, data);

  const { element } = part;

  const onStart = (e: Event) => {
    const { propertyName } = (e as TransitionEvent);

    if (e.target === element && data.trackedProperties.includes(propertyName)) {
      data.activeTransitions.add(propertyName)
      part.setValue(true);
      part.commit();
    }
  };

  const onEndOrCancel = (e: Event) => {
    const { propertyName } = (e as TransitionEvent);
    if (data.activeTransitions.has(propertyName)) {
      data.activeTransitions.delete(propertyName);

      if (e.target === element && data.activeTransitions.size === 0) {
        part.setValue(false);
        part.commit();
      }
    }
  };

  element.addEventListener('transitionstart', onStart);
  element.addEventListener('transitioncancel', onEndOrCancel);
  element.addEventListener('transitionend', onEndOrCancel);
});

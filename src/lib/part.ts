export type DetachHandler = () => void;

/**
 * The Part interface represents a dynamic part of a template instance rendered
 * by lit-html.
 */
export interface Part {
  value: any;

  /**
   * Sets the current part value, but does not write it to the DOM.
   * @param value The value that will be committed.
   */
  setValue(value: any): void;

  /**
   * Commits the current part value, cause it to actually be written to the DOM.
   */
  commit(): void;

  /**
   * Sets the current part vaule and writes it to the DOM.
   * @param value The value that will be commited.
   */
  commitValue(value: any): void;

  /**
   * Sets a callback that will be called when this part is detached from the DOM.
   * Only a single handler can be registered at a time, so calling this method
   * multiple times will replace the handler
   * @param handle The callback that will be called when the part is detached
   */
  onDetach(handle: DetachHandler): void;
}

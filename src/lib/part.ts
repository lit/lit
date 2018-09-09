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
}

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
export const noChange = {};

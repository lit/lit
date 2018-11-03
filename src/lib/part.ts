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
}

export const isPrimitive = (value: any) =>
    (value === null ||
     !(typeof value === 'object' || typeof value === 'function'));
export class SpecialEvent extends Event {
  aNumber: number;

  constructor(
    aNumber = 5,
    type = 'special-event',
    options = {composed: true, bubbles: true, cancelable: true}
  ) {
    super(type, options);
    this.aNumber = aNumber;
  }
}

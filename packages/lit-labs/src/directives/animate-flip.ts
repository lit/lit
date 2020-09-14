import {LitElement} from 'lit-element';
import {directive, Directive, nothing, Part, AttributePart} from 'lit-html';

export class AnimateFlipDirective extends Directive {
  updateListener?: () => void;
  updatedListener?: () => void;
  host?: LitElement;
  element!: Element;
  inElement!: Element;
  outElement!: Element;
  onDone?: () => void;
  animation?: Animation;
  previousRect?: ClientRect;
  previousOpacity?: number;
  reversing = false;
  options: KeyframeAnimationOptions = {
    duration: 333,
    easing: `cubic-bezier(0.42, 0, 0.58, 1)`,
  };

  constructor(part: Part) {
    super();
    // if (!(part instanceof AttributePart)) {
    //   throw new Error('Can only use the animate directive in attribute position.');
    // }
    this.element = (part as AttributePart).element;
  }

  connect(host: LitElement, options?: KeyframeAnimationOptions) {
    this.host = host;
    if (options !== undefined) {
      this.options = options;
    }
    this.updateListener = () => this.measure();
    this.host.updateCallbacks.add(this.updateListener);
    this.updatedListener = () => this.animate();
    this.host.updatedCallbacks.add(this.updatedListener);
  }

  disconnect() {
    if (!this.host) {
      return;
    }
    this.host.updateCallbacks.delete(this.updateListener!);
    this.host.updateCallbacks.delete(this.updatedListener!);
    this.host = undefined;
  }

  render(element: LitElement, options?: KeyframeAnimationOptions, onDone?: () => void, inElement?: Element, outElement?: Element) {
    if (this.host === undefined) {
      this.connect(element, options);
    }
    this.onDone = onDone;
    this.inElement = inElement || this.element;
    this.outElement = outElement || this.element;
    return nothing;
  }

  measure() {
    if (!(this.host as any).hasUpdated) {
      return;
    }
    // TODO(sorvell): what should this do?
    if (this.animation && this.animation.playState === 'running') {
      //this.animation.cancel();
      return;
    }
    const element = this.reversing ? this.outElement : this.inElement;
    this.previousRect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    this.previousOpacity = Number(style.getPropertyValue('opacity') || '1');
  }

  async animate() {
    if (
      (this.animation && this.animation.playState === 'running') ||
      this.previousRect === undefined
    ) {
      return;
    }
    const element = this.reversing ? this.outElement : this.inElement;
    this.reversing = !this.reversing;
    const previousRect = this.previousRect!;
    const currentRect = element.getBoundingClientRect();
    const currentStyles = getComputedStyle(element);
    const dleft = previousRect.left - currentRect.left;
    const dtop = previousRect.top - currentRect.top;
    const dheight = previousRect.height / currentRect.height;
    const dwidth = previousRect.width / currentRect.width;

    const currentOpacity = Number(
      currentStyles.getPropertyValue('opacity') || '1'
    );
    let transform = '';
    if (dleft !== 0 || dtop !== 0) {
      transform += ` translate(${dleft}px, ${dtop}px)`;
    }
    if (dwidth !== 1 || dheight !== 1) {
      transform += ` scale(${dwidth}, ${dheight})`;
    }
    const opacity =
      this.previousOpacity! - currentOpacity === 0
        ? ''
        : String(this.previousOpacity);
    //console.log('animate?', transform, opacity);
    if (transform === '' && opacity === '') {
      return;
    }
    const startFrame: {transformOrigin: string, transform?: string; opacity?: string} = {transformOrigin: 'top left'};
    if (transform) {
      startFrame.transform = transform;
    }
    if (opacity) {
      startFrame.opacity = opacity;
    }
    //console.log('animate!', startFrame);
    this.animation = this.element.animate([startFrame, {transformOrigin: 'top left'}], this.options);
    if (this.onDone) {
      await this.animation.finished;
      this.onDone();
    }
  }
}

export const animateFlip = directive(AnimateFlipDirective);

# @lit-labs/motion

Lit directives for making things move.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/motion
```

## Flip directive

The `flip` directive can be used to animate DOM elements from one lit render
to the next. If the `flip` element between renders, it will perform a "tweening"
animation between the two states based on the options given. In addition,
elements can animate when they initially render to DOM and when they are
removed.

The directive supports a number of options:

| Option           | Usage                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| animationOptions | configure animation via standard KeyframeAnimationOptions                                                      |
| properties       | list of properties to animate, defaults to ['left', 'top','width', 'height', 'opacity', 'color', 'background'] |
| disabled         | disables animation                                                                                             |
| guard            | function producing values that must change for the flip to run                                                 |
| in               | keyframes to use when animating in                                                                             |
| out              | keyframes to use when animating out                                                                            |
| skipInitial      | skip animating in the first time                                                                               |
| id               | used to link to other flips via `inId`                                                                         |
| inId             | id of the flip to render from when animating in                                                                |
| onStart          | run when the flip starts                                                                                       |
| onComplete       | run when the flip completes                                                                                    |
| onFrames         | run when the frames are produces, use to modify frames                                                         |

### How it works

The directive name is based on an animation technique of the same
name derived from First, Last, Invert, Play. This describes how the directive
works. It measures the styling of the flip element before a layout change
(first) and after a layout change (last). Then it inverts the last layout
such that it matches the first layout. Finally it plays an animation which
removes the inverted layout such that the element animates to the "last" layout.
See the [flip article by Paul Lewis](https://aerotwist.com/blog/flip-your-animations/)
for more information about the technique.

The directive uses a reactive controller to coordinate measuring the DOM of the
flip element. The first layout is measured when the hosting element updates,
and the last layout is measured when the hosting element renders and completes
its update.

### Usage

Here's an example:

```ts
import {flip} from '@lit-labs/motion';
// ...

class MyElement extends LitElement {
  static properties = {shifted: {}};
  static styles = css`
    .box {
      position: absolute;
      width: 100px;
      height: 100px;
      background: steelblue;
      top: 100px;
      border-radius: 50%;
    }

    .shifted {
      right: 0;
    }
  `;

  render() {
    return html`
      <button @click=${this._toggle}>Move</button>
      <div class="box ${this.shifted ? 'shifted' : ''}" ${flip()}></div>
    `;
  }

  _toggle() {
    this.shifted = !this.shifted;
  }
}
```

## Flip controller

The flip controller allows you to coordinate and control flip directives within
a given element.

The controller constructor takes an options object with the following properties:

| Property    | Usage                                                            |
| ----------- | ---------------------------------------------------------------- |
| flipOptions | default options for all element flip directives                  |
| startPaused | all element flip animations start paused                         |
| disabled    | disables all element flip animations                             |
| onComplete  | run when all element flip animations complete for a given update |

The flip controller also provides API for controlling flip animations,
including `play()`, `pause()`, `cancel()`, `finish()`, and `togglePlay()`.
These methods affect all the flip animations for a given element. Finally,
flip controller has properties which reflect the state of the flip animations
in the host element: `isPlaying` returns true if any flips are
currently playing; `isAnimating` returns true if any flips currently have
animations (which may be paused).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).

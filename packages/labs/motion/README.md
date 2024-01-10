# @lit-labs/motion

Lit directives for making things move.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/motion
```

## Animate directive

The `animate` directive can be used to animate DOM elements from one lit render
to the next. If the `animate` element changes state between renders, the directive
performs a "tweening" animation between the two states based on the options given.
In addition, elements can animate when they initially render to DOM and when they
are removed.

The directive supports a number of options:

| Option          | Usage                                                                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| keyframeOptions | configure animation via the [KeyframeEffect Options](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#parameters) from the Web Animation API. |
| properties      | list of properties to animate, defaults to ['left', 'top','width', 'height', 'opacity', 'color', 'background']                                                              |
| disabled        | disables animation                                                                                                                                                          |
| guard           | function producing values that must change for the `animate` to run                                                                                                         |
| in              | keyframes to use when animating in                                                                                                                                          |
| out             | keyframes to use when animating out                                                                                                                                         |
| skipInitial     | skip animating in the first time                                                                                                                                            |
| id              | used to link to other `animate`'s via `inId`                                                                                                                                |
| inId            | id of the `animate` to render from when animating in                                                                                                                        |
| onStart         | run when the `animate` starts                                                                                                                                               |
| onComplete      | run when the `animate` completes                                                                                                                                            |
| onFrames        | run when the frames are produced, use to modify frames                                                                                                                      |

### How it works

The directive uses the FLIP animation technique--derived from First, Last, Invert,
Play. This describes how the directive works. It measures the styling of the `animate`
element before a layout change (first) and after a layout change (last). Then it
inverts the last layout such that it matches the first layout. Finally it plays an
animation which removes the inverted layout such that the element animates to the
"last" layout. See the [FLIP article by Paul Lewis](https://aerotwist.com/blog/flip-your-animations/)
for more information about the technique.

The directive uses a reactive controller to coordinate measuring the DOM of the
`animate` element. The first layout is measured when the hosting element updates,
and the last layout is measured when the hosting element renders and completes
its update.

### Usage

Here's an example:

```ts
import {animate} from '@lit-labs/motion';
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
      <div class="box ${this.shifted ? 'shifted' : ''}" ${animate()}></div>
    `;
  }

  _toggle() {
    this.shifted = !this.shifted;
  }
}
```

## AnimateController

The animate controller allows you to coordinate and control `animate` directives within
a given element.

The controller constructor takes an options object with the following properties:

| Property       | Usage                                                       |
| -------------- | ----------------------------------------------------------- |
| defaultOptions | default options for all element `animate` directives        |
| startPaused    | all element animations start paused                         |
| disabled       | disables all element animations                             |
| onComplete     | run when all element animations complete for a given update |

The animate controller also provides API for controlling `animate` animations,
including `play()`, `pause()`, `cancel()`, `finish()`, and `togglePlay()`.
These methods affect all the `animate` animations for a given element. Finally,
animate controller has properties which reflect the state of the `animate` animations
in the host element: `isPlaying` returns true if any `animate`'s are
currently playing; `isAnimating` returns true if any `animate`s currently have
animations (which may be paused).

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).

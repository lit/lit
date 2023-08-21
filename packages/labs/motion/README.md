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

| Option          | Usage                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| keyframeOptions | configure animation via standard KeyframeAnimationOptions                                                      |
| properties      | list of properties to animate, defaults to ['left', 'top','width', 'height', 'opacity', 'color', 'background'] |
| disabled        | disables animation                                                                                             |
| guard           | function producing values that must change for the `animate` to run                                            |
| in              | keyframes to use when animating in                                                                             |
| out             | keyframes to use when animating out                                                                            |
| skipInitial     | skip animating in the first time                                                                               |
| id              | used to link to other `animate`'s via `inId`                                                                   |
| inId            | id of the `animate` to render from when animating in                                                           |
| onStart         | run when the `animate` starts                                                                                  |
| onComplete      | run when the `animate` completes                                                                               |
| onFrames        | run when the frames are produced, use to modify frames                                                         |

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

## Spring and Spring2D controllers

The Spring and Spring2D controllers simulate physical springs with the [Wobble](https://github.com/skevy/wobble) library.

To use a spring you set the `fromPosition` and `toPosition` properties, which puts the spring into tension, and the end of the spring into motion. `currentPosition` will update of the course of the spring simulation, and the spring controller will trigger an element update so that the element can read `currentPosition` and render using it.

```ts
@customElement('goo-element')
export class GooElement extends LitElement {
  // Both the MouseController and SpringController2D will
  // trigger a render when the mouse moves or the spring updates
  _mouse = new MouseController(this);
  _spring1 = new SpringController2D(this, fast);

  render() {
    // Set the spring to go to the mouse
    this._spring1.toPosition = this._mouse.position;

    // Position a div based on the current position of the spring.
    return html`
      <div
        class="b1"
        style=${positionStyle(this._spring3.currentPosition)}
      ></div>
    `;
  }
}

const fast = {
  stiffness: 1200,
  damping: 400,
};

const positionStyle = ({x, y}: Position2D) =>
  styleMap({
    transform: `translate3d(${x}px,${y}px,0) translate3d(-50%,-50%,0)`,
  });
```

### Configuration

The SpringController constructor takes the host element and a `SpringConfig` object with the following properties:

| Property                    | Type      | Usage                                                                                                                 |
| --------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| `fromValue`                 | `number`  | Starting value of the animation. Defaults to `0`.                                                                     |
| `toValue`                   | `number`  | Ending value of the animation. Defaults to `1`.                                                                       |
| `stiffness`                 | `number`  | The spring stiffness coefficient. Defaults to `100`.                                                                  |
| `damping`                   | `number`  | Defines how the spring’s motion should be damped due to the forces of friction. Defaults to `10`.                     |
| `mass`                      | `number`  | The mass of the object attached to the end of the spring. Defaults to `1`.                                            |
| `initialVelocity`           | `number`  | The initial velocity (in units/ms) of the object attached to the spring. Defaults to `0`.                             |
| `allowsOverdamping`         | `boolean` | Whether or not the spring allows "overdamping" (a damping ratio > 1). Defaults to `false`.                            |
| `overshootClamping`         | `boolean` | False when overshooting is allowed, true when it is not. Defaults to `false`.                                         |
| `restVelocityThreshold`     | `number`  | When spring's velocity is below restVelocityThreshold, it is at rest. Defaults to `.001`.                             |
| `restDisplacementThreshold` | `number`  | When the spring's displacement (current value) is below restDisplacementThreshold, it is at rest. Defaults to `.001`. |

The SpringController2D constructor's `Spring2DConfig` has the same properties except `fromValue` and `toValue`, which are replaces with 2D equivalents:

| Property       | Type                     | Usage                                                        |
| -------------- | ------------------------ | ------------------------------------------------------------ |
| `fromPosition` | `{x: number, y: number}` | Starting value of the animation. Defaults to `{x: 0, y: 0}`. |
| `toPosition`   | `{x: number, y: number}` | Ending value of the animation. Defaults to `{x: 1, y: 1}`.   |

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).

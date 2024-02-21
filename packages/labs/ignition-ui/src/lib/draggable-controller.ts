/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ElementPart, ReactiveController, ReactiveElement} from 'lit';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from 'lit/directive.js';

/**
 * A reactive controller that makes elements draggable.
 *
 * Draggable here means moving an element. This type of dragging is different
 * than "drag and drop" which tends to have more to do with operations that
 * create or copy data, and which often create a clone or proxy of the dragged
 * element.
 *
 * This controller doesn't perform any actual movement of elements. Instead, it
 * listens for mouse events on the host element and calls the provided callbacks
 * to allow the consuming code to move the element.
 */
export class DraggableController<T = void> implements ReactiveController {
  _host: ReactiveElement;
  _options: DraggableOptions<T>;
  data!: T;

  constructor(host: ReactiveElement, options: DraggableOptions<T>) {
    (this._host = host).addController(this);
    this._options = {...options};
    if (this._options.target !== undefined) {
      this._options.target.addEventListener('mousedown', this._onMouseDown);
    }
  }

  /*
   * Mouse handler for the case when there is no "handle" element and the host
   * itself is draggable.
   */
  private _onMouseDown = (e: MouseEvent) => {
    const startX = this._host.offsetLeft;
    const startY = this._host.offsetTop;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const {onStart, onMove, onEnd} = this._options;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - clientX + startX;
      const deltaY = e.clientY - clientY + startY;
      // TODO: bubbling mouse events are weird. We should probably use the
      // real DnD API?
      this._host.dispatchEvent(new DragEvent('drag', {bubbles: true}));
      onMove?.(deltaX, deltaY, e, this.data);
    };

    const onMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('contextmenu', onMouseUp);
      onEnd?.(e, this.data);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    // http://www.quirksmode.org/dom/events/contextmenu.html
    document.addEventListener('contextmenu', onMouseUp);

    onStart?.(e, this.data);
  };

  hostConnected() {}

  handle(data: T) {
    return dragable(this, data);
  }
}

/*
 * A directive that adds event listeners to a "handle" element, which is an
 * element, typically a child, that is the target of mouse events that will be
 * used to move the host element.
 */
class DraggableDirective<T = void> extends Directive {
  controller!: DraggableController<T>;
  element?: HTMLElement;
  data!: T;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('handle() must be used in an element binding');
    }
  }

  render(_controller: DraggableController<T>, _data: T) {
    throw new Error();
  }

  update(part: ElementPart, [controller, data]: DirectiveParameters<this>) {
    this.data = data;
    this.controller ??= controller;
    if (part.element !== this.element) {
      if (this.element !== undefined) {
        this.element.removeEventListener('mousedown', this._onMouseDown);
      }
      this.element = part.element as HTMLElement;
      this.element.addEventListener('mousedown', this._onMouseDown);
    }
  }

  private _onMouseDown = (e: MouseEvent) => {
    // eslint-disable-next-line prefer-const
    let startX: number;
    // eslint-disable-next-line prefer-const
    let startY: number;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const {onStart} = this.controller._options;
    let {onMove, onEnd} = this.controller._options;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - clientX + startX;
      const deltaY = e.clientY - clientY + startY;
      // TODO: bubbling mouse events are weird. Should we use the real DnD API?
      this.controller._host.dispatchEvent(
        new DragEvent('drag', {bubbles: true})
      );
      onMove?.(deltaX, deltaY, e, this.data);
    };

    const onMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('contextmenu', onMouseUp);
      onEnd?.(e, this.data);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    // http://www.quirksmode.org/dom/events/contextmenu.html
    document.addEventListener('contextmenu', onMouseUp);

    const config = onStart?.(e, this.data);
    onMove ??= config?.onMove;
    onEnd ??= config?.onEnd;
    startX = config?.startX ?? 0;
    startY = config?.startY ?? 0;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dragable = directive(DraggableDirective<any>);

export interface DraggableOptions<T = void> {
  onStart?: (event: MouseEvent, data: T) => DraggableStartResult<T> | void;

  /**
   * Callback invoked during the drag operation. `deltaX` and `deltaY` are
   * the change in position from the offset position of the host.
   */
  onMove?: (deltaX: number, deltaY: number, event: MouseEvent, data: T) => void;

  /**
   * Callback invoked whe the drag operation ends.
   */
  onEnd?: (event: MouseEvent, data: T) => void;

  target?: HTMLElement;
}

export interface DraggableStartResult<T = void> {
  startX?: number;

  startY?: number;

  /**
   * Callback invoked during the drag operation. `deltaX` and `deltaY` are
   * the change in position from the offset position of the host.
   */
  onMove?: (deltaX: number, deltaY: number, event: MouseEvent, data: T) => void;

  /**
   * Callback invoked whe the drag operation ends.
   */
  onEnd?: (event: MouseEvent, data: T) => void;
}

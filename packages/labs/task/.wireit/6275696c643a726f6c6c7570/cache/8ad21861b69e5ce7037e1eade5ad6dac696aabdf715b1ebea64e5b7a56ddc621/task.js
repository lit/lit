import {notEqual as t} from '@lit/reactive-element';
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ const i = {INITIAL: 0, PENDING: 1, COMPLETE: 2, ERROR: 3},
  s = Symbol();
class h {
  constructor(t, i, s) {
    (this.t = 0),
      (this.status = 0),
      (this.autoRun = !0),
      (this.i = t),
      this.i.addController(this);
    const h = 'object' == typeof i ? i : {task: i, args: s};
    (this.h = h.task),
      (this.o = h.args),
      void 0 !== h.autoRun && (this.autoRun = h.autoRun),
      (this.taskComplete = new Promise((t, i) => {
        (this.l = t), (this.u = i);
      }));
  }
  hostUpdated() {
    this.performTask();
  }
  async performTask() {
    var t;
    const i = null === (t = this.o) || void 0 === t ? void 0 : t.call(this);
    this.shouldRun(i) && this.run(i);
  }
  shouldRun(t) {
    return this.autoRun && this.v(t);
  }
  async run(t) {
    var i;
    let h, r;
    null != t ||
      (t = null === (i = this.o) || void 0 === i ? void 0 : i.call(this)),
      (2 !== this.status && 3 !== this.status) ||
        (this.taskComplete = new Promise((t, i) => {
          (this.l = t), (this.u = i);
        })),
      (this.status = 1),
      (this.m = void 0),
      (this.p = void 0),
      this.i.requestUpdate();
    const o = ++this.t;
    try {
      h = await this.h(t);
    } catch (t) {
      r = t;
    }
    this.t === o &&
      (h === s
        ? (this.status = 0)
        : (void 0 === r
            ? ((this.status = 2), this.l(h))
            : ((this.status = 3), this.u(r)),
          (this.p = h),
          (this.m = r)),
      this.i.requestUpdate());
  }
  get value() {
    return this.p;
  }
  get error() {
    return this.m;
  }
  render(t) {
    var i, s, h, r;
    switch (this.status) {
      case 0:
        return null === (i = t.initial) || void 0 === i ? void 0 : i.call(t);
      case 1:
        return null === (s = t.pending) || void 0 === s ? void 0 : s.call(t);
      case 2:
        return null === (h = t.complete) || void 0 === h
          ? void 0
          : h.call(t, this.value);
      case 3:
        return null === (r = t.error) || void 0 === r
          ? void 0
          : r.call(t, this.error);
      default:
        this.status;
    }
  }
  v(i) {
    const s = this.g;
    return (
      (this.g = i),
      Array.isArray(i) && Array.isArray(s)
        ? i.length === s.length && i.some((i, h) => t(i, s[h]))
        : i !== s
    );
  }
}
export {h as Task, i as TaskStatus, s as initialState};
//# sourceMappingURL=task.js.map

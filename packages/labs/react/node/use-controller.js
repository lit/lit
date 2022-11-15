/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t = Promise.resolve();
class s {
  constructor(t, s) {
    (this.v = []),
      (this._ = !0),
      (this.p = !1),
      (this.m = t),
      (this.C = s),
      (this.j = new Promise((t, s) => {
        this.N = t;
      }));
  }
  addController(t) {
    this.v.push(t);
  }
  removeController(t) {
    var s;
    null === (s = this.v) ||
      void 0 === s ||
      s.splice(this.v.indexOf(t) >>> 0, 1);
  }
  requestUpdate() {
    this._ || ((this._ = !0), t.then(() => this.C(++this.m)));
  }
  get updateComplete() {
    return this.j;
  }
  O() {
    (this.p = !0),
      this.v.forEach((t) => {
        var s;
        return null === (s = t.hostConnected) || void 0 === s
          ? void 0
          : s.call(t);
      });
  }
  M() {
    (this.p = !1),
      this.v.forEach((t) => {
        var s;
        return null === (s = t.hostDisconnected) || void 0 === s
          ? void 0
          : s.call(t);
      });
  }
  P() {
    this.v.forEach((t) => {
      var s;
      return null === (s = t.hostUpdate) || void 0 === s ? void 0 : s.call(t);
    });
  }
  S() {
    this._ = !1;
    const t = this.N;
    (this.j = new Promise((t, s) => {
      this.N = t;
    })),
      this.v.forEach((t) => {
        var s;
        return null === (s = t.hostUpdated) || void 0 === s
          ? void 0
          : s.call(t);
      }),
      t(this._);
  }
}
const i = (i, e) => {
  const {useState: r, useLayoutEffect: o} = i,
    [n, h] = r(0);
  let u = !1;
  const [d] = r(() => {
    const i = new s(n, h),
      r = e(i);
    return (
      (i.g = r),
      i.O(),
      (u = !0),
      t.then(() => {
        u && i.M();
      }),
      i
    );
  });
  return (
    (d._ = !0),
    o(() => ((u = !1), d.p || d.O(), () => d.M()), []),
    o(() => d.S()),
    d.P(),
    d.g
  );
};
export {i as useController};
//# sourceMappingURL=use-controller.js.map

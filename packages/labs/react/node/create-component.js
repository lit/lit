/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t = new WeakMap(),
  n = (n, e, o, i, s) => {
    const l = null == s ? void 0 : s[e];
    void 0 === l || o === i
      ? null == o && e in HTMLElement.prototype
        ? n.removeAttribute(e)
        : (n[e] = o)
      : ((n, e, o) => {
          let i = t.get(n);
          void 0 === i && t.set(n, (i = new Map()));
          let s = i.get(e);
          void 0 !== o
            ? void 0 === s
              ? (i.set(e, (s = {handleEvent: o})), n.addEventListener(e, s))
              : (s.handleEvent = o)
            : void 0 !== s && (i.delete(e), n.removeEventListener(e, s));
        })(n, l, o);
  };
function e(t = window.React, e, o, i, s) {
  let l, d, a;
  if (void 0 === e) {
    const n = t;
    ({tagName: d, elementClass: a, events: i, displayName: s} = n),
      (l = n.react);
  } else (l = t), (a = o), (d = e);
  const c = l.Component,
    r = l.createElement;
  class u extends c {
    constructor() {
      super(...arguments), (this.o = null);
    }
    t(t) {
      if (null !== this.o)
        for (const e in this.i)
          n(this.o, e, this.props[e], t ? t[e] : void 0, i);
    }
    componentDidMount() {
      this.t();
    }
    componentDidUpdate(t) {
      this.t(t);
    }
    render() {
      this.i = {};
      const t = this.props;
      return r(d, t);
    }
  }
  u.displayName = null != s ? s : a.name;
  const v = l.forwardRef((t, n) =>
    r(u, {...t, _$Gl: n}, null == t ? void 0 : t.children)
  );
  return (v.displayName = u.displayName), v;
}
export {e as createComponent};
//# sourceMappingURL=create-component.js.map

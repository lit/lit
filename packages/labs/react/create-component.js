/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const t = new Set(['children', 'localName', 'ref', 'style', 'className']),
  e = new WeakMap(),
  n = (t, n, s, o, i) => {
    const c = i?.[n];
    void 0 !== c
      ? s !== o &&
        ((t, n, s) => {
          let o = e.get(t);
          void 0 === o && e.set(t, (o = new Map()));
          let i = o.get(n);
          void 0 !== s
            ? void 0 === i
              ? (o.set(n, (i = {handleEvent: s})), t.addEventListener(n, i))
              : (i.handleEvent = s)
            : void 0 !== i && (o.delete(n), t.removeEventListener(n, i));
        })(t, c, s)
      : (t[n] = s);
  },
  s = (e, s, o, i) => {
    const c = e.Component,
      l = e.createElement,
      r = new Set(Object.keys(i ?? {}));
    for (const e in o.prototype)
      e in HTMLElement.prototype ||
        (t.has(e)
          ? console.warn(
              `${s} contains property ${e} which is a React reserved property. It will be used by React and not set on the element.`
            )
          : r.add(e));
    class h extends c {
      constructor() {
        super(...arguments), (this.t = null);
      }
      o(t) {
        if (null !== this.t)
          for (const e in this.i)
            n(this.t, e, this.props[e], t ? t[e] : void 0, i);
      }
      componentDidMount() {
        this.o();
      }
      componentDidUpdate(t) {
        this.o(t);
      }
      render() {
        const t = this.props.l;
        (void 0 !== this.h && this.p === t) ||
          (this.h = (e) => {
            null === this.t && (this.t = e),
              null !== t &&
                ((t, e) => {
                  'function' == typeof t ? t(e) : (t.current = e);
                })(t, e),
              (this.p = t);
          });
        const e = {ref: this.h};
        this.i = {};
        for (const [t, n] of Object.entries(this.props))
          r.has(t) ? (this.i[t] = n) : (e['className' === t ? 'class' : t] = n);
        return l(s, e);
      }
    }
    return e.forwardRef((t, e) => l(h, {...t, l: e}, t?.children));
  };
export {s as createComponent};
//# sourceMappingURL=create-component.js.map

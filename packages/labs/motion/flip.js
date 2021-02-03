import {nothing as t} from 'lit-html';
import {PartType as i, directive as s} from 'lit-html/directive.js';
import {AsyncDirective as h} from 'lit-html/async-directive.js';
const e = [{transform: 'translateY(100%) scale(0)', opacity: 0}],
  r = [{transform: 'translateY(-100%) scale(0)', opacity: 0}],
  n = [{opacity: 0}],
  o = n,
  a = [{opacity: 0}, {opacity: 1}],
  c = (t, i) => {
    const s = t - i;
    return 0 === s ? void 0 : s;
  },
  l = (t, i) => {
    const s = t / i;
    return 1 === s ? void 0 : s;
  },
  u = {
    left: (t, i) => {
      const s = c(t, i);
      return s && `translateX(${s}px)`;
    },
    top: (t, i) => {
      const s = c(t, i);
      return s && `translateY(${s}px)`;
    },
    width: (t, i) => {
      const s = l(t, i);
      return s && `scaleX(${s})`;
    },
    height: (t, i) => {
      const s = l(t, i);
      return s && `scaleY(${s})`;
    },
  },
  d = {duration: 333, easing: 'ease-in-out'},
  p = ['left', 'top', 'width', 'height', 'opacity'];
class m extends h {
  constructor(t) {
    if (
      (super(t),
      (this.t = null),
      (this.i = null),
      (this.o = !0),
      (this.reversing = !1),
      t.type === i.CHILD)
    )
      throw Error('The `flip` directive must be used in attribute position.');
  }
  render(i) {
    return t;
  }
  update(t, [i]) {
    var s, h;
    return (
      void 0 === this.h &&
        ((this.h = t.options?.host), this.h.addController(this)),
      (this.options = i || {}),
      (s = this.options).animationOptions ?? (s.animationOptions = d),
      (h = this.options).properties ?? (h.properties = p),
      (this.l = t.element),
      this.render(i)
    );
  }
  u(t, i) {
    const s = t.getBoundingClientRect(),
      h = getComputedStyle(t);
    this.options.properties.forEach((t) => {
      const e = s[t] ?? h[t],
        r = Number(e);
      i[t] = isNaN(r) ? e + '' : r;
    });
  }
  getMeasuredElement() {
    return (
      (this.reversing ? this.options.fromElement : this.options.toElement) ??
      this.l
    );
  }
  hostUpdate() {
    const t = this.options.guard?.();
    if (
      ((this.o =
        !this.p() &&
        ((t, i) => {
          if (void 0 === t && void 0 === i) return !0;
          if (Array.isArray(t)) {
            if (
              Array.isArray(i) &&
              i.length === t.length &&
              t.every((t, s) => t !== i[s])
            )
              return !0;
          } else if (i !== t) return !0;
          return !1;
        })(t, this.m)),
      !this.o)
    )
      return;
    void 0 !== t && (this.m = Array.isArray(t) ? Array.from(t) : t);
    const i = this.getMeasuredElement();
    i.isConnected && this.u(i, (this.v = {})),
      (this.t = this.l.parentNode),
      (this.i = this.l.nextSibling);
  }
  hostUpdated() {
    if (!this.o || !this.l.isConnected) return;
    const t = this.getMeasuredElement();
    this.u(t, (this.g = {}));
    const i =
      void 0 !== this.v
        ? this.$(this.v, this.g)
        : this.options.in
        ? [...this.options.in, {}]
        : void 0;
    console.log('animation frames', i), void 0 !== i && this._(i);
  }
  reconnectedCallback() {}
  disconnectedCallback() {
    this.o &&
      requestAnimationFrame(async () => {
        if (this.t?.isConnected && void 0 !== this.options.out) {
          const t = this.i && this.i.parentNode === this.t ? this.i : null;
          this.t.insertBefore(this.l, t);
          const i = {};
          if ((this.u(this.l, i), this.options.stabilizeOut)) {
            const t = c(this.v.left, i.left);
            0 !== t &&
              ((this.l.style.position = 'relative'),
              (this.l.style.left = t + 'px'));
            const s = c(this.v.top, i.top);
            0 !== s &&
              ((this.l.style.position = 'relative'),
              (this.l.style.top = s + 'px'));
          }
          await this._(this.options.out), this.l.remove();
        }
      });
  }
  $(t, i) {
    const s = {},
      h = {};
    let e = !1;
    for (const r in i) {
      const n = t[r],
        o = i[r];
      if (r in u) {
        const t = (0, u[r])(n, o);
        void 0 !== t && ((e = !0), (s.transform = `${s.transform ?? ''} ${t}`));
      } else n !== o && ((e = !0), (s[r] = n), (h[r] = o));
    }
    return e ? [s, h] : void 0;
  }
  p() {
    return 'running' === this.animation?.playState;
  }
  async _(t) {
    this.p() ||
      ((this.animation = this.l.animate(t, this.options.animationOptions)),
      await this.animation.finished,
      this.options.onComplete?.(this.l, this));
  }
}
const f = s(m);
export {
  m as Flip,
  d as defaultAnimationOptions,
  p as defaultCssProperties,
  o as fade,
  a as fadeIn,
  n as fadeOut,
  f as flip,
  r as flyAbove,
  e as flyBelow,
};
//# sourceMappingURL=flip.js.map

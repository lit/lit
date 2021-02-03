import {nothing as t} from 'lit-html';
import {PartType as i, directive as s} from 'lit-html/directive.js';
import {AsyncDirective as o} from 'lit-html/async-directive.js';
const r = ['top', 'right', 'bottom', 'left'];
class e extends o {
  constructor(t) {
    if ((super(t), t.type === i.CHILD))
      throw Error('The `flip` directive must be used in attribute position.');
  }
  render(i, s) {
    return t;
  }
  update(t, [i, s]) {
    return (
      void 0 === this.h &&
        ((this.h = t.options?.host), this.h.addController(this)),
      (this.j = t.element),
      (this.k = i),
      (this.X = s ?? ['left', 'top', 'width', 'height']),
      this.render(i, s)
    );
  }
  hostUpdated() {
    this.Y();
  }
  Y() {
    const t = this.k?.(),
      i = t?.offsetParent;
    if (void 0 === t || !i) return;
    const s = t.getBoundingClientRect(),
      o = i.getBoundingClientRect();
    this.X?.forEach((t) => {
      const i = r.includes(t) ? s[t] - o[t] : s[t];
      this.j.style[t] = i + 'px';
    });
  }
}
const h = s(e);
export {e as Position, h as position};
//# sourceMappingURL=position.js.map

import './lazy-image.mjs';
import {Layout1d} from '../../src/layouts/Layout1d.mjs';
import {VirtualScroller} from '../../src/VirtualScroller.mjs';
import {getDims, getUrl, searchFlickr} from './flickr.mjs';

export {getDims, getUrl, searchFlickr};

export class Sample {
  constructor() {
    this.items = [];
    this.layout = new Layout1d();

    document.body.style.margin = 0;
    document.body.style.height = '100vh';

    window.addEventListener('hashchange', () => this.search());
    window.addEventListener('resize', () => this._setDirection());

    this._setDirection();
    this._setUp();
  }

  _setDirection() {
    if (window.innerWidth > window.innerHeight) {
      this.layout.direction = 'horizontal';
      this.constraint = {height: Math.min(window.innerHeight, 600)};
      document.body.style.minHeight = '1px';
    } else {
      this.layout.direction = 'vertical';
      this.constraint = {width: Math.min(window.innerWidth, 800)};
    }
  }

  _setUp() {
    this.scroller = new VirtualScroller({
      layout: this.layout,
      container: document.body,
      createElement: () => {
        const img = document.createElement('lazy-image');
        img.style = 'position: absolute;';
        const h = document.createElement('h2');
        h.style =
            'color: white; position: absolute; bottom: 0; width: 100%; marign: 0; padding: 0 1em; box-sizing: border-box; text-align: center; font-family: sans-serif; text-shadow: rgba(0, 0, 0, 0.5) 2px 2px;';
        img.appendChild(h);
        return img;
      },
      updateElement: (child, idx) => {
        const item = this.items[idx];
        const dim = getDims(item, this.constraint);
        child.src = getUrl(item);
        Object.assign(child.style, {
          height: dim.height + 'px',
          width: dim.width + 'px',
          background: (idx % 2) ? '#DDD' : '#CCC'
        });
        child.querySelector('h2').textContent = item.title;
      }
    });
  }

  render() {
    this.scroller.totalItems = this.items.length;
  }

  async search() {
    const term = window.location.hash.substring(1) || 'fog';
    const resp = await searchFlickr(term);
    this.items = resp.photo.filter(p => p.width_o);
    this.render();
  }
}

class LazyImage extends HTMLElement {
    constructor() {
      super();
      this._src = null;
      this._pendingLoad = null;
      this._load = this._load.bind(this);
      this._root = this.attachShadow({mode: 'open'});
      this._root.innerHTML = `
      <style>
          :host { position: relative; background: #DDD; }
          img { height: 100%; width: 100%; opacity: 0; transition: unset; }
          img.loaded { opacity: 1; transition: opacity 0.5s; }
          ::slotted() { z-index: 1; color: white; }
      </style>
      <img />
      <slot></slot>`;
      this._img = this._root.querySelector('img');
      this._img.addEventListener('load', e => this._loaded());
    }
  
    set src(url) {
      this._src = url;
      if (this._pendingLoad) {
        clearTimeout(this._pendingLoad);
      }
      this._img.classList = '';
      this._pendingLoad = setTimeout(this._load, 500);
    }
  
    _load() {
      this._img.classList = '';
      this._img.src = this._src;
    }
  
    _loaded() {
      this._img.classList = 'loaded';
    }
  }
  
  customElements.define('lazy-image', LazyImage);
import { LitElement, html, css } from 'lit-element';
import StackBlitzSDK from '@stackblitz/sdk';

class StackBlitz extends LitElement {
  static get properties() {
    return {
      folder: { type: String },
      openFile: { type: String },
      label: { type: String },
      _loading: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.openFile = 'index.html';
    this.label = 'Launch Code Editor';
    this._loading = false;
    this._vm = null;
  }

  static get styles() {
    return [
      css`
        .pretty-button {
          cursor: pointer;
          display: inline-block;
          box-sizing: border-box;
          margin: 12px 0;
          padding: 13px 44px;
          border: 2px solid #2196F3;
          background-color: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #2196F3;
          text-align: center;
          text-decoration: none;
          text-transform: uppercase;
          border-radius: 0;
          -webkit-appearance: none;
          appearance: none;
        }

        .pretty-button:hover,
        .pretty-button:active {
          background-color: #2196F3;
          color: #FFF;
        }

        .pretty-button:disabled {
          background-color: transparent;
          border-color: #999;
          color: #999;
        }

        /* iframe#container will replace div#container once StackBlitz loads. */
        iframe {
          border: none;
          min-height: 50vh;
        }
      `
    ];
  }

  render() {
    return html`
      <div id="container">
        <button class="pretty-button" @click="${this.loadProject}"
            .disabled="${this._loading}">
          ${this._loading ? 'Loading Code Editor...' : this.label}
        </button>
      </div>`;
  }

  async loadProject() {
    this.style.display = 'block';
    const folder = this.folder;
    if (folder && !this._loading) {
      try {
        this._loading = true;
        const response = await fetch(`${folder}/manifest.json`);
        const manifest = await response.json();
        const files = manifest.files.map(async (filename) => {
          const response = await fetch(`${folder}/${filename}`);
          return { [filename]: await response.text() };
        });
        const project = Object.assign({}, manifest, {
          files: (await Promise.all(files)).reduce(
            (acc, file) => Object.assign(acc, file), {}),
          settings: {
            compile: {
              action: 'refresh'
            }
          }
        });
        const container = this.shadowRoot.getElementById('container');
        this._vm = await StackBlitzSDK.embedProject(container, project, {
          forceEmbedLayout: true,
          view: 'both',
          openFile: this.openFile
        });
      } finally {
        this._loading = false;
      }
    }
  }
}

customElements.define('stack-blitz', StackBlitz);

/**
 * This page generates its content from the custom-element.json file as read by
 * the _data/api.11tydata.js script.
 */
module.exports = class Docs {
  data() {
    return {
      layout: 'page.11ty.cjs',
      title: '<my-element> ⌲ Docs',
    };
  }

  render(data) {
    const manifest = data.api['11tydata'].customElements;
    const elements = manifest.modules.reduce(
      (els, module) =>
        els.concat(
          module.declarations?.filter((dec) => dec.customElement) ?? []
        ),
      []
    );
    return `
      <h1>API</h1>
      ${elements
        .map(
          (element) => `
        <h2>&lt;${element.tagName}></h2>
        <div>
          ${element.description}
        </div>
        ${renderTable(
          'Attributes',
          ['name', 'description', 'type.text', 'default'],
          element.attributes
        )}
        ${renderTable(
          'Properties',
          ['name', 'attribute', 'description', 'type.text', 'default'],
          element.members.filter((m) => m.kind === 'field')
        )}  
        ${renderTable(
          'Methods',
          ['name', 'parameters', 'description', 'return.type.text'],
          element.members
            .filter(
              (m) =>
                m.kind === 'method' &&
                m.privacy !== 'private' &&
                m.name[0] !== '_'
            )
            .map((m) => ({
              ...m,
              parameters: renderTable(
                '',
                ['name', 'description', 'type.text'],
                m.parameters
              ),
            }))
        )}
        ${renderTable('Events', ['name', 'description'], element.events)}    
        ${renderTable(
          'Slots',
          [['name', '(default)'], 'description'],
          element.slots
        )}  
        ${renderTable(
          'CSS Shadow Parts',
          ['name', 'description'],
          element.cssParts
        )}
        ${renderTable(
          'CSS Custom Properties',
          ['name', 'description'],
          element.cssProperties
        )}
        `
        )
        .join('')}
    `;
  }
};

/**
 * Reads a (possibly deep) path off of an object.
 */
const get = (obj, path) => {
  let fallback = '';
  if (Array.isArray(path)) {
    [path, fallback] = path;
  }
  const parts = path.split('.');
  while (obj && parts.length) {
    obj = obj[parts.shift()];
  }
  return obj == null || obj === '' ? fallback : obj;
};

/**
 * Renders a table of data, plucking the given properties from each item in
 * `data`.
 */
const renderTable = (name, properties, data) => {
  if (data === undefined || data.length === 0) {
    return '';
  }
  return `
    ${name ? `<h3>${name}</h3>` : ''}
    <table>
      <tr>
        ${properties
          .map(
            (p) =>
              `<th>${capitalize(
                (Array.isArray(p) ? p[0] : p).split('.')[0]
              )}</th>`
          )
          .join('')}
      </tr>
      ${data
        .map(
          (i) => `
        <tr>
          ${properties.map((p) => `<td>${get(i, p)}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </table>
  `;
};

const capitalize = (s) => s[0].toUpperCase() + s.substring(1);

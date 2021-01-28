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
    const customElements = data.api['11tydata'].customElements;
    const tags = customElements.tags;
    return `
      <h1>API</h1>
      ${tags
        .map(
          (tag) => `
        <h2>&lt;${tag.name}></h2>
        <div>
          ${tag.description}
        </div>
        ${renderTable(
          'Attributes',
          ['name', 'description', 'type', 'default'],
          tag.attributes
        )}
        ${renderTable(
          'Properties',
          ['name', 'attribute', 'description', 'type', 'default'],
          tag.properties
        )}  
        ${
          /*
           * Methods are not output by web-component-analyzer yet (a bug), so
           * this is a placeholder so that at least _something_ will be output
           * when that is fixed, and element maintainers will hopefully have a
           * signal to update this file to add the neccessary columns.
           */
          renderTable('Methods', ['name', 'description'], tag.methods)
        }
        ${renderTable('Events', ['name', 'description'], tag.events)}    
        ${renderTable('Slots', ['name', 'description'], tag.slots)}  
        ${renderTable(
          'CSS Shadow Parts',
          ['name', 'description'],
          tag.cssParts
        )}
        ${renderTable(
          'CSS Custom Properties',
          ['name', 'description'],
          tag.cssProperties
        )}
        `
        )
        .join('')}
    `;
  }
};

/**
 * Renders a table of data, plucking the given properties from each item in
 * `data`.
 */
const renderTable = (name, properties, data) => {
  if (data === undefined) {
    return '';
  }
  return `
    <h3>${name}</h3>
    <table>
      <tr>
        ${properties.map((p) => `<th>${capitalize(p)}</th>`).join('')}
      </tr>
      ${data
        .map(
          (i) => `
        <tr>
          ${properties.map((p) => `<td>${i[p]}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </table>
  `;
};

const capitalize = (s) => s[0].toUpperCase() + s.substring(1);

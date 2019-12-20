const page = require('./page.11ty.cjs');

/**
 * This template extends the page template and adds an examples list.
 */
module.exports = function(data) {

  return page({
    ...data,
    content: renderExample(data),
  });
};

const renderExample = ({name, content, collections, page}) => {
  return `
    <h1>Example: ${name}</h1>
    <section class="examples">
      <nav class="collection">
        <ul>
          ${collections.example === undefined
              ? ''
              : collections.example.map((post) => `
                  <li class=${post.url === page.url ? 'selected' : ''}>
                    <a href="${post.url}">${ post.data.description.replace('<', '&lt;') }</a>
                  </li>
                `).join('')}
        </ul>
      </nav>
      <div>
        ${content}
      </div>
    </section>
  `;
};

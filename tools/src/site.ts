import * as fs from 'fs-extra';
import * as path from 'path';
import globcb = require('glob');
import { promisify } from 'util';
import frontMatter = require('front-matter');
import marked = require('marked');
import Prism = require('prismjs');

const glob = promisify(globcb);

/**
 * Adds classes to the <pre> elements
 */
class CustomRenderer extends marked.Renderer {
  code(code: string, language: string, _isEscaped: boolean) {
    return html`<pre class="code language-${language}" language="${language}">
${Prism.highlight(code, Prism.languages[language])}
</pre>`;
  }
}
marked.setOptions({
  renderer: new CustomRenderer(),
});

const docsOutDir = path.resolve(__dirname, '../../docs');
const docsSrcDir = path.resolve(__dirname, '../../docs-src');
const root = 'lit-html';

type FileData = {
  path: path.ParsedPath;
  attributes: any;
  body: string;
}

async function generateDocs() {
  await fs.emptyDir(docsOutDir);
  const fileNames = await glob('**/*.md', { cwd: docsSrcDir });

  // Read in all file data
  const files = new Map<string, FileData>(await Promise.all(fileNames.map(async (fileName) => {
    const filePath = path.parse(fileName);
    const content = await fs.readFile(path.join(docsSrcDir, fileName), 'utf-8');
    const pageData = frontMatter(content);

    return [fileName, {
      path: filePath,
      attributes: pageData.attributes,
      body: pageData.body,
    }] as [string, FileData];
  })));

  const guideOutline = getOutline(files);

  for (const fileData of files.values()) {
    const outDir = path.join(docsOutDir, fileData.path.dir);
    await fs.mkdirs(outDir);
    const body = marked(fileData.body);
    const section = fileData.path.dir.split(path.sep)[0] || 'home';
    const outContent = page(section, body, guideOutline);
    const outPath = path.join(docsOutDir, fileData.path.dir, `${fileData.path.name}.html`);
    fs.writeFile(outPath, outContent);
  }

  fs.copyFileSync(path.join(docsSrcDir, 'index.css'), path.join(docsOutDir, 'index.css'));
  fs.copyFileSync(path.resolve(__dirname, '../node_modules/prismjs/themes/prism-okaidia.css'), path.join(docsOutDir, 'prism.css'));
}

/**
 * The main page template
 */
const page = (pagePath: string, content: string, outline: Outline) => html`
  <!doctype html>

  <html>
    <head>
      <link rel="stylesheet" href="/${root}/index.css">
      <link rel="stylesheet" href="/${root}/prism.css">
    </head>
    <body>
      ${sideNav(pagePath, outline)}
      ${topNav(pagePath.split('/')[0])}
      <main>
        ${content}
      <main>
      <footer>
        <p>© 2018 Polymer Authors. Code Licensed under the BSD License. Documentation licensed under CC BY 3.0.</p>
      </footer>
    </body>
  </html>
`;

const topNav = (section: string) => html`
  <nav id="top-nav">
    <div class="icon-large">lit-html</div>
    <ul>
      <li ${section === 'home' ? 'class="selected"' : ''}><a href="/${root}/">Home</a></li>
      <li ${section === 'guide' ? 'class="selected"' : ''}><a href="/${root}/guide">Guide</a></li>
      <li ${section === 'api' ? 'class="selected"' : ''}><a href="/${root}/api">API</a></li>
      <li><a href="https://github.com/Polymer/lit-html">GitHub</a></li>
    </ul>
  </nav>
`;

interface Outline extends Map<string, OutlineData> {}
type OutlineData = FileData|Outline;

/**
 * Generates an outline of all the files.
 * 
 * The outline is a set of nested maps of filenames to file data.
 * The output is sorted with index first, then alpha-by-name
 */
const getOutline = (files: Map<string, FileData>) => {

  const outline: Outline = new Map();

  for (const fileData of files.values()) {
    const parts = fileData.path.dir.split(path.sep);
    let parent = outline;

    for (const part of parts) {
      let child = parent.get(part);
      if (child === undefined) {
        child = new Map() as Outline;
        parent.set(part, child);
      }
      if (child instanceof Map) {
        parent = child;
      } else {
        console.error(child);
        throw new Error('oops!');
      }
    }
    parent.set(fileData.path.name, fileData);
  }

  function sortOutline(unsorted: Outline, sorted: Outline) {
    // re-insert index first
    sorted.set('index', unsorted.get('index')!);
    unsorted.delete('index');
    // re-insert other entries in alpha-order
    unsorted.forEach((value, key) => {
      if (value instanceof Map) {
        value = sortOutline(value, new Map());
      }
      sorted.set(key, value);
    });
    return sorted;
  }

  return sortOutline(outline, new Map());
}

const sideNav = (pagePath: string, outline: Outline) => {
  // Side nav is only rendered for the guide
  if (!pagePath.startsWith('guide')) {
    return '';
  }

  // Renders the outline, using the frontmatter from the pages
  const renderOutline = (outline: Outline): string => {
    return html`
      <ul>
        ${Array.from(outline.entries()).map(([name, data]) => {
          // if (name === 'index') {
          //   return '';
          // }
          const fileData = (data instanceof Map ? data.get('index') : data) as FileData;
          const isFile = !(data instanceof Map);
          let url = `/${root}/${fileData.path.dir}/`;
          if (isFile) {
            url = url + `${fileData.path.name}.html`;
          }
          return html`
            <li>
              <a href="${url}">
                ${isFile ? fileData.attributes['title'] : name}
              </a>
              ${isFile ? '' : renderOutline(data as Outline)}
            </li>
          `;
          })}
      </ul>
    `;
  };

  return html`
    <nav id="side-nav">
      <h1>Guide</h1>
      ${renderOutline(outline.get('guide') as Outline)}
    </nav>
  `;
}

// Nearly no-op template tag to get syntax highlighting and support Arrays.
const html = (strings: TemplateStringsArray, ...values: any[]) => 
    values.reduce((acc, v, i) => acc + (Array.isArray(v) ? v.join('\n') : String(v)) + strings[i + 1], strings[0]);

generateDocs();

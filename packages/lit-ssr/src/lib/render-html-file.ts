import {render} from './render-lit-html.js';
import {$private} from 'lit-html/private-ssr-support.js';
import {promises as fs} from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import {URL} from 'url';

const {HTML_RESULT} = $private;

interface RenderAppOptions {
  url: string;
  root: string;
  fallback: string;
  env: {[key: string]: unknown};
}

interface InitializeSSRModule {
  initializeSSR?: (location: string) => void | Promise<unknown>;
}

/**
 * Process to render an HTML file for a given URL:
 * 1. Read the specified HTML file
 * 2. Find all `<script>` tags marked with `ssr` attribute and dynamically
 *    import them
 * 3. If the module exported an `initializeSSR` method, call and await its
 *    result
 * 4. If `initializeSSR` returned a values array, push those values onto the the
 *    dynamic values to render the page with
 * 5. Split the HTML file contents on the `<!--lit-ssr-value-->` markers
 * 6. Return a TemplateResult constructed from the HTML page's contents and the
 *    values returned from initializeSSR.
 */
export async function renderFile(options: RenderAppOptions) {
  // Shim some useful globals onto window
  const url = new URL(options.url);
  Object.assign(window, {
    location: url,
    fetch,
    process: {env: {NODE_ENV: 'production', ...(options.env || {})}},
  });
  // Make sure file exists; if not, use fallback
  let file = path.join(options.root, url.pathname);
  let exists = false;
  try {
    exists = (await fs.stat(file)).isFile();
  } catch {
    /* Use fallback */
  }
  if (!exists) {
    file = path.join(options.root, options.fallback);
  }
  // Read file
  const content = await fs.readFile(file, 'utf-8');
  // Load `ssr`-tagged scripts
  const scripts = Array.from(
    content.matchAll(/<script[^>]* src="([^"]+)" ssr>/g)
  ).map((m) => m[1]);
  const values = [];
  for (const script of scripts) {
    const module = await import(path.join(options.root, script));
    if ((module as InitializeSSRModule).initializeSSR) {
      const ret = await module.initializeSSR(url);
      if (Array.isArray(ret)) {
        values.push(...ret);
      }
    }
  }
  // Split strings for any interpolated values
  const strings = content.split('<!--lit-ssr-value-->');
  if (strings.length - 1 !== values.length) {
    throw new Error(
      `Number of <!--lit-ssr-value--> comments (${
        strings.length - 1
      }) and initializeSSR()-returned values (${values.length}) did not match.`
    );
  }
  // Construct a TemplateResult
  return render({
    _$litType$: HTML_RESULT,
    strings,
    values,
  });
}

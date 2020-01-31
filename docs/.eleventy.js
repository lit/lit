const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const markdownIt = require('markdown-it');
const pluginTOC = require('eleventy-plugin-nesting-toc');
const markdownItAnchor = require('markdown-it-anchor');
const slugifyLib = require('slugify');

const loadLanguages = require('prismjs/components/');
// This Prism langauge supports HTML and CSS in tagged template literals
loadLanguages(['js-templates']);

// Use the same slugify as 11ty for markdownItAnchor. It's similar to Jekyll,
// and preserves the existing URL fragments
const slugify = (s) => slugifyLib(s, {lower: true});

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginTOC, {tags: ['h2', 'h3']});
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPassthroughCopy('css/*');
  eleventyConfig.addPassthroughCopy('images/**/*');
  eleventyConfig.addPassthroughCopy('api/**/*');

  // TODO: Move to Cloud Run with a Node runtime, and remove these
  eleventyConfig.addPassthroughCopy('app.yaml');
  eleventyConfig.addPassthroughCopy('main.py');

  const md = markdownIt({html: true, breaks: true, linkify: true})
                 .use(markdownItAnchor, {slugify, permalink: false});
  eleventyConfig.setLibrary('md', md);

  eleventyConfig.addCollection('guide', function(collection) {
    // Order the 'guide' collection by filename, which includes a number prefix.
    // We could also order by a frontmatter property
    return collection.getFilteredByGlob('guide/*').sort(function(a, b) {
      if (a.fileSlug == 'guide') {
        return -1;
      }
      if (a.fileSlug < b.fileSlug) {
        return -1;
      }
      if (b.fileSlug < a.fileSlug) {
        return 1;
      }
      return 0;
    });
  });

  return {
    dir: {input: '.', output: '_site'},
  };
};

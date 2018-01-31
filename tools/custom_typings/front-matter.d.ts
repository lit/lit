declare module 'front-matter' {
  function frontMatter(content: string): {
    attributes: object;
    body: string;
    frontmatter: string;
  };
  export = frontMatter;
}

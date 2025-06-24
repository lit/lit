import {
  Comment,
  NativeTemplate,
  TaggedTemplateExpression,
  TreeAdapter,
} from './tree-adapter.js';

/**
 * Finds all Lit HTML tagged template literals in the AST.
 *
 * This function identifies Lit templates through multiple methods:
 * 1. Looking for templates with @litHtmlTemplate annotations
 * 2. Identifying templates with the 'html' template tag name
 * 3. Detecting Lit binding syntax patterns (.property, ?boolean, @event)
 *
 * @param config The configuration object
 * @returns An array of tagged template expressions that are identified as Lit templates
 */
export function findLitTaggedTemplates<T extends TreeAdapter>({
  tree,
  sourceText,
  infer,
}: {
  tree: T;
  /**
   * The original source code text
   */
  sourceText: string;
  /**
   * Configuration for inference rules (whether to check for html tag and Lit bindings)
   */
  infer: {
    /**
     * Whether to check for the 'html' template tag
     */
    htmlTag: boolean;
    /**
     * Whether to check for Lit binding syntax patterns
     */
    litBindings: boolean;
  };
}): TaggedTemplateExpression<NativeTemplate<T>>[] {
  const templates =
    tree.findTaggedTemplateLiterals() as TaggedTemplateExpression<
      NativeTemplate<T>
    >[];
  const comments = tree.findComments();
  return findLikelyLitTaggedTemplates<NativeTemplate<T>>({
    sourceText,
    comments,
    templates,
    infer,
  });
}

/**
 * Determines if a tagged template is likely a Lit template based on inference rules.
 *
 * Checks for:
 * 1. The 'html' template tag name (if htmlTag inference is enabled)
 * 2. Lit binding syntax patterns (if litBindings inference is enabled)
 *
 * @param config The configuration object
 * @returns True if the template is likely a Lit template, false otherwise
 */
export function isLikelyTaggedTemplateLiteral<T extends Object>({
  node,
  fullText,
  infer,
}: {
  /**
   * The tagged template expression to check
   */
  node: TaggedTemplateExpression<T>;
  /**
   * The original source code text
   */
  fullText: string;
  /**
   * Configuration for inference rules
   */
  infer: {
    /**
     * Whether to check for the 'html' template tag
     */
    htmlTag: boolean;
    /**
     * Whether to check for Lit binding syntax patterns
     */
    litBindings: boolean;
  };
}): boolean {
  if (infer.htmlTag && node.tagName === 'html') {
    return true;
  }

  if (!infer.litBindings) {
    return false;
  }

  // Regular expressions for Lit binding sigils
  //
  // Starts off with a space
  // then one of ., ?, or @ which is a Lit binding sigil
  // then a word character which is the start of a valid attribute name
  // then possible dashes and more word characters
  // then followed by =
  // then followed by an optional single (') or double ("") quote
  // then followed by ${
  const sigilBindingRegex = /\s[.?@]\w+[-\w]*=["']?\$\{/;

  // Extract the template content
  if (
    node.template &&
    node.template.start !== undefined &&
    node.template.end !== undefined
  ) {
    const templateContent = fullText.substring(
      node.template.start - node.start,
      node.template.end - node.start
    );

    // Check for Lit binding sigils
    if (sigilBindingRegex.test(templateContent)) {
      return true;
    }
  }

  return false;
}

/**
 * Identifies Lit HTML tagged templates through annotations and inference rules.
 *
 * This function uses multiple strategies to identify Lit templates:
 * 1. Looks for templates with @litHtmlTemplate annotations in nearby comments
 * 2. Skips templates with @litHtmlIgnore annotations
 * 3. Uses inference rules to identify templates based on tag name and binding syntax
 *
 * Uses an optimized comment indexing approach to avoid O(tc) complexity when
 * matching comments to templates. This works by sorting comments once and then
 * using a sliding window approach to find relevant comments for each template.
 *
 * @returns An array of tagged template expressions that are identified as Lit templates
 */
function findLikelyLitTaggedTemplates<T extends Object>({
  sourceText,
  comments,
  templates,
  infer,
}: {
  /**
   * The original source code text
   */
  sourceText: string;
  comments: Comment[];
  /**
   * The tagged template expressions to analyze
   */
  templates: TaggedTemplateExpression<T>[];
  /**
   * Configuration for inference rules
   */
  infer: {
    /**
     * Whether to check for the 'html' template tag
     */
    htmlTag: boolean;
    /**
     * Whether to check for Lit binding syntax patterns
     */
    litBindings: boolean;
  };
}): TaggedTemplateExpression<T>[] {
  const litTaggedTemplates: TaggedTemplateExpression<T>[] = [];

  // Sort comments by their start position to process them in order
  const sortedComments = comments.sort((a, b) => a.start - b.start);

  // This is the key optimization: we maintain a sliding window through the comments array
  // by keeping track of the starting index for each template. This avoids having to
  // scan through all comments for each template, which would be O(tc) where t
  // is the number of templates and c is the number of comments.
  let commentStartIndex = 0;

  for (const template of templates) {
    // Flag to track if we should skip this template (e.g., if it has @litHtmlIgnore)
    let skip = false;

    // Iterate through comments starting from our current position in the comments array.
    // This is much more efficient than starting from the beginning for each template,
    // especially in large files with many comments and templates.
    for (
      let commentIndex = commentStartIndex;
      commentIndex < sortedComments.length;
      commentIndex++
    ) {
      const comment = sortedComments[commentIndex];
      // Comment must end before the template starts
      if (comment.end > template.start) {
        commentStartIndex = commentIndex;
        break;
      }

      // Check if the comment is close enough to the template to be considered related.
      // We only consider comments that are within 1 line of the template to avoid
      // associating unrelated comments with templates.
      const textBetween = sourceText.substring(comment.end, template.start);
      const numLinesBetween = textBetween.match(/\r?\n/g)?.length ?? 0;

      if (numLinesBetween > 1) {
        continue;
      }

      // Check for special annotations that determine if this template
      // should be included or explicitly ignored
      if (comment.value.includes('@litHtmlIgnore')) {
        skip = true;
        commentStartIndex = commentIndex;
        break;
      }

      // If we found a @litHtmlTemplate annotation, include this template
      if (comment.value.includes('@litHtmlTemplate')) {
        litTaggedTemplates.push(template);
        commentStartIndex = commentIndex;
        break;
      }
    }

    // If we didn't explicitly skip this template, add it to the remaining list for further analysis
    if (skip) {
      continue;
    }

    const fullText = sourceText.substring(template.start, template.end);

    if (isLikelyTaggedTemplateLiteral({node: template, fullText, infer})) {
      litTaggedTemplates.push(template);
    }
  }

  return litTaggedTemplates;
}

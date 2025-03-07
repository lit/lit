import {findLitTaggedTemplates} from './detection.js';
import {parseTemplateLiteral} from './html-parser/template-literal.js';
import {NativeTemplate, TreeAdapter} from './tree-adapter.js';

export interface Comment {
  type: 'Line' | 'Block';
  value: string;
  start: number;
  end: number;
}

/**
 *
 * @param tree OXC estree output
 */
export function transformTree<T extends TreeAdapter>({
  tree,
  sourceText,
  infer,
}: {
  /**
   * The parsed estree. By default, we use OXC's parser.
   */
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
     * Whether to check for the html tag
     */
    htmlTag: boolean;
    /**
     * Whether to check for Lit bindings
     */
    litBindings: boolean;
  };
}): NativeTemplate<T>[] {
  const litTaggedTemplates = findLitTaggedTemplates<T>({
    tree,
    sourceText,
    infer,
  });
  litTaggedTemplates.map((template) => parseTemplateLiteral(template));
  return litTaggedTemplates.map((template) => template.native);
}

import {createDocumentFragment, DocumentFragment} from './parse5-shim.js';
import {parseTemplateLiteralSpan} from './template-literal-span.js';
import {Mode, State} from './state.js';
import {TaggedTemplateExpression} from '../tree-adapter.js';

export function parseTemplateLiteral(
  template: TaggedTemplateExpression
): DocumentFragment {
  // Cast to Lit template and initialize the custom properties
  const litTemplate = template;
  const fragment = createDocumentFragment();

  litTemplate.native.documentFragment = fragment;
  litTemplate.native.isLit = true;
  fragment.sourceCodeLocation = {
    startOffset: litTemplate.template.start + 1,
    endOffset: litTemplate.template.end - 1,
  };

  let state: State = {
    mode: Mode.TEXT,
    attributeMode: null,
    elementStack: [],
    document: fragment,
    endTagIgnore: false,
    charLocation: litTemplate.template.start + 1,
    checkingSecondDash: false,
    commentIsBogus: false,
    lastExpressionNode: null,
    potentialTextNode: null,
    currentAttributeQuote: null,
    currentAttributeNode: null,
    currentElementNode: null,
    currentTextNode: null,
    currentCommentNode: null,
    currentTagLiteral: null,
    currentEndTag: [],
  };

  const spans = litTemplate.template.spans;

  for (let i = 0; i < spans.length; i++) {
    const segment = spans[i];
    const nextExpression = litTemplate.template.expressions[i];
    state = parseTemplateLiteralSpan(segment, nextExpression, state);
  }

  return fragment;
}

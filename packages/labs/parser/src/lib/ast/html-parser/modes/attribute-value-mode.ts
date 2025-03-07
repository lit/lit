import {Mode, State} from '../state.js';
import {createLitHtmlExpression, createTagLiteral} from '../parse5-shim.js';
import {
  updateSourceLocation,
  updateAttributeSourceLocation,
} from '../helpers.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function attributeValueMode(
  char: string | undefined,
  nextExpression: With<Object, LitLinkedExpression> | undefined,
  state: State
): State {
  if (state.lastExpressionNode) {
    state.lastExpressionNode.sourceCodeLocation!.endOffset = state.charLocation;
    state.lastExpressionNode = null;
  }

  if (!state.currentElementNode) {
    throw new Error(
      'Started attribute-value mode, but no current tag is being tracked.'
    );
  }

  if (!state.currentAttributeNode || !state.attributeMode) {
    throw new Error(
      'Started attribute-value mode, but no current attribute is being tracked.'
    );
  }

  // Initialize the current tag literal if it doesn't exist
  if (!state.currentTagLiteral) {
    state.currentTagLiteral = createTagLiteral('');
    state.currentTagLiteral.sourceCodeLocation = {
      startOffset: state.charLocation,
      endOffset: state.charLocation,
    };
  }

  // Handle end of input
  if (!char) {
    // Commit the current tag literal to the attribute value if it has content
    if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentAttributeNode.value.push(state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    // Handle next expression if present
    if (nextExpression) {
      state.lastExpressionNode = createLitHtmlExpression(
        nextExpression,
        state.charLocation
      );
      state.currentAttributeNode.value.push(state.lastExpressionNode);
    }

    // Commit the attribute to the element if it hasn't been committed yet
    if (state.currentAttributeNode && state.currentElementNode) {
      // Update source locations
      updateAttributeSourceLocation(
        state.charLocation,
        state.currentElementNode,
        state.currentAttributeNode
      );
      state.currentElementNode.attrs.push(state.currentAttributeNode);
    }
    return state;
  }

  const parent =
    state.elementStack[state.elementStack.length - 1] ?? state.document;

  // Handle attribute value quotes
  if (char === '"' || char === "'") {
    if (!state.currentAttributeQuote) {
      // Opening quote - set the current quote character
      state.currentAttributeQuote = char;
      // Don't add the quote character to the value
      return state;
    } else if (state.currentAttributeQuote === char) {
      // Closing quote - finish the attribute value
      if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentAttributeNode.value.push(state.currentTagLiteral);
        state.currentTagLiteral = null;
      }

      // Commit the attribute to the element
      updateAttributeSourceLocation(
        state.charLocation,
        state.currentElementNode,
        state.currentAttributeNode
      );
      state.currentElementNode.attrs.push(state.currentAttributeNode);

      // Reset state
      state.currentAttributeNode = null;
      state.currentAttributeQuote = null;
      state.mode = Mode.TAG;
      return state;
    }
    // If we reach here, it's a quote character within the attribute value
    // Just add it to the current literal value
  }

  // Handle whitespace when not inside quotes (unquoted attribute values)
  if (
    (char === ' ' || char === '\n' || char === '\t') &&
    !state.currentAttributeQuote
  ) {
    // End of unquoted attribute value - finish the attribute value
    if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentAttributeNode.value.push(state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    // Commit the attribute to the element
    updateAttributeSourceLocation(
      state.charLocation,
      state.currentElementNode,
      state.currentAttributeNode
    );
    state.currentElementNode.attrs.push(state.currentAttributeNode);

    // Reset state
    state.currentAttributeNode = null;
    state.currentAttributeQuote = null;
    state.mode = Mode.TAG;
    return state;
  }

  // Handle self-closing tag
  if (char === '/' && state.currentAttributeQuote === null) {
    if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentAttributeNode.value.push(state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    // Commit the attribute to the element
    updateAttributeSourceLocation(
      state.charLocation,
      state.currentElementNode,
      state.currentAttributeNode
    );
    state.currentElementNode.attrs.push(state.currentAttributeNode);

    // Reset state
    state.currentAttributeNode = null;
    state.mode = Mode.TAG;
    return state;
  }

  // Handle end of tag - this also handles the case of missing closing quotes
  if (char === '>') {
    if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentAttributeNode.value.push(state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    // Commit the attribute to the element
    updateAttributeSourceLocation(
      state.charLocation,
      state.currentElementNode,
      state.currentAttributeNode
    );
    state.currentElementNode.attrs.push(state.currentAttributeNode);

    // Update element and push to parent
    updateSourceLocation(state.charLocation, state.currentElementNode, {
      additionalEndOffset: 1,
      updateStartTag: true,
    });
    parent.childNodes.push(state.currentElementNode);
    state.currentElementNode.parentNode = parent;
    state.elementStack.push(state.currentElementNode);

    // Reset state
    state.currentAttributeNode = null;
    state.currentElementNode = null;
    // Always reset quote state when ending a tag (helps with malformed attribute handling)
    state.currentAttributeQuote = null;
    state.mode = Mode.TEXT;
    return state;
  }

  // Add character to the current literal value
  if (state.currentTagLiteral) {
    state.currentTagLiteral.value = `${state.currentTagLiteral.value}${char}`;
  }

  return state;
}

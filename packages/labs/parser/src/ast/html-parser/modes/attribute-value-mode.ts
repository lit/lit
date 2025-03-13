import {Mode, State} from '../state.js';
import {createLitHtmlExpression} from '../parse5-shim.js';
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
    state.currentTagLiteral = {
      type: 'LitTagLiteral',
      value: '',
      sourceCodeLocation: {
        startOffset: state.charLocation,
        endOffset: state.charLocation,
      },
    };
  }

  // Handle end of input
  if (!char) {
    // Commit the current tag literal to the attribute value if it has content
    if (state.currentTagLiteral.value.length) {
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

    return state;
  }

  const parent =
    state.elementStack[state.elementStack.length - 1] ?? state.document;
  console.log(char);

  // Handle quotes
  if (char === '"' || char === "'") {
    if (!state.currentAttibuteQuote) {
      // Start of quoted value
      state.currentAttibuteQuote = char;
    } else if (state.currentAttibuteQuote === char) {
      state.mode = Mode.TAG;
      // End of quoted value
      if (state.currentTagLiteral.value.length) {
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentAttributeNode.value.push(state.currentTagLiteral);
        // Update source locations
        updateAttributeSourceLocation(
          state.charLocation,
          state.currentElementNode,
          state.currentAttributeNode!
        );
        // Commit the attribute to the element
        state.currentElementNode.attrs.push(state.currentAttributeNode);
        state.currentTagLiteral = null;
      }
      state.currentAttibuteQuote = null;
    } else {
      // Different quote inside quoted value, treat as regular character
      state.currentTagLiteral.value += char;
    }
  }
  // Handle end of tag
  else if (char === '>') {
    state.mode = Mode.TEXT;

    // Commit the current tag literal to the attribute value if it has content
    if (state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentAttributeNode.value.push(state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    // Commit the attribute to the element
    state.currentElementNode.attrs.push(state.currentAttributeNode);

    // Update source locations
    updateAttributeSourceLocation(
      state.charLocation,
      state.currentElementNode,
      state.currentAttributeNode!
    );

    // Update element structure
    parent.childNodes.push(state.currentElementNode);
    state.currentElementNode.parentNode = parent;
    state.elementStack.push(state.currentElementNode);
    updateSourceLocation(state.charLocation, state.currentElementNode, {
      additionalEndOffset: 1,
      updateStartTag: true,
    });

    // Reset current nodes
    state.currentAttributeNode = null;
    state.currentElementNode = null;
    state.currentAttibuteQuote = null;
  }
  // Handle whitespace
  else if ((char === ' ' || char === '\n') && !state.currentAttibuteQuote) {
    state.mode = Mode.TAG;
    // Whitespace outside quotes ends the attribute value
    if (state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentAttributeNode.value.push(state.currentTagLiteral);
      // Update source locations
      updateAttributeSourceLocation(
        state.charLocation,
        state.currentElementNode,
        state.currentAttributeNode!
      );
      // Commit the attribute to the element
      state.currentElementNode.attrs.push(state.currentAttributeNode);
      state.currentTagLiteral = null;
    }
  }
  // Handle any other character
  else {
    // Add character to the current tag literal
    state.currentTagLiteral.value += char;
  }

  return state;
}

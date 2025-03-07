import {AttributeMode, Mode, State} from '../state.js';
import {createLitHtmlExpression} from '../parse5-shim.js';
import {
  getUniqueAttributeExpressionName,
  isValidAttributeStartCharacter,
  prepareForAttributeMode,
  updateSourceLocation,
  updateAttributeSourceLocation,
} from '../helpers.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function attributeEqualsOrTagMode(
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
      'Started attribute-equals-or-tag mode, but no current tag is being tracked.'
    );
  }

  if (!state.currentAttributeNode || !state.attributeMode) {
    throw new Error(
      'Started attribute-equals-or-tag mode, but no current attribute is being tracked.'
    );
  }

  // This is the case of
  // "<div asdf ${...}>"
  // or "<div asdf"
  if (!char) {
    state.mode = Mode.TAG;
    // commit the current attribute node
    state.currentElementNode.attrs.push(state.currentAttributeNode);

    updateAttributeSourceLocation(
      state.charLocation,
      state.currentElementNode,
      state.currentAttributeNode!
    );
    if (!state.currentAttributeNode.value.length) {
      state.currentAttributeNode.value = [
        {
          type: 'LitTagLiteral',
          value: '',
        },
      ];
    }

    state.currentAttributeNode = null;

    if (nextExpression) {
      // commit the current expression as an expression attribute
      state.lastExpressionNode = createLitHtmlExpression(
        nextExpression,
        state.charLocation
      );
      state.currentElementNode.attrs.push(state.lastExpressionNode);

      if (!state.currentElementNode.sourceCodeLocation!.attrs) {
        state.currentElementNode.sourceCodeLocation!.attrs = {};
      }

      const uniqueExprName = getUniqueAttributeExpressionName(
        state.lastExpressionNode
      );
      state.currentElementNode.sourceCodeLocation!.attrs[uniqueExprName] =
        state.lastExpressionNode.sourceCodeLocation!;

      return state;
    }

    return state;
  }

  const parent =
    state.elementStack[state.elementStack.length - 1] ?? state.document;

  if (char === '>') {
    state.mode = Mode.TEXT;
    // Commit the current attribute node
    state.currentElementNode.attrs.push(state.currentAttributeNode);

    // Set empty value if none exists
    if (!state.currentAttributeNode.value.length) {
      state.currentAttributeNode.value = [
        {
          type: 'LitTagLiteral',
          value: '',
        },
      ];
    }

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
  } else if (char === '=') {
    // we found an equals, so we are moving to an attribute value
    state.mode = Mode.ATTRIBUTE_VALUE;
  } else if (isValidAttributeStartCharacter(char)) {
    state.mode = Mode.ATTRIBUTE;
    // This is a new attribute - commit the current one first
    state.currentElementNode.attrs.push(state.currentAttributeNode);

    // Set empty value if none exists
    if (!state.currentAttributeNode.value.length) {
      state.currentAttributeNode.value = [
        {
          type: 'LitTagLiteral',
          value: '',
        },
      ];
    }

    // Update source locations for the attribute we're finishing
    updateAttributeSourceLocation(
      state.charLocation,
      state.currentElementNode,
      state.currentAttributeNode!
    );

    // Set up for the new attribute
    // Determine the attribute mode based on the character
    switch (char) {
      case '.':
        state.attributeMode = AttributeMode.PROPERTY;
        prepareForAttributeMode(state, char);
        break;
      case '?':
        state.attributeMode = AttributeMode.BOOLEAN;
        prepareForAttributeMode(state, char);
        break;
      case '@':
        state.attributeMode = AttributeMode.EVENT;
        prepareForAttributeMode(state, char);
        break;
      default:
        state.attributeMode = AttributeMode.STRING;
        prepareForAttributeMode(state, char);
        break;
    }
  } else if (char === ' ' || char === '\n') {
    // Just whitespace, stay in the same mode
  }

  return state;
}

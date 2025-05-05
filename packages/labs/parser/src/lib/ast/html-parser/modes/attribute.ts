import {Mode, State} from '../state.js';
import {createLitHtmlExpression, createTagLiteral} from '../parse5-shim.js';
import {
  updateSourceLocation,
  updateAttributeSourceLocation,
} from '../helpers.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function attributeMode(
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
      'Started attribute mode, but no current tag is being tracked.'
    );
  }

  if (!state.currentTagLiteral) {
    state.currentTagLiteral = createTagLiteral('');
    state.currentTagLiteral.sourceCodeLocation = {
      startOffset: state.charLocation,
      endOffset: state.charLocation,
    };
  }

  if (!state.currentAttributeNode) {
    state.currentAttributeNode = {
      type: state.attributeMode!,
      name: [],
      value: [],
      element: state.currentElementNode,
    };
  }

  if (!char) {
    if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentAttributeNode!.name.push(state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    if (nextExpression) {
      state.lastExpressionNode = createLitHtmlExpression(
        nextExpression,
        state.charLocation
      );
      state.currentAttributeNode!.name.push(state.lastExpressionNode);
    }

    return state;
  }

  const parent =
    state.elementStack[state.elementStack.length - 1] ?? state.document;

  switch (char) {
    case ' ':
      state.mode = Mode.ATTRIBUTE_EQUALS_OR_TAG;
      if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentAttributeNode!.name.push(state.currentTagLiteral);
        state.currentTagLiteral = null;
      }
      break;
    case '\n':
      state.mode = Mode.ATTRIBUTE_EQUALS_OR_TAG;
      if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentAttributeNode!.name.push(state.currentTagLiteral);
        state.currentTagLiteral = null;
      }
      break;
    case '=':
      state.mode = Mode.ATTRIBUTE_VALUE;
      if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentAttributeNode!.name.push(state.currentTagLiteral);
        state.currentTagLiteral = null;
      }
      break;
    case '>':
      state.mode = Mode.TEXT;
      // In this case the attribute doesn't have a value, so we commit it as is
      if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentAttributeNode!.name.push(state.currentTagLiteral);
        state.currentTagLiteral = null;
      }

      updateAttributeSourceLocation(
        state.charLocation,
        state.currentElementNode,
        state.currentAttributeNode!
      );
      state.currentElementNode.attrs.push(state.currentAttributeNode!);

      if (!state.currentAttributeNode!.value.length) {
        state.currentAttributeNode!.value = [createTagLiteral('')];
      }

      updateSourceLocation(state.charLocation, state.currentElementNode, {
        additionalEndOffset: 1,
        updateStartTag: true,
      });
      parent.childNodes.push(state.currentElementNode);
      state.currentElementNode.parentNode = parent;
      state.elementStack.push(state.currentElementNode);
      state.currentElementNode = null;
      state.currentAttributeNode = null;
      break;
    case '/':
      // Handle self-closing tags
      state.mode = Mode.TAG;
      if (state.currentTagLiteral && state.currentTagLiteral.value.length) {
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentAttributeNode!.name.push(state.currentTagLiteral);
        state.currentTagLiteral = null;
      }

      // Commit the attribute
      updateAttributeSourceLocation(
        state.charLocation,
        state.currentElementNode,
        state.currentAttributeNode!
      );
      state.currentElementNode.attrs.push(state.currentAttributeNode!);

      if (!state.currentAttributeNode!.value.length) {
        state.currentAttributeNode!.value = [createTagLiteral('')];
      }

      state.currentAttributeNode = null;
      break;
    default:
      if (state.currentTagLiteral) {
        state.currentTagLiteral.value = `${state.currentTagLiteral.value}${char}`;
      }
      break;
  }

  return state;
}

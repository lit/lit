import {Mode, State} from '../state.js';
import {createLitHtmlExpression} from '../parse5-shim.js';
import {updateSourceLocation} from '../helpers.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function tagNameMode(
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
      'Started tag name mode, but no current tag is being tracked.'
    );
  }

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

  if (!char) {
    if (state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentElementNode.tagName.push(state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    if (nextExpression) {
      state.lastExpressionNode = createLitHtmlExpression(
        nextExpression,
        state.charLocation
      );
      state.currentElementNode.tagName.push(state.lastExpressionNode);
    }

    return state;
  }

  const parent =
    state.elementStack[state.elementStack.length - 1] ?? state.document;
  switch (char) {
    case ' ':
      state.mode = Mode.TAG;
      state.currentElementNode.tagName.push(state.currentTagLiteral);
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentTagLiteral = null;
      break;
    case '/':
      state.mode = Mode.TAG;
      state.currentElementNode.tagName.push(state.currentTagLiteral);
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentTagLiteral = null;
      break;
    case '\n':
      state.mode = Mode.TAG;
      state.currentElementNode.tagName.push(state.currentTagLiteral);
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentTagLiteral = null;
      break;
    case '>':
      state.mode = Mode.TEXT;
      state.currentElementNode.tagName.push(state.currentTagLiteral);
      updateSourceLocation(state.charLocation, state.currentElementNode, {
        additionalEndOffset: 1,
        updateStartTag: true,
      });
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      parent.childNodes.push(state.currentElementNode);
      state.currentElementNode.parentNode = parent;
      state.elementStack.push(state.currentElementNode);
      state.currentElementNode = null;
      state.currentTagLiteral = null;
      break;
    default:
      state.currentTagLiteral.value = `${state.currentTagLiteral.value}${char}`;
      break;
  }

  return state;
}

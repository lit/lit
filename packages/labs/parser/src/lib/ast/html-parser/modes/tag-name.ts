import {Mode, State} from '../state.js';
import {
  createElement,
  createLitHtmlExpression,
  createTagLiteral,
} from '../parse5-shim.js';
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
    state.currentElementNode = createElement('');
    state.currentElementNode = {
      ...state.currentElementNode,
      sourceCodeLocation: {
        startOffset: state.charLocation - 1, // Account for "<" character
        startTag: {
          startOffset: state.charLocation - 1, // Account for "<" character
          endOffset: state.charLocation - 1, // Will be updated later
        },
        endOffset: state.charLocation - 1, // Will be updated later
      },
      tagName: [],
    };
  }

  if (!state.currentTagLiteral) {
    state.currentTagLiteral = createTagLiteral('');
    state.currentTagLiteral.sourceCodeLocation = {
      startOffset: state.charLocation,
      endOffset: state.charLocation,
    };
  }

  if (!char) {
    // Commit the current tag literal if it has content
    if (state.currentTagLiteral && state.currentTagLiteral.value.length > 0) {
      state.currentElementNode.tagName.push(state.currentTagLiteral);
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    // Handle expression in tag name
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
      if (state.currentTagLiteral) {
        state.currentElementNode.tagName.push(state.currentTagLiteral);
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentTagLiteral = null;
      }
      state.mode = Mode.TAG;
      break;
    case '/':
      if (state.currentTagLiteral) {
        state.currentElementNode.tagName.push(state.currentTagLiteral);
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentTagLiteral = null;
      }
      state.mode = Mode.TAG;
      break;
    case '\n':
      if (state.currentTagLiteral) {
        state.currentElementNode.tagName.push(state.currentTagLiteral);
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentTagLiteral = null;
      }
      state.mode = Mode.TAG;
      break;
    case '>':
      if (state.currentTagLiteral) {
        state.currentElementNode.tagName.push(state.currentTagLiteral);
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentTagLiteral = null;
      }
      state.mode = Mode.TEXT;
      updateSourceLocation(state.charLocation, state.currentElementNode, {
        additionalEndOffset: 1,
        updateStartTag: true,
      });
      parent.childNodes.push(state.currentElementNode);
      state.currentElementNode.parentNode = parent;
      state.elementStack.push(state.currentElementNode);
      state.currentElementNode = null;
      break;
    default:
      if (state.currentTagLiteral) {
        state.currentTagLiteral.value = `${state.currentTagLiteral.value}${char}`;
      }
      break;
  }

  return state;
}

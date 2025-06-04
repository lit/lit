import {Mode, State} from '../state.js';
import {createLitHtmlExpression, createTextNode} from '../parse5-shim.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function textMode(
  char: string | undefined,
  nextExpression: With<Object, LitLinkedExpression> | undefined,
  state: State
): State {
  if (state.lastExpressionNode) {
    state.lastExpressionNode.sourceCodeLocation!.endOffset = state.charLocation;
    state.lastExpressionNode = null;
  }

  if (!state.currentTextNode) {
    state.currentTextNode = createTextNode('');
    state.currentTextNode = {
      ...state.currentTextNode,
      sourceCodeLocation: {
        startOffset: state.charLocation,
        endOffset: state.charLocation,
      },
    };
  }

  if (!char) {
    const parentNode =
      state.elementStack[state.elementStack.length - 1] ?? state.document;

    if (state.currentTextNode.value.length) {
      state.currentTextNode.sourceCodeLocation!.endOffset = state.charLocation;
      state.currentTextNode.parentNode = parentNode;
      parentNode.childNodes.push(state.currentTextNode);
    }
    state.currentTextNode = null;

    if (nextExpression) {
      state.lastExpressionNode = createLitHtmlExpression(
        nextExpression,
        state.charLocation
      );
      parentNode.childNodes.push(state.lastExpressionNode);

      state.currentTextNode = createTextNode('');
      state.currentTextNode = {
        ...state.currentTextNode,
        sourceCodeLocation: {
          startOffset: state.charLocation,
          endOffset: state.charLocation,
        },
      };
    }

    return state;
  }

  switch (char) {
    case '<':
      state.mode = Mode.TAG_OR_COMMENT_OR_TEXT_OR_END_TAG;
      state.currentTextNode.sourceCodeLocation!.endOffset = state.charLocation;
      state.potentialTextNode = {
        ...state.currentTextNode,
        sourceCodeLocation: {...state.currentTextNode.sourceCodeLocation!},
      };
      state.currentTextNode.value = `${state.currentTextNode.value}${char}`;
      break;
    default:
      state.currentTextNode.value = `${state.currentTextNode.value}${char}`;
      break;
  }

  return state;
}

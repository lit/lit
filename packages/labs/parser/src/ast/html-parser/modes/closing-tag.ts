import {Mode, State} from '../state.js';
import {createLitHtmlExpression, Element} from '../parse5-shim.js';
import {
  coerceLiteralExpressionString,
  updateSourceLocation,
} from '../helpers.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function closingTagMode(
  char: string | undefined,
  nextExpression: With<Object, LitLinkedExpression> | undefined,
  state: State
): State {
  if (state.lastExpressionNode) {
    state.lastExpressionNode.sourceCodeLocation!.endOffset = state.charLocation;
    state.lastExpressionNode = null;
  }

  if (!state.currentEndTag && !state.endTagIgnore) {
    state.currentEndTag = [];
  }

  if (!state.currentTagLiteral && !state.endTagIgnore) {
    state.currentTagLiteral = {
      type: 'LitTagLiteral',
      value: '',
      sourceCodeLocation: {
        startOffset: state.charLocation,
        endOffset: state.charLocation,
      },
    };
  }

  if (!char && state.currentEndTag && state.currentTagLiteral) {
    if (state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentEndTag.push(state.currentTagLiteral);
      state.currentTagLiteral = null;
    }

    if (nextExpression) {
      state.lastExpressionNode = createLitHtmlExpression(
        nextExpression,
        state.charLocation
      );
      state.currentEndTag.push(state.lastExpressionNode);
    }

    return state;
  }

  let parent: Element | null = null;
  let numPops = 0;

  if (state.currentTagLiteral) {
    const coercedTagName = coerceLiteralExpressionString(
      ...state.currentEndTag,
      state.currentTagLiteral
    );

    // Find the potential parent element
    for (let i = state.elementStack.length - 1; i >= 0; i--) {
      numPops++;
      const potentialParent = state.elementStack[i];
      const coercedParentTagName = coerceLiteralExpressionString(
        ...potentialParent.tagName
      );
      if (coercedParentTagName === coercedTagName) {
        parent = potentialParent;
        break;
      }
    }
  }

  switch (char) {
    case ' ':
      state.endTagIgnore = true;
      if (
        state.currentEndTag &&
        state.currentTagLiteral &&
        state.currentTagLiteral.value.length
      ) {
        state.currentEndTag.push(state.currentTagLiteral);
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
      }
      state.currentTagLiteral = null;
      break;
    case '\n':
      state.endTagIgnore = true;
      if (
        state.currentEndTag &&
        state.currentTagLiteral &&
        state.currentTagLiteral.value.length
      ) {
        state.currentEndTag.push(state.currentTagLiteral);
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
      }
      state.currentTagLiteral = null;
      break;
    case '>':
      state.mode = Mode.TEXT;
      if (
        state.currentEndTag &&
        state.currentTagLiteral &&
        state.currentTagLiteral.value.length
      ) {
        state.currentEndTag.push(state.currentTagLiteral);
        updateSourceLocation(state.charLocation, state.currentTagLiteral);
        state.currentEndTag.push(state.currentTagLiteral);
      }

      if (parent) {
        // Update parent element's end offset
        updateSourceLocation(state.charLocation, parent, {
          additionalEndOffset: 1,
        });

        // Set up the end tag location
        parent.sourceCodeLocation!.endTag = {
          startOffset:
            state.currentEndTag[0].sourceCodeLocation!.startOffset - 2,
          endOffset: state.charLocation + 1,
        };
        // No need to update endOffset again as it's already set by updateSourceLocation

        for (let i = 0; i < numPops; i++) {
          state.elementStack.pop();
        }
      }

      state.currentEndTag = [];
      state.currentTagLiteral = null;
      state.endTagIgnore = false;
      break;
    default:
      if (state.currentTagLiteral) {
        state.currentTagLiteral.value = `${state.currentTagLiteral.value}${char}`;
      }
      break;
  }

  return state;
}

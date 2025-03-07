import {Mode, State} from '../state.js';
import {createCommentNode, createLitHtmlExpression} from '../parse5-shim.js';
import {updateSourceLocation} from '../helpers.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function commentMode(
  char: string | undefined,
  nextExpression: With<Object, LitLinkedExpression> | undefined,
  state: State
): State {
  if (state.lastExpressionNode) {
    state.lastExpressionNode.sourceCodeLocation!.endOffset = state.charLocation;
    state.lastExpressionNode = null;
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

  // Initialize the comment node if it doesn't exist
  if (!state.currentCommentNode) {
    state.currentCommentNode = createCommentNode();
    state.currentCommentNode = {
      ...state.currentCommentNode,
      data: [],
      sourceCodeLocation: {
        startOffset: state.charLocation - 2, // Account for the "<!" characters
        endOffset: state.charLocation,
      },
    };
  }

  // Handle end of input
  if (!char) {
    if (state.currentTagLiteral.value.length) {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
      state.currentCommentNode.data.push(state.currentTagLiteral);
    }

    state.currentTagLiteral = null;

    // Handle next expression if present
    if (nextExpression) {
      state.lastExpressionNode = createLitHtmlExpression(
        nextExpression,
        state.charLocation
      );
      // Add the expression to the comment data instead of as a separate node
      state.currentCommentNode.data.push(state.lastExpressionNode);
    }

    return state;
  }

  const isFirstChar =
    state.currentCommentNode.data.length === 0 &&
    state.currentTagLiteral.value.length === 0;

  // Check for standard HTML comment pattern (<!-- ... -->)
  if (isFirstChar && char === '-') {
    state.currentTagLiteral.value = '-';
    // First character is a dash, might be a standard comment
    state.checkingSecondDash = true;
    return state; // Skip adding this dash to the comment data
  } else if (state.checkingSecondDash && char === '-') {
    // Second character is also a dash, this is a standard HTML comment
    state.commentIsBogus = false; // Not a bogus comment
    state.checkingSecondDash = false;
    state.currentTagLiteral = null;
    return state; // Skip adding these two dashes to the comment data
  }

  state.checkingSecondDash = false;

  // Check for the end of the comment
  if (
    char === '>' &&
    (state.commentIsBogus ||
      (!state.commentIsBogus && state.currentTagLiteral.value.endsWith('--')))
  ) {
    if (!state.commentIsBogus && state.currentTagLiteral.value.endsWith('--')) {
      // Remove the trailing "--" from the comment
      state.currentTagLiteral.value = state.currentTagLiteral.value.slice(
        0,
        -2
      );
      // update the source location of the tag literal
      state.currentTagLiteral.sourceCodeLocation!.endOffset =
        state.charLocation - 2;
    } else {
      updateSourceLocation(state.charLocation, state.currentTagLiteral);
    }

    state.mode = Mode.TEXT;

    // Update source location and commit the comment node
    updateSourceLocation(state.charLocation, state.currentCommentNode, {
      additionalEndOffset: 1,
    });

    if (state.currentTagLiteral.value.length) {
      state.currentCommentNode.data.push(state.currentTagLiteral);
    }

    // Reset the comment node
    state.currentCommentNode = null;
    state.currentTagLiteral = null;
    state.commentIsBogus = false;
    return state;
  }

  state.currentTagLiteral.value = `${state.currentTagLiteral.value}${char}`;

  return state;
}

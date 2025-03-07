import {Mode, State} from '../state.js';
import {createLitHtmlExpression} from '../parse5-shim.js';
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
    state.currentTagLiteral = {
      type: 'LitTagLiteral',
      value: '',
      sourceCodeLocation: {
        startOffset: state.charLocation,
        endOffset: state.charLocation,
      },
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
    if (state.currentTagLiteral.value.length) {
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

  if (char === ' ' || char === '\n') {
    state.mode = Mode.ATTRIBUTE_EQUALS_OR_TAG;

    updateSourceLocation(state.charLocation, state.currentTagLiteral);
    if (state.currentTagLiteral.value.length) {
      state.currentAttributeNode!.name.push(state.currentTagLiteral);
    }
    updateAttributeSourceLocation(
      state.charLocation,
      state.currentElementNode,
      state.currentAttributeNode!
    );

    state.currentTagLiteral = null;
  } else if (char === '=') {
    state.mode = Mode.ATTRIBUTE_VALUE;
    state.currentAttributeNode?.name.push(state.currentTagLiteral);
    updateSourceLocation(state.charLocation, state.currentTagLiteral);

    state.currentTagLiteral = null;
  } else if (char === '>') {
    state.mode = Mode.TEXT;
    // update Element
    parent.childNodes.push(state.currentElementNode);
    state.currentElementNode.parentNode = parent;
    state.elementStack.push(state.currentElementNode);
    updateSourceLocation(state.charLocation, state.currentElementNode, {
      additionalEndOffset: 1,
      updateStartTag: true,
    });

    // update attribute data
    if (state.currentTagLiteral.value.length) {
      state.currentAttributeNode!.name.push(state.currentTagLiteral);
    }
    updateSourceLocation(state.charLocation, state.currentTagLiteral);
    state.currentAttributeNode!.value = [
      {
        type: 'LitTagLiteral',
        value: '',
      },
    ];
    state.currentElementNode.attrs.push(state.currentAttributeNode!);

    // We subtract 1 from the start offset of attributes with sigils which are
    // not included in the string literal value.
    updateAttributeSourceLocation(
      state.charLocation,
      state.currentElementNode,
      state.currentAttributeNode!
    );

    state.currentAttributeNode = null;
    state.currentElementNode = null;
    state.currentTagLiteral = null;
  } else {
    state.currentTagLiteral.value = `${state.currentTagLiteral.value}${char}`;
  }

  return state;
}

import {Mode, State} from '../state.js';
import {
  createLitHtmlExpression,
  createTextNode,
  createElement,
  createCommentNode,
} from '../parse5-shim.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function tagOrCommentOrTexOrEndTagMode(
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

  if (!state.currentElementNode) {
    state.currentElementNode = createElement('', {});

    state.currentElementNode = {
      ...state.currentElementNode,
      nodeName: [],
      get tagName() {
        return this.nodeName;
      },
      set tagName(value) {
        this.nodeName = value;
      },
      sourceCodeLocation: {
        startOffset: state.charLocation - 1,
        endOffset: state.currentTagLiteral.sourceCodeLocation!.endOffset,
        attrs: {},
        startTag: {
          startOffset: state.charLocation - 1,
          endOffset: state.currentTagLiteral.sourceCodeLocation!.endOffset,
        },
      },
    };
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

  // Some Possible cases:
  // <${literal`tag-mame`} ...>...</${literal`tag-name`}>
  //
  // Some Unsupported Cases:
  // <${literal`!--`}
  // <${literal`/`}endTagName>
  // <${literal`7-not-valid-tag-name`}
  if (!char) {
    // we assume the best of people and that this is a valid tag name binding
    // Also NOTE Lit does not support `4 <${5}` so that saves us here since
    // HTML supports that
    state.mode = Mode.TAG;

    // update tag literal
    state.currentTagLiteral.sourceCodeLocation!.endOffset = state.charLocation;

    // update element node
    if (state.currentTagLiteral.value.length) {
      state.currentElementNode.tagName.push(state.currentTagLiteral);
    }

    state.currentTagLiteral = null;

    // we are not at tail of template literal. This is probably a tag name
    // binding like so:
    // html`<${literal`tag-name`} ...`
    if (nextExpression) {
      state.lastExpressionNode = createLitHtmlExpression(
        nextExpression,
        state.charLocation
      );
      state.currentElementNode.tagName.push(state.lastExpressionNode);
    }

    // we are at tail of template literal commit as text node
    // We handle the case of text node at the end like:
    // html`<div>Hello world<`
    // where "Hello world<" is a text node
    if (!nextExpression && state.currentTextNode.value.length) {
      const parentNode =
        state.elementStack[state.elementStack.length - 1] ?? state.document;
      state.currentTextNode.parentNode = parentNode;
      parentNode.childNodes.push(state.currentTextNode);
    }

    // cleanup state
    state.currentTextNode = null;
    state.currentCommentNode = null;

    return state;
  }

  const parent =
    state.elementStack[state.elementStack.length - 1] ?? state.document;
  state.currentTextNode.value = `${state.currentTextNode.value}${char}`;
  state.currentTagLiteral.value = `${state.currentTagLiteral.value}${char}`;

  switch (char) {
    case '!':
      state.mode = Mode.COMMENT;
      // cleanup state
      state.currentTagLiteral = null;
      state.currentElementNode = null;
      state.currentTextNode = null;

      if (state.potentialTextNode && state.potentialTextNode.value.length) {
        parent.childNodes.push(state.potentialTextNode);
        state.potentialTextNode.parentNode = parent;
      }

      state.currentCommentNode = createCommentNode();
      state.currentCommentNode = {
        ...state.currentCommentNode,
        data: [],
        parentNode: parent,
        sourceCodeLocation: {
          startOffset: state.charLocation - 1,
          endOffset: state.charLocation,
        },
      };

      parent.childNodes.push(state.currentCommentNode);

      state.commentIsBogus = true;
      state.potentialTextNode = null;
      break;
    case '/':
      state.mode = Mode.CLOSING_TAG;
      // cleanup state
      state.currentTagLiteral = null;
      state.currentElementNode = null;
      state.currentTextNode = null;

      if (state.potentialTextNode && state.potentialTextNode.value.length) {
        parent.childNodes.push(state.potentialTextNode);
        state.potentialTextNode.parentNode = parent;
      }

      state.potentialTextNode = null;
      break;
    default:
      if (isValidTagStartCharacter(char)) {
        state.mode = Mode.TAG_NAME;
        if (state.potentialTextNode && state.potentialTextNode.value.length) {
          parent.childNodes.push(state.potentialTextNode);
          state.potentialTextNode.parentNode = parent;
        }

        state.potentialTextNode = null;

        // cleanup state
        state.currentTextNode = null;
        state.currentCommentNode = null;
        break;
      }

      state.mode = Mode.TEXT;
      state.potentialTextNode = null;
      break;
  }

  return state;
}

function isValidTagStartCharacter(char: string): boolean {
  return !!char.match(/[a-zA-Z]/);
}

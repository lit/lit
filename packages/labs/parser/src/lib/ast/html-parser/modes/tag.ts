import {AttributeMode, Mode, State} from '../state.js';
import {createLitHtmlExpression} from '../parse5-shim.js';
import {
  getUniqueAttributeExpressionName,
  prepareForAttributeMode,
  isValidAttributeStartCharacter,
  updateSourceLocation,
} from '../helpers.js';
import {LitLinkedExpression, With} from '../../tree-adapter.js';

export function tagMode(
  char: string | undefined,
  nextExpression: With<Object, LitLinkedExpression> | undefined,
  state: State
): State {
  if (state.lastExpressionNode) {
    state.lastExpressionNode.sourceCodeLocation!.endOffset = state.charLocation;
    state.lastExpressionNode = null;
  }

  if (!state.currentElementNode) {
    throw new Error('Started tag mode, but no current tag is being tracked.');
  }

  if (!char) {
    if (nextExpression) {
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

  switch (char) {
    case '>':
      state.mode = Mode.TEXT;
      parent.childNodes.push(state.currentElementNode);
      state.currentElementNode.parentNode = parent;
      state.elementStack.push(state.currentElementNode);
      updateSourceLocation(state.charLocation, state.currentElementNode, {
        additionalEndOffset: 1,
        updateStartTag: true,
      });
      state.currentElementNode = null;
      break;
    // tslint:disable-next-line: no-switch-case-fall-through
    case '.':
      state.mode = Mode.ATTRIBUTE;
      state.attributeMode = AttributeMode.PROPERTY;
      prepareForAttributeMode(state, char);
      break;
    case '?':
      state.mode = Mode.ATTRIBUTE;
      state.attributeMode = AttributeMode.BOOLEAN;
      prepareForAttributeMode(state, char);
      break;
    case '@':
      state.mode = Mode.ATTRIBUTE;
      state.attributeMode = AttributeMode.EVENT;
      prepareForAttributeMode(state, char);
      break;
    default:
      if (!isValidAttributeStartCharacter(char)) {
        break;
      }
      state.mode = Mode.ATTRIBUTE;
      state.attributeMode = AttributeMode.STRING;
      prepareForAttributeMode(state, char);
      break;
  }

  return state;
}

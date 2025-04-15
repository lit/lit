import {Mode, State} from './state.js';
import {textMode} from './modes/text.js';
import {tagOrCommentOrTexOrEndTagMode} from './modes/tag-or-comment-or-text-or-end-tag.js';
import {tagMode} from './modes/tag.js';
import {tagNameMode} from './modes/tag-name.js';
import {closingTagMode} from './modes/closing-tag.js';
import {attributeMode} from './modes/attribute.js';
import {attributeEqualsOrTagMode} from './modes/attribute-equals-or-tag-mode.js';
import {attributeValueMode} from './modes/attribute-value-mode.js';
import {commentMode} from './modes/comment.js';
import {
  LitLinkedExpression,
  TemplateExpression,
  With,
} from '../tree-adapter.js';

export function parseTemplateLiteralSpan(
  template: TemplateExpression,
  nextExpression: With<Object, LitLinkedExpression> | undefined,
  state: State
): State {
  for (let i = 0; i < template.value.raw.length + 1; i++) {
    const char: string | undefined = template.value.raw[i];
    state.charLocation = template.start + i;
    // console.log(char, state.mode);

    switch (state.mode) {
      case Mode.TEXT:
        state = textMode(char, nextExpression, state);
        break;
      case Mode.TAG_OR_COMMENT_OR_TEXT_OR_END_TAG:
        state = tagOrCommentOrTexOrEndTagMode(char, nextExpression, state);
        break;
      case Mode.TAG_NAME:
        state = tagNameMode(char, nextExpression, state);
        break;
      case Mode.COMMENT:
        state = commentMode(char, nextExpression, state);
        break;
      case Mode.TAG:
        state = tagMode(char, nextExpression, state);
        break;
      case Mode.CLOSING_TAG:
        state = closingTagMode(char, nextExpression, state);
        break;
      case Mode.ATTRIBUTE:
        state = attributeMode(char, nextExpression, state);
        break;
      case Mode.ATTRIBUTE_EQUALS_OR_TAG:
        state = attributeEqualsOrTagMode(char, nextExpression, state);
        break;
      case Mode.ATTRIBUTE_VALUE:
        state = attributeValueMode(char, nextExpression, state);
        break;
      default:
        break;
    }
  }

  return state;
}

import type {
  Directive,
  Statement,
  TemplateElement,
  Expression,
} from 'oxc-parser';
import type {LitTaggedTemplateExpression, With} from '../tree-adapter.js';

export function isLitTaggedTemplateExpression<
  T extends Directive | Statement | Expression | TemplateElement,
>(node: T): node is With<T, LitTaggedTemplateExpression> {
  return (
    node.type === 'TaggedTemplateExpression' &&
    'isLit' in node &&
    (node.isLit as boolean)
  );
}

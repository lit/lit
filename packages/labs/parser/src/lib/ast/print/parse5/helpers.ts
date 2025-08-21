import {
  LitHtmlExpression,
  LitTagLiteral,
} from '../../html-parser/parse5-shim.js';
import {printLitHtmlExpression} from './lit-element-expression.js';

export function printAttributeArray(
  values: (LitHtmlExpression | LitTagLiteral)[],
  prefix: string,
  level: number,
  propName = 'value'
) {
  const lines: string[] = [];
  lines.push(`${prefix}  ${propName}: [`);
  for (const value of values) {
    switch (value.type) {
      case 'LitTagLiteral':
        lines.push(
          `${prefix}    LitTagLiteral ${value.sourceCodeLocation ? `(loc: ${value.sourceCodeLocation.startOffset}, ${value.sourceCodeLocation.endOffset})` : '(virtual)'}`
        );
        lines.push(
          `${prefix}      value: "${value.value.replaceAll('\n', '\\n')}"`
        );
        break;
      default:
        lines.push(
          printLitHtmlExpression({
            node: value,
            level: level + 1,
            prefix: prefix + '    ',
          })
        );
        break;
    }
  }
  lines.push(`${prefix}  ]`);
  return lines.join('\n');
}

export function stringifyLiteralExpressionArray(
  expressions: (LitTagLiteral | LitHtmlExpression)[]
) {
  let output = '';

  for (const expression of expressions) {
    if (expression.type === 'LitTagLiteral') {
      output += expression.value;
    } else {
      output += '${...}';
    }
  }

  return output.replaceAll('\n', '\\n');
}

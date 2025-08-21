import type {
  NullLiteral,
  BigIntLiteral,
  RegExpLiteral,
  StringLiteral,
  BooleanLiteral,
  NumericLiteral,
} from 'oxc-parser';

export function printLiteral({
  lines,
  prefix,
  node,
}: {
  lines: string[];
  prefix: string;
  node:
    | NullLiteral
    | BigIntLiteral
    | RegExpLiteral
    | StringLiteral
    | BooleanLiteral
    | NumericLiteral;
}) {
  lines.push(`${prefix}Literal: ${node.raw} (loc: ${node.start}, ${node.end})`);
}

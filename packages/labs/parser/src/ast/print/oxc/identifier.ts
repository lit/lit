import type {IdentifierReference} from 'oxc-parser';

export function printIdentifier({
  lines,
  prefix,
  node,
}: {
  lines: string[];
  prefix: string;
  node: IdentifierReference;
  level: number;
}) {
  lines.push(
    `${prefix}Identifier: ${node.name} (loc: ${node.start}, ${node.end})`
  );
}

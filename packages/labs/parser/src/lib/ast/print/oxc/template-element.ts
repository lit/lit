import type {TemplateElement} from 'oxc-parser';

export function printTemplateElement({
  node,
  lines,
  prefix,
}: {
  node: TemplateElement;
  lines: string[];
  prefix: string;
  level: number;
}) {
  lines.push(
    `${prefix}  "${node.value.raw.replaceAll('\n', '\\n')}", (loc: ${node.start}, ${node.end})`
  );
}

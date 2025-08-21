import {coerceLiteralExpressionString} from '../../html-parser/helpers.js';
import {Element} from '../../html-parser/parse5-shim.js';
import {printAttribute} from './attribute.js';
import {prettyPrintNode} from './node.js';

/**
 * Pretty prints an element
 */

export function prettyPrintElement({
  node,
  prefix,
  level,
}: {
  node: Element;
  prefix: string;
  level: number;
}): string {
  const lines: string[] = [];
  lines.push(
    `${prefix}ELEMENT (loc: ${node.sourceCodeLocation?.startOffset}, ${node.sourceCodeLocation?.endOffset})`
  );

  let tagName = '';
  const locs: string[] = [];

  for (const tag of node.tagName) {
    if (tag.type === 'LitTagLiteral') {
      tagName += tag.value;
    } else {
      tagName += '${...}';
    }
    locs.push(
      `(${tag.sourceCodeLocation?.startOffset}, ${tag.sourceCodeLocation?.endOffset})`
    );
  }
  lines.push(`${prefix}  tagName: ${tagName} ${locs.join(' ')}`);

  if (node.sourceCodeLocation?.startTag) {
    lines.push(
      `${prefix}  startTag: (loc: ${node.sourceCodeLocation?.startTag?.startOffset}, ${node.sourceCodeLocation?.startTag?.endOffset})`
    );

    if (node.sourceCodeLocation?.startTag?.attrs) {
      lines.push(`${prefix}  attrs: {`);
      for (const [name, loc] of Object.entries(
        node.sourceCodeLocation?.startTag?.attrs
      )) {
        lines.push(
          `${prefix}    ${name}: (${loc.startOffset}, ${loc.endOffset})`
        );
      }
      lines.push(`${prefix}  }`);
    }
  }

  if (node.sourceCodeLocation?.endTag) {
    lines.push(
      `${prefix}  endTag: ${node.sourceCodeLocation?.endTag?.startOffset}, ${node.sourceCodeLocation?.endTag?.endOffset}`
    );
  }

  // Add attributes
  if (node.attrs && node.attrs.length > 0) {
    lines.push(`${prefix}  attrs: [`);

    for (const attr of node.attrs) {
      if (attr.type === 'LitHtmlExpression') {
        lines.push(
          printAttribute({
            node: attr,
            location: attr.sourceCodeLocation,
            level: level + 2,
            prefix: prefix + '    ',
          })
        );
        continue;
      }
      lines.push(
        printAttribute({
          node: attr,
          location: (node.sourceCodeLocation?.attrs ?? {})[
            coerceLiteralExpressionString(...attr.name)
          ],
          level: level + 2,
          prefix: prefix + '    ',
        })
      );
    }
    lines.push(`${prefix}  ],`);
  }

  if (node.childNodes && node.childNodes.length > 0) {
    lines.push(`${prefix}  childNodes: (${node.childNodes.length}) [`);
    // Add child nodes
    for (const child of node.childNodes) {
      lines.push(prettyPrintNode(child, level + 2));
    }
    lines.push(`${prefix}  ],`);
  }
  return lines.join('\n');
}

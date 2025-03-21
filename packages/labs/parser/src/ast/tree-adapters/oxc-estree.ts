import {
  TaggedTemplateExpression,
  TreeAdapter,
  With,
  LitTaggedTemplateExpression,
  TemplateLiteral,
  LitLinkedExpression,
} from '../tree-adapter.js';
import type {
  ParseResult,
  TemplateLiteral as OxcTemplateLiteral,
  TaggedTemplateExpression as OxcTaggedTemplateExpression,
  Program,
  Comment as OxcComment,
  Expression as OxcExpression,
} from 'oxc-parser';

export class ESTreeTreeAdapter
  implements TreeAdapter<OxcTaggedTemplateExpression>
{
  private program: Program;
  private comments: OxcComment[];
  private templates: TaggedTemplateExpression<OxcTaggedTemplateExpression>[] =
    [];

  constructor({program, comments}: ParseResult) {
    this.program = program;
    this.comments = comments;
    this.templates = [];
    // Start traversal with each top-level node
    for (const node of this.program.body) {
      visit(node, this.templates);
    }
  }

  findTaggedTemplateLiterals() {
    return this.templates;
  }

  findComments() {
    return this.comments;
  }
}

function isTaggedTemplate(node: unknown): node is OxcTaggedTemplateExpression {
  return (
    !!node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'TaggedTemplateExpression'
  );
}

function extractTagName({tag}: OxcTaggedTemplateExpression): string {
  if (tag.type === 'Identifier') {
    return tag.name;
  }

  return '';
}

export function normalizeTaggedTemplateLiteral(
  node: OxcTaggedTemplateExpression
): TaggedTemplateExpression<OxcTaggedTemplateExpression> {
  const native = node as With<
    OxcTaggedTemplateExpression,
    LitTaggedTemplateExpression
  >;

  return {
    start: node.start,
    end: node.end,
    tagName: extractTagName(node),
    native,
    template: normalizeTemplateLiteral(node.quasi),
  };
}

function normalizeTemplateLiteral(
  templateLiteral: OxcTemplateLiteral
): TemplateLiteral {
  return {
    start: templateLiteral.start,
    end: templateLiteral.end,
    spans: templateLiteral.quasis,
    expressions: normalizeExpressions(templateLiteral.expressions),
  };
}

function normalizeExpressions(
  expressions: OxcExpression[]
): With<OxcExpression, LitLinkedExpression>[] {
  return expressions as With<OxcExpression, LitLinkedExpression>[];
}

function visit(node: unknown, templates: TaggedTemplateExpression[]): void {
  if (!node || typeof node !== 'object') {
    return;
  }

  // Check if this is a tagged template expression
  if (isTaggedTemplate(node)) {
    templates.push(normalizeTaggedTemplateLiteral(node));
  }

  // Recursively visit all properties that could contain nodes
  for (const [key, value] of Object.entries(node)) {
    // For performance, skip known values that can't contain nodes
    if (
      key === 'type' ||
      key === 'loc' ||
      key === 'range' ||
      key === 'start' ||
      key === 'end'
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      // Handle arrays of nodes
      for (const item of value) {
        visit(item, templates);
      }

      continue;
    }

    if (value && typeof value === 'object') {
      // Handle single node
      visit(value, templates);
    }
  }
}

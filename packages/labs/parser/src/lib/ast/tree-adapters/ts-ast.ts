import {
  TaggedTemplateExpression,
  TreeAdapter,
  Comment,
  With,
  LitTaggedTemplateExpression,
  TemplateLiteral,
  LitLinkedExpression,
  TemplateExpression,
} from '../tree-adapter.js';
import {
  forEachLeadingCommentRange,
  SourceFile,
  TemplateLiteral as TsTemplateLiteral,
  TaggedTemplateExpression as TsTaggedTemplateExpression,
  Expression as TsExpression,
  SyntaxKind,
  Node,
  forEachChild,
} from 'typescript';

export class TsTreeAdapter implements TreeAdapter<TsTaggedTemplateExpression> {
  private sourceFile: SourceFile;
  private taggedTemplateLiterals: TaggedTemplateExpression<TsTaggedTemplateExpression>[] =
    [];
  private comments: Comment[] = [];

  constructor(source: SourceFile) {
    this.sourceFile = source;
    const sourceText = source.getFullText();
    // Start traversal with each top-level node
    forEachChild(this.sourceFile, (node: Node) => {
      visit(node, this.taggedTemplateLiterals);
    });

    forEachLeadingCommentRange(sourceText, 0, (pos, end) => {
      this.comments.push({
        start: pos,
        end,
        value: sourceText.slice(pos, end),
      });
    });
  }

  findTaggedTemplateLiterals() {
    return this.taggedTemplateLiterals;
  }

  findComments() {
    return this.comments;
  }
}

function isTaggedTemplate(node: Node): node is TsTaggedTemplateExpression {
  return node.kind === SyntaxKind.TaggedTemplateExpression;
}

function extractTagName({tag}: TsTaggedTemplateExpression): string {
  if (tag.kind === SyntaxKind.Identifier) {
    return tag.getText();
  }

  return '';
}

function normalizeTaggedTemplateExpression(
  node: TsTaggedTemplateExpression
): TaggedTemplateExpression<TsTaggedTemplateExpression> {
  const native = node as With<
    TsTaggedTemplateExpression,
    LitTaggedTemplateExpression
  >;

  return {
    start: node.getStart(),
    end: node.end,
    tagName: extractTagName(node),
    native,
    template: normalizeTemplateLiteral(node.template),
  };
}

function normalizeTemplateLiteral(
  template: TsTemplateLiteral
): TemplateLiteral {
  const {spans, expressions} = normalizeTemplateSpans(template);

  return {
    start: template.getStart(),
    end: template.end,
    spans: spans,
    expressions: expressions,
  };
}

function normalizeTemplateSpans(template: TsTemplateLiteral): {
  spans: TemplateExpression[];
  expressions: With<TsExpression, LitLinkedExpression>[];
} {
  if (template.kind === SyntaxKind.NoSubstitutionTemplateLiteral) {
    return {
      spans: [
        {
          start: template.getStart() + 1,
          end: template.end - 1,
          value: {
            raw: template.getText().substring(1, template.getText().length - 1),
          },
        },
      ],
      expressions: [],
    };
  }

  const expressions: With<TsExpression, LitLinkedExpression>[] = [];
  const spans: TemplateExpression[] = [];

  spans.push({
    // ignore the opening backtick like estree
    start: template.head.getStart() + 1,
    // ignore the ${ expression start like estree
    end: template.head.end - 2,
    value: {
      raw: template.head.text,
    },
  });

  template.templateSpans.forEach((span) => {
    expressions.push(normalizeExpression(span.expression));

    const normalizedSpan = {
      // ignore the closing expression } like estree
      start: span.getStart() + 1,
      end:
        span.literal.kind === SyntaxKind.TemplateTail
          ? // ignore the closing backtick like estree
            span.literal.end - 1
          : // ignore the ${ expression start like estree
            span.literal.end - 2,
      value: {
        raw: span.literal.text,
      },
    };

    spans.push(normalizedSpan);
  });

  return {spans, expressions};
}

function normalizeExpression(
  expression: TsExpression
): With<TsExpression, LitLinkedExpression> {
  return expression as With<TsExpression, LitLinkedExpression>;
}

function visit(
  node: Node,
  templates: TaggedTemplateExpression<TsTaggedTemplateExpression>[]
): void {
  // Check if this is a tagged template expression
  if (isTaggedTemplate(node)) {
    templates.push(normalizeTaggedTemplateExpression(node));
  }
  // Recursively visit each child node.
  forEachChild(node, (child: Node) => {
    visit(child, templates);
  });
}

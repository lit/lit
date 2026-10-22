import ts from 'typescript';
import {Strategy, TemplatePart} from './models.js';

export interface TypescriptStrategy extends Strategy<ts.Node> {
  walkChildNodes(node: ts.Node, visit: (node: ts.Node) => void): void;
  getHeadTemplatePart(node: ts.TemplateLiteral | ts.TemplateHead): TemplatePart;
  getMiddleTailTemplatePart(
    node: ts.TemplateMiddle | ts.TemplateTail
  ): TemplatePart;
}

let currentRoot: ts.SourceFile | undefined;
export default <TypescriptStrategy>{
  getRootNode(source: string, fileName = ''): ts.SourceFile {
    return ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext);
  },
  walkNodes(root: ts.SourceFile, visit: (node: ts.Node) => void) {
    currentRoot = root;
    this.walkChildNodes(root, visit);
    currentRoot = undefined;
  },
  walkChildNodes(node: ts.Node, visit: (node: ts.Node) => void) {
    visit(node);
    ts.forEachChild(node, (child) => {
      this.walkChildNodes(child, visit);
    });
  },
  isTaggedTemplate: ts.isTaggedTemplateExpression,
  getTagText(node: ts.TaggedTemplateExpression): string {
    return node.tag.getText(currentRoot);
  },
  getTaggedTemplateTemplate(
    node: ts.TaggedTemplateExpression
  ): ts.TemplateLiteral {
    return node.template;
  },
  isTemplate: ts.isTemplateLiteral,
  getTemplateParts(node: ts.TemplateLiteral): TemplatePart[] {
    if (ts.isNoSubstitutionTemplateLiteral(node)) {
      // "`string`"
      return [this.getHeadTemplatePart(node)];
    } else {
      return [
        // "`head${" "}middle${" "}tail`"
        this.getHeadTemplatePart(node.head),
        ...node.templateSpans.map((templateSpan) =>
          this.getMiddleTailTemplatePart(templateSpan.literal)
        ),
      ];
    }
  },
  getHeadTemplatePart(node: ts.TemplateLiteral | ts.TemplateHead) {
    const fullText = node.getFullText(currentRoot);
    // ignore prefix spaces and comments
    const startOffset = fullText.indexOf('`') + 1;
    const endOffset = ts.isTemplateHead(node) ? -2 : -1;
    return {
      text: fullText.slice(startOffset, fullText.length + endOffset),
      start: node.pos + startOffset,
      end: node.end + endOffset,
    };
  },
  getMiddleTailTemplatePart(node: ts.TemplateMiddle | ts.TemplateTail) {
    // Use text, not fullText, to avoid prefix comments, which are part of the
    // expression.
    const text = node.getText(currentRoot);
    const endOffset = ts.isTemplateMiddle(node) ? 2 : 1;
    return {
      text: text.slice(1, text.length - endOffset),
      // Use getStart() and not node.pos, which may include prefix comments,
      // which are part of the expression
      start: node.getStart(currentRoot) + 1,
      end: node.end - endOffset,
    };
  },
};

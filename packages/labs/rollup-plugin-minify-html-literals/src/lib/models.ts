export interface Template {
  tag?: string;
  parts: TemplatePart[];
}

export interface TemplatePart {
  text: string;
  start: number;
  end: number;
}

export interface Strategy<N = unknown> {
  getRootNode(source: string, fileName?: string): N;
  walkNodes(parent: N, visit: (child: N) => void): void;
  isTaggedTemplate(node: N): boolean;
  getTagText(node: N): string;
  getTaggedTemplateTemplate(node: N): N;
  isTemplate(node: N): boolean;
  getTemplateParts(node: N): TemplatePart[];
}

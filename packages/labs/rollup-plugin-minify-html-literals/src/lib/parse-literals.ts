import {Template, Strategy} from './models.js';
import typescript from './typescript.js';

export interface ParseLiteralsOptions {
  fileName?: string;
  strategy?: Partial<Strategy<unknown>>;
}

export function parseLiterals(
  source: string,
  options: ParseLiteralsOptions = {}
): Template[] {
  const strategy = {
    ...(<Strategy<unknown>>typescript),
    ...(options.strategy || {}),
  };

  const literals: Template[] = [];
  const visitedTemplates: unknown[] = [];
  strategy.walkNodes(strategy.getRootNode(source, options.fileName), (node) => {
    if (strategy.isTaggedTemplate(node)) {
      const template = strategy.getTaggedTemplateTemplate(node);
      visitedTemplates.push(template);
      literals.push({
        tag: strategy.getTagText(node),
        parts: strategy.getTemplateParts(template),
      });
    } else if (strategy.isTemplate(node) && !visitedTemplates.includes(node)) {
      literals.push({
        parts: strategy.getTemplateParts(node),
      });
    }
  });

  return literals;
}

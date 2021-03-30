/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import * as parse5 from 'parse5';
import {ProgramMessage, Placeholder, Message} from './messages.js';
import {createDiagnostic} from './typescript.js';
import {generateMsgId, HASH_DELIMITER} from './id-generation.js';

type ResultOrError<R, E> =
  | {result: R; error?: undefined}
  | {result?: undefined; error: E};

/**
 * Extract translation messages from all files in a TypeScript program.
 */
export function extractMessagesFromProgram(
  program: ts.Program
): {messages: ProgramMessage[]; errors: ts.Diagnostic[]} {
  const messages: ProgramMessage[] = [];
  const errors: ts.Diagnostic[] = [];
  for (const sourcefile of program.getSourceFiles()) {
    extractMessagesFromNode(
      sourcefile,
      program,
      sourcefile,
      messages,
      errors,
      []
    );
  }
  const deduped = dedupeMessages(messages);
  return {
    messages: deduped.messages,
    errors: [...errors, ...deduped.errors],
  };
}

/**
 * Traverse through a TypeScript node and collect all translation messages.
 *
 * TODO(aomarks) There is a fair bit of overlap between this and
 * outputters/transform.ts. Consider sharing more code, or unifying somehow
 * (e.g. a common analyzing traverser with hooks?).
 */
function extractMessagesFromNode(
  file: ts.SourceFile,
  program: ts.Program,
  node: ts.Node,
  messages: ProgramMessage[],
  errors: ts.Diagnostic[],
  descStack: MsgDesc[]
): void {
  const newDescs = extractMsgDescs(node, file.getFullText());
  if (newDescs.length > 0) {
    // Note we just make a copy of the stack each time we get a new description.
    // This is a little simpler than modifying it in-place given that we have to
    // de-duplicate. This could be a spot to optimize if we start handling
    // humongous applications.
    descStack = dedupeMsgDescs([...descStack, ...newDescs]);
  }

  const extractResult = extractMsg(file, program, node, descStack);
  if (extractResult.error) {
    errors.push(extractResult.error);
  } else if (extractResult.result !== undefined) {
    messages.push(extractResult.result);
  }

  ts.forEachChild(node, (node) => {
    extractMessagesFromNode(file, program, node, messages, errors, descStack);
  });
}

/**
 * Look for a call like msg('foo', 'bar') or msg('foo', html`<b>bar</b>`) and
 * extract a translation message if we find one.
 */
function extractMsg(
  file: ts.SourceFile,
  program: ts.Program,
  node: ts.Node,
  descStack: MsgDesc[]
): ResultOrError<ProgramMessage | undefined, ts.Diagnostic> {
  if (!isMsgCall(node, program.getTypeChecker())) {
    // We're not interested.
    return {result: undefined};
  }
  if (node.arguments.length < 1 || node.arguments.length > 2) {
    return {
      error: createDiagnostic(
        file,
        node,
        `Expected 1 or 2 arguments to msg(), got ${node.arguments.length}`
      ),
    };
  }
  const [templateArg, optionsArg] = node.arguments;

  const templateResult = extractTemplate(
    templateArg,
    file,
    program.getTypeChecker()
  );
  if (templateResult.error) {
    return {error: templateResult.error};
  }
  const {contents, template, isLitTemplate} = templateResult.result;

  const optionsResult = extractOptions(optionsArg, file);
  if (optionsResult.error) {
    return {error: optionsResult.error};
  }
  const options = optionsResult.result;
  const name = options.id ?? generateMsgIdFromAstNode(template, isLitTemplate);

  return {
    result: {
      name,
      file,
      node,
      contents,
      isLitTemplate,
      descStack: descStack.map((desc) => desc.text),
    },
  };
}

/**
 * Analyze the options argument to a msg call.
 */
export function extractOptions(
  node: ts.Node | undefined,
  file: ts.SourceFile
): ResultOrError<
  {id?: string; args?: ts.NodeArray<ts.Expression>},
  ts.Diagnostic
> {
  if (node === undefined) {
    return {result: {}};
  }
  if (!ts.isObjectLiteralExpression(node)) {
    return {
      error: createDiagnostic(
        file,
        node,
        `Expected second argument to msg() to be an object literal`
      ),
    };
  }

  let id: string | undefined = undefined;
  let args: ts.NodeArray<ts.Expression> | undefined = undefined;

  for (const property of node.properties) {
    // {
    //   a: 0,     // PropertyAssignment > Identifier
    //   'b': 0,   // PropertyAssignment > StringLiteral
    //   ['c']: 0, // PropertyAssignment > ComputedPropertyName
    //   d,        // ShorthandPropertyAssignment
    //   ...e,     // SpreadAssignment
    // }

    if (!ts.isPropertyAssignment(property)) {
      return {
        error: createDiagnostic(
          file,
          property,
          `Options object must use identifier or string literal property ` +
            `assignments. Shorthand and spread assignments are not supported.`
        ),
      };
    }

    let name;
    if (ts.isIdentifier(property.name)) {
      name = property.name.escapedText;
    } else if (ts.isStringLiteral(property.name)) {
      name = property.name.text;
    } else {
      return {
        error: createDiagnostic(
          file,
          property.name,
          `Options object must use identifier or string literal property ` +
            `assignments. Computed assignments are not supported.`
        ),
      };
    }

    if (name === 'id') {
      if (
        (!ts.isStringLiteral(property.initializer) &&
          !ts.isNoSubstitutionTemplateLiteral(property.initializer)) ||
        property.initializer.text.trim() === ''
      ) {
        return {
          error: createDiagnostic(
            file,
            property.initializer,
            `Options id property must be a non-empty string literal`
          ),
        };
      }
      id = property.initializer.text;
    } else if (name === 'args') {
      if (!ts.isArrayLiteralExpression(property.initializer)) {
        return {
          error: createDiagnostic(
            file,
            property.initializer,
            `Options args property must be an array literal`
          ),
        };
      }
      args = property.initializer.elements;
    } else {
      return {
        error: createDiagnostic(
          file,
          property,
          `Options object property must be "id" or "args"`
        ),
      };
    }
  }

  return {result: {id, args}};
}

interface ExtractedTemplate {
  contents: Array<string | Placeholder>;
  params?: string[];
  isLitTemplate: boolean;
  template: ts.TemplateLiteral | ts.StringLiteral;
}

/**
 * Analyze the template argument to a msg call.
 */
export function extractTemplate(
  templateArg: ts.Node,
  file: ts.SourceFile,
  typeChecker: ts.TypeChecker
): ResultOrError<ExtractedTemplate, ts.DiagnosticWithLocation> {
  if (isStaticString(templateArg)) {
    // E.g. 'Hello World', `Hello World`
    return {
      result: {
        template: templateArg,
        contents: [templateArg.text],
        isLitTemplate: false,
      },
    };
  }

  if (isLitTemplate(templateArg)) {
    // E.g. html`Hello <b>${name}</b>`
    return paramTemplate(templateArg, file);
  }

  if (isStrTaggedTemplate(templateArg, typeChecker)) {
    // E.g. str`Hello ${who}`
    return paramTemplate(templateArg, file);
  }

  if (
    ts.isTemplateExpression(templateArg) ||
    ts.isTaggedTemplateExpression(templateArg)
  ) {
    // E.g. `Hello ${who}`, wrongTag`Hello ${who}`
    return {
      error: createDiagnostic(
        file,
        templateArg,
        `String literal with expressions must use the str tag`
      ),
    };
  }

  return {
    error: createDiagnostic(
      file,
      templateArg,
      `Expected first argument to msg() to be a string or lit-html ` +
        `template.`
    ),
  };
}

export function generateMsgIdFromAstNode(
  template: ts.TemplateLiteral | ts.StringLiteral,
  isHtmlTagged: boolean
): string {
  const strings = [];
  if (
    ts.isStringLiteral(template) ||
    ts.isNoSubstitutionTemplateLiteral(template)
  ) {
    strings.push(template.text);
  } else {
    // TemplateExpression
    strings.push(template.head.text);
    for (const span of template.templateSpans) {
      strings.push(span.literal.text);
    }
  }
  for (const s of strings) {
    if (s.includes(HASH_DELIMITER)) {
      // TODO(aomarks) Surface diagnostic
      throw new Error('String cannot contain hash delimiter');
    }
  }
  return generateMsgId(strings, isHtmlTagged);
}

/**
 * Extract a message from calls like:
 *   str`Hello ${name}`
 *   html`Hello <b>${name}</b>`
 */
function paramTemplate(
  arg: ts.TaggedTemplateExpression | ts.TemplateExpression,
  file: ts.SourceFile
): ResultOrError<ExtractedTemplate, ts.DiagnosticWithLocation> {
  const parts: Array<string | {identifier: string}> = [];
  const template = ts.isTaggedTemplateExpression(arg) ? arg.template : arg;
  let spans;
  if (ts.isNoSubstitutionTemplateLiteral(template)) {
    spans = [];
    parts.push(template.text);
  } else {
    spans = template.templateSpans;
    parts.push(template.head.text);
  }
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    noEmitHelpers: true,
  });
  for (const span of spans) {
    parts.push({
      identifier: printer.printNode(
        ts.EmitHint.Unspecified,
        span.expression,
        file
      ),
    });
    parts.push(span.literal.text);
  }
  const isLit = isLitTemplate(arg);
  const contents = isLit
    ? replaceExpressionsAndHtmlWithPlaceholders(parts)
    : parts.map((part) =>
        typeof part === 'string'
          ? part
          : {untranslatable: '${' + part.identifier + '}'}
      );
  const combined = combineAdjacentPlaceholders(contents);
  return {
    result: {
      template,
      contents: combined,
      isLitTemplate: isLit,
    },
  };
}

interface Expression {
  identifier: string;
}

/**
 * These substitutions are used to delineate template string literal expressions
 * embedded within HTML during HTML parsing in a way that is:
 *
 * [1] Valid anywhere a lit-html expression binding can go without changing the
 *     structure of the HTML.
 * [2] Unambiguous, so that existing code wouldn't accidentally look like this.
 * [3] Not authorable in source code even intentionally (hence the random number).
 */
const EXPRESSION_RAND = String(Math.random()).slice(2);
const EXPRESSION_START = `_START_LIT_LOCALIZE_EXPR_${EXPRESSION_RAND}_`;
const EXPRESSION_END = `_END_LIT_LOCALIZE_EXPR_${EXPRESSION_RAND}_`;

/**
 * Our template is split apart based on template string literal expressions.
 * But to parse HTML, we need one valid HTML string. Concatenate the template
 * using unique markers to encode template string expressions so that they can
 * pass as valid HTML and be restored after parsing.
 *
 * Here's an example of what's going on:
 *
 * Source:
 *   html`Hi ${name}, click <a href="${url}">me</a>!`
 *
 * After TypeScript parsing (x for expression):
 *   ['Hi', {x: name}, ', click <a href="', {x: url}, '">me</a>!']
 *
 * Concatenated HTML (note X and XEND are more unique in reality):
 *   'Hi X_name_XEND, click <a href="X_url_XEND">me</a>!'
 *
 * After HTML parsed and markup converted to placeholders (ph):
 *   ['Hi X_name_XEND, click ', {ph: '<a href="X_url_XEND">'}, 'me', {ph: '</a>'}, '!']
 *
 * After expressions restored and additional placeholders added:
 *   ['Hi ', {ph: '${name}'}, ', click', {ph: '<a href="${url}">'}, 'me', {ph: '</a>'}, '!']
 */
function replaceExpressionsAndHtmlWithPlaceholders(
  parts: Array<string | Expression>
): Array<string | Placeholder> {
  const concatenatedHtml = parts
    .map((part) =>
      typeof part === 'string'
        ? part
        : EXPRESSION_START + part.identifier + EXPRESSION_END
    )
    .join('');
  const contents: Array<string | Placeholder> = [];
  for (const part of replaceHtmlWithPlaceholders(concatenatedHtml)) {
    if (typeof part === 'string') {
      const startSplit = part.split(EXPRESSION_START);
      for (const substr of startSplit) {
        const endSplit = substr.split(EXPRESSION_END);
        if (endSplit.length === 1) {
          if (substr) {
            contents.push(substr);
          }
        } else {
          const [identifier, tail] = endSplit;
          contents.push({untranslatable: '${' + identifier + '}'});
          if (tail) {
            contents.push(tail);
          }
        }
      }
    } else {
      // An HTML markup placeholder. If there are expressions within this
      // markup, it's fine and good to just keep this one placeholder. We just
      // need to fix the syntax.
      contents.push({
        untranslatable: part.untranslatable
          .replace(EXPRESSION_START, '${')
          .replace(EXPRESSION_END, '}'),
      });
    }
  }
  return contents;
}

/**
 * Collapse all sequences of adjacent placeholders, to simplify message
 * structure.
 *
 * This situation arises because we initially generate unique placeholders for
 * each HTML open/close tag, and for each each template string literal
 * expression, and it's simpler to collapse all of these at once afterwards.
 *
 * For example, if given:
 *
 *   [ {ph: '<b>'}, {ph: '${foo}'}, {ph: '</b>'} ]
 *
 * Then return:
 *
 *   [ {ph: '<b>${foo}</b>'} ]
 */
function combineAdjacentPlaceholders(
  original: Array<string | Placeholder>
): Array<string | Placeholder> {
  const combined = [];
  const phBuffer = [];
  for (let i = 0; i < original.length; i++) {
    const item = original[i];
    if (typeof item !== 'string') {
      // A placeholder.
      phBuffer.push(item.untranslatable);
    } else if (phBuffer.length > 0 && item.trim() === '') {
      // Whitespace can also be combined with its preceding placeholder.
      phBuffer.push(item);
    } else {
      if (phBuffer.length > 0) {
        // Flush the placeholder buffer.
        combined.push({untranslatable: phBuffer.splice(0).join('')});
      }
      // Some translatable text.
      combined.push(item);
    }
  }
  if (phBuffer.length > 0) {
    // The final item was a placeholder, don't forget it.
    combined.push({untranslatable: phBuffer.join('')});
  }
  return combined;
}

/**
 * A message description extracted from a TypeScript comment in a particular
 * file.
 */
interface MsgDesc {
  /** Where the comment begins in the source text. */
  pos: number;
  /** Where the comment ends in the source text. */
  end: number;
  /** The extracted description (the part after `// msgdesc: `) */
  text: string;
}

/**
 * Look for "// msgdesc: foo" comments attached to the given node.
 */
function extractMsgDescs(node: ts.Node, fileText: string): MsgDesc[] {
  const ranges = ts.getLeadingCommentRanges(fileText, node.getFullStart());
  const descs: MsgDesc[] = [];
  if (ranges !== undefined) {
    for (const range of ranges) {
      const comment = fileText.slice(range.pos, range.end);
      const match = comment.match(/.*msgdesc:\s*(.+)/);
      if (match !== null) {
        descs.push({pos: range.pos, end: range.end, text: match[1].trim()});
      }
    }
  }
  return descs;
}

/**
 * The way TypeScript treats comments in the AST means that it's possible for
 * us to extract the exact same exact comment range multiple times when
 * traversing certain AST structures (e.g. both for an "expression" node and
 * some child node it has). De-duplicate these based on their source text
 * positions.
 */
function dedupeMsgDescs(descs: MsgDesc[]): MsgDesc[] {
  // Since Maps preserve order, we can just pick a key that will be the same for
  // duplicate comment ranges, populate the map, and then iterate through the
  // values.
  const map = new Map<string, MsgDesc>();
  for (const desc of descs) {
    const key = `${desc.pos}:${desc.end}`;
    if (map.has(key)) {
      continue;
    }
    map.set(key, desc);
  }
  return [...map.values()];
}

function replaceHtmlWithPlaceholders(
  html: string
): Array<string | Placeholder> {
  const components: Array<string | Placeholder> = [];

  const traverse = (node: parse5.DefaultTreeNode): void => {
    if (node.nodeName === '#text') {
      const text = (node as parse5.DefaultTreeTextNode).value;
      components.push(text);
    } else if (node.nodeName === '#comment') {
      components.push({
        untranslatable: serializeComment(node as parse5.DefaultTreeCommentNode),
      });
    } else {
      const {open, close} = serializeOpenCloseTags(node);
      components.push({untranslatable: open});
      if ('childNodes' in node) {
        for (const child of (node as parse5.DefaultTreeParentNode).childNodes) {
          traverse(child);
        }
      }
      components.push({untranslatable: close});
    }
  };

  const frag = parse5.parseFragment(html) as parse5.DefaultTreeDocumentFragment;
  for (const child of (frag as parse5.DefaultTreeParentNode).childNodes) {
    traverse(child);
  }
  return components;
}

/**
 * Serialize just the open and close tags for a node, ignoring its children. If
 * it is a self-closing tag, close will be an empty string.
 *
 * Example:
 *
 *   <b class="red">foo</b> --> {open: '<b class="red">, close: '</b>'}
 */
function serializeOpenCloseTags(
  node: parse5.Node
): {open: string; close: string} {
  const withoutChildren = {...node, childNodes: []};
  const fakeParent = {childNodes: [withoutChildren]};
  const serialized = parse5.serialize(fakeParent);
  const lastLt = serialized.lastIndexOf('<');
  const open = serialized.slice(0, lastLt);
  const close = serialized.slice(lastLt);
  return {open, close};
}

/**
 * Serialize an HTML comment node.
 *
 * Example:
 *
 *   {data: "foo"} --> "<!-- foo -->"
 */
function serializeComment(comment: parse5.DefaultTreeCommentNode): string {
  return parse5.serialize({childNodes: [comment]});
}

/**
 * E.g. "foo", 'foo', or `foo`, but not `foo${bar}`.
 */
export function isStaticString(
  node: ts.Node
): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

/**
 * E.g. html`foo` or html`foo${bar}`
 */
export function isLitTemplate(
  node: ts.Node
): node is ts.TaggedTemplateExpression {
  return (
    ts.isTaggedTemplateExpression(node) &&
    ts.isIdentifier(node.tag) &&
    node.tag.escapedText === 'html'
  );
}

/**
 * Return whether this is a call to the lit-localize `msg` function.
 */
export function isMsgCall(
  node: ts.Node,
  typeChecker: ts.TypeChecker
): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  let type;
  try {
    type = typeChecker.getTypeAtLocation(node.expression);
  } catch {
    return false;
  }
  const props = typeChecker.getPropertiesOfType(type);
  return props.some((prop) => prop.escapedName === '_LIT_LOCALIZE_MSG_');
}

/**
 * Return whether a node is a string tagged with our special `str` tag.
 */
export function isStrTaggedTemplate(
  node: ts.Node,
  typeChecker: ts.TypeChecker
): node is ts.TaggedTemplateExpression {
  if (!ts.isTaggedTemplateExpression(node)) {
    return false;
  }
  let tag;
  try {
    tag = typeChecker.getTypeAtLocation(node.tag);
  } catch {
    return false;
  }
  const props = typeChecker.getPropertiesOfType(tag);
  return props.some((prop) => prop.escapedName === '_LIT_LOCALIZE_STR_');
}

/**
 * Check for messages that have the same ID. For those with the same ID and the
 * same content, de-duplicate them. For those with the same ID and different
 * content, return an error.
 */
function dedupeMessages(
  messages: ProgramMessage[]
): {messages: ProgramMessage[]; errors: ts.Diagnostic[]} {
  const errors: ts.Diagnostic[] = [];
  const cache = new Map<string, ProgramMessage>();
  for (const message of messages) {
    const cached = cache.get(message.name);
    if (cached === undefined) {
      cache.set(message.name, message);
    } else if (!messageEqual(message, cached)) {
      errors.push(
        createDiagnostic(
          message.file,
          message.node,
          `Message ids must have the same default text wherever they are used`,
          [
            createDiagnostic(
              cached.file,
              cached.node,
              'This message id was already found here with different text.'
            ),
          ]
        )
      );
    }
  }
  return {messages: [...cache.values()], errors};
}

function messageEqual(a: Message, b: Message): boolean {
  if (a.contents.length !== b.contents.length) {
    return false;
  }
  for (let i = 0; i < a.contents.length; i++) {
    if (!contentEqual(a.contents[i], b.contents[i])) {
      return false;
    }
  }
  return true;
}

function contentEqual(
  a: string | Placeholder,
  b: string | Placeholder
): boolean {
  if (typeof a === 'string') {
    if (typeof b !== 'string') {
      return false;
    }
    return a === b;
  }
  if (typeof a === 'object') {
    if (typeof b !== 'object') {
      return false;
    }
    return a.untranslatable === b.untranslatable;
  }
  return true;
}

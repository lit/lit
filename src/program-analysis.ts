/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as ts from 'typescript';
import * as parse5 from 'parse5';
import {ProgramMessage, Placeholder, Message} from './messages';
import {createDiagnostic} from './typescript';

/**
 * Extract translation messages from all files in a TypeScript program.
 */
export function extractMessagesFromProgram(
  node: ts.Program
): {messages: ProgramMessage[]; errors: ts.Diagnostic[]} {
  const messages: ProgramMessage[] = [];
  const errors: ts.Diagnostic[] = [];
  for (const sourcefile of node.getSourceFiles()) {
    extractMessagesFromNode(sourcefile, sourcefile, messages, errors, []);
  }
  const deduped = dedupeMessages(messages);
  return {
    messages: deduped.messages,
    errors: [...errors, ...deduped.errors],
  };
}

/**
 * Traverse through a TypeScript node and collect all translation messages.
 */
function extractMessagesFromNode(
  file: ts.SourceFile,
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

  const msg = extractMsg(file, node, descStack);
  if (msg !== undefined) {
    if ('contents' in msg) {
      messages.push(msg);
    } else {
      errors.push(msg);
    }
  }

  ts.forEachChild(node, (node) => {
    extractMessagesFromNode(file, node, messages, errors, descStack);
  });
}

/**
 * Look for a call like msg('foo', 'bar') or msg('foo', html`<b>bar</b>`) and
 * extract a translation message if we find one.
 */
function extractMsg(
  file: ts.SourceFile,
  node: ts.Node,
  descStack: MsgDesc[]
): ProgramMessage | ts.Diagnostic | undefined {
  if (!isMsgCall(node)) {
    // We're not interested.
    return;
  }
  if (node.arguments.length < 2) {
    return createDiagnostic(
      file,
      node,
      `Expected at least 2 arguments to msg(), got ${node.arguments.length}`
    );
  }
  const [nameArg, contentsArg] = node.arguments;
  if (!isStaticString(nameArg) || !nameArg.text) {
    return createDiagnostic(
      file,
      nameArg,
      `Expected first argument to msg() to be a static and non-empty string`
    );
  }
  const name = nameArg.text;

  if (isStaticString(contentsArg)) {
    // E.g. msg('foo', 'bar')
    return {
      name,
      contents: [contentsArg.text],
      node,
      file,
      descStack: descStack.map((desc) => desc.text),
      isLitTemplate: false,
    };
  }

  if (isLitExpression(contentsArg)) {
    if (ts.isNoSubstitutionTemplateLiteral(contentsArg.template)) {
      // E.g. msg('foo', html`bar <b>baz</b>`)
      return {
        name,
        contents: combineAdjacentPlaceholders(
          replaceHtmlWithPlaceholders(contentsArg.template.text)
        ),
        node,
        file,
        descStack: descStack.map((desc) => desc.text),
        isLitTemplate: true,
      };
    }
    // E.g. msg('foo', html`bar ${baz}`)
    return createDiagnostic(
      file,
      contentsArg,
      `To use a variable, use an arrow function.`
    );
  }

  if (ts.isTemplateExpression(contentsArg)) {
    // E.g. msg('foo', `bar ${baz}`)
    return createDiagnostic(
      file,
      contentsArg,
      `To use a variable, pass an arrow function.`
    );
  }

  if (ts.isArrowFunction(contentsArg)) {
    // E.g. msg('foo', (name) => html`Hello ${name}`, name)
    return functionTemplate(contentsArg, name, file, node, descStack);
  }

  return createDiagnostic(
    file,
    contentsArg,
    `Expected second argument to msg() to be a string, a lit-html ` +
      `template, or an arrow function that returns one of those.`
  );
}

/**
 * Extract a message from calls like:
 *   msg('foo', (name) => `Hello ${name}`, name)
 *   msg('foo', (name) => html`Hello <b>${name}</b>`, name)
 */
function functionTemplate(
  fn: ts.ArrowFunction,
  name: string,
  file: ts.SourceFile,
  node: ts.Node,
  descStack: MsgDesc[]
): ProgramMessage | ts.Diagnostic | undefined {
  if (fn.parameters.length === 0) {
    return createDiagnostic(
      file,
      fn,
      `Expected template function to have at least one parameter. ` +
        `Use a regular string or lit-html template if there are no variables.`
    );
  }
  const params = [];
  for (const param of fn.parameters) {
    if (!ts.isIdentifier(param.name)) {
      return createDiagnostic(
        file,
        param,
        `Expected template function parameter to be an identifier`
      );
    }
    params.push(param.name.text);
  }
  const body = fn.body;
  if (
    !ts.isTemplateExpression(body) &&
    !ts.isNoSubstitutionTemplateLiteral(body) &&
    !isLitExpression(body)
  ) {
    return createDiagnostic(
      file,
      body,
      `Expected template function to return a template string literal ` +
        `or a lit-html template, without braces`
    );
  }
  const template = isLitExpression(body) ? body.template : body;
  const parts: Array<string | {identifier: string}> = [];
  if (ts.isTemplateExpression(template)) {
    const spans = template.templateSpans;
    parts.push(template.head.text);
    for (const span of spans) {
      if (
        !ts.isIdentifier(span.expression) ||
        !params.includes(span.expression.text)
      ) {
        return createDiagnostic(
          file,
          span.expression,
          `Placeholder must be one of the following identifiers: ` +
            params.join(', ')
        );
      }
      const identifier = span.expression.text;
      parts.push({identifier});
      parts.push(span.literal.text);
    }
  } else {
    // A NoSubstitutionTemplateLiteral. No spans.
    parts.push(template.text);
  }
  const isLitTemplate = isLitExpression(body);
  const contents = isLitTemplate
    ? replaceExpressionsAndHtmlWithPlaceholders(parts)
    : parts.map((part) =>
        typeof part === 'string'
          ? part
          : {untranslatable: '${' + part.identifier + '}'}
      );
  return {
    name,
    contents: combineAdjacentPlaceholders(contents),
    node,
    file,
    descStack: descStack.map((desc) => desc.text),
    params,
    isLitTemplate,
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
    const text =
      node.nodeName === '#text'
        ? (node as parse5.DefaultTreeTextNode).value
        : null;
    if (text !== null) {
      components.push(text);
    } else {
      const {open, close} = serializeOpenCloseTags(node);
      components.push({untranslatable: open});
      for (const child of (node as parse5.DefaultTreeParentNode).childNodes) {
        traverse(child);
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
export function isLitExpression(
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
export function isMsgCall(node: ts.Node): node is ts.CallExpression {
  // TODO(aomarks) This is too crude. We should do better to identify only our
  // `msg` function.
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.escapedText === 'msg'
  );
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

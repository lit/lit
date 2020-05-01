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
import {ProgramMessage, Placeholder, Message} from './interfaces';
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
  if (
    !ts.isCallExpression(node) ||
    !ts.isIdentifier(node.expression) ||
    node.expression.escapedText !== 'msg'
  ) {
    // We're not interested.
    return;
  }
  if (node.arguments.length !== 2) {
    return createDiagnostic(
      file,
      node,
      `Expected 2 arguments to msg() call, got ${node.arguments.length}`
    );
  }
  const [nameArg, contentsArg] = node.arguments;
  if (!isStaticString(nameArg)) {
    return createDiagnostic(
      file,
      nameArg,
      `Expected first argument to be a static string`
    );
  }
  const name = nameArg.text;
  if (!name) {
    return createDiagnostic(
      file,
      nameArg,
      `Expected first argument to be a non-empty string`
    );
  }

  if (isStaticString(contentsArg)) {
    // E.g. msg('foo', 'bar')
    return {
      name,
      contents: [contentsArg.text],
      node,
      file,
      descStack: descStack.map((desc) => desc.text),
    };
  }

  if (isLitExpression(contentsArg)) {
    if (ts.isNoSubstitutionTemplateLiteral(contentsArg.template)) {
      // E.g. msg('foo', html`bar <b>baz</b>`)
      return {
        name,
        contents: replaceHtmlWithPlaceholders(contentsArg.template.text),
        node,
        file,
        descStack: descStack.map((desc) => desc.text),
      };
    } else {
      // E.g. msg('foo', html`bar ${baz}`)
      //
      // TODO(aomarks) We have some options for supporting at least some
      // expressions in templates.
      //
      // (1) Take a function that returns a template and require during analysis
      // that expressions in that template only reference variables local to the
      // function. For example:
      //
      //   msg('greet', (user: string) => html`Hello ${user}!`, this.userName)
      //
      // Would generate the XLB:
      //
      //   <msg name="greet">Hello<ph>${user}</ph>!</msg>
      //
      // And would generate the TypeScript function with overload:
      //
      //   export function msg(name: 'greet', (user: string) => TemplateResult, string);
      //   export function msg(...args: any[]) {
      //     return templates[activeLocale][args[0]].apply(null, args.slice(2));
      //   };
      //
      //   const templates = {
      //     en: {
      //       foo: (user: string) => html`Hello ${user}!`,
      //     },
      //     es: {
      //       foo: (user: string) => html`Hola ${user}!`;,
      //     },
      //   };
      //
      // (2) If instead of generating a runtime template map we can transform
      // the source code as a build step, then we could also pass template
      // expressions all the way through translation and directly substitute
      // them at their original location, preserving variable scope.
      //
      // (3) Something quick and dirty with simple custom string replacements.
      return createDiagnostic(
        file,
        contentsArg,
        `lit-html expressions with substitutions are not currently supported`
      );
    }
  } else {
    return createDiagnostic(
      file,
      contentsArg,
      `javascript template literals with substitutions are not currently supported`
    );
  }
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

  let activePlaceholder: Placeholder | undefined = undefined;
  const accretePlaceholder = (str: string): void => {
    if (activePlaceholder === undefined) {
      activePlaceholder = {untranslatable: ''};
      components.push(activePlaceholder);
    }
    activePlaceholder.untranslatable += str;
  };

  const traverse = (node: parse5.DefaultTreeNode): void => {
    const text =
      node.nodeName === '#text'
        ? (node as parse5.DefaultTreeTextNode).value
        : null;
    if (text !== null && text.trim() !== '') {
      // Some translatable text.
      components.push(text);
      // If we were building a placeholder, we shouldn't be anymore.
      activePlaceholder = undefined;
    } else if (text !== null) {
      // If we were building a placeholder, and then we hit a text node that's
      // just whitespace, that doesn't indicate that we're back to some
      // translatable text. Just add it to the placeholder.
      if (activePlaceholder !== null) {
        accretePlaceholder(text);
      } else {
        components.push(text);
      }
    } else {
      // We're in some untranslatable HTML. Keep building up a placeholder until
      // we hit some translatable text again.
      const {open, close} = serializeOpenCloseTags(node);
      accretePlaceholder(open);
      for (const child of (node as parse5.DefaultTreeParentNode).childNodes) {
        traverse(child);
      }
      accretePlaceholder(close);
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
function isStaticString(
  node: ts.Node
): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

/**
 * E.g. html`foo` or html`foo${bar}`
 */
function isLitExpression(node: ts.Node): node is ts.TaggedTemplateExpression {
  return (
    ts.isTaggedTemplateExpression(node) &&
    ts.isIdentifier(node.tag) &&
    node.tag.escapedText === 'html'
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

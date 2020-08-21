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

import {Message} from '../messages';
import {Locale} from '../locales';
import {Config} from '../config';
import * as ts from 'typescript';
import {isLitTemplate, isMsgCall, isStaticString} from '../program-analysis';
import {KnownError} from '../error';
import {escapeStringToEmbedInTemplateLiteral} from '../typescript';
import * as pathLib from 'path';

/**
 * Configuration specific to the `transform` output mode.
 */
export interface TransformOutputConfig {
  mode: 'transform';
}

/**
 * Compile and emit the given TypeScript program using the lit-localize
 * transformer.
 */
export function transformOutput(
  translationsByLocale: Map<Locale, Message[]>,
  config: Config,
  program: ts.Program
) {
  // TODO(aomarks) It doesn't seem that it's possible for a TypeScript
  // transformer to emit a new file, so we just have to emit for each locale.
  // Need to do some more investigation into the best way to integrate this
  // transformation into a real project so that the user can still use --watch
  // and other tsc flags. It would also be nice to support the language server,
  // so that diagnostics will show up immediately in the editor.
  const opts = program.getCompilerOptions();
  const outRoot = opts.outDir || '.';
  for (const locale of [config.sourceLocale, ...config.targetLocales]) {
    let translations;
    if (locale !== config.sourceLocale) {
      translations = new Map<string, Message>();
      for (const message of translationsByLocale.get(locale) || []) {
        translations.set(message.name, message);
      }
    }
    opts.outDir = pathLib.join(outRoot, '/', locale);
    program.emit(undefined, undefined, undefined, undefined, {
      before: [litLocalizeTransform(translations, locale, program)],
    });
  }
}

/**
 * Return a TypeScript TransformerFactory for the lit-localize transformer.
 */
export function litLocalizeTransform(
  translations: Map<string, Message> | undefined,
  locale: string,
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const transformer = new Transformer(context, translations, locale, program);
    return (file) => ts.visitNode(file, transformer.boundVisitNode);
  };
}

/**
 * Implementation of the lit-localize TypeScript transformer.
 */
class Transformer {
  private context: ts.TransformationContext;
  private translations: Map<string, Message> | undefined;
  private locale: string;
  private typeChecker: ts.TypeChecker;
  boundVisitNode = this.visitNode.bind(this);

  constructor(
    context: ts.TransformationContext,
    translations: Map<string, Message> | undefined,
    locale: string,
    program: ts.Program
  ) {
    this.context = context;
    this.translations = translations;
    this.locale = locale;
    this.typeChecker = program.getTypeChecker();
  }

  /**
   * Top-level delegating visitor for all nodes.
   */
  visitNode(node: ts.Node): ts.VisitResult<ts.Node> {
    // msg('greeting', 'hello') -> 'hola'
    if (isMsgCall(node, this.typeChecker)) {
      return this.replaceMsgCall(node);
    }

    // html`<b>${msg('greeting', 'hello')}</b>` -> html`<b>hola</b>`
    if (isLitTemplate(node)) {
      // If an html-tagged template literal embeds a msg call, we want to
      // collapse the result of that msg call into the parent template.
      return tagLit(
        makeTemplateLiteral(
          this.recursivelyFlattenTemplate(node.template, true)
        )
      );
    }

    // import ... from 'lit-localize' -> (removed)
    if (ts.isImportDeclaration(node)) {
      const moduleSymbol = this.typeChecker.getSymbolAtLocation(
        node.moduleSpecifier
      );
      if (moduleSymbol && this.isLitLocalizeModule(moduleSymbol)) {
        return undefined;
      }
    }

    if (ts.isCallExpression(node)) {
      // configureTransformLocalization(...) -> {getLocale: () => "es-419"}
      if (
        this.typeHasProperty(
          node.expression,
          '_LIT_LOCALIZE_CONFIGURE_TRANSFORM_LOCALIZATION_'
        )
      ) {
        return ts.createObjectLiteral(
          [
            ts.createPropertyAssignment(
              ts.createIdentifier('getLocale'),
              ts.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                ts.createStringLiteral(this.locale)
              )
            ),
          ],
          false
        );
      }

      // configureLocalization(...) -> Error
      if (
        this.typeHasProperty(
          node.expression,
          '_LIT_LOCALIZE_CONFIGURE_LOCALIZATION_'
        )
      ) {
        // TODO(aomarks) This error is not surfaced earlier in the analysis phase
        // as a nicely formatted diagnostic, but it should be.
        throw new KnownError(
          'Cannot use configureLocalization in transform mode. ' +
            'Use configureTransformLocalization instead.'
        );
      }

      // Localized(LitElement) -> LitElement
      if (this.typeHasProperty(node.expression, '_LIT_LOCALIZE_LOCALIZED_')) {
        if (node.arguments.length !== 1) {
          // TODO(aomarks) Surface as diagnostic instead.
          throw new KnownError(
            `Expected Localized mixin call to have one argument, ` +
              `got ${node.arguments.length}`
          );
        }
        return node.arguments[0];
      }
    }

    // LOCALE_STATUS_EVENT -> "lit-localize-status"
    //
    // We want to replace this imported string constant with its static value so
    // that we can always safely remove the 'lit-localize' module import.
    //
    // TODO(aomarks) Maybe we should error here instead, since lit-localize
    // won't fire any of these events in transform mode? But I'm still thinking
    // about the use case of an app that can run in either runtime or transform
    // mode without code changes (e.g. runtime for dev, transform for
    // production)...
    //
    // We can't tag this string const with a special property like we do with
    // our exported functions, because doing so breaks lookups into
    // `WindowEventMap`. So we instead identify the symbol by name, and check
    // that it was declared in the lit-localize module.
    let eventSymbol = this.typeChecker.getSymbolAtLocation(node);
    if (eventSymbol && eventSymbol.name === 'LOCALE_STATUS_EVENT') {
      if (eventSymbol.flags & ts.SymbolFlags.Alias) {
        // Symbols will be aliased in the case of
        // `import {LOCALE_STATUS_EVENT} ...`
        // but not in the case of `import * as ...`.
        eventSymbol = this.typeChecker.getAliasedSymbol(eventSymbol);
      }
      for (const decl of eventSymbol.declarations) {
        let sourceFile: ts.Node = decl;
        while (!ts.isSourceFile(sourceFile)) {
          sourceFile = sourceFile.parent;
        }
        const sourceFileSymbol = this.typeChecker.getSymbolAtLocation(
          sourceFile
        );
        if (sourceFileSymbol && this.isLitLocalizeModule(sourceFileSymbol)) {
          return ts.createStringLiteral('lit-localize-status');
        }
      }
    }

    return ts.visitEachChild(node, this.boundVisitNode, this.context);
  }

  /**
   * Replace a lit-localize `msg` call with the string or template corresponding
   * to that message. If translations are present, use the translation.
   * Otherwise, use the source template directly from the second argument.
   */
  replaceMsgCall(
    call: ts.CallExpression
  ): ts.TemplateLiteral | ts.TaggedTemplateExpression | ts.StringLiteral {
    const [arg0, arg1] = call.arguments;

    if (arg0 === undefined || !isStaticString(arg0) || arg0.text === '') {
      // TODO(aomarks) Here and below, we should surface these as diagnostics.
      throw new KnownError('Expected arg0 to be a non-empty string');
    }
    const id = arg0.text;

    if (
      arg1 === undefined ||
      !(
        ts.isStringLiteral(arg1) ||
        ts.isTemplateLiteral(arg1) ||
        isLitTemplate(arg1) ||
        ts.isArrowFunction(arg1)
      )
    ) {
      throw new KnownError(
        'Expected arg1 to be a template, string, or function'
      );
    }

    let template: ts.TemplateLiteral | ts.StringLiteral;
    let isLitTagged = false;

    // If the second argument is a function, we need to extract the actual
    // template from the body of that function.
    //
    // Given: msg("foo", (name) => html`Hello ${name}`, "World")
    // Extract: html`Hello ${name}`
    if (ts.isArrowFunction(arg1)) {
      if (
        !ts.isStringLiteral(arg1.body) &&
        !ts.isTemplateLiteral(arg1.body) &&
        !isLitTemplate(arg1.body)
      ) {
        throw new KnownError(
          'Expected function body to be a template or string'
        );
      }
      if (isLitTemplate(arg1.body)) {
        isLitTagged = true;
        template = arg1.body.template;
      } else {
        template = arg1.body;
      }
    } else if (isLitTemplate(arg1)) {
      isLitTagged = true;
      template = arg1.template;
    } else {
      template = arg1;
    }

    // If translations are available, replace the source template from the
    // second argument with the corresponding translation.
    if (this.translations !== undefined) {
      const translation = this.translations.get(id);
      if (translation !== undefined) {
        const templateLiteralBody = translation.contents
          .map((content) =>
            typeof content === 'string'
              ? escapeStringToEmbedInTemplateLiteral(content)
              : content.untranslatable
          )
          .join('');
        // Note that we assume localized placeholder contents have already been
        // validated against the source code to confirm that HTML and template
        // literal expressions have not been corrupted or manipulated during
        // localization (though moving their position is OK).
        template = parseStringAsTemplateLiteral(templateLiteralBody);
      }
      // TODO(aomarks) Emit a warning that a translation was missing.
    }

    // If our second argument was a function, then any template expressions in
    // our template are scoped to that function. The arguments to that function
    // are the 3rd and onwards arguments to our `msg` function, so we must
    // substitute those arguments into the expressions.
    //
    // Given: msg("foo", (name) => html`Hello <b>${name}</b>`, "World")
    // Generate: html`Hello <b>${"World"}</b>`
    if (ts.isArrowFunction(arg1) && ts.isTemplateExpression(template)) {
      const paramNames = [];
      for (const param of arg1.parameters) {
        if (ts.isIdentifier(param.name)) {
          paramNames.push(param.name.text);
        } else {
          throw new KnownError('Expected parameter to be identifier');
        }
      }
      const paramValues = new Map<string, ts.Expression>();
      for (let i = 0; i < paramNames.length; i++) {
        paramValues.set(paramNames[i], call.arguments[i + 2]);
      }
      template = this.substituteIdentsInExpressions(template, paramValues);
    }

    // Nothing more to do with a simple string.
    if (ts.isStringLiteral(template)) {
      if (isLitTagged) {
        throw new KnownError(
          'Internal error: string literal cannot be html-tagged'
        );
      }
      return template;
    }

    // We may have ended up with template expressions that can be represented
    // more efficiently by hoisting them directly into the template.
    //
    // Given: html`Hello <b>${"World"}</b>`
    // Generate: html`Hello <b>World</b>`
    template = makeTemplateLiteral(
      this.recursivelyFlattenTemplate(template, isLitTagged)
    );
    return isLitTagged ? tagLit(template) : template;
  }

  /**
   * For every expression in the given template, assume that it is a simple
   * identifier, and substitute it with the corresponding TypeScript node in the
   * given map.
   *
   * Given: html`Hello ${name}` with Map(['name', StringLiteral{"World"}])
   * Generate: html`Hello ${"World"}`
   */
  substituteIdentsInExpressions(
    template: ts.TemplateExpression,
    paramValues: Map<string, ts.Expression>
  ): ts.TemplateLiteral {
    return ts.visitEachChild(
      template,
      (span: ts.Node) => {
        if (!ts.isTemplateSpan(span)) {
          return span;
        }
        const expression = span.expression;
        if (!ts.isIdentifier(expression)) {
          throw new KnownError('Expected expression to be identifier');
        }
        const ident = expression.text;
        const value = paramValues.get(ident);
        if (value === undefined) {
          throw new KnownError('No value provided');
        }
        return ts.createTemplateSpan(value, span.literal);
      },
      this.context
    );
  }

  /**
   * Deconstruct the given template literal it into a sequence of strings and
   * expressions. Transform each expression using this transformer class,
   * deconstruct that result in the same way, and "flatten" the result into
   * the parent template wherever possible. Strings are flattened into strings,
   * and strings + HTML are flattened into HTML.
   *
   * Examples:
   *
   * [1] `foo` => ['foo']
   * [2] `foo${name}bar` => ['foo', Expression{name}, 'bar']
   * [3] `foo${"bar"}baz` => ['foo', 'bar', 'baz']
   * [4] html`<b>${html`<i>foo</i>`}</b>` => ['<b>', '<i>foo</i>', '</b>']
   * [5] html`<b>${msg("foo", 'bar')}</b>` => ['<b>', 'bar', '</b>']
   */
  recursivelyFlattenTemplate(
    template: ts.TemplateLiteral,
    isLit: boolean
  ): Array<string | ts.Expression> {
    if (ts.isNoSubstitutionTemplateLiteral(template)) {
      return [template.text];
    }

    const fragments: Array<string | ts.Expression> = [template.head.text];
    const subsume = (expression: ts.Expression): boolean => {
      if (ts.isStringLiteral(expression)) {
        fragments.push(expression.text);
      } else if (ts.isTemplateLiteral(expression)) {
        fragments.push(...this.recursivelyFlattenTemplate(expression, false));
      } else if (isLit && isLitTemplate(expression)) {
        fragments.push(
          ...this.recursivelyFlattenTemplate(expression.template, true)
        );
      } else {
        return false;
      }
      return true;
    };

    for (const span of template.templateSpans) {
      let expression = span.expression;
      // Can we directly subsume this span?
      if (!subsume(expression)) {
        // No, but it may still need transformation.
        expression = ts.visitNode(expression, this.boundVisitNode);
        // Maybe we can subsume it after transformation (e.g a `msg` call which
        // is now transformed to a template)?
        if (!subsume(expression)) {
          // Still no, then keep the expression in a span as it was.
          fragments.push(expression);
        }
      }
      fragments.push(span.literal.text);
    }
    return fragments;
  }

  /**
   * Return whether the given symbol looks like one of the lit-localize modules
   * (because it exports one of the special tagged functions).
   */
  isLitLocalizeModule(moduleSymbol: ts.Symbol): boolean {
    if (!moduleSymbol.exports) {
      return false;
    }
    const exports = moduleSymbol.exports.values();
    for (const xport of exports as typeof exports & {
      [Symbol.iterator](): Iterator<ts.Symbol>;
    }) {
      const type = this.typeChecker.getTypeAtLocation(xport.valueDeclaration);
      const props = this.typeChecker.getPropertiesOfType(type);
      if (
        props.some(
          (prop) =>
            prop.escapedName === '_LIT_LOCALIZE_MSG_' ||
            prop.escapedName === '_LIT_LOCALIZE_LOCALIZED_'
        )
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Return whether the tpe of the given node is "tagged" with the given special
   * identifying property (e.g. "_LIT_LOCALIZE_MSG_").
   */
  typeHasProperty(
    node: ts.Node,
    propertyName: string
  ): node is ts.CallExpression {
    const type = this.typeChecker.getTypeAtLocation(node);
    const props = this.typeChecker.getPropertiesOfType(type);
    return props.some((prop) => prop.escapedName === propertyName);
  }
}

/**
 * Wrap a TemplateLiteral in the lit-html `html` tag.
 */
function tagLit(template: ts.TemplateLiteral): ts.TaggedTemplateExpression {
  return ts.createTaggedTemplate(ts.createIdentifier('html'), template);
}

/**
 * Parse the given string as though it were the body of a template literal
 * (backticks should not be included), and return its TypeScript AST node
 * representation.
 */
function parseStringAsTemplateLiteral(
  templateLiteralBody: string
): ts.TemplateLiteral {
  const file = ts.createSourceFile(
    '__DUMMY__.ts',
    '`' + templateLiteralBody + '`',
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.JS
  );
  if (file.statements.length !== 1) {
    throw new KnownError('Internal error: expected 1 statement');
  }
  const statement = file.statements[0];
  if (!ts.isExpressionStatement(statement)) {
    throw new KnownError('Internal error: expected expression statement');
  }
  const expression = statement.expression;
  if (!ts.isTemplateLiteral(expression)) {
    throw new KnownError(
      'Internal error: expected template literal expression'
    );
  }
  return expression;
}

/**
 * Given an array of strings and template expressions (as generated by
 * `recursivelyFlattenTemplate`), create the simplest TemplateLiteral node,
 * where contiguous string items are collapsed into a single TemplateHead or
 * TemplateSpan.
 */
function makeTemplateLiteral(
  fragments: Array<string | ts.Expression>
): ts.TemplateLiteral {
  let textBuf: string[] = [];
  const spans = [];
  for (let i = fragments.length - 1; i >= 0; i--) {
    const fragment = fragments[i];
    if (typeof fragment === 'string') {
      textBuf.unshift(fragment);
    } else {
      const text = textBuf.join('');
      const literal =
        spans.length === 0
          ? ts.createTemplateTail(text)
          : ts.createTemplateMiddle(text);
      const span = ts.createTemplateSpan(fragment, literal);
      spans.unshift(span);
      textBuf = [];
    }
  }
  if (spans.length === 0) {
    return ts.createNoSubstitutionTemplateLiteral(textBuf.join(''));
  }
  return ts.createTemplateExpression(
    ts.createTemplateHead(textBuf.join('')),
    spans
  );
}

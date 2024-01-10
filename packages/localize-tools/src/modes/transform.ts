/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Message, Placeholder, makeMessageIdMap} from '../messages.js';
import {writeLocaleCodesModule} from '../locales.js';
import type {Locale} from '../types/locale.js';
import type {Config} from '../types/config.js';
import type {TransformOutputConfig} from '../types/modes.js';
import ts from 'typescript';
import {
  isLitTemplate,
  isMsgCall,
  extractTemplate,
  extractOptions,
  generateMsgIdFromAstNode,
} from '../program-analysis.js';
import {KnownError} from '../error.js';
import {
  escapeTextContentToEmbedInTemplateLiteral,
  stringifyDiagnostics,
  parseStringAsTemplateLiteral,
} from '../typescript.js';
import * as pathLib from 'path';
import {LitLocalizer} from '../index.js';

type TypeScriptTransformerFactoryFactory = (
  program: ts.Program
) => ts.TransformerFactory<ts.SourceFile>;

/**
 * Localizes a Lit project in transform mode.
 */
export class TransformLitLocalizer extends LitLocalizer {
  config: Config & {output: TransformOutputConfig};

  constructor(config: Config & {output: TransformOutputConfig}) {
    super();
    if (config.output.mode !== 'transform') {
      throw new Error(
        `Error: TransformLocalizer requires a localization config with output.mode "transform"`
      );
    }
    this.config = config;
  }

  /**
   * Compile the project for each locale, replacing all templates with their
   * localized versions, and write to the configured locale directory structure.
   */
  async build() {
    this.assertTranslationsAreValid();
    const {translations} = this.readTranslationsSync();
    await transformOutput(
      translations,
      this.config,
      this.config.output,
      this.program
    );
  }

  /**
   * Make a map from each locale code to a function that takes a TypeScript
   * Program and returns a TypeScript Transformer Factory that replaces all
   * `msg` calls with localized templates.
   *
   * This factory is suitable for inclusion in the `before` array of the
   * `customTransformers` parameter of the TypeScript `program.emit` method.
   */
  transformers(): Map<Locale, TypeScriptTransformerFactoryFactory> {
    const {translations} = this.readTranslationsSync();
    const locales = [this.config.sourceLocale, ...this.config.targetLocales];
    const factories = new Map<Locale, TypeScriptTransformerFactoryFactory>();
    for (const locale of locales) {
      factories.set(locale, (program: ts.Program) =>
        litLocalizeTransform(
          makeMessageIdMap(translations.get(locale) ?? []),
          locale,
          program
        )
      );
    }
    return factories;
  }
}

/**
 * Compile and emit the given TypeScript program using the lit-localize
 * transformer.
 *
 * TODO(aomarks) Refactor this into the build() method above.
 */
async function transformOutput(
  translationsByLocale: Map<Locale, Message[]>,
  config: Config,
  transformConfig: TransformOutputConfig,
  program: ts.Program
) {
  if (transformConfig.outputDir === undefined && !config.tsConfig) {
    throw new KnownError(
      `Either output.outputDir or tsConfig must be specified.`
    );
  }
  if (transformConfig.localeCodesModule) {
    await writeLocaleCodesModule(
      config.sourceLocale,
      config.targetLocales,
      transformConfig.localeCodesModule
    );
  }
  // TODO(aomarks) It doesn't seem that it's possible for a TypeScript
  // transformer to emit a new file, so we just have to emit for each locale.
  // Need to do some more investigation into the best way to integrate this
  // transformation into a real project so that the user can still use --watch
  // and other tsc flags. It would also be nice to support the language server,
  // so that diagnostics will show up immediately in the editor.
  const compilerOpts = program.getCompilerOptions();
  const outRoot = transformConfig.outputDir ?? compilerOpts.outDir ?? '.';
  for (const locale of [config.sourceLocale, ...config.targetLocales]) {
    let translations;
    if (locale !== config.sourceLocale) {
      translations = new Map<string, Message>();
      for (const message of translationsByLocale.get(locale) || []) {
        translations.set(message.name, message);
      }
    }
    compilerOpts.outDir = pathLib.join(outRoot, '/', locale);
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
    return (file) => {
      const transformer = new Transformer(
        context,
        translations,
        locale,
        program,
        file
      );
      return ts.visitNode(file, transformer.boundVisitNode) as ts.SourceFile;
    };
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
  sourceFile: ts.SourceFile;

  constructor(
    context: ts.TransformationContext,
    translations: Map<string, Message> | undefined,
    locale: string,
    program: ts.Program,
    sourceFile: ts.SourceFile
  ) {
    this.context = context;
    this.translations = translations;
    this.locale = locale;
    this.typeChecker = program.getTypeChecker();
    this.sourceFile = sourceFile;
  }

  /**
   * Top-level delegating visitor for all nodes.
   */
  visitNode(node: ts.Node): ts.VisitResult<ts.Node | undefined> {
    // msg('greeting', 'hello') -> 'hola'
    if (isMsgCall(node, this.typeChecker)) {
      return this.replaceMsgCall(node);
    }

    // html`<b>${msg('greeting', 'hello')}</b>` -> html`<b>hola</b>`
    if (isLitTemplate(node)) {
      // If an html-tagged template literal embeds a msg call, we want to
      // collapse the result of that msg call into the parent template.
      return tagLit(
        this.context.factory,
        makeTemplateLiteral(
          this.context.factory,
          this.recursivelyFlattenTemplate(node.template, true)
        )
      );
    }

    // import ... from '@lit/localize' -> (removed)
    if (ts.isImportDeclaration(node)) {
      const moduleSymbol = this.typeChecker.getSymbolAtLocation(
        node.moduleSpecifier
      );
      if (moduleSymbol && this.fileNameAppearsToBeLitLocalize(moduleSymbol)) {
        return undefined;
      }
    }

    const factory = this.context.factory;
    if (ts.isCallExpression(node)) {
      // configureTransformLocalization(...) -> {getLocale: () => "es-419"}
      if (
        this.typeHasProperty(
          node.expression,
          '_LIT_LOCALIZE_CONFIGURE_TRANSFORM_LOCALIZATION_'
        )
      ) {
        return factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(
              factory.createIdentifier('getLocale'),
              factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                factory.createStringLiteral(this.locale)
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

      // updateWhenLocaleChanges() -> undefined
      if (
        this.typeHasProperty(node.expression, '_LIT_LOCALIZE_CONTROLLER_FN_')
      ) {
        return factory.createIdentifier('undefined');
      }
    }

    // @localized -> removed
    if (
      ts.isDecorator(node) &&
      ts.isCallExpression(node.expression) &&
      this.typeHasProperty(
        node.expression.expression,
        '_LIT_LOCALIZE_DECORATOR_'
      )
    ) {
      return undefined;
    }

    // LOCALE_STATUS_EVENT -> "lit-localize-status"
    //
    // We want to replace this imported string constant with its static value so
    // that we can always safely remove the '@lit/localize' module import.
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
      for (const decl of eventSymbol.declarations ?? []) {
        let sourceFile: ts.Node = decl;
        while (!ts.isSourceFile(sourceFile)) {
          sourceFile = sourceFile.parent;
        }
        const sourceFileSymbol =
          this.typeChecker.getSymbolAtLocation(sourceFile);
        if (
          sourceFileSymbol &&
          this.fileNameAppearsToBeLitLocalize(sourceFileSymbol)
        ) {
          return factory.createStringLiteral('lit-localize-status');
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
    const [templateArg, optionsArg] = call.arguments;

    const templateResult = extractTemplate(
      templateArg,
      this.sourceFile,
      this.typeChecker
    );
    if (templateResult.error) {
      throw new Error(stringifyDiagnostics([templateResult.error]));
    }
    const {tag, contents, template} = templateResult.result;
    let newTemplate = template;

    const optionsResult = extractOptions(optionsArg, this.sourceFile);
    if (optionsResult.error) {
      throw new Error(stringifyDiagnostics([optionsResult.error]));
    }
    const options = optionsResult.result;
    const id = options.id ?? generateMsgIdFromAstNode(template, tag === 'html');

    if (this.translations !== undefined) {
      const translation = this.translations.get(id);
      if (translation !== undefined) {
        // If translations are available, replace the source template from the
        // second argument with the corresponding translation.

        // Maps from <translation absolute expression index> to
        // <[source placeholder index, placeholder-relative expression index]>.
        const transExprToSourcePosition = new Map<number, [number, number]>();

        // Maps from <source placeholder index> to <the number of expressions in
        // that placeholder>.
        const placeholderExpressionCounts = new Map<number, number>();

        // The absolute position of each expression within the translated
        // message.
        let absTransExprIdx = 0;

        // Maps source placeholder to their index.
        const placeholdersByIndex = new Map<number, Placeholder>();
        for (let i = 0, phIdx = 0; i < contents.length; i++) {
          const content = contents[i];
          if (typeof content === 'object') {
            placeholdersByIndex.set(phIdx++, content);
          }
        }

        const templateLiteralBody = translation.contents
          .map((content) => {
            if (typeof content === 'string') {
              return escapeTextContentToEmbedInTemplateLiteral(content);
            }
            const sourcePlaceholderIdx = content.index;
            const matchingPlaceholder =
              placeholdersByIndex.get(sourcePlaceholderIdx);
            if (matchingPlaceholder === undefined) {
              throw new Error(
                `Placeholder from translation does not appear in source.` +
                  `\nLocale: ${this.locale}` +
                  `\nPlaceholder: ${content.untranslatable}`
              );
            }
            const parsedPlaceholder = parseStringAsTemplateLiteral(
              matchingPlaceholder.untranslatable
            );
            if (ts.isTemplateExpression(parsedPlaceholder)) {
              placeholderExpressionCounts.set(
                sourcePlaceholderIdx,
                parsedPlaceholder.templateSpans.length
              );
              for (let i = 0; i < parsedPlaceholder.templateSpans.length; i++) {
                const placeholderRelativeExprIdx = i;
                transExprToSourcePosition.set(absTransExprIdx++, [
                  sourcePlaceholderIdx,
                  placeholderRelativeExprIdx,
                ]);
              }
            }

            return matchingPlaceholder.untranslatable;
          })
          .join('');

        newTemplate = parseStringAsTemplateLiteral(templateLiteralBody);
        if (ts.isTemplateExpression(newTemplate)) {
          const newParts: Array<string | ts.Expression> = [];
          newParts.push(newTemplate.head.text);
          for (let i = 0; i < newTemplate.templateSpans.length; i++) {
            const span = newTemplate.templateSpans[i];
            const srcPos = transExprToSourcePosition.get(i);
            if (srcPos === undefined) {
              const expressionText = templateLiteralBody.slice(
                span.expression.pos - 1,
                span.expression.end - 1
              );
              throw new Error(
                `Expression in translation does not appear in source.` +
                  `\nLocale: ${this.locale}` +
                  `\nExpression: ${expressionText}`
              );
            }
            const [sourcePlaceholderIdx, placeholderRelativeExprIdx] = srcPos;
            let absSourceExprIdx = placeholderRelativeExprIdx;
            for (let j = 0; j < sourcePlaceholderIdx; j++) {
              // Offset by the length of all preceding placeholder indexes.
              absSourceExprIdx += placeholderExpressionCounts.get(j) ?? 0;
            }
            if (!ts.isTemplateExpression(template)) {
              throw new Error('Internal error');
            }
            const sourceExpression = template.templateSpans[absSourceExprIdx];
            newParts.push(sourceExpression.expression);
            newParts.push(span.literal.text);
          }
          newTemplate = makeTemplateLiteral(this.context.factory, newParts);
        }
      }
      // TODO(aomarks) Emit a warning that a translation was missing.
    }

    // Nothing more to do with a simple string.
    if (ts.isStringLiteral(newTemplate)) {
      if (tag === 'html') {
        throw new KnownError(
          'Internal error: string literal cannot be html-tagged'
        );
      }
      return newTemplate;
    }

    // We may have ended up with template expressions that can be represented
    // more efficiently by hoisting them directly into the template.
    //
    // Given: html`Hello <b>${"World"}</b>`
    // Generate: html`Hello <b>World</b>`
    newTemplate = makeTemplateLiteral(
      this.context.factory,
      this.recursivelyFlattenTemplate(newTemplate, tag === 'html')
    );
    return tag === 'html'
      ? tagLit(this.context.factory, newTemplate)
      : newTemplate;
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
        return this.context.factory.createTemplateSpan(value, span.literal);
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
    const subsume = (expression: ts.Node | undefined): boolean => {
      if (expression === undefined) {
        return false;
      }
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

    for (let i = 0; i < template.templateSpans.length; i++) {
      const span = template.templateSpans[i];
      // A span preceded by `=` can be an attribute so skip subsume and
      // keep it as an expression to produce valid lit-html template
      // TODO(augustinekim) Consider optimizing to regular quoted string for
      // regular html attributes
      if (
        (i === 0
          ? template.head.text
          : template.templateSpans[i - 1].literal.text
        ).endsWith('=')
      ) {
        const expr = ts.visitNode(span.expression, this.boundVisitNode);
        if (expr === undefined || !ts.isExpression(expr)) {
          throw new Error(
            `Internal error: expected expression, but got ${
              expr ? ts.SyntaxKind[expr.kind] : 'undefined'
            }`
          );
        }
        fragments.push(expr);
        fragments.push(span.literal.text);
        continue;
      }
      let expression: ts.Node | undefined = span.expression;
      // Can we directly subsume this span?
      if (!subsume(expression)) {
        // No, but it may still need transformation.
        expression = ts.visitNode(expression, this.boundVisitNode);
        if (expression === undefined || !ts.isExpression(expression)) {
          throw new Error(
            `Internal error: expected expression, but got ${
              expression ? ts.SyntaxKind[expression.kind] : 'undefined'
            }`
          );
        }

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
   * based on its filename. Note when we call this function, we're already
   * strongly suspecting a lit-localize call.
   */
  fileNameAppearsToBeLitLocalize(moduleSymbol: ts.Symbol): boolean {
    // TODO(aomarks) Find a better way to implement this. We could probably just
    // check for any file path matching '/@lit/localize/` -- however that will
    // fail our tests because we import with a relative path in that case.
    for (const decl of moduleSymbol.declarations ?? []) {
      if (
        ts.isSourceFile(decl) &&
        (decl.fileName.endsWith('/localize/lit-localize.d.ts') ||
          decl.fileName.endsWith('/localize/internal/locale-status-event.d.ts'))
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
 * Wrap a TemplateLiteral in the lit `html` tag.
 */
function tagLit(
  factory: ts.NodeFactory,
  template: ts.TemplateLiteral
): ts.TaggedTemplateExpression {
  return factory.createTaggedTemplateExpression(
    factory.createIdentifier('html'),
    undefined,
    template
  );
}

/**
 * Given an array of strings and template expressions (as generated by
 * `recursivelyFlattenTemplate`), create the simplest TemplateLiteral node,
 * where contiguous string items are collapsed into a single TemplateHead or
 * TemplateSpan.
 */
function makeTemplateLiteral(
  factory: ts.NodeFactory,
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
          ? factory.createTemplateTail(text)
          : factory.createTemplateMiddle(text);
      const span = factory.createTemplateSpan(fragment, literal);
      spans.unshift(span);
      textBuf = [];
    }
  }
  if (spans.length === 0) {
    return factory.createNoSubstitutionTemplateLiteral(textBuf.join(''));
  }
  return factory.createTemplateExpression(
    factory.createTemplateHead(textBuf.join('')),
    spans
  );
}

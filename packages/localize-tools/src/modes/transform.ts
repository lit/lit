/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Message, makeMessageIdMap} from '../messages.js';
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
      return ts.visitNode(file, transformer.boundVisitNode);
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

    // import ... from '@lit/localize' -> (removed)
    if (ts.isImportDeclaration(node)) {
      const moduleSymbol = this.typeChecker.getSymbolAtLocation(
        node.moduleSpecifier
      );
      if (moduleSymbol && this.fileNameAppearsToBeLitLocalize(moduleSymbol)) {
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

      // updateWhenLocaleChanges() -> undefined
      if (
        this.typeHasProperty(node.expression, '_LIT_LOCALIZE_CONTROLLER_FN_')
      ) {
        return ts.createIdentifier('undefined');
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
    const [templateArg, optionsArg] = call.arguments;

    const templateResult = extractTemplate(
      templateArg,
      this.sourceFile,
      this.typeChecker
    );
    if (templateResult.error) {
      throw new Error(stringifyDiagnostics([templateResult.error]));
    }
    const {tag} = templateResult.result;
    let {template} = templateResult.result;

    const optionsResult = extractOptions(optionsArg, this.sourceFile);
    if (optionsResult.error) {
      throw new Error(stringifyDiagnostics([optionsResult.error]));
    }
    const options = optionsResult.result;
    const id = options.id ?? generateMsgIdFromAstNode(template, tag === 'html');

    const sourceExpressions = new Map<string, ts.Expression>();
    if (ts.isTemplateExpression(template)) {
      for (const span of template.templateSpans) {
        // TODO(aomarks) Support less brittle/more readable placeholder keys.
        const key = this.sourceFile.text.slice(
          span.expression.pos,
          span.expression.end
        );
        sourceExpressions.set(key, span.expression);
      }
    }

    // If translations are available, replace the source template from the
    // second argument with the corresponding translation.
    if (this.translations !== undefined) {
      const translation = this.translations.get(id);
      if (translation !== undefined) {
        const templateLiteralBody = translation.contents
          .map((content) =>
            typeof content === 'string'
              ? escapeTextContentToEmbedInTemplateLiteral(content)
              : content.untranslatable
          )
          .join('');

        template = parseStringAsTemplateLiteral(templateLiteralBody);
        if (ts.isTemplateExpression(template)) {
          const newParts = [];
          newParts.push(template.head.text);
          for (const span of template.templateSpans) {
            const expressionKey = templateLiteralBody.slice(
              span.expression.pos - 1,
              span.expression.end - 1
            );
            const sourceExpression = sourceExpressions.get(expressionKey);
            if (sourceExpression === undefined) {
              throw new Error(
                `Expression in translation does not appear in source.` +
                  `\nLocale: ${this.locale}` +
                  `\nExpression: ${expressionKey}`
              );
            }
            newParts.push(sourceExpression);
            newParts.push(span.literal.text);
          }
          template = makeTemplateLiteral(newParts);
        }
      }
      // TODO(aomarks) Emit a warning that a translation was missing.
    }

    // Nothing more to do with a simple string.
    if (ts.isStringLiteral(template)) {
      if (tag === 'html') {
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
      this.recursivelyFlattenTemplate(template, tag === 'html')
    );
    return tag === 'html' ? tagLit(template) : template;
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
function tagLit(template: ts.TemplateLiteral): ts.TaggedTemplateExpression {
  return ts.createTaggedTemplate(ts.createIdentifier('html'), template);
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

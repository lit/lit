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
      before: [litLocalizeTransform(translations)],
    });
  }
}

/**
 * Return a TypeScript TransformerFactory for the lit-localize transformer.
 */
export function litLocalizeTransform(
  translations: Map<string, Message> | undefined
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const transformer = new Transformer(context, translations);
    return (file) => ts.visitNode(file, transformer.boundVisitNode);
  };
}

/**
 * Implementation of the lit-localize TypeScript transformer.
 */
class Transformer {
  private context: ts.TransformationContext;
  boundVisitNode = this.visitNode.bind(this);

  constructor(
    context: ts.TransformationContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _translations: Map<string, Message> | undefined
  ) {
    this.context = context;
  }

  /**
   * Top-level delegating visitor for all nodes.
   */
  visitNode(node: ts.Node): ts.VisitResult<ts.Node> {
    // TODO(aomarks) The transformer!
    return ts.visitEachChild(node, this.boundVisitNode, this.context);
  }
}

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as xmldom from '@xmldom/xmldom';
import fsExtra from 'fs-extra';
import * as pathLib from 'path';
import type {Config} from '../types/config.js';
import type {XliffConfig} from '../types/formatters.js';
import type {Locale} from '../types/locale.js';
import {Formatter} from './index.js';
import {KnownError, unreachable} from '../error.js';
import {
  Bundle,
  Message,
  ProgramMessage,
  Placeholder,
  makeMessageIdMap,
} from '../messages.js';
import {
  getOneElementByTagNameOrThrow,
  getNonEmptyAttributeOrThrow,
} from './xml-utils.js';

/**
 * Create an XLIFF formatter from a main config object.
 */
export function xliffFactory(config: Config) {
  return new XliffFormatter(config);
}

/**
 * Formatter for XLIFF v1.2
 * https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html
 */
export class XliffFormatter implements Formatter {
  private config: Config;
  private xliffConfig: XliffConfig;

  constructor(config: Config) {
    if (config.interchange.format !== 'xliff') {
      throw new Error(
        `Internal error: expected interchange.format "xliff", ` +
          `got ${config.interchange.format}`
      );
    }
    this.config = config;
    this.xliffConfig = config.interchange;
  }

  /**
   * For each target locale, look for the file "<xliffDir>/<locale>.xlf", and if
   * it exists, parse out translations.
   */
  readTranslations(): Bundle[] {
    const bundles: Array<Bundle> = [];
    for (const locale of this.config.targetLocales) {
      const xmlStr = this.readTranslationFile(locale);
      if (!xmlStr) {
        continue;
      }
      bundles.push(this.parseXliff(xmlStr));
    }
    return bundles;
  }

  /**
   * Parse the given XLIFF XML string and return its translations.
   */
  private parseXliff(xmlStr: string): Bundle {
    const doc = new xmldom.DOMParser().parseFromString(xmlStr);
    const file = getOneElementByTagNameOrThrow(doc, 'file');
    const locale = getNonEmptyAttributeOrThrow(
      file,
      'target-language'
    ) as Locale;
    const messages: Message[] = [];
    const transUnits = file.getElementsByTagName('trans-unit');
    for (let t = 0; t < transUnits.length; t++) {
      const transUnit = transUnits[t];
      const name = getNonEmptyAttributeOrThrow(transUnit, 'id');
      const targets = transUnit.getElementsByTagName('target');
      if (targets.length === 0) {
        // No <target> means it's not translated yet.
        continue;
      }
      if (targets.length > 1) {
        throw new KnownError(
          `Expected 0 or 1 <target> in <trans-unit>, got ${targets.length}`
        );
      }
      const target = targets[0];
      const contents: Array<string | Placeholder> = [];
      for (let c = 0; c < target.childNodes.length; c++) {
        const child = target.childNodes[c];
        if (child.nodeType === doc.TEXT_NODE) {
          contents.push(child.nodeValue || '');
        } else if (
          child.nodeType === doc.ELEMENT_NODE &&
          child.nodeName === 'x'
        ) {
          const phText = getNonEmptyAttributeOrThrow(
            child as Element,
            'equiv-text'
          );
          const index = Number(
            getNonEmptyAttributeOrThrow(child as Element, 'id')
          );
          contents.push({untranslatable: phText, index});
        } else if (
          child.nodeType === doc.ELEMENT_NODE &&
          child.nodeName === 'ph'
        ) {
          const phText = child.childNodes[0];
          if (
            child.childNodes.length !== 1 ||
            !phText ||
            phText.nodeType !== doc.TEXT_NODE
          ) {
            throw new KnownError(
              `Expected <${child.nodeName}> to have exactly one text node`
            );
          }
          const index = Number(
            getNonEmptyAttributeOrThrow(child as Element, 'id')
          );
          contents.push({untranslatable: phText.nodeValue || '', index});
        } else {
          throw new KnownError(
            `Unexpected node in <trans-unit>: ${child.nodeType} ${child.nodeName}`
          );
        }
      }
      messages.push({name, contents});
    }
    return {locale, messages};
  }

  /**
   * Write a "<xliffDir>/<locale>.xlf" file for each target locale. If a message
   * has already been translated, it will have both a <source> and a <target>.
   * Otherwise, it will only have a <source>.
   */
  async writeOutput(
    sourceMessages: ProgramMessage[],
    translations: Map<Locale, Message[]>
  ): Promise<void> {
    const xliffDir = this.config.resolve(this.xliffConfig.xliffDir);
    try {
      await fsExtra.ensureDir(xliffDir);
    } catch (e) {
      throw new KnownError(
        `Error creating XLIFF directory: ${xliffDir}\n` +
          `Do you have write permission?\n` +
          (e as Error).message
      );
    }
    const writes: Array<Promise<void>> = [];
    for (const targetLocale of this.config.targetLocales) {
      const existingTargetXmlStr = this.readTranslationFile(targetLocale);
      const xmlStr = this.encodeLocale(
        sourceMessages,
        targetLocale,
        translations.get(targetLocale) || [],
        existingTargetXmlStr
          ? new xmldom.DOMParser().parseFromString(existingTargetXmlStr)
          : undefined
      );
      const path = pathLib.join(xliffDir, `${targetLocale}.xlf`);
      writes.push(
        fsExtra.writeFile(path, xmlStr, 'utf8').catch((e) => {
          throw new KnownError(
            `Error creating XLIFF file: ${path}\n` +
              `Do you have write permission?\n` +
              (e as Error).message
          );
        })
      );
    }
    await Promise.all(writes);
  }

  /**
   * Encode the given locale in XLIFF format.
   */
  private encodeLocale(
    sourceMessages: ProgramMessage[],
    targetLocale: Locale,
    targetMessages: Message[],
    targetDocument?: XMLDocument
  ): string {
    const translationsByName = makeMessageIdMap(targetMessages);
    const doc = targetDocument || this.initNewTargetDocument(targetLocale);
    const indent = this.createIndentFunction(doc);
    const existingTranslationsByName = this.makeExistingTranslationsMap(doc);
    const body = getOneElementByTagNameOrThrow(doc, 'body');
    const names = new Set();
    for (const {name, contents: sourceContents, desc} of sourceMessages) {
      // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#trans-unit
      let transUnit = existingTranslationsByName.get(name);
      if (!transUnit) {
        transUnit = doc.createElement('trans-unit');
        transUnit.setAttribute('id', name);
        this.appendChild(body, transUnit, 0, indent);
      }

      // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#source
      let source = this.getElementByTagName(transUnit, 'source');
      if (!source) {
        source = doc.createElement('source');
        this.appendChild(transUnit, source, 1, indent);
      } else {
        this.clearElement(source);
      }
      for (const child of this.encodeContents(doc, sourceContents)) {
        source.appendChild(child);
      }

      const translation = translationsByName.get(name);
      if (translation) {
        // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#target
        let target = this.getElementByTagName(transUnit, 'target');
        if (!target) {
          target = doc.createElement('target');
          this.appendChild(transUnit, target, 1, indent);
        } else {
          this.clearElement(target);
        }
        for (const child of this.encodeContents(doc, translation.contents)) {
          target.appendChild(child);
        }
      }

      if (desc) {
        // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#note
        let note = this.getNoteElement(transUnit, desc);
        if (!note) {
          note = doc.createElement('note');
          note.setAttribute('from', 'lit-localize');
          this.appendChild(transUnit, note, 1, indent);
        } else {
          // migrate existing notes generated by lit-localize
          if (!note.hasAttribute('from')) {
            note.setAttribute('from', 'lit-localize');
          }
          this.clearElement(note);
        }
        note.appendChild(doc.createTextNode(desc));
      }

      names.add(name);
    }

    // clean up obsolete translations
    existingTranslationsByName.forEach((existingTransUnit, existingName) => {
      if (!names.has(existingName)) {
        this.removeChildAndPrecedingText(body, existingTransUnit);
      }
    });

    if (!targetDocument) {
      indent(getOneElementByTagNameOrThrow(doc, 'file'));
      indent(getOneElementByTagNameOrThrow(doc, 'xliff'));
    }

    // for existing files this is a guess
    indent(doc);

    const serializer = new xmldom.XMLSerializer();
    const xmlStr = serializer.serializeToString(doc);
    return xmlStr;
  }

  /**
   * Encode the given message contents in XLIFF format.
   */
  private encodeContents(doc: Document, contents: Message['contents']): Node[] {
    const nodes = [];
    // We need a unique ID within each source for each placeholder. The index
    // will do.
    let phIdx = 0;
    for (const content of contents) {
      if (typeof content === 'string') {
        nodes.push(doc.createTextNode(content));
      } else {
        nodes.push(this.createPlaceholder(doc, String(phIdx++), content));
      }
    }
    return nodes;
  }

  private createPlaceholder(
    doc: Document,
    id: string,
    {untranslatable}: Placeholder
  ): HTMLElement {
    const style = this.xliffConfig.placeholderStyle ?? 'x';
    if (style === 'x') {
      // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#x
      const el = doc.createElement('x');
      el.setAttribute('id', id);
      el.setAttribute('equiv-text', untranslatable);
      return el;
    } else if (style === 'ph') {
      // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#ph
      const el = doc.createElement('ph');
      el.setAttribute('id', id);
      el.appendChild(doc.createTextNode(untranslatable));
      return el;
    } else {
      throw new Error(
        `Internal error: unknown xliff placeholderStyle: ${unreachable(style)}`
      );
    }
  }

  private initNewTargetDocument(targetLocale: Locale): XMLDocument {
    const doc = new xmldom.DOMImplementation().createDocument('', '', null);
    const indent = this.createIndentFunction(doc);
    doc.appendChild(
      doc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"')
    );
    indent(doc);

    // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#xliff
    const xliff = doc.createElement('xliff');
    xliff.setAttribute('version', '1.2');
    xliff.setAttribute('xmlns', 'urn:oasis:names:tc:xliff:document:1.2');
    doc.appendChild(xliff);
    indent(xliff);

    // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#file
    const file = doc.createElement('file');
    xliff.appendChild(file);
    file.setAttribute('target-language', targetLocale);
    file.setAttribute('source-language', this.config.sourceLocale);
    // TODO The spec requires the source filename in the "original" attribute,
    // but we don't currently track filenames.
    file.setAttribute('original', 'lit-localize-inputs');
    // Plaintext seems right, as opposed to HTML, since our translatable message
    // text is just text, and all HTML markup is encoded into <x> or <ph>
    // elements.
    file.setAttribute('datatype', 'plaintext');
    indent(file);

    // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#body
    const body = doc.createElement('body');
    file.appendChild(body);

    return doc;
  }

  private readTranslationFile(locale: Locale): string | undefined {
    const path = pathLib.join(
      this.config.resolve(this.xliffConfig.xliffDir),
      locale + '.xlf'
    );
    try {
      return fsExtra.readFileSync(path, 'utf8');
    } catch (err) {
      if ((err as Error & {code: string}).code === 'ENOENT') {
        // It's ok if the file doesn't exist, it's probably just the first
        // time we're running for this locale.
        return undefined;
      }
      throw err;
    }
  }

  private makeExistingTranslationsMap(
    document: XMLDocument
  ): Map<string, Element> {
    const map = new Map<string, Element>();
    const transUnits = document.getElementsByTagName('trans-unit');
    for (let t = 0; t < transUnits.length; t++) {
      const transUnit = transUnits[t];
      map.set(getNonEmptyAttributeOrThrow(transUnit, 'id'), transUnit);
    }
    return map;
  }

  private getElementByTagName(
    element: Element,
    tagName: string
  ): Element | undefined {
    const matches = element.getElementsByTagName(tagName);
    return matches.length === 1 ? matches[0] : undefined;
  }

  private getNoteElement(element: Element, note: string): Element | undefined {
    const matches = element.getElementsByTagName('note');
    if (matches.length < 1) {
      return undefined;
    }
    for (let i = 0; i < matches.length; i++) {
      const el = matches.item(i);
      if (el?.getAttribute('from') === 'lit-localize') {
        return el;
      }
      // generated by previous version of lit-localize
      if (el?.textContent?.trim() === note) {
        return el;
      }
    }
    return undefined;
  }

  /**
   * xmldom does not implement replaceChildren.
   */
  private clearElement(element: Element) {
    const children = element.childNodes;
    // Iterate backwards so we don't have to worry about the index changing each
    // time we remove.
    for (let i = children.length - 1; i >= 0; i--) {
      element.removeChild(children.item(i));
    }
  }

  /**
   * Append childNode to parentNode, try to preserve some
   * whitespace / indentation for common scenarios.
   */
  private appendChild(
    parentNode: Node,
    childNode: Node,
    level: number,
    indent: Function
  ) {
    const lastChild = parentNode.lastChild;
    if (lastChild) {
      parentNode.insertBefore(indent(parentNode, level), lastChild);
      parentNode.insertBefore(childNode, lastChild);
    } else {
      parentNode.appendChild(indent(parentNode, level));
      parentNode.appendChild(childNode);
      parentNode.appendChild(indent(parentNode, level - 1));
    }
  }

  private removeChildAndPrecedingText(parentNode: Node, childNode: Node) {
    if (childNode.previousSibling?.nodeType === childNode.TEXT_NODE) {
      parentNode.removeChild(childNode.previousSibling);
    }
    parentNode.removeChild(childNode);
  }

  private createIndentFunction(doc: Document): Function {
    return (node: Element | Document, level = 0) =>
      node.appendChild(doc.createTextNode('\n' + Array(level + 1).join('  ')));
  }
}

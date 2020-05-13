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

import * as xmldom from 'xmldom';
import * as fsExtra from 'fs-extra';
import * as pathLib from 'path';
import {Config} from '../config';
import {Locale} from '../locales';
import {Formatter} from './index';
import {KnownError} from '../error';
import {Bundle, Message, ProgramMessage, Placeholder} from '../messages';
import {
  getOneElementByTagNameOrThrow,
  getNonEmptyAttributeOrThrow,
  formatXml,
} from './xml-utils';

/**
 * Configuration for XLIFF interchange format.
 */
export interface XliffConfig {
  format: 'xliff';

  /**
   * Directory on disk to read/write .xlf XML files. For each target locale,
   * the file path "<xliffDir>/<locale>.xlf" will be used.
   */
  xliffDir: string;
}

/**
 * Create an XLIF formatter from a main config object.
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
  async readTranslations(): Promise<Bundle[]> {
    const bundles: Array<Promise<Bundle | null>> = [];
    for (const locale of this.config.targetLocales) {
      bundles.push(
        (async () => {
          const path = pathLib.join(
            this.config.resolve(this.xliffConfig.xliffDir),
            locale + '.xlf'
          );
          let xmlStr;
          try {
            xmlStr = await fsExtra.readFile(path, 'utf8');
          } catch (err) {
            if (err.code === 'ENOENT') {
              // It's ok if the file doesn't exist, it's probably just the first
              // time we're running for this locale.
              return null;
            }
            throw err;
          }
          return this.parseXlif(xmlStr);
        })()
      );
    }
    return (await Promise.all(bundles)).filter((x) => x !== null) as Bundle[];
  }

  /**
   * Parse the given XLIF XML string and return its translations.
   */
  private parseXlif(xmlStr: string): Bundle {
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
          child.nodeName === 'ph'
        ) {
          const phText = child.childNodes[0];
          if (
            child.childNodes.length !== 1 ||
            !phText ||
            phText.nodeType !== doc.TEXT_NODE
          ) {
            throw new KnownError(`Expected <ph> to have exactly one text node`);
          }
          contents.push({untranslatable: phText.nodeValue || ''});
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
    const writes: Array<Promise<void>> = [];
    for (const targetLocale of this.config.targetLocales) {
      const xmlStr = this.encodeLocale(
        sourceMessages,
        targetLocale,
        translations.get(targetLocale) || []
      );
      const path = pathLib.join(
        this.config.resolve(this.xliffConfig.xliffDir),
        `${targetLocale}.xlf`
      );
      writes.push(fsExtra.writeFile(path, xmlStr, 'utf8'));
    }
    await Promise.all(writes);
  }

  /**
   * Encode the given locale in XLIF format.
   */
  private encodeLocale(
    sourceMessages: ProgramMessage[],
    targetLocale: Locale,
    targetMessages: Message[]
  ): string {
    const translationsByName = new Map<string, Message>();
    for (const message of targetMessages) {
      translationsByName.set(message.name, message);
    }

    const doc = new xmldom.DOMImplementation().createDocument('', '', null);
    doc.appendChild(
      doc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"')
    );
    doc.appendChild(doc.createTextNode('\n'));

    // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#xliff
    const xliff = doc.createElement('xliff');
    xliff.setAttribute('version', '1.2');
    xliff.setAttribute('xmlns', 'http://www.w3.org/2001/XMLSchema-instance');
    xliff.setAttribute(
      'xsi:schemaLocation',
      'urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-strict.xsd'
    );

    // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#file
    const file = doc.createElement('file');
    doc.appendChild(file);
    // TODO The spec requires the source filename in the "original" attribute,
    // but we don't currently track filenames.
    file.setAttribute('original', 'lit-localize-inputs');
    // Plaintext seems right, as opposed to HTML, since our translatable
    // message text is just text, and all HTML markup is encoded into <ph>
    // elements.
    file.setAttribute('datatype', 'plaintext');
    file.setAttribute('source-language', this.config.sourceLocale);
    file.setAttribute('target-language', targetLocale);

    const body = doc.createElement('body');
    file.appendChild(body);

    for (const {name, contents: sourceContents, descStack} of sourceMessages) {
      // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#trans-unit
      const transUnit = doc.createElement('trans-unit');
      body.appendChild(transUnit);
      transUnit.setAttribute('id', name);

      if (descStack.length > 0) {
        // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#note
        const note = document.createElement('note');
        note.appendChild(doc.createTextNode(descStack.join(' / ')));
        transUnit.appendChild(note);
      }

      // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#source
      const source = doc.createElement('source');
      for (const child of this.encodeContents(doc, sourceContents)) {
        source.appendChild(child);
      }
      transUnit.appendChild(source);

      const translation = translationsByName.get(name);
      if (translation !== undefined) {
        // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#target
        const target = doc.createElement('target');
        for (const child of this.encodeContents(doc, translation.contents)) {
          target.appendChild(child);
        }
        transUnit.appendChild(target);
      }
    }
    const serializer = new xmldom.XMLSerializer();
    const xmlStr = serializer.serializeToString(doc);
    return formatXml(xmlStr);
  }

  /**
   * Encode the given message contents in XLIF format.
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
        const {untranslatable} = content;
        // https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#ph
        const ph = doc.createElement('ph');
        ph.setAttribute('id', String(phIdx++));
        ph.appendChild(doc.createTextNode(untranslatable));
        nodes.push(ph);
      }
    }
    return nodes;
  }
}

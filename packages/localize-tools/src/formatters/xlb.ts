/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as xmldom from '@xmldom/xmldom';
import fastGlob from 'fast-glob';
import fsExtra from 'fs-extra';
import * as pathlib from 'path';
import type {Config} from '../types/config.js';
import type {XlbConfig} from '../types/formatters.js';
import type {Locale} from '../types/locale.js';
import {Formatter} from './index.js';
import {KnownError} from '../error.js';
import {ProgramMessage, Message, Bundle, Placeholder} from '../messages.js';
import {
  getOneElementByTagNameOrThrow,
  getNonEmptyAttributeOrThrow,
} from './xml-utils.js';

/**
 * Create an XLB formatter from a main config object.
 */
export function xlbFactory(config: Config) {
  return new XlbFormatter(config);
}

/**
 * Formatter for XLB.
 */
class XlbFormatter implements Formatter {
  private config: Config;
  private xlbConfig: XlbConfig;

  constructor(config: Config) {
    if (config.interchange.format !== 'xlb') {
      throw new KnownError(
        `Internal error: expected interchange.format "xlb", ` +
          `got ${config.interchange.format}`
      );
    }
    this.config = config;
    this.xlbConfig = config.interchange;
  }

  /**
   * Read translations from all XLB files on disk that match the configured glob
   * pattern.
   */
  readTranslations(): Array<Bundle> {
    const files = fastGlob.sync(this.xlbConfig.translationsGlob, {
      cwd: this.config.baseDir,
      absolute: true,
    });
    const bundles: Array<Bundle> = [];
    for (const file of files) {
      const xmlStr = fsExtra.readFileSync(file, 'utf8');
      bundles.push(this.parseXmb(xmlStr));
    }
    return bundles;
  }

  /**
   * Parse the given XLB XML string and return its translations.
   */
  private parseXmb(xmlStr: string): Bundle {
    const doc = new xmldom.DOMParser().parseFromString(xmlStr);
    const bundle = getOneElementByTagNameOrThrow(doc, 'localizationbundle');
    const locale = getNonEmptyAttributeOrThrow(bundle, 'locale') as Locale;
    const msgNodes = doc.getElementsByTagName('msg');
    const messages: Message[] = [];
    for (let i = 0; i < msgNodes.length; i++) {
      const msg = msgNodes[i];
      const name = getNonEmptyAttributeOrThrow(msg, 'name');
      const contents: Array<string | Placeholder> = [];
      for (let j = 0; j < msg.childNodes.length; j++) {
        const child = msg.childNodes[j];
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
          const index = Number(
            getNonEmptyAttributeOrThrow(child as Element, 'name')
          );
          contents.push({untranslatable: phText.nodeValue || '', index});
        } else {
          throw new KnownError(
            `Unexpected node in <msg>: ${child.nodeType} ${child.nodeName}`
          );
        }
      }
      messages.push({name, contents});
    }
    return {locale, messages};
  }

  /**
   * Write the source messages output file.
   */
  async writeOutput(sourceMessages: ProgramMessage[]): Promise<void> {
    const doc = new xmldom.DOMImplementation().createDocument('', '', null);
    const indent = (node: Element | Document, level = 0) =>
      node.appendChild(doc.createTextNode('\n' + Array(level + 1).join('  ')));
    doc.appendChild(
      doc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"')
    );
    indent(doc);
    const bundle = doc.createElement('localizationbundle');
    bundle.setAttribute('locale', this.config.sourceLocale);
    doc.appendChild(bundle);
    indent(bundle, 1);
    const messagesNode = doc.createElement('messages');
    bundle.appendChild(messagesNode);
    for (const {name, contents, desc} of sourceMessages) {
      const messageNode = doc.createElement('msg');
      messageNode.setAttribute('name', name);
      if (desc) {
        messageNode.setAttribute('desc', desc);
      }
      indent(messagesNode, 2);
      messagesNode.appendChild(messageNode);
      let phIdx = 0;
      for (const content of contents) {
        if (typeof content === 'string') {
          messageNode.appendChild(doc.createTextNode(content));
        } else {
          const {untranslatable} = content;
          const ph = doc.createElement('ph');
          ph.setAttribute('name', String(phIdx++));
          ph.appendChild(doc.createTextNode(untranslatable));
          messageNode.appendChild(ph);
        }
      }
    }
    indent(messagesNode, 1);
    indent(bundle);
    indent(doc);
    const serialized = new xmldom.XMLSerializer().serializeToString(doc);
    const filePath = this.config.resolve(this.xlbConfig.outputFile);
    const parentDir = pathlib.dirname(filePath);
    try {
      await fsExtra.ensureDir(parentDir);
    } catch (e) {
      throw new KnownError(
        `Error creating XLB directory: ${parentDir}\n` +
          `Do you have write permission?\n` +
          (e as Error).message
      );
    }
    try {
      await fsExtra.writeFile(filePath, serialized, 'utf8');
    } catch (e) {
      throw new KnownError(
        `Error creating XLB file: ${filePath}\n` +
          `Do you have write permission?\n` +
          (e as Error).message
      );
    }
  }
}

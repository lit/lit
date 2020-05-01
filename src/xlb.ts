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
import {ProgramMessage, Message, Bundle, Placeholder} from './interfaces';
import {Locale, isLocale} from './locales';

/**
 * Generate an XLB XML file for the given messages. This file contains the
 * canonical set of messages that will be translatd.
 */
export function generateXlb(
  messages: ProgramMessage[],
  locale: Locale
): string {
  const doc = new xmldom.DOMImplementation().createDocument('', '', null);
  doc.appendChild(
    doc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"')
  );
  doc.appendChild(doc.createTextNode('\n'));
  const bundle = doc.createElement('localizationbundle');
  bundle.setAttribute('locale', locale);
  doc.appendChild(bundle);
  bundle.appendChild(doc.createTextNode('\n  '));
  const messagesNode = doc.createElement('messages');
  bundle.appendChild(messagesNode);
  for (const {name, contents, descStack} of messages) {
    messagesNode.appendChild(doc.createTextNode('\n    '));
    const messageNode = doc.createElement('msg');
    messageNode.setAttribute('name', name);
    if (descStack.length > 0) {
      messageNode.setAttribute('desc', descStack.join(' / '));
    }
    messagesNode.appendChild(messageNode);
    for (const content of contents) {
      if (typeof content === 'string') {
        messageNode.appendChild(doc.createTextNode(content));
      } else {
        const {untranslatable} = content;
        const ph = doc.createElement('ph');
        ph.appendChild(doc.createTextNode(untranslatable));
        messageNode.appendChild(ph);
      }
    }
  }
  messagesNode.appendChild(doc.createTextNode('\n  '));
  bundle.appendChild(doc.createTextNode('\n'));
  doc.appendChild(doc.createTextNode('\n'));
  const serialized = new xmldom.XMLSerializer().serializeToString(doc);
  return serialized;
}

/**
 * Parse an XLB XML file. These files contain translations organized using the
 * same message names that we originally requested.
 */
export function parseXlb(xlbStr: string): Bundle {
  const doc = new xmldom.DOMParser().parseFromString(xlbStr);
  const bundleNodes = doc.getElementsByTagName('localizationbundle');
  if (bundleNodes.length !== 1) {
    throw new Error(
      `Expected exactly one <localizationbundle> in XLB file, was ${bundleNodes.length}`
    );
  }
  const locale = bundleNodes[0].getAttribute('locale');
  if (!locale) {
    throw new Error(
      `Expected locale attribute in <localizationbundle>, was missing or empty`
    );
  }
  if (!isLocale(locale)) {
    throw new Error(
      `Did not recognize locale ${locale} in <localizationbundle>, ` +
        `maybe you need to add it to locales.ts?`
    );
  }
  const msgNodes = doc.getElementsByTagName('msg');
  const messages: Message[] = [];
  for (let m = 0; m < msgNodes.length; m++) {
    const msg = msgNodes[m];
    const name = msg.getAttribute('name');
    if (!name) {
      throw new Error(
        `Expected <msg> to have "name" attribute, was missing or empty`
      );
    }
    const contents: Array<string | Placeholder> = [];
    for (let c = 0; c < msg.childNodes.length; c++) {
      const child = msg.childNodes[c];
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
          throw new Error(`Expected <ph> to have exactly one text node`);
        }
        contents.push({untranslatable: phText.nodeValue || ''});
      } else {
        throw new Error(
          `Unexpected node in <msg>: ${child.nodeType} ${child.nodeName}`
        );
      }
    }
    messages.push({name, contents});
  }
  return {locale, messages};
}

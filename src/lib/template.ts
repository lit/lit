/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * @module lit-html
 */

import {TemplateResult} from './template-result.js';

/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
export const marker = `{{lit-${Math.random().toString(36).slice(2)}}}`;

/**
 * An expression marker for text-positions, nodes with attributes, and
 * style tags with dynamic values.
 */
export const nodeMarker = `<!--${marker}-->`;

/**
 * A regular expression for HTML tags
 */
const tagRegex = /<[^\0-\x1F\x7F-\x9F "'>=/]+(>)?/;

/**
 * A regular expression that groups the name of the last attribute defined
 */
const lastAttributeNameRegex =
    /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F "'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d"']*$/;

/**
 * A regular expression for all characters that close a tag context
 */
const nodeEscapeRegex = /([>'"])/;

/**
 * A regular expression for a comment close
 */
const closeCommentRegex = /-->/;

/**
 * A regular expression for a closing style tag
 */
const closeStyleRegex = /<\/style>/;

type parser = (htmlString: string) => string|undefined;
/**
 * Parser state
 */
let outputString: string;
let parts: Array<Array<TemplatePart>> = [];
let currentPart: TemplatePart|undefined;
let tagString: string;
let tagHasBinding: boolean;
let parse: parser;
let parseContext: parser;

/**
 * Parses a string that is in a free text context.
 * It consumes tokens from the input string until the context enters another
 * context (tag, comment, style). If the end of the string is reached, it
 * inserts a marker for a dynamic text part. Returns the remainder of the string
 * after all text tokens have been consumed.
 */
const parseText = (htmlString: string): string|undefined => {
  const match = htmlString.match(tagRegex);
  if (match) {
    // Skip parsing tags if the tag is immediately closed;
    if (match[1]) {
      outputString += htmlString.slice(0, match.index) + match[0];
      htmlString = htmlString.slice(match[0].length + match.index!);
      if (match[0] === '<style>') {
        parse = parseStyle;
      } else {
        parse = parseText;
      }
    } else {
      outputString += htmlString.slice(0, match.index);
      htmlString = htmlString.slice(match.index);
      if (htmlString.slice(0, 4) === `<!--`) {
        parse = parseComment;
      } else {
        parse = parseTag;
        if (htmlString.slice(0, 6) === `<style`) {
          parseContext = parseStyle;
        } else {
          parseContext = parseText;
        }
      }
    }
    return htmlString;
  } else {
    outputString += htmlString + nodeMarker;
    parts.push([{type: 'node', strings: []}]);
    parse = parseText;
    return;
  }
};

/**
 * Parses a string that is in a comment context.
 * It consumes tokens from the input string until the comment closes and returns
 * to a text context. If the end of the string is reached, it inserts a marker
 * for a dynamic comment part.
 */
const parseComment = (htmlString: string): string|undefined => {
  const match = htmlString.match(closeCommentRegex);
  if (match) {
    const commentEnd = match.index! + 3;
    if (currentPart) {
      outputString += nodeMarker;
      currentPart.strings!.push(htmlString.slice(0, match.index));
      currentPart = undefined;
    } else {
      outputString += htmlString.slice(0, commentEnd);
    }
    return parseText(htmlString.slice(commentEnd));
  } else {
    if (!currentPart) {
      currentPart = {type: 'comment', strings: []};
      parts.push([currentPart]);
      htmlString = htmlString.slice(4);
    }
    currentPart.strings!.push(htmlString);
    return;
  }
};

/**
 * Parses a string that is in a style context.
 * It consumes tokens from the input string until the style tag closes and
 * returns to a text context. If the end of the string is reached, it inserts a
 * marker for a dynamic comment part.
 */
const parseStyle = (htmlString: string): string|undefined => {
  const match = htmlString.match(closeStyleRegex);
  if (match) {
    const styleEnd = match.index! + 8;
    if (currentPart) {
      outputString += '</style>' + nodeMarker;
      currentPart.strings!.push(htmlString.slice(0, match.index));
      currentPart = undefined;
      parse = parseText;
    } else {
      outputString += htmlString.slice(0, styleEnd);
    }
    parse = parseText;
    return htmlString.slice(styleEnd);
  } else {
    if (!currentPart) {
      currentPart = {type: 'style', strings: []};
      parts.push([currentPart]);
    }
    currentPart.strings!.push(htmlString);
    // output.push(string, marker);
    return;
  }
};

const parseTag = (htmlString: string): string|undefined => {
  let match = htmlString.match(nodeEscapeRegex);
  if (match) {
    const tagEnd = match.index! + 1;
    if (match[1] === `>`) {
      if (tagHasBinding) {
        outputString += nodeMarker;
        tagHasBinding = false;
      }
      outputString += tagString + htmlString.slice(0, tagEnd);
      tagString = '';
      parse = parseContext;
      return htmlString.slice(tagEnd);
    } else {
      parse = parseAttribute(match[1]);
      tagString += htmlString.slice(0, tagEnd);
      return htmlString.slice(tagEnd);
    }
  } else {
    // Bare attribute
    if (!tagHasBinding) {
      parts.push([]);
      tagHasBinding = true;
    }
    match = htmlString.match(lastAttributeNameRegex) as RegExpMatchArray;
    parts[parts.length - 1].push(
        {type: 'attribute', name: match[1], strings: ['', '']});
    tagString += htmlString.slice(0, match.index);
    return;
  }
};

const parseAttribute = (delimiter: string) => (
    htmlString: string): string|undefined => {
  const index = htmlString.indexOf(delimiter);
  if (index >= 0) {
    if (currentPart) {
      currentPart.strings!.push(htmlString.slice(0, index));
    } else {
      tagString += htmlString.slice(0, index + 1);
    }
    currentPart = undefined;
    parse = parseTag;
    return htmlString.slice(index + 1);
  } else {
    if (currentPart) {
      currentPart.strings!.push(htmlString);
    } else {
      const match = tagString.match(lastAttributeNameRegex) as RegExpMatchArray;
      tagString = tagString.slice(0, match.index);
      if (!tagHasBinding) {
        parts.push([]);
        tagHasBinding = true;
      }
      currentPart = {type: 'attribute', name: match[1], strings: [htmlString]};
      parts[parts.length - 1].push(currentPart);
    }
    return;
  }
};

/**
 * An updateable Template that tracks the location of dynamic parts.
 */
export class Template {
  parts: Array<Array<TemplatePart>> = [];
  element: HTMLTemplateElement;

  constructor(result: TemplateResult) {
    this.element = document.createElement('template');
    // Reset the global parser variables
    parts = [];
    outputString = '';
    tagString = '';
    tagHasBinding = false;
    parse = parseText;

    const strings = result.strings;
    let htmlString;
    const lastString = strings.length - 1;
    for (let i = 0; i < lastString; i++) {
      htmlString = strings[i];
      do {
        htmlString = parse(htmlString);
      } while (htmlString !==
               undefined);  // Important, we must continue when string === ''
    }
    // Only parse the last string until we hit text context;
    htmlString = strings[lastString];
    while (parse !== parseText) {
      htmlString = parse(htmlString!);
    }
    outputString += htmlString;

    this.parts = parts;
    this.element.innerHTML = outputString;
  }
}

/**
 * A placeholder for a dynamic expression in an HTML template.
 *
 * There are two built-in part types: AttributePart and NodePart. NodeParts
 * always represent a single dynamic expression, while AttributeParts may
 * represent as many expressions are contained in the attribute.
 *
 * A Template's parts are mutable, so parts can be replaced or modified
 * (possibly to implement different template semantics). The contract is that
 * parts can only be replaced, not removed, added or reordered, and parts must
 * always consume the correct number of values in their `update()` method.
 *
 * TODO(justinfagnani): That requirement is a little fragile. A
 * TemplateInstance could instead be more careful about which values it gives
 * to Part.update().
 */
export type TemplatePart =|{
  type: 'node';
  strings: string[]|undefined
}
|{
  type: 'attribute';
  name: string;
  strings: string[]
}
|{
  type: 'comment';
  strings: string[]
}
|{
  type: 'style';
  strings: string[]
};

// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
export const createMarker = (data: string) => document.createComment(data);

// Creates a comment with the part index and number of attributes. The
// attribute count occupies the 16 high bits, and the part index the 16 low
// bits.
// export const insertPartMarker = (node: Node, partIndex: number,
// attributeCount: number) => {
//   return;
// };
// node.parentNode!.insertBefore(createMarker(`${partMarker}${(attributeCount <<
// 16) | partIndex}`), node);

/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#attributes-0
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-character
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */

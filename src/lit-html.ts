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

// The first argument to JS template tags retain identity across multiple
// calls to a tag for the same literal, so we can cache work done per literal
// in a Map.
export const templateCaches =
    new Map<string, Map<TemplateStringsArray, Template>>();

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    new TemplateResult(strings, values, 'html');

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
    new SVGTemplateResult(strings, values, 'svg');

/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
export class TemplateResult {
  strings: TemplateStringsArray;
  values: any[];
  type: string;
  partCallback: PartCallback;

  constructor(
      strings: TemplateStringsArray, values: any[], type: string,
      partCallback: PartCallback = defaultPartCallback) {
    this.strings = strings;
    this.values = values;
    this.type = type;
    this.partCallback = partCallback;
  }

  /**
   * Returns a string of HTML used to create a <template> element.
   */
  getHTML(): string {
    const l = this.strings.length - 1;
    let html = '';
    let isTextBinding = true;
    for (let i = 0; i < l; i++) {
      const s = this.strings[i];
      html += s;
      // We're in a text position if the previous string closed its tags.
      // If it doesn't have any tags, then we use the previous text position
      // state.
      const closing = findTagClose(s);
      isTextBinding = closing > -1 ? closing < s.length : isTextBinding;
      html += isTextBinding ? nodeMarker : marker;
    }
    html += this.strings[l];
    return html;
  }

  getTemplateElement(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = this.getHTML();
    return template;
  }
}

/**
 * A TemplateResult for SVG fragments.
 *
 * This class wraps HTMl in an <svg> tag in order to parse its contents in the
 * SVG namespace, then modifies the template to remove the <svg> tag so that
 * clones only container the original fragment.
 */
export class SVGTemplateResult extends TemplateResult {
  getHTML(): string {
    return `<svg>${super.getHTML()}</svg>`;
  }
  getTemplateElement(): HTMLTemplateElement {
    const template = super.getTemplateElement();
    const content = template.content;
    const svgElement = content.firstChild!;
    content.removeChild(svgElement);
    reparentNodes(content, svgElement.firstChild);
    return template;
  }
}

/**
 * A function type that creates a Template from a TemplateResult.
 *
 * This is a hook into the template-creation process for rendering that
 * requires some modification of templates before they're used, like ShadyCSS,
 * which must add classes to elements and remove styles.
 *
 * Templates should be cached as aggressively as possible, so that many
 * TemplateResults produced from the same expression only do the work of
 * creating the Template the first time.
 *
 * Templates are usually cached by TemplateResult.strings and
 * TemplateResult.type, but may be cached by other keys if this function
 * modifies the template.
 *
 * Note that currently TemplateFactories must not add, remove, or reorder
 * expressions, because there is no way to describe such a modification
 * to render() so that values are interpolated to the correct place in the
 * template instances.
 */
export type TemplateFactory = (result: TemplateResult) => Template;

/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
export function defaultTemplateFactory(result: TemplateResult) {
  let templateCache = templateCaches.get(result.type);
  if (templateCache === undefined) {
    templateCache = new Map<TemplateStringsArray, Template>();
    templateCaches.set(result.type, templateCache);
  }
  let template = templateCache.get(result.strings);
  if (template === undefined) {
    template = new Template(result, result.getTemplateElement());
    templateCache.set(result.strings, template);
  }
  return template;
}

export type TemplateContainer = (Element|DocumentFragment)&{
  __templateInstance?: TemplateInstance;
};

/**
 * Renders a template to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result a TemplateResult created by evaluating a template tag like
 *     `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param templateFactory a function to create a Template or retreive one from
 *     cache.
 */
export function render(
    result: TemplateResult,
    container: Element|DocumentFragment,
    templateFactory: TemplateFactory = defaultTemplateFactory
  ) {
  const template = templateFactory(result);
  let instance = (container as TemplateContainer).__templateInstance;

  // Repeat render, just call update()
  if (instance !== undefined && instance.template === template &&
      instance._partCallback === result.partCallback) {
    instance.update(result.values);
    return;
  }

  // First render, create a new TemplateInstance and append it
  instance =
      new TemplateInstance(template, result.partCallback, templateFactory);
  (container as TemplateContainer).__templateInstance = instance;

  const fragment = instance._clone();
  instance.update(result.values);

  removeNodes(container, container.firstChild);
  container.appendChild(fragment);
}

/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;

/**
 * An expression marker used text-positions, not attribute positions,
 * in template.
 */
const nodeMarker = `<!--${marker}-->`;

const markerRegex = new RegExp(`${marker}|${nodeMarker}`);

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
const lastAttributeNameRegex =
    /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;

/**
 * Finds the closing index of the last closed HTML tag.
 * This has 3 possible return values:
 *   - `-1`, meaning there is no tag in str.
 *   - `string.length`, meaning the last opened tag is unclosed.
 *   - Some positive number < str.length, meaning the index of the closing '>'.
 */
function findTagClose(str: string): number {
  const close = str.lastIndexOf('>');
  const open = str.indexOf('<', close + 1);
  return open > -1 ? str.length : close;
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
export class TemplatePart {
  constructor(
      public type: string, public index: number, public name?: string,
      public rawName?: string, public strings?: string[]) {
  }
}

export const isTemplatePartActive = (part: TemplatePart) => part.index !== -1;

/**
 * An updateable Template that tracks the location of dynamic parts.
 */
export class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

  constructor(result: TemplateResult, element: HTMLTemplateElement) {
    this.element = element;
    const content = this.element.content;
    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
        content,
        133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
               NodeFilter.SHOW_TEXT */
        ,
        null as any,
        false);
    let index = -1;
    let partIndex = 0;
    const nodesToRemove: Node[] = [];

    // The actual previous node, accounting for removals: if a node is removed
    // it will never be the previousNode.
    let previousNode: Node|undefined;
    // Used to set previousNode at the top of the loop.
    let currentNode: Node|undefined;

    while (walker.nextNode()) {
      index++;
      previousNode = currentNode;
      const node = currentNode = walker.currentNode as Element;
      if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
        if (!node.hasAttributes()) {
          continue;
        }
        const attributes = node.attributes;
        // Per https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
        // attributes are not guaranteed to be returned in document order. In
        // particular, Edge/IE can return them out of order, so we cannot assume
        // a correspondance between part index and attribute index.
        let count = 0;
        for (let i = 0; i < attributes.length; i++) {
          if (attributes[i].value.indexOf(marker) >= 0) {
            count++;
          }
        }
        while (count-- > 0) {
          // Get the template literal section leading up to the first
          // expression in this attribute
          const stringForPart = result.strings[partIndex];
          // Find the attribute name
          const attributeNameInPart =
              lastAttributeNameRegex.exec(stringForPart)![1];
          // Find the corresponding attribute
          // TODO(justinfagnani): remove non-null assertion
          const attribute = attributes.getNamedItem(attributeNameInPart)!;
          const stringsForAttributeValue = attribute.value.split(markerRegex);
          this.parts.push(new TemplatePart(
              'attribute',
              index,
              attribute.name,
              attributeNameInPart,
              stringsForAttributeValue));
          node.removeAttribute(attribute.name);
          partIndex += stringsForAttributeValue.length - 1;
        }
      } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const nodeValue = node.nodeValue!;
        if (nodeValue.indexOf(marker) < 0) {
          continue;
        }

        const parent = node.parentNode!;
        const strings = nodeValue.split(markerRegex);
        const lastIndex = strings.length - 1;

        // We have a part for each match found
        partIndex += lastIndex;

        // Generate a new text node for each literal section
        // These nodes are also used as the markers for node parts
        for (let i = 0; i < lastIndex; i++) {
          parent.insertBefore(
              (strings[i] === '')
                  ? document.createComment('')
                  : document.createTextNode(strings[i]),
              node);
          this.parts.push(new TemplatePart('node', index++));
        }
        parent.insertBefore(
            strings[lastIndex] === '' ?
                document.createComment('') :
                document.createTextNode(strings[lastIndex]),
            node);
        nodesToRemove.push(node);
      } else if (
          node.nodeType === 8 /* Node.COMMENT_NODE */ &&
          node.nodeValue === marker) {
        const parent = node.parentNode!;
        // Add a new marker node to be the startNode of the Part if any of the
        // following are true:
        //  * We don't have a previousSibling
        //  * previousSibling is being removed (thus it's not the
        //    `previousNode`)
        //  * previousSibling is not a Text node
        //
        // TODO(justinfagnani): We should be able to use the previousNode here
        // as the marker node and reduce the number of extra nodes we add to a
        // template. See https://github.com/PolymerLabs/lit-html/issues/147
        const previousSibling = node.previousSibling;
        if (previousSibling === null || previousSibling !== previousNode ||
            previousSibling.nodeType !== Node.TEXT_NODE) {
          parent.insertBefore(document.createComment(''), node);
        } else {
          index--;
        }
        this.parts.push(new TemplatePart('node', index++));
        nodesToRemove.push(node);
        // If we don't have a nextSibling add a marker node.
        // We don't have to check if the next node is going to be removed,
        // because that node will induce a new marker if so.
        if (node.nextSibling === null) {
          parent.insertBefore(document.createComment(''), node);
        } else {
          index--;
        }
        currentNode = previousNode;
        partIndex++;
      }
    }

    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode!.removeChild(n);
    }
  }
}

/**
 * Returns a value ready to be inserted into a Part from a user-provided value.
 *
 * If the user value is a directive, this invokes the directive with the given
 * part. If the value is null, it's converted to undefined to work better
 * with certain DOM APIs, like textContent.
 */
export const getValue = (part: Part, value: any) => {
  // `null` as the value of a Text node will render the string 'null'
  // so we convert it to undefined
  if (isDirective(value)) {
    value = value(part);
    return noChange;
  }
  return value === null ? undefined : value;
};

export interface DirectiveFn<P= Part> {
  (part: P): void;
  __litDirective?: true;
}

export const directive = <P= Part>(f: DirectiveFn<P>): DirectiveFn<P> => {
  f.__litDirective = true;
  return f;
};

const isDirective = (o: any) =>
    typeof o === 'function' && o.__litDirective === true;

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
export const noChange = {};

/**
 * @deprecated Use `noChange` instead.
 */
export { noChange as directiveValue };

const isPrimitiveValue = (value: any) => value === null ||
    !(typeof value === 'object' || typeof value === 'function');

export interface Part {
  instance: TemplateInstance;
  size?: number;
}

export interface SinglePart extends Part { setValue(value: any): void; }

export interface MultiPart extends Part {
  setValue(values: any[], startIndex: number): void;
}

export class AttributePart implements MultiPart {
  instance: TemplateInstance;
  element: Element;
  name: string;
  strings: string[];
  size: number;
  _previousValues: any;

  constructor(
      instance: TemplateInstance, element: Element, name: string,
      strings: string[]) {
    this.instance = instance;
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.size = strings.length - 1;

    this._previousValues = [];
  }

  protected _interpolate(values: any[], startIndex: number) {
    const strings = this.strings;
    const l = strings.length - 1;
    let text = '';

    for (let i = 0; i < l; i++) {
      text += strings[i];
      const v = getValue(this, values[startIndex + i]);
      if (v && v !== noChange &&
          (Array.isArray(v) || typeof v !== 'string' && v[Symbol.iterator])) {
        for (const t of v) {
          // TODO: we need to recursively call getValue into iterables...
          text += t;
        }
      } else {
        text += v;
      }
    }
    return text + strings[l];
  }

  protected _equalToPreviousValues(values: any[], startIndex: number) {
    for (let i = startIndex; i < startIndex + this.size; i++) {
      if (this._previousValues[i] !== values[i] ||
          !isPrimitiveValue(values[i])) {
        return false;
      }
    }
    return true;
  }

  setValue(values: any[], startIndex: number): void {
    if (this._equalToPreviousValues(values, startIndex)) {
      return;
    }
    const s = this.strings;
    let value: any;
    if (s.length === 2 && s[0] === '' && s[1] === '') {
      // An expression that occupies the whole attribute value will leave
      // leading and trailing empty strings.
      value = getValue(this, values[startIndex]);
      if (Array.isArray(value)) {
        value = value.join('');
      }
    } else {
      value = this._interpolate(values, startIndex);
    }
    if (value !== noChange) {
      this.element.setAttribute(this.name, value);
    }
    this._previousValues = values;
  }
}

export class NodePart implements SinglePart {
  instance: TemplateInstance;
  startNode: Node;
  endNode: Node;
  _previousValue: any;

  constructor(instance: TemplateInstance, startNode: Node, endNode: Node) {
    this.instance = instance;
    this.startNode = startNode;
    this.endNode = endNode;
    this._previousValue = undefined;
  }

  setValue(value: any): void {
    value = getValue(this, value);
    if (value === noChange) {
      return;
    }
    if (isPrimitiveValue(value)) {
      // Handle primitive values
      // If the value didn't change, do nothing
      if (value === this._previousValue) {
        return;
      }
      this._setText(value);
    } else if (value instanceof TemplateResult) {
      this._setTemplateResult(value);
    } else if (Array.isArray(value) || value[Symbol.iterator]) {
      this._setIterable(value);
    } else if (value instanceof Node) {
      this._setNode(value);
    } else if (value.then !== undefined) {
      this._setPromise(value);
    } else {
      // Fallback, will render the string representation
      this._setText(value);
    }
  }

  private _insert(node: Node) {
    this.endNode.parentNode!.insertBefore(node, this.endNode);
  }

  private _setNode(value: Node): void {
    if (this._previousValue === value) {
      return;
    }
    this.clear();
    this._insert(value);
    this._previousValue = value;
  }

  private _setText(value: string): void {
    const node = this.startNode.nextSibling!;
    value = value === undefined ? '' : value;
    if (node === this.endNode.previousSibling &&
        node.nodeType === Node.TEXT_NODE) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      // TODO(justinfagnani): Can we just check if _previousValue is
      // primitive?
      node.textContent = value;
    } else {
      this._setNode(document.createTextNode(value));
    }
    this._previousValue = value;
  }

  private _setTemplateResult(value: TemplateResult): void {
    const template = this.instance._getTemplate(value);
    let instance: TemplateInstance;
    if (this._previousValue && this._previousValue.template === template) {
      instance = this._previousValue;
    } else {
      instance = new TemplateInstance(
          template, this.instance._partCallback, this.instance._getTemplate);
      this._setNode(instance._clone());
      this._previousValue = instance;
    }
    instance.update(value.values);
  }

  private _setIterable(value: any): void {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.

    // If _previousValue is an array, then the previous render was of an
    // iterable and _previousValue will contain the NodeParts from the previous
    // render. If _previousValue is not an array, clear this part and make a new
    // array for NodeParts.
    if (!Array.isArray(this._previousValue)) {
      this.clear();
      this._previousValue = [];
    }

    // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render
    const itemParts = this._previousValue as any[];
    let partIndex = 0;

    for (const item of value) {
      // Try to reuse an existing part
      let itemPart = itemParts[partIndex];

      // If no existing part, create a new one
      if (itemPart === undefined) {
        // If we're creating the first item part, it's startNode should be the
        // container's startNode
        let itemStart = this.startNode;

        // If we're not creating the first part, create a new separator marker
        // node, and fix up the previous part's endNode to point to it
        if (partIndex > 0) {
          const previousPart = itemParts[partIndex - 1];
          itemStart = previousPart.endNode = document.createTextNode('');
          this._insert(itemStart);
        }
        itemPart = new NodePart(this.instance, itemStart, this.endNode);
        itemParts.push(itemPart);
      }
      itemPart.setValue(item);
      partIndex++;
    }

    if (partIndex === 0) {
      this.clear();
      this._previousValue = undefined;
    } else if (partIndex < itemParts.length) {
      const lastPart = itemParts[partIndex - 1];
      // Truncate the parts array so _previousValue reflects the current state
      itemParts.length = partIndex;
      this.clear(lastPart.endNode.previousSibling!);
      lastPart.endNode = this.endNode;
    }
  }

  private _setPromise(value: Promise<any>): void {
    this._previousValue = value;
    value.then((v: any) => {
      if (this._previousValue === value) {
        this.setValue(v);
      }
    });
  }

  clear(startNode: Node = this.startNode) {
    removeNodes(
        this.startNode.parentNode!, startNode.nextSibling!, this.endNode);
  }
}

export type PartCallback =
    (instance: TemplateInstance, templatePart: TemplatePart, node: Node) =>
        Part;

export const defaultPartCallback =
    (instance: TemplateInstance,
     templatePart: TemplatePart,
     node: Node): Part => {
      if (templatePart.type === 'attribute') {
        return new AttributePart(
            instance, node as Element, templatePart.name!, templatePart.strings!
        );
      } else if (templatePart.type === 'node') {
        return new NodePart(instance, node, node.nextSibling!);
      }
      throw new Error(`Unknown part type ${templatePart.type}`);
    };


/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
export class TemplateInstance {
  _parts: Array<Part|undefined> = [];
  _partCallback: PartCallback;
  _getTemplate: TemplateFactory;
  template: Template;

  constructor(
      template: Template, partCallback: PartCallback,
      getTemplate: TemplateFactory) {
    this.template = template;
    this._partCallback = partCallback;
    this._getTemplate = getTemplate;
  }

  update(values: any[]) {
    let valueIndex = 0;
    for (const part of this._parts) {
      if (!part) {
        valueIndex++;
      } else if (part.size === undefined) {
        (part as SinglePart).setValue(values[valueIndex]);
        valueIndex++;
      } else {
        (part as MultiPart).setValue(values, valueIndex);
        valueIndex += part.size;
      }
    }
  }

  _clone(): DocumentFragment {
    // Clone the node, rather than importing it, to keep the fragment in the
    // template's document. This leaves the fragment inert so custom elements
    // won't upgrade until after the main document adopts the node.
    const fragment = this.template.element.content.cloneNode(true) as DocumentFragment;
    const parts = this.template.parts;

    if (parts.length > 0) {
      // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null
      const walker = document.createTreeWalker(
          fragment,
          133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                 NodeFilter.SHOW_TEXT */
          ,
          null as any,
          false);

      let index = -1;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const partActive = isTemplatePartActive(part);
        // An inactive part has no coresponding Template node.
        if (partActive) {
          while (index < part.index) {
            index++;
            walker.nextNode();
          }
        }
        this._parts.push(partActive ? this._partCallback(this, part, walker.currentNode) : undefined);
      }
    }
    return fragment;
  }
}

/**
 * Reparents nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), into another container (could be the same container), before
 * `beforeNode`. If `beforeNode` is null, it appends the nodes to the
 * container.
 */
export const reparentNodes =
    (container: Node,
     start: Node | null,
     end: Node | null = null,
     before: Node | null = null): void => {
      let node = start;
      while (node !== end) {
        const n = node!.nextSibling;
        container.insertBefore(node!, before as Node);
        node = n;
      }
    };

/**
 * Removes nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), from `container`.
 */
export const removeNodes =
    (container: Node, startNode: Node | null, endNode: Node | null = null):
        void => {
          let node = startNode;
          while (node !== endNode) {
            const n = node!.nextSibling;
            container.removeChild(node!);
            node = n;
          }
        };

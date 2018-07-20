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
 * Creates Parts when a template is instantiated.
 */
export class TemplateProcessor {
  /**
   * Create parts for an attribute-position binding, given the event, attribute
   * name, and string literals.
   *
   * @param element The element containing the binding
   * @param name  The attribute name
   * @param strings The string literals. There are always at least two strings,
   *   event for fully-controlled bindings with a single expression.
   */
  handleAttributeExpressions(element: Element, name: string, strings: string[]):
      Part[] {
    const comitter = new AttributeCommitter(element, name, strings);
    return comitter.parts;
  }

  /**
   * Create parts for a text-position binding.
   * @param templateFactory
   */
  handleTextExpression(templateFactory: TemplateFactory) {
    return new NodePart(templateFactory);
  }
}

export const defaultTemplateProcessor = new TemplateProcessor();

/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
export class TemplateResult {
  strings: TemplateStringsArray;
  values: any[];
  type: string;
  processor: TemplateProcessor;

  constructor(
      strings: TemplateStringsArray, values: any[], type: string,
      processor: TemplateProcessor = defaultTemplateProcessor) {
    this.strings = strings;
    this.values = values;
    this.type = type;
    this.processor = processor;
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
      const close = s.lastIndexOf('>');
      // We're in a text position if the previous string closed its last tag, an
      // attribute position if the string opened an unclosed tag, and unchanged
      // if the string had no brackets at all:
      //
      // "...>...": text position. open === -1, close > -1
      // "...<...": attribute position. open > -1
      // "...": no change. open === -1, close === -1
      isTextBinding =
          (close > -1 || isTextBinding) && s.indexOf('<', close + 1) === -1;
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
    templateFactory: TemplateFactory = defaultTemplateFactory) {
  const template = templateFactory(result);
  let instance = (container as TemplateContainer).__templateInstance;

  // Repeat render, just call update()
  if (instance !== undefined && instance.template === template &&
      instance.processor === result.processor) {
    instance.update(result.values);
    return;
  }

  // First render, create a new TemplateInstance and append it
  instance = new TemplateInstance(template, result.processor, templateFactory);
  (container as TemplateContainer).__templateInstance = instance;

  const fragment = instance._clone();

  removeNodes(container, container.firstChild);
  container.appendChild(fragment);

  instance.update(result.values);
}

// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');

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
export type TemplatePart = {
  type: 'node',
  index: number
}|{type: 'attribute', index: number, name: string, strings: string[]};

export const isTemplatePartActive = (part: TemplatePart) => part.index !== -1;

/**
 * An updateable Template that tracks the location of dynamic parts.
 */
export class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

  constructor(result: TemplateResult, element: HTMLTemplateElement) {
    this.element = element;
    let index = -1;
    let partIndex = 0;
    const nodesToRemove: Node[] = [];

    const _prepareTemplate = (template: HTMLTemplateElement) => {
      const content = template.content;
      // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null
      const walker = document.createTreeWalker(
          content,
          133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                  NodeFilter.SHOW_TEXT */
          ,
          null as any,
          false);
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
          if (node.hasAttributes()) {
            const attributes = node.attributes;
            // Per
            // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
            // attributes are not guaranteed to be returned in document order.
            // In particular, Edge/IE can return them out of order, so we cannot
            // assume a correspondance between part index and attribute index.
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
              const name = lastAttributeNameRegex.exec(stringForPart)![1];

              // Find the corresponding attribute
              // If the attribute name contains special characters, lower-case
              // it so that on XML nodes with case-sensitive getAttribute() we
              // can still find the attribute, which will have been lower-cased
              // by the parser.
              //
              // If the attribute name doesn't contain special character, it's
              // important to _not_ lower-case it, in case the name is
              // case-sensitive, like with XML attributes like "viewBox".
              const attributeLookupName =
                  /^[a-zA-Z-]*$/.test(name) ? name : name.toLowerCase();
              const attributeValue = node.getAttribute(attributeLookupName)!;
              const strings = attributeValue.split(markerRegex);
              this.parts.push({type: 'attribute', index, name, strings});
              node.removeAttribute(attributeLookupName);
              partIndex += strings.length - 1;
            }
          }
          if (node.tagName === 'TEMPLATE') {
            _prepareTemplate(node as HTMLTemplateElement);
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
                (strings[i] === '') ? createMarker() :
                                      document.createTextNode(strings[i]),
                node);
            this.parts.push({type: 'node', index: index++});
          }
          parent.insertBefore(
              strings[lastIndex] === '' ?
                  createMarker() :
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
            parent.insertBefore(createMarker(), node);
          } else {
            index--;
          }
          this.parts.push({type: 'node', index: index++});
          nodesToRemove.push(node);
          // If we don't have a nextSibling add a marker node.
          // We don't have to check if the next node is going to be removed,
          // because that node will induce a new marker if so.
          if (node.nextSibling === null) {
            parent.insertBefore(createMarker(), node);
          } else {
            index--;
          }
          currentNode = previousNode;
          partIndex++;
        }
      }
    };
    _prepareTemplate(element);
    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode!.removeChild(n);
    }
  }
}

export interface DirectiveFn<P = Part> {
  (part: P): void;
  __litDirective?: true;
}

export const directive = <P = Part>(f: DirectiveFn<P>): DirectiveFn<P> => {
  f.__litDirective = true;
  return f;
};

export const isDirective = (o: any) =>
    typeof o === 'function' && o.__litDirective === true;

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
export const noChange = {};

export const isPrimitive = (value: any) =>
    (value === null ||
     !(typeof value === 'object' || typeof value === 'function'));

/**
 * The Part interface represents a dynamic part of a template instance rendered
 * by lit-html.
 */
export interface Part {
  value: any;

  /**
   * Sets the current part value, but does not write it to the DOM.
   * @param value The value that will be committed.
   */
  setValue(value: any): void;

  /**
   * Commits the current part value, cause it to actually be written to the DOM.
   */
  commit(): void;
}

/**
 * Sets attribute values for AttributeParts, so that the value is only set once
 * even if there are multiple parts for an attribute.
 */
export class AttributeCommitter {
  element: Element;
  name: string;
  strings: string[];
  parts: AttributePart[];
  dirty = true;

  constructor(element: Element, name: string, strings: string[]) {
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.parts = [];
    for (let i = 0; i < strings.length - 1; i++) {
      this.parts[i] = this._createPart();
    }
  }

  /**
   * Creates a single part. Override this to create a differnt type of part.
   */
  protected _createPart(): AttributePart {
    return new AttributePart(this);
  }

  protected _getValue(): any {
    const strings = this.strings;
    const l = strings.length - 1;
    let text = '';

    for (let i = 0; i < l; i++) {
      text += strings[i];
      const part = this.parts[i];
      if (part !== undefined) {
        const v = part.value;
        if (v != null &&
            (Array.isArray(v) || typeof v !== 'string' && v[Symbol.iterator])) {
          for (const t of v) {
            text += t;
          }
        } else {
          text += v;
        }
      }
    }

    text += strings[l];
    return text;
  }

  commit(): void {
    if (this.dirty) {
      this.dirty = false;
      this.element.setAttribute(this.name, this._getValue());
    }
  }
}

export class AttributePart implements Part {
  committer: AttributeCommitter;
  value: any = undefined;

  constructor(comitter: AttributeCommitter) {
    this.committer = comitter;
  }

  setValue(value: any): void {
    if (value !== noChange || !isPrimitive(value) || value !== this.value) {
      this.value = value;
      // If the value is a not a directive, dirty the committer so that it'll
      // call setAttribute. If the value is a directive, it'll dirty the
      // committer if it calls setValue().
      if (!isDirective(value)) {
        this.committer.dirty = true;
      }
    }
  }

  commit() {
    while (isDirective(this.value)) {
      const directive = this.value;
      this.value = noChange;
      directive(this);
    }
    if (this.value === noChange) {
      return;
    }
    this.committer.commit();
  }
}

export class NodePart implements Part {
  templateFactory: TemplateFactory;
  startNode!: Node;
  endNode!: Node;
  value: any = undefined;
  _pendingValue: any = undefined;

  constructor(templateFactory: TemplateFactory) {
    this.templateFactory = templateFactory;
  }

  /**
   * Inserts this part between `ref` and `ref`'s next sibling. Both `ref` and
   * its next sibling must be static, unchanging nodes such as those that appear
   * in a literal section of a template.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterNode(ref: Node) {
    this.startNode = ref;
    this.endNode = ref.nextSibling!;
  }

  /**
   * Appends this part into a parent part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  appendIntoPart(part: NodePart) {
    part._insert(this.startNode = createMarker());
    part._insert(this.endNode = createMarker());
  }

  /**
   * Appends this part after `ref`
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterPart(ref: NodePart) {
    ref._insert(this.startNode = createMarker());
    this.endNode = ref.endNode;
    ref.endNode = this.startNode;
  }

  setValue(value: any): void {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }
    const value = this._pendingValue;
    if (value === noChange) {
      return;
    }
    if (isPrimitive(value)) {
      if (value !== this.value) {
        this._commitText(value);
      }
    } else if (value instanceof TemplateResult) {
      this._commitTemplateResult(value);
    } else if (value instanceof Node) {
      this._commitNode(value);
    } else if (Array.isArray(value) || value[Symbol.iterator]) {
      this._commitIterable(value);
    } else if (value.then !== undefined) {
      this._commitPromise(value);
    } else {
      // Fallback, will render the string representation
      this._commitText(value);
    }
  }

  private _insert(node: Node) {
    this.endNode.parentNode!.insertBefore(node, this.endNode);
  }

  private _commitNode(value: Node): void {
    if (this.value === value) {
      return;
    }
    this.clear();
    this._insert(value);
    this.value = value;
  }

  private _commitText(value: string): void {
    const node = this.startNode.nextSibling!;
    value = value == null ? '' : value;
    if (node === this.endNode.previousSibling &&
        node.nodeType === Node.TEXT_NODE) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      // TODO(justinfagnani): Can we just check if this.value is primitive?
      node.textContent = value;
    } else {
      this._commitNode(document.createTextNode(value));
    }
    this.value = value;
  }

  private _commitTemplateResult(value: TemplateResult): void {
    const template = this.templateFactory(value);
    let instance: TemplateInstance;
    if (this.value && this.value.template === template) {
      instance = this.value;
    } else {
      // Make sure we propagate the template processor from the TemplateResult
      // so that we use it's syntax extension, etc. The template factory comes
      // from the render function so that it can control caching.
      instance =
          new TemplateInstance(template, value.processor, this.templateFactory);
      this._commitNode(instance._clone());
      this.value = instance;
    }
    instance.update(value.values);
  }

  private _commitIterable(value: any): void {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.

    // If _value is an array, then the previous render was of an
    // iterable and _value will contain the NodeParts from the previous
    // render. If _value is not an array, clear this part and make a new
    // array for NodeParts.
    if (!Array.isArray(this.value)) {
      this.value = [];
      this.clear();
    }

    // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render
    const itemParts = this.value as NodePart[];
    let partIndex = 0;
    let itemPart: NodePart|undefined;

    for (const item of value) {
      // Try to reuse an existing part
      itemPart = itemParts[partIndex];

      // If no existing part, create a new one
      if (itemPart === undefined) {
        itemPart = new NodePart(this.templateFactory);
        itemParts.push(itemPart);
        if (partIndex === 0) {
          itemPart.appendIntoPart(this);
        } else {
          itemPart.insertAfterPart(itemParts[partIndex - 1]);
        }
      }
      itemPart.setValue(item);
      itemPart.commit();
      partIndex++;
    }

    if (partIndex < itemParts.length) {
      // Truncate the parts array so _value reflects the current state
      itemParts.length = partIndex;
      this.clear(itemPart && itemPart!.endNode);
    }
  }

  private _commitPromise(value: Promise<any>): void {
    this.value = value;
    value.then((v: any) => {
      if (this.value === value) {
        this.setValue(v);
        this.commit();
      }
    });
  }

  clear(startNode: Node = this.startNode) {
    removeNodes(
        this.startNode.parentNode!, startNode.nextSibling!, this.endNode);
  }
}

/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
export class TemplateInstance {
  _parts: Array<Part|undefined> = [];
  processor: TemplateProcessor;
  _getTemplate: TemplateFactory;
  template: Template;

  constructor(
      template: Template, processor: TemplateProcessor,
      getTemplate: TemplateFactory) {
    this.template = template;
    this.processor = processor;
    this._getTemplate = getTemplate;
  }

  update(values: any[]) {
    let i = 0;
    for (const part of this._parts) {
      if (part !== undefined) {
        part.setValue(values[i]);
      }
      i++;
    }
    for (const part of this._parts) {
      if (part !== undefined) {
        part.commit();
      }
    }
  }

  _clone(): DocumentFragment {
    // Clone the node, rather than importing it, to keep the fragment in the
    // template's document. This leaves the fragment inert so custom elements
    // won't upgrade until after the main document adopts the node.
    const fragment =
        this.template.element.content.cloneNode(true) as DocumentFragment;
    const parts = this.template.parts;
    let partIndex = 0;
    let nodeIndex = 0;

    const _prepareInstance = (fragment: DocumentFragment) => {
      // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null
      const walker = document.createTreeWalker(
          fragment,
          133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                NodeFilter.SHOW_TEXT */
          ,
          null as any,
          false);

      let node = walker.nextNode();
      // Loop through all the nodes and parts of a template
      while (partIndex < parts.length && node !== null) {
        const part = parts[partIndex];
        // Consecutive Parts may have the same node index, in the case of
        // multiple bound attributes on an element. So each iteration we either
        // increment the nodeIndex, if we aren't on a node with a part, or the
        // partIndex if we are. By not incrementing the nodeIndex when we find a
        // part, we allow for the next part to be associated with the current
        // node if neccessasry.
        if (!isTemplatePartActive(part)) {
          this._parts.push(undefined);
          partIndex++;
        } else if (nodeIndex === part.index) {
          if (part.type === 'node') {
            const part = this.processor.handleTextExpression(this._getTemplate);
            part.insertAfterNode(node);
            this._parts.push(part);
          } else {
            this._parts.push(...this.processor.handleAttributeExpressions(
                node as Element, part.name, part.strings));
          }
          partIndex++;
        } else {
          nodeIndex++;
          if (node.nodeName === 'TEMPLATE') {
            _prepareInstance((node as HTMLTemplateElement).content);
          }
          node = walker.nextNode();
        }
      }
    };
    _prepareInstance(fragment);
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
     start: Node|null,
     end: Node|null = null,
     before: Node|null = null): void => {
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
    (container: Node, startNode: Node|null, endNode: Node|null = null):
        void => {
          let node = startNode;
          while (node !== endNode) {
            const n = node!.nextSibling;
            container.removeChild(node!);
            node = n;
          }
        };

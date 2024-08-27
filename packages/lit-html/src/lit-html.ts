/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// IMPORTANT: these imports must be type-only
import type {Directive, DirectiveResult, PartInfo} from './directive.js';
import type {TrustedHTML, TrustedTypesWindow} from 'trusted-types/lib';

const DEV_MODE = true;
const ENABLE_EXTRA_SECURITY_HOOKS = true;
const ENABLE_SHADYDOM_NOPATCH = true;
const NODE_MODE = false;

// Allows minifiers to rename references to globalThis
const global = globalThis;

/**
 * Contains types that are part of the unstable debug API.
 *
 * Everything in this API is not stable and may change or be removed in the future,
 * even on patch releases.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LitUnstable {
  /**
   * When Lit is running in dev mode and `window.emitLitDebugLogEvents` is true,
   * we will emit 'lit-debug' events to window, with live details about the update and render
   * lifecycle. These can be useful for writing debug tooling and visualizations.
   *
   * Please be aware that running with window.emitLitDebugLogEvents has performance overhead,
   * making certain operations that are normally very cheap (like a no-op render) much slower,
   * because we must copy data and dispatch events.
   */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace DebugLog {
    export type Entry =
      | TemplatePrep
      | TemplateInstantiated
      | TemplateInstantiatedAndUpdated
      | TemplateUpdating
      | BeginRender
      | EndRender
      | CommitPartEntry
      | SetPartValue;
    export interface TemplatePrep {
      kind: 'template prep';
      template: Template;
      strings: TemplateStringsArray;
      clonableTemplate: HTMLTemplateElement;
      parts: TemplatePart[];
    }
    export interface BeginRender {
      kind: 'begin render';
      id: number;
      value: unknown;
      container: HTMLElement | DocumentFragment;
      options: RenderOptions | undefined;
      part: ChildPart | undefined;
    }
    export interface EndRender {
      kind: 'end render';
      id: number;
      value: unknown;
      container: HTMLElement | DocumentFragment;
      options: RenderOptions | undefined;
      part: ChildPart;
    }
    export interface TemplateInstantiated {
      kind: 'template instantiated';
      template: Template | CompiledTemplate;
      instance: TemplateInstance;
      options: RenderOptions | undefined;
      fragment: Node;
      parts: Array<Part | undefined>;
      values: unknown[];
    }
    export interface TemplateInstantiatedAndUpdated {
      kind: 'template instantiated and updated';
      template: Template | CompiledTemplate;
      instance: TemplateInstance;
      options: RenderOptions | undefined;
      fragment: Node;
      parts: Array<Part | undefined>;
      values: unknown[];
    }
    export interface TemplateUpdating {
      kind: 'template updating';
      template: Template | CompiledTemplate;
      instance: TemplateInstance;
      options: RenderOptions | undefined;
      parts: Array<Part | undefined>;
      values: unknown[];
    }
    export interface SetPartValue {
      kind: 'set part';
      part: Part;
      value: unknown;
      valueIndex: number;
      values: unknown[];
      templateInstance: TemplateInstance;
    }

    export type CommitPartEntry =
      | CommitNothingToChildEntry
      | CommitText
      | CommitNode
      | CommitAttribute
      | CommitProperty
      | CommitBooleanAttribute
      | CommitEventListener
      | CommitToElementBinding;

    export interface CommitNothingToChildEntry {
      kind: 'commit nothing to child';
      start: ChildNode;
      end: ChildNode | null;
      parent: Disconnectable | undefined;
      options: RenderOptions | undefined;
    }

    export interface CommitText {
      kind: 'commit text';
      node: Text;
      value: unknown;
      options: RenderOptions | undefined;
    }

    export interface CommitNode {
      kind: 'commit node';
      start: Node;
      parent: Disconnectable | undefined;
      value: Node;
      options: RenderOptions | undefined;
    }

    export interface CommitAttribute {
      kind: 'commit attribute';
      element: Element;
      name: string;
      value: unknown;
      options: RenderOptions | undefined;
    }

    export interface CommitProperty {
      kind: 'commit property';
      element: Element;
      name: string;
      value: unknown;
      options: RenderOptions | undefined;
    }

    export interface CommitBooleanAttribute {
      kind: 'commit boolean attribute';
      element: Element;
      name: string;
      value: boolean;
      options: RenderOptions | undefined;
    }

    export interface CommitEventListener {
      kind: 'commit event listener';
      element: Element;
      name: string;
      value: unknown;
      oldListener: unknown;
      options: RenderOptions | undefined;
      // True if we're removing the old event listener (e.g. because settings changed, or value is nothing)
      removeListener: boolean;
      // True if we're adding a new event listener (e.g. because first render, or settings changed)
      addListener: boolean;
    }

    export interface CommitToElementBinding {
      kind: 'commit to element binding';
      element: Element;
      value: unknown;
      options: RenderOptions | undefined;
    }
  }
}

interface DebugLoggingWindow {
  // Even in dev mode, we generally don't want to emit these events, as that's
  // another level of cost, so only emit them when DEV_MODE is true _and_ when
  // window.emitLitDebugEvents is true.
  emitLitDebugLogEvents?: boolean;
}

/**
 * Useful for visualizing and logging insights into what the Lit template system is doing.
 *
 * Compiled out of prod mode builds.
 */
const debugLogEvent = DEV_MODE
  ? (event: LitUnstable.DebugLog.Entry) => {
      const shouldEmit = (global as unknown as DebugLoggingWindow)
        .emitLitDebugLogEvents;
      if (!shouldEmit) {
        return;
      }
      global.dispatchEvent(
        new CustomEvent<LitUnstable.DebugLog.Entry>('lit-debug', {
          detail: event,
        })
      );
    }
  : undefined;
// Used for connecting beginRender and endRender events when there are nested
// renders when errors are thrown preventing an endRender event from being
// called.
let debugLogRenderId = 0;

let issueWarning: (code: string, warning: string) => void;

if (DEV_MODE) {
  global.litIssuedWarnings ??= new Set();

  // Issue a warning, if we haven't already.
  issueWarning = (code: string, warning: string) => {
    warning += code
      ? ` See https://lit.dev/msg/${code} for more information.`
      : '';
    if (!global.litIssuedWarnings!.has(warning)) {
      console.warn(warning);
      global.litIssuedWarnings!.add(warning);
    }
  };

  issueWarning(
    'dev-mode',
    `Lit is in dev mode. Not recommended for production!`
  );
}

const wrap =
  ENABLE_SHADYDOM_NOPATCH &&
  global.ShadyDOM?.inUse &&
  global.ShadyDOM?.noPatch === true
    ? (global.ShadyDOM!.wrap as <T extends Node>(node: T) => T)
    : <T extends Node>(node: T) => node;

const trustedTypes = (global as unknown as TrustedTypesWindow).trustedTypes;

/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = trustedTypes
  ? trustedTypes.createPolicy('lit-html', {
      createHTML: (s) => s,
    })
  : undefined;

/**
 * Used to sanitize any value before it is written into the DOM. This can be
 * used to implement a security policy of allowed and disallowed values in
 * order to prevent XSS attacks.
 *
 * One way of using this callback would be to check attributes and properties
 * against a list of high risk fields, and require that values written to such
 * fields be instances of a class which is safe by construction. Closure's Safe
 * HTML Types is one implementation of this technique (
 * https://github.com/google/safe-html-types/blob/master/doc/safehtml-types.md).
 * The TrustedTypes polyfill in API-only mode could also be used as a basis
 * for this technique (https://github.com/WICG/trusted-types).
 *
 * @param node The HTML node (usually either a #text node or an Element) that
 *     is being written to. Note that this is just an exemplar node, the write
 *     may take place against another instance of the same class of node.
 * @param name The name of an attribute or property (for example, 'href').
 * @param type Indicates whether the write that's about to be performed will
 *     be to a property or a node.
 * @return A function that will sanitize this class of writes.
 */
export type SanitizerFactory = (
  node: Node,
  name: string,
  type: 'property' | 'attribute'
) => ValueSanitizer;

/**
 * A function which can sanitize values that will be written to a specific kind
 * of DOM sink.
 *
 * See SanitizerFactory.
 *
 * @param value The value to sanitize. Will be the actual value passed into
 *     the lit-html template literal, so this could be of any type.
 * @return The value to write to the DOM. Usually the same as the input value,
 *     unless sanitization is needed.
 */
export type ValueSanitizer = (value: unknown) => unknown;

const identityFunction: ValueSanitizer = (value: unknown) => value;
const noopSanitizer: SanitizerFactory = (
  _node: Node,
  _name: string,
  _type: 'property' | 'attribute'
) => identityFunction;

/** Sets the global sanitizer factory. */
const setSanitizer = (newSanitizer: SanitizerFactory) => {
  if (!ENABLE_EXTRA_SECURITY_HOOKS) {
    return;
  }
  if (sanitizerFactoryInternal !== noopSanitizer) {
    throw new Error(
      `Attempted to overwrite existing lit-html security policy.` +
        ` setSanitizeDOMValueFactory should be called at most once.`
    );
  }
  sanitizerFactoryInternal = newSanitizer;
};

/**
 * Only used in internal tests, not a part of the public API.
 */
const _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
  sanitizerFactoryInternal = noopSanitizer;
};

const createSanitizer: SanitizerFactory = (node, name, type) => {
  return sanitizerFactoryInternal(node, name, type);
};

// Added to an attribute name to mark the attribute as bound so we can find
// it easily.
const boundAttributeSuffix = '$lit$';

// This marker is used in many syntactic positions in HTML, so it must be
// a valid element name and attribute name. We don't support dynamic names (yet)
// but this at least ensures that the parse tree is closer to the template
// intention.
const marker = `lit$${Math.random().toFixed(9).slice(2)}$`;

// String used to tell if a comment is a marker comment
const markerMatch = '?' + marker;

// Text used to insert a comment marker node. We use processing instruction
// syntax because it's slightly smaller, but parses as a comment node.
const nodeMarker = `<${markerMatch}>`;

const d =
  NODE_MODE && global.document === undefined
    ? ({
        createTreeWalker() {
          return {};
        },
      } as unknown as Document)
    : document;

// Creates a dynamic marker. We never have to search for these in the DOM.
const createMarker = () => d.createComment('');

// https://tc39.github.io/ecma262/#sec-typeof-operator
type Primitive = null | undefined | boolean | number | string | symbol | bigint;
const isPrimitive = (value: unknown): value is Primitive =>
  value === null || (typeof value != 'object' && typeof value != 'function');
const isArray = Array.isArray;
const isIterable = (value: unknown): value is Iterable<unknown> =>
  isArray(value) ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof (value as any)?.[Symbol.iterator] === 'function';

const SPACE_CHAR = `[ \t\n\f\r]`;
const ATTR_VALUE_CHAR = `[^ \t\n\f\r"'\`<>=]`;
const NAME_CHAR = `[^\\s"'>=/]`;

// These regexes represent the five parsing states that we care about in the
// Template's HTML scanner. They match the *end* of the state they're named
// after.
// Depending on the match, we transition to a new state. If there's no match,
// we stay in the same state.
// Note that the regexes are stateful. We utilize lastIndex and sync it
// across the multiple regexes used. In addition to the five regexes below
// we also dynamically create a regex to find the matching end tags for raw
// text elements.

/**
 * End of text is: `<` followed by:
 *   (comment start) or (tag) or (dynamic tag binding)
 */
const textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
const COMMENT_START = 1;
const TAG_NAME = 2;
const DYNAMIC_TAG_NAME = 3;

const commentEndRegex = /-->/g;
/**
 * Comments not started with <!--, like </{, can be ended by a single `>`
 */
const comment2EndRegex = />/g;

/**
 * The tagEnd regex matches the end of the "inside an opening" tag syntax
 * position. It either matches a `>`, an attribute-like sequence, or the end
 * of the string after a space (attribute-name position ending).
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \t\n\f\r" are HTML space characters:
 * https://infra.spec.whatwg.org/#ascii-whitespace
 *
 * So an attribute is:
 *  * The name: any character except a whitespace character, ("), ('), ">",
 *    "=", or "/". Note: this is different from the HTML spec which also excludes control characters.
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const tagEndRegex = new RegExp(
  `>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`,
  'g'
);
const ENTIRE_MATCH = 0;
const ATTRIBUTE_NAME = 1;
const SPACES_AND_EQUALS = 2;
const QUOTE_CHAR = 3;

const singleQuoteAttrEndRegex = /'/g;
const doubleQuoteAttrEndRegex = /"/g;
/**
 * Matches the raw text elements.
 *
 * Comments are not parsed within raw text elements, so we need to search their
 * text content for marker strings.
 */
const rawTextElement = /^(?:script|style|textarea|title)$/i;

/** TemplateResult types */
const HTML_RESULT = 1;
const SVG_RESULT = 2;
const MATHML_RESULT = 3;

type ResultType = typeof HTML_RESULT | typeof SVG_RESULT | typeof MATHML_RESULT;

// TemplatePart types
// IMPORTANT: these must match the values in PartType
const ATTRIBUTE_PART = 1;
const CHILD_PART = 2;
const PROPERTY_PART = 3;
const BOOLEAN_ATTRIBUTE_PART = 4;
const EVENT_PART = 5;
const ELEMENT_PART = 6;
const COMMENT_PART = 7;

/**
 * The return type of the template tag functions, {@linkcode html} and
 * {@linkcode svg} when it hasn't been compiled by @lit-labs/compiler.
 *
 * A `TemplateResult` object holds all the information about a template
 * expression required to render it: the template strings, expression values,
 * and type of template (html or svg).
 *
 * `TemplateResult` objects do not create any DOM on their own. To create or
 * update DOM you need to render the `TemplateResult`. See
 * [Rendering](https://lit.dev/docs/components/rendering) for more information.
 *
 */
export type UncompiledTemplateResult<T extends ResultType = ResultType> = {
  // This property needs to remain unminified.
  ['_$litType$']: T;
  strings: TemplateStringsArray;
  values: unknown[];
};

/**
 * This is a template result that may be either uncompiled or compiled.
 *
 * In the future, TemplateResult will be this type. If you want to explicitly
 * note that a template result is potentially compiled, you can reference this
 * type and it will continue to behave the same through the next major version
 * of Lit. This can be useful for code that wants to prepare for the next
 * major version of Lit.
 */
export type MaybeCompiledTemplateResult<T extends ResultType = ResultType> =
  | UncompiledTemplateResult<T>
  | CompiledTemplateResult;

/**
 * The return type of the template tag functions, {@linkcode html} and
 * {@linkcode svg}.
 *
 * A `TemplateResult` object holds all the information about a template
 * expression required to render it: the template strings, expression values,
 * and type of template (html or svg).
 *
 * `TemplateResult` objects do not create any DOM on their own. To create or
 * update DOM you need to render the `TemplateResult`. See
 * [Rendering](https://lit.dev/docs/components/rendering) for more information.
 *
 * In Lit 4, this type will be an alias of
 * MaybeCompiledTemplateResult, so that code will get type errors if it assumes
 * that Lit templates are not compiled. When deliberately working with only
 * one, use either {@linkcode CompiledTemplateResult} or
 * {@linkcode UncompiledTemplateResult} explicitly.
 */
export type TemplateResult<T extends ResultType = ResultType> =
  UncompiledTemplateResult<T>;

export type HTMLTemplateResult = TemplateResult<typeof HTML_RESULT>;

export type SVGTemplateResult = TemplateResult<typeof SVG_RESULT>;

export type MathMLTemplateResult = TemplateResult<typeof MATHML_RESULT>;

/**
 * A TemplateResult that has been compiled by @lit-labs/compiler, skipping the
 * prepare step.
 */
export interface CompiledTemplateResult {
  // This is a factory in order to make template initialization lazy
  // and allow ShadyRenderOptions scope to be passed in.
  // This property needs to remain unminified.
  ['_$litType$']: CompiledTemplate;
  values: unknown[];
}

export interface CompiledTemplate extends Omit<Template, 'el'> {
  // el is overridden to be optional. We initialize it on first render
  el?: HTMLTemplateElement;

  // The prepared HTML string to create a template element from.
  // The type is a TemplateStringsArray to guarantee that the value came from
  // source code, preventing a JSON injection attack.
  h: TemplateStringsArray;
}

/**
 * Generates a template literal tag function that returns a TemplateResult with
 * the given result type.
 */
const tag =
  <T extends ResultType>(type: T) =>
  (strings: TemplateStringsArray, ...values: unknown[]): TemplateResult<T> => {
    // Warn against templates octal escape sequences
    // We do this here rather than in render so that the warning is closer to the
    // template definition.
    if (DEV_MODE && strings.some((s) => s === undefined)) {
      console.warn(
        'Some template strings are undefined.\n' +
          'This is probably caused by illegal octal escape sequences.'
      );
    }
    if (DEV_MODE) {
      // Import static-html.js results in a circular dependency which g3 doesn't
      // handle. Instead we know that static values must have the field
      // `_$litStatic$`.
      if (
        values.some((val) => (val as {_$litStatic$: unknown})?.['_$litStatic$'])
      ) {
        issueWarning(
          '',
          `Static values 'literal' or 'unsafeStatic' cannot be used as values to non-static templates.\n` +
            `Please use the static 'html' tag function. See https://lit.dev/docs/templates/expressions/#static-expressions`
        );
      }
    }
    return {
      // This property needs to remain unminified.
      ['_$litType$']: type,
      strings,
      values,
    };
  };

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 *
 * ```ts
 * const header = (title: string) => html`<h1>${title}</h1>`;
 * ```
 *
 * The `html` tag returns a description of the DOM to render as a value. It is
 * lazy, meaning no work is done until the template is rendered. When rendering,
 * if a template comes from the same expression as a previously rendered result,
 * it's efficiently updated instead of replaced.
 */
export const html = tag(HTML_RESULT);

/**
 * Interprets a template literal as an SVG fragment that can efficiently render
 * to and update a container.
 *
 * ```ts
 * const rect = svg`<rect width="10" height="10"></rect>`;
 *
 * const myImage = html`
 *   <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
 *     ${rect}
 *   </svg>`;
 * ```
 *
 * The `svg` *tag function* should only be used for SVG fragments, or elements
 * that would be contained **inside** an `<svg>` HTML element. A common error is
 * placing an `<svg>` *element* in a template tagged with the `svg` tag
 * function. The `<svg>` element is an HTML element and should be used within a
 * template tagged with the {@linkcode html} tag function.
 *
 * In LitElement usage, it's invalid to return an SVG fragment from the
 * `render()` method, as the SVG fragment will be contained within the element's
 * shadow root and thus not be properly contained within an `<svg>` HTML
 * element.
 */
export const svg = tag(SVG_RESULT);

/**
 * Interprets a template literal as MathML fragment that can efficiently render
 * to and update a container.
 *
 * ```ts
 * const num = mathml`<mn>1</mn>`;
 *
 * const eq = html`
 *   <math>
 *     ${num}
 *   </math>`;
 * ```
 *
 * The `mathml` *tag function* should only be used for MathML fragments, or
 * elements that would be contained **inside** a `<math>` HTML element. A common
 * error is placing a `<math>` *element* in a template tagged with the `mathml`
 * tag function. The `<math>` element is an HTML element and should be used
 * within a template tagged with the {@linkcode html} tag function.
 *
 * In LitElement usage, it's invalid to return an MathML fragment from the
 * `render()` method, as the MathML fragment will be contained within the
 * element's shadow root and thus not be properly contained within a `<math>`
 * HTML element.
 */
export const mathml = tag(MATHML_RESULT);

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
export const noChange = Symbol.for('lit-noChange');

/**
 * A sentinel value that signals a ChildPart to fully clear its content.
 *
 * ```ts
 * const button = html`${
 *  user.isAdmin
 *    ? html`<button>DELETE</button>`
 *    : nothing
 * }`;
 * ```
 *
 * Prefer using `nothing` over other falsy values as it provides a consistent
 * behavior between various expression binding contexts.
 *
 * In child expressions, `undefined`, `null`, `''`, and `nothing` all behave the
 * same and render no nodes. In attribute expressions, `nothing` _removes_ the
 * attribute, while `undefined` and `null` will render an empty string. In
 * property expressions `nothing` becomes `undefined`.
 */
export const nothing = Symbol.for('lit-nothing');

/**
 * The cache of prepared templates, keyed by the tagged TemplateStringsArray
 * and _not_ accounting for the specific template tag used. This means that
 * template tags cannot be dynamic - they must statically be one of html, svg,
 * or attr. This restriction simplifies the cache lookup, which is on the hot
 * path for rendering.
 */
const templateCache = new WeakMap<TemplateStringsArray, Template>();

/**
 * Object specifying options for controlling lit-html rendering. Note that
 * while `render` may be called multiple times on the same `container` (and
 * `renderBefore` reference node) to efficiently update the rendered content,
 * only the options passed in during the first render are respected during
 * the lifetime of renders to that unique `container` + `renderBefore`
 * combination.
 */
export interface RenderOptions {
  /**
   * An object to use as the `this` value for event listeners. It's often
   * useful to set this to the host component rendering a template.
   */
  host?: object;
  /**
   * A DOM node before which to render content in the container.
   */
  renderBefore?: ChildNode | null;
  /**
   * Node used for cloning the template (`importNode` will be called on this
   * node). This controls the `ownerDocument` of the rendered DOM, along with
   * any inherited context. Defaults to the global `document`.
   */
  creationScope?: {importNode(node: Node, deep?: boolean): Node};
  /**
   * The initial connected state for the top-level part being rendered. If no
   * `isConnected` option is set, `AsyncDirective`s will be connected by
   * default. Set to `false` if the initial render occurs in a disconnected tree
   * and `AsyncDirective`s should see `isConnected === false` for their initial
   * render. The `part.setConnected()` method must be used subsequent to initial
   * render to change the connected state of the part.
   */
  isConnected?: boolean;
}

const walker = d.createTreeWalker(
  d,
  129 /* NodeFilter.SHOW_{ELEMENT|COMMENT} */
);

let sanitizerFactoryInternal: SanitizerFactory = noopSanitizer;

//
// Classes only below here, const variable declarations only above here...
//
// Keeping variable declarations and classes together improves minification.
// Interfaces and type aliases can be interleaved freely.
//

// Type for classes that have a `_directive` or `_directives[]` field, used by
// `resolveDirective`
export interface DirectiveParent {
  _$parent?: DirectiveParent;
  _$isConnected: boolean;
  __directive?: Directive;
  __directives?: Array<Directive | undefined>;
}

function trustFromTemplateString(
  tsa: TemplateStringsArray,
  stringFromTSA: string
): TrustedHTML {
  // A security check to prevent spoofing of Lit template results.
  // In the future, we may be able to replace this with Array.isTemplateObject,
  // though we might need to make that check inside of the html and svg
  // functions, because precompiled templates don't come in as
  // TemplateStringArray objects.
  if (!isArray(tsa) || !tsa.hasOwnProperty('raw')) {
    let message = 'invalid template strings array';
    if (DEV_MODE) {
      message = `
          Internal Error: expected template strings to be an array
          with a 'raw' field. Faking a template strings array by
          calling html or svg like an ordinary function is effectively
          the same as calling unsafeHtml and can lead to major security
          issues, e.g. opening your code up to XSS attacks.
          If you're using the html or svg tagged template functions normally
          and still seeing this error, please file a bug at
          https://github.com/lit/lit/issues/new?template=bug_report.md
          and include information about your build tooling, if any.
        `
        .trim()
        .replace(/\n */g, '\n');
    }
    throw new Error(message);
  }
  return policy !== undefined
    ? policy.createHTML(stringFromTSA)
    : (stringFromTSA as unknown as TrustedHTML);
}

/**
 * Returns an HTML string for the given TemplateStringsArray and result type
 * (HTML or SVG), along with the case-sensitive bound attribute names in
 * template order. The HTML contains comment markers denoting the `ChildPart`s
 * and suffixes on bound attributes denoting the `AttributeParts`.
 *
 * @param strings template strings array
 * @param type HTML or SVG
 * @return Array containing `[html, attrNames]` (array returned for terseness,
 *     to avoid object fields since this code is shared with non-minified SSR
 *     code)
 */
const getTemplateHtml = (
  strings: TemplateStringsArray,
  type: ResultType
): [TrustedHTML, Array<string>] => {
  // Insert makers into the template HTML to represent the position of
  // bindings. The following code scans the template strings to determine the
  // syntactic position of the bindings. They can be in text position, where
  // we insert an HTML comment, attribute value position, where we insert a
  // sentinel string and re-write the attribute name, or inside a tag where
  // we insert the sentinel string.
  const l = strings.length - 1;
  // Stores the case-sensitive bound attribute names in the order of their
  // parts. ElementParts are also reflected in this array as undefined
  // rather than a string, to disambiguate from attribute bindings.
  const attrNames: Array<string> = [];
  let html =
    type === SVG_RESULT ? '<svg>' : type === MATHML_RESULT ? '<math>' : '';

  // When we're inside a raw text tag (not it's text content), the regex
  // will still be tagRegex so we can find attributes, but will switch to
  // this regex when the tag ends.
  let rawTextEndRegex: RegExp | undefined;

  // The current parsing state, represented as a reference to one of the
  // regexes
  let regex = textEndRegex;

  for (let i = 0; i < l; i++) {
    const s = strings[i];
    // The index of the end of the last attribute name. When this is
    // positive at end of a string, it means we're in an attribute value
    // position and need to rewrite the attribute name.
    // We also use a special value of -2 to indicate that we encountered
    // the end of a string in attribute name position.
    let attrNameEndIndex = -1;
    let attrName: string | undefined;
    let lastIndex = 0;
    let match!: RegExpExecArray | null;

    // The conditions in this loop handle the current parse state, and the
    // assignments to the `regex` variable are the state transitions.
    while (lastIndex < s.length) {
      // Make sure we start searching from where we previously left off
      regex.lastIndex = lastIndex;
      match = regex.exec(s);
      if (match === null) {
        break;
      }
      lastIndex = regex.lastIndex;
      if (regex === textEndRegex) {
        if (match[COMMENT_START] === '!--') {
          regex = commentEndRegex;
        } else if (match[COMMENT_START] !== undefined) {
          // We started a weird comment, like </{
          regex = comment2EndRegex;
        } else if (match[TAG_NAME] !== undefined) {
          if (rawTextElement.test(match[TAG_NAME])) {
            // Record if we encounter a raw-text element. We'll switch to
            // this regex at the end of the tag.
            rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, 'g');
          }
          regex = tagEndRegex;
        } else if (match[DYNAMIC_TAG_NAME] !== undefined) {
          if (DEV_MODE) {
            throw new Error(
              'Bindings in tag names are not supported. Please use static templates instead. ' +
                'See https://lit.dev/docs/templates/expressions/#static-expressions'
            );
          }
          regex = tagEndRegex;
        }
      } else if (regex === tagEndRegex) {
        if (match[ENTIRE_MATCH] === '>') {
          // End of a tag. If we had started a raw-text element, use that
          // regex
          regex = rawTextEndRegex ?? textEndRegex;
          // We may be ending an unquoted attribute value, so make sure we
          // clear any pending attrNameEndIndex
          attrNameEndIndex = -1;
        } else if (match[ATTRIBUTE_NAME] === undefined) {
          // Attribute name position
          attrNameEndIndex = -2;
        } else {
          attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
          attrName = match[ATTRIBUTE_NAME];
          regex =
            match[QUOTE_CHAR] === undefined
              ? tagEndRegex
              : match[QUOTE_CHAR] === '"'
                ? doubleQuoteAttrEndRegex
                : singleQuoteAttrEndRegex;
        }
      } else if (
        regex === doubleQuoteAttrEndRegex ||
        regex === singleQuoteAttrEndRegex
      ) {
        regex = tagEndRegex;
      } else if (regex === commentEndRegex || regex === comment2EndRegex) {
        regex = textEndRegex;
      } else {
        // Not one of the five state regexes, so it must be the dynamically
        // created raw text regex and we're at the close of that element.
        regex = tagEndRegex;
        rawTextEndRegex = undefined;
      }
    }

    if (DEV_MODE) {
      // If we have a attrNameEndIndex, which indicates that we should
      // rewrite the attribute name, assert that we're in a valid attribute
      // position - either in a tag, or a quoted attribute value.
      console.assert(
        attrNameEndIndex === -1 ||
          regex === tagEndRegex ||
          regex === singleQuoteAttrEndRegex ||
          regex === doubleQuoteAttrEndRegex,
        'unexpected parse state B'
      );
    }

    // We have four cases:
    //  1. We're in text position, and not in a raw text element
    //     (regex === textEndRegex): insert a comment marker.
    //  2. We have a non-negative attrNameEndIndex which means we need to
    //     rewrite the attribute name to add a bound attribute suffix.
    //  3. We're at the non-first binding in a multi-binding attribute, use a
    //     plain marker.
    //  4. We're somewhere else inside the tag. If we're in attribute name
    //     position (attrNameEndIndex === -2), add a sequential suffix to
    //     generate a unique attribute name.

    // Detect a binding next to self-closing tag end and insert a space to
    // separate the marker from the tag end:
    const end =
      regex === tagEndRegex && strings[i + 1].startsWith('/>') ? ' ' : '';
    html +=
      regex === textEndRegex
        ? s + nodeMarker
        : attrNameEndIndex >= 0
          ? (attrNames.push(attrName!),
            s.slice(0, attrNameEndIndex) +
              boundAttributeSuffix +
              s.slice(attrNameEndIndex)) +
            marker +
            end
          : s + marker + (attrNameEndIndex === -2 ? i : end);
  }

  const htmlResult: string | TrustedHTML =
    html +
    (strings[l] || '<?>') +
    (type === SVG_RESULT ? '</svg>' : type === MATHML_RESULT ? '</math>' : '');

  // Returned as an array for terseness
  return [trustFromTemplateString(strings, htmlResult), attrNames];
};

/** @internal */
export type {Template};
class Template {
  /** @internal */
  el!: HTMLTemplateElement;

  parts: Array<TemplatePart> = [];

  constructor(
    // This property needs to remain unminified.
    {strings, ['_$litType$']: type}: UncompiledTemplateResult,
    options?: RenderOptions
  ) {
    let node: Node | null;
    let nodeIndex = 0;
    let attrNameIndex = 0;
    const partCount = strings.length - 1;
    const parts = this.parts;

    // Create template element
    const [html, attrNames] = getTemplateHtml(strings, type);
    this.el = Template.createElement(html, options);
    walker.currentNode = this.el.content;

    // Re-parent SVG or MathML nodes into template root
    if (type === SVG_RESULT || type === MATHML_RESULT) {
      const wrapper = this.el.content.firstChild!;
      wrapper.replaceWith(...wrapper.childNodes);
    }

    // Walk the template to find binding markers and create TemplateParts
    while ((node = walker.nextNode()) !== null && parts.length < partCount) {
      if (node.nodeType === 1) {
        if (DEV_MODE) {
          const tag = (node as Element).localName;
          // Warn if `textarea` includes an expression and throw if `template`
          // does since these are not supported. We do this by checking
          // innerHTML for anything that looks like a marker. This catches
          // cases like bindings in textarea there markers turn into text nodes.
          if (
            /^(?:textarea|template)$/i!.test(tag) &&
            (node as Element).innerHTML.includes(marker)
          ) {
            const m =
              `Expressions are not supported inside \`${tag}\` ` +
              `elements. See https://lit.dev/msg/expression-in-${tag} for more ` +
              `information.`;
            if (tag === 'template') {
              throw new Error(m);
            } else issueWarning('', m);
          }
        }
        // TODO (justinfagnani): for attempted dynamic tag names, we don't
        // increment the bindingIndex, and it'll be off by 1 in the element
        // and off by two after it.
        if ((node as Element).hasAttributes()) {
          for (const name of (node as Element).getAttributeNames()) {
            if (name.endsWith(boundAttributeSuffix)) {
              const realName = attrNames[attrNameIndex++];
              const value = (node as Element).getAttribute(name)!;
              const statics = value.split(marker);
              const m = /([.?@])?(.*)/.exec(realName)!;
              parts.push({
                type: ATTRIBUTE_PART,
                index: nodeIndex,
                name: m[2],
                strings: statics,
                ctor:
                  m[1] === '.'
                    ? PropertyPart
                    : m[1] === '?'
                      ? BooleanAttributePart
                      : m[1] === '@'
                        ? EventPart
                        : AttributePart,
              });
              (node as Element).removeAttribute(name);
            } else if (name.startsWith(marker)) {
              parts.push({
                type: ELEMENT_PART,
                index: nodeIndex,
              });
              (node as Element).removeAttribute(name);
            }
          }
        }
        // TODO (justinfagnani): benchmark the regex against testing for each
        // of the 3 raw text element names.
        if (rawTextElement.test((node as Element).tagName)) {
          // For raw text elements we need to split the text content on
          // markers, create a Text node for each segment, and create
          // a TemplatePart for each marker.
          const strings = (node as Element).textContent!.split(marker);
          const lastIndex = strings.length - 1;
          if (lastIndex > 0) {
            (node as Element).textContent = trustedTypes
              ? (trustedTypes.emptyScript as unknown as '')
              : '';
            // Generate a new text node for each literal section
            // These nodes are also used as the markers for node parts
            // We can't use empty text nodes as markers because they're
            // normalized when cloning in IE (could simplify when
            // IE is no longer supported)
            for (let i = 0; i < lastIndex; i++) {
              (node as Element).append(strings[i], createMarker());
              // Walk past the marker node we just added
              walker.nextNode();
              parts.push({type: CHILD_PART, index: ++nodeIndex});
            }
            // Note because this marker is added after the walker's current
            // node, it will be walked to in the outer loop (and ignored), so
            // we don't need to adjust nodeIndex here
            (node as Element).append(strings[lastIndex], createMarker());
          }
        }
      } else if (node.nodeType === 8) {
        const data = (node as Comment).data;
        if (data === markerMatch) {
          parts.push({type: CHILD_PART, index: nodeIndex});
        } else {
          let i = -1;
          while ((i = (node as Comment).data.indexOf(marker, i + 1)) !== -1) {
            // Comment node has a binding marker inside, make an inactive part
            // The binding won't work, but subsequent bindings will
            parts.push({type: COMMENT_PART, index: nodeIndex});
            // Move to the end of the match
            i += marker.length - 1;
          }
        }
      }
      nodeIndex++;
    }

    if (DEV_MODE) {
      // If there was a duplicate attribute on a tag, then when the tag is
      // parsed into an element the attribute gets de-duplicated. We can detect
      // this mismatch if we haven't precisely consumed every attribute name
      // when preparing the template. This works because `attrNames` is built
      // from the template string and `attrNameIndex` comes from processing the
      // resulting DOM.
      if (attrNames.length !== attrNameIndex) {
        throw new Error(
          `Detected duplicate attribute bindings. This occurs if your template ` +
            `has duplicate attributes on an element tag. For example ` +
            `"<input ?disabled=\${true} ?disabled=\${false}>" contains a ` +
            `duplicate "disabled" attribute. The error was detected in ` +
            `the following template: \n` +
            '`' +
            strings.join('${...}') +
            '`'
        );
      }
    }

    // We could set walker.currentNode to another node here to prevent a memory
    // leak, but every time we prepare a template, we immediately render it
    // and re-use the walker in new TemplateInstance._clone().
    debugLogEvent &&
      debugLogEvent({
        kind: 'template prep',
        template: this,
        clonableTemplate: this.el,
        parts: this.parts,
        strings,
      });
  }

  // Overridden via `litHtmlPolyfillSupport` to provide platform support.
  /** @nocollapse */
  static createElement(html: TrustedHTML, _options?: RenderOptions) {
    const el = d.createElement('template');
    el.innerHTML = html as unknown as string;
    return el;
  }
}

export interface Disconnectable {
  _$parent?: Disconnectable;
  _$disconnectableChildren?: Set<Disconnectable>;
  // Rather than hold connection state on instances, Disconnectables recursively
  // fetch the connection state from the RootPart they are connected in via
  // getters up the Disconnectable tree via _$parent references. This pushes the
  // cost of tracking the isConnected state to `AsyncDirectives`, and avoids
  // needing to pass all Disconnectables (parts, template instances, and
  // directives) their connection state each time it changes, which would be
  // costly for trees that have no AsyncDirectives.
  _$isConnected: boolean;
}

function resolveDirective(
  part: ChildPart | AttributePart | ElementPart,
  value: unknown,
  parent: DirectiveParent = part,
  attributeIndex?: number
): unknown {
  // Bail early if the value is explicitly noChange. Note, this means any
  // nested directive is still attached and is not run.
  if (value === noChange) {
    return value;
  }
  let currentDirective =
    attributeIndex !== undefined
      ? (parent as AttributePart).__directives?.[attributeIndex]
      : (parent as ChildPart | ElementPart | Directive).__directive;
  const nextDirectiveConstructor = isPrimitive(value)
    ? undefined
    : // This property needs to remain unminified.
      (value as DirectiveResult)['_$litDirective$'];
  if (currentDirective?.constructor !== nextDirectiveConstructor) {
    // This property needs to remain unminified.
    currentDirective?.['_$notifyDirectiveConnectionChanged']?.(false);
    if (nextDirectiveConstructor === undefined) {
      currentDirective = undefined;
    } else {
      currentDirective = new nextDirectiveConstructor(part as PartInfo);
      currentDirective._$initialize(part, parent, attributeIndex);
    }
    if (attributeIndex !== undefined) {
      ((parent as AttributePart).__directives ??= [])[attributeIndex] =
        currentDirective;
    } else {
      (parent as ChildPart | Directive).__directive = currentDirective;
    }
  }
  if (currentDirective !== undefined) {
    value = resolveDirective(
      part,
      currentDirective._$resolve(part, (value as DirectiveResult).values),
      currentDirective,
      attributeIndex
    );
  }
  return value;
}

export type {TemplateInstance};
/**
 * An updateable instance of a Template. Holds references to the Parts used to
 * update the template instance.
 */
class TemplateInstance implements Disconnectable {
  _$template: Template;
  _$parts: Array<Part | undefined> = [];

  /** @internal */
  _$parent: ChildPart;
  /** @internal */
  _$disconnectableChildren?: Set<Disconnectable> = undefined;

  constructor(template: Template, parent: ChildPart) {
    this._$template = template;
    this._$parent = parent;
  }

  // Called by ChildPart parentNode getter
  get parentNode() {
    return this._$parent.parentNode;
  }

  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }

  // This method is separate from the constructor because we need to return a
  // DocumentFragment and we don't want to hold onto it with an instance field.
  _clone(options: RenderOptions | undefined) {
    const {
      el: {content},
      parts: parts,
    } = this._$template;
    const fragment = (options?.creationScope ?? d).importNode(content, true);
    walker.currentNode = fragment;

    let node = walker.nextNode()!;
    let nodeIndex = 0;
    let partIndex = 0;
    let templatePart = parts[0];

    while (templatePart !== undefined) {
      if (nodeIndex === templatePart.index) {
        let part: Part | undefined;
        if (templatePart.type === CHILD_PART) {
          part = new ChildPart(
            node as HTMLElement,
            node.nextSibling,
            this,
            options
          );
        } else if (templatePart.type === ATTRIBUTE_PART) {
          part = new templatePart.ctor(
            node as HTMLElement,
            templatePart.name,
            templatePart.strings,
            this,
            options
          );
        } else if (templatePart.type === ELEMENT_PART) {
          part = new ElementPart(node as HTMLElement, this, options);
        }
        this._$parts.push(part);
        templatePart = parts[++partIndex];
      }
      if (nodeIndex !== templatePart?.index) {
        node = walker.nextNode()!;
        nodeIndex++;
      }
    }
    // We need to set the currentNode away from the cloned tree so that we
    // don't hold onto the tree even if the tree is detached and should be
    // freed.
    walker.currentNode = d;
    return fragment;
  }

  _update(values: Array<unknown>) {
    let i = 0;
    for (const part of this._$parts) {
      if (part !== undefined) {
        debugLogEvent &&
          debugLogEvent({
            kind: 'set part',
            part,
            value: values[i],
            valueIndex: i,
            values,
            templateInstance: this,
          });
        if ((part as AttributePart).strings !== undefined) {
          (part as AttributePart)._$setValue(values, part as AttributePart, i);
          // The number of values the part consumes is part.strings.length - 1
          // since values are in between template spans. We increment i by 1
          // later in the loop, so increment it by part.strings.length - 2 here
          i += (part as AttributePart).strings!.length - 2;
        } else {
          part._$setValue(values[i]);
        }
      }
      i++;
    }
  }
}

/*
 * Parts
 */
type AttributeTemplatePart = {
  readonly type: typeof ATTRIBUTE_PART;
  readonly index: number;
  readonly name: string;
  readonly ctor: typeof AttributePart;
  readonly strings: ReadonlyArray<string>;
};
type ChildTemplatePart = {
  readonly type: typeof CHILD_PART;
  readonly index: number;
};
type ElementTemplatePart = {
  readonly type: typeof ELEMENT_PART;
  readonly index: number;
};
type CommentTemplatePart = {
  readonly type: typeof COMMENT_PART;
  readonly index: number;
};

/**
 * A TemplatePart represents a dynamic part in a template, before the template
 * is instantiated. When a template is instantiated Parts are created from
 * TemplateParts.
 */
type TemplatePart =
  | ChildTemplatePart
  | AttributeTemplatePart
  | ElementTemplatePart
  | CommentTemplatePart;

export type Part =
  | ChildPart
  | AttributePart
  | PropertyPart
  | BooleanAttributePart
  | ElementPart
  | EventPart;

export type {ChildPart};
class ChildPart implements Disconnectable {
  readonly type = CHILD_PART;
  readonly options: RenderOptions | undefined;
  _$committedValue: unknown = nothing;
  /** @internal */
  __directive?: Directive;
  /** @internal */
  _$startNode: ChildNode;
  /** @internal */
  _$endNode: ChildNode | null;
  private _textSanitizer: ValueSanitizer | undefined;
  /** @internal */
  _$parent: Disconnectable | undefined;
  /**
   * Connection state for RootParts only (i.e. ChildPart without _$parent
   * returned from top-level `render`). This field is unused otherwise. The
   * intention would be clearer if we made `RootPart` a subclass of `ChildPart`
   * with this field (and a different _$isConnected getter), but the subclass
   * caused a perf regression, possibly due to making call sites polymorphic.
   * @internal
   */
  __isConnected: boolean;

  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    // ChildParts that are not at the root should always be created with a
    // parent; only RootChildNode's won't, so they return the local isConnected
    // state
    return this._$parent?._$isConnected ?? this.__isConnected;
  }

  // The following fields will be patched onto ChildParts when required by
  // AsyncDirective
  /** @internal */
  _$disconnectableChildren?: Set<Disconnectable> = undefined;
  /** @internal */
  _$notifyConnectionChanged?(
    isConnected: boolean,
    removeFromParent?: boolean,
    from?: number
  ): void;
  /** @internal */
  _$reparentDisconnectables?(parent: Disconnectable): void;

  constructor(
    startNode: ChildNode,
    endNode: ChildNode | null,
    parent: TemplateInstance | ChildPart | undefined,
    options: RenderOptions | undefined
  ) {
    this._$startNode = startNode;
    this._$endNode = endNode;
    this._$parent = parent;
    this.options = options;
    // Note __isConnected is only ever accessed on RootParts (i.e. when there is
    // no _$parent); the value on a non-root-part is "don't care", but checking
    // for parent would be more code
    this.__isConnected = options?.isConnected ?? true;
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      // Explicitly initialize for consistent class shape.
      this._textSanitizer = undefined;
    }
  }

  /**
   * The parent node into which the part renders its content.
   *
   * A ChildPart's content consists of a range of adjacent child nodes of
   * `.parentNode`, possibly bordered by 'marker nodes' (`.startNode` and
   * `.endNode`).
   *
   * - If both `.startNode` and `.endNode` are non-null, then the part's content
   * consists of all siblings between `.startNode` and `.endNode`, exclusively.
   *
   * - If `.startNode` is non-null but `.endNode` is null, then the part's
   * content consists of all siblings following `.startNode`, up to and
   * including the last child of `.parentNode`. If `.endNode` is non-null, then
   * `.startNode` will always be non-null.
   *
   * - If both `.endNode` and `.startNode` are null, then the part's content
   * consists of all child nodes of `.parentNode`.
   */
  get parentNode(): Node {
    let parentNode: Node = wrap(this._$startNode).parentNode!;
    const parent = this._$parent;
    if (
      parent !== undefined &&
      parentNode?.nodeType === 11 /* Node.DOCUMENT_FRAGMENT */
    ) {
      // If the parentNode is a DocumentFragment, it may be because the DOM is
      // still in the cloned fragment during initial render; if so, get the real
      // parentNode the part will be committed into by asking the parent.
      parentNode = (parent as ChildPart | TemplateInstance).parentNode;
    }
    return parentNode;
  }

  /**
   * The part's leading marker node, if any. See `.parentNode` for more
   * information.
   */
  get startNode(): Node | null {
    return this._$startNode;
  }

  /**
   * The part's trailing marker node, if any. See `.parentNode` for more
   * information.
   */
  get endNode(): Node | null {
    return this._$endNode;
  }

  _$setValue(value: unknown, directiveParent: DirectiveParent = this): void {
    if (DEV_MODE && this.parentNode === null) {
      throw new Error(
        `This \`ChildPart\` has no \`parentNode\` and therefore cannot accept a value. This likely means the element containing the part was manipulated in an unsupported way outside of Lit's control such that the part's marker nodes were ejected from DOM. For example, setting the element's \`innerHTML\` or \`textContent\` can do this.`
      );
    }
    value = resolveDirective(this, value, directiveParent);
    if (isPrimitive(value)) {
      // Non-rendering child values. It's important that these do not render
      // empty text nodes to avoid issues with preventing default <slot>
      // fallback content.
      if (value === nothing || value == null || value === '') {
        if (this._$committedValue !== nothing) {
          debugLogEvent &&
            debugLogEvent({
              kind: 'commit nothing to child',
              start: this._$startNode,
              end: this._$endNode,
              parent: this._$parent,
              options: this.options,
            });
          this._$clear();
        }
        this._$committedValue = nothing;
      } else if (value !== this._$committedValue && value !== noChange) {
        this._commitText(value);
      }
      // This property needs to remain unminified.
    } else if ((value as TemplateResult)['_$litType$'] !== undefined) {
      this._commitTemplateResult(value as TemplateResult);
    } else if ((value as Node).nodeType !== undefined) {
      if (DEV_MODE && this.options?.host === value) {
        this._commitText(
          `[probable mistake: rendered a template's host in itself ` +
            `(commonly caused by writing \${this} in a template]`
        );
        console.warn(
          `Attempted to render the template host`,
          value,
          `inside itself. This is almost always a mistake, and in dev mode `,
          `we render some warning text. In production however, we'll `,
          `render it, which will usually result in an error, and sometimes `,
          `in the element disappearing from the DOM.`
        );
        return;
      }
      this._commitNode(value as Node);
    } else if (isIterable(value)) {
      this._commitIterable(value);
    } else {
      // Fallback, will render the string representation
      this._commitText(value);
    }
  }

  private _insert<T extends Node>(node: T) {
    return wrap(wrap(this._$startNode).parentNode!).insertBefore(
      node,
      this._$endNode
    );
  }

  private _commitNode(value: Node): void {
    if (this._$committedValue !== value) {
      this._$clear();
      if (
        ENABLE_EXTRA_SECURITY_HOOKS &&
        sanitizerFactoryInternal !== noopSanitizer
      ) {
        const parentNodeName = this._$startNode.parentNode?.nodeName;
        if (parentNodeName === 'STYLE' || parentNodeName === 'SCRIPT') {
          let message = 'Forbidden';
          if (DEV_MODE) {
            if (parentNodeName === 'STYLE') {
              message =
                `Lit does not support binding inside style nodes. ` +
                `This is a security risk, as style injection attacks can ` +
                `exfiltrate data and spoof UIs. ` +
                `Consider instead using css\`...\` literals ` +
                `to compose styles, and do dynamic styling with ` +
                `css custom properties, ::parts, <slot>s, ` +
                `and by mutating the DOM rather than stylesheets.`;
            } else {
              message =
                `Lit does not support binding inside script nodes. ` +
                `This is a security risk, as it could allow arbitrary ` +
                `code execution.`;
            }
          }
          throw new Error(message);
        }
      }
      debugLogEvent &&
        debugLogEvent({
          kind: 'commit node',
          start: this._$startNode,
          parent: this._$parent,
          value: value,
          options: this.options,
        });
      this._$committedValue = this._insert(value);
    }
  }

  private _commitText(value: unknown): void {
    // If the committed value is a primitive it means we called _commitText on
    // the previous render, and we know that this._$startNode.nextSibling is a
    // Text node. We can now just replace the text content (.data) of the node.
    if (
      this._$committedValue !== nothing &&
      isPrimitive(this._$committedValue)
    ) {
      const node = wrap(this._$startNode).nextSibling as Text;
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(node, 'data', 'property');
        }
        value = this._textSanitizer(value);
      }
      debugLogEvent &&
        debugLogEvent({
          kind: 'commit text',
          node,
          value,
          options: this.options,
        });
      (node as Text).data = value as string;
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        const textNode = d.createTextNode('');
        this._commitNode(textNode);
        // When setting text content, for security purposes it matters a lot
        // what the parent is. For example, <style> and <script> need to be
        // handled with care, while <span> does not. So first we need to put a
        // text node into the document, then we can sanitize its content.
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(textNode, 'data', 'property');
        }
        value = this._textSanitizer(value);
        debugLogEvent &&
          debugLogEvent({
            kind: 'commit text',
            node: textNode,
            value,
            options: this.options,
          });
        textNode.data = value as string;
      } else {
        this._commitNode(d.createTextNode(value as string));
        debugLogEvent &&
          debugLogEvent({
            kind: 'commit text',
            node: wrap(this._$startNode).nextSibling as Text,
            value,
            options: this.options,
          });
      }
    }
    this._$committedValue = value;
  }

  private _commitTemplateResult(
    result: TemplateResult | CompiledTemplateResult
  ): void {
    // This property needs to remain unminified.
    const {values, ['_$litType$']: type} = result;
    // If $litType$ is a number, result is a plain TemplateResult and we get
    // the template from the template cache. If not, result is a
    // CompiledTemplateResult and _$litType$ is a CompiledTemplate and we need
    // to create the <template> element the first time we see it.
    const template: Template | CompiledTemplate =
      typeof type === 'number'
        ? this._$getTemplate(result as UncompiledTemplateResult)
        : (type.el === undefined &&
            (type.el = Template.createElement(
              trustFromTemplateString(type.h, type.h[0]),
              this.options
            )),
          type);

    if ((this._$committedValue as TemplateInstance)?._$template === template) {
      debugLogEvent &&
        debugLogEvent({
          kind: 'template updating',
          template,
          instance: this._$committedValue as TemplateInstance,
          parts: (this._$committedValue as TemplateInstance)._$parts,
          options: this.options,
          values,
        });
      (this._$committedValue as TemplateInstance)._update(values);
    } else {
      const instance = new TemplateInstance(template as Template, this);
      const fragment = instance._clone(this.options);
      debugLogEvent &&
        debugLogEvent({
          kind: 'template instantiated',
          template,
          instance,
          parts: instance._$parts,
          options: this.options,
          fragment,
          values,
        });
      instance._update(values);
      debugLogEvent &&
        debugLogEvent({
          kind: 'template instantiated and updated',
          template,
          instance,
          parts: instance._$parts,
          options: this.options,
          fragment,
          values,
        });
      this._commitNode(fragment);
      this._$committedValue = instance;
    }
  }

  // Overridden via `litHtmlPolyfillSupport` to provide platform support.
  /** @internal */
  _$getTemplate(result: UncompiledTemplateResult) {
    let template = templateCache.get(result.strings);
    if (template === undefined) {
      templateCache.set(result.strings, (template = new Template(result)));
    }
    return template;
  }

  private _commitIterable(value: Iterable<unknown>): void {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.

    // If value is an array, then the previous render was of an
    // iterable and value will contain the ChildParts from the previous
    // render. If value is not an array, clear this part and make a new
    // array for ChildParts.
    if (!isArray(this._$committedValue)) {
      this._$committedValue = [];
      this._$clear();
    }

    // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render
    const itemParts = this._$committedValue as ChildPart[];
    let partIndex = 0;
    let itemPart: ChildPart | undefined;

    for (const item of value) {
      if (partIndex === itemParts.length) {
        // If no existing part, create a new one
        // TODO (justinfagnani): test perf impact of always creating two parts
        // instead of sharing parts between nodes
        // https://github.com/lit/lit/issues/1266
        itemParts.push(
          (itemPart = new ChildPart(
            this._insert(createMarker()),
            this._insert(createMarker()),
            this,
            this.options
          ))
        );
      } else {
        // Reuse an existing part
        itemPart = itemParts[partIndex];
      }
      itemPart._$setValue(item);
      partIndex++;
    }

    if (partIndex < itemParts.length) {
      // itemParts always have end nodes
      this._$clear(
        itemPart && wrap(itemPart._$endNode!).nextSibling,
        partIndex
      );
      // Truncate the parts array so _value reflects the current state
      itemParts.length = partIndex;
    }
  }

  /**
   * Removes the nodes contained within this Part from the DOM.
   *
   * @param start Start node to clear from, for clearing a subset of the part's
   *     DOM (used when truncating iterables)
   * @param from  When `start` is specified, the index within the iterable from
   *     which ChildParts are being removed, used for disconnecting directives in
   *     those Parts.
   *
   * @internal
   */
  _$clear(
    start: ChildNode | null = wrap(this._$startNode).nextSibling,
    from?: number
  ) {
    this._$notifyConnectionChanged?.(false, true, from);
    while (start && start !== this._$endNode) {
      const n = wrap(start!).nextSibling;
      (wrap(start!) as Element).remove();
      start = n;
    }
  }
  /**
   * Implementation of RootPart's `isConnected`. Note that this method
   * should only be called on `RootPart`s (the `ChildPart` returned from a
   * top-level `render()` call). It has no effect on non-root ChildParts.
   * @param isConnected Whether to set
   * @internal
   */
  setConnected(isConnected: boolean) {
    if (this._$parent === undefined) {
      this.__isConnected = isConnected;
      this._$notifyConnectionChanged?.(isConnected);
    } else if (DEV_MODE) {
      throw new Error(
        'part.setConnected() may only be called on a ' +
          'RootPart returned from render().'
      );
    }
  }
}

/**
 * A top-level `ChildPart` returned from `render` that manages the connected
 * state of `AsyncDirective`s created throughout the tree below it.
 */
export interface RootPart extends ChildPart {
  /**
   * Sets the connection state for `AsyncDirective`s contained within this root
   * ChildPart.
   *
   * lit-html does not automatically monitor the connectedness of DOM rendered;
   * as such, it is the responsibility of the caller to `render` to ensure that
   * `part.setConnected(false)` is called before the part object is potentially
   * discarded, to ensure that `AsyncDirective`s have a chance to dispose of
   * any resources being held. If a `RootPart` that was previously
   * disconnected is subsequently re-connected (and its `AsyncDirective`s should
   * re-connect), `setConnected(true)` should be called.
   *
   * @param isConnected Whether directives within this tree should be connected
   * or not
   */
  setConnected(isConnected: boolean): void;
}

export type {AttributePart};
class AttributePart implements Disconnectable {
  readonly type:
    | typeof ATTRIBUTE_PART
    | typeof PROPERTY_PART
    | typeof BOOLEAN_ATTRIBUTE_PART
    | typeof EVENT_PART = ATTRIBUTE_PART;
  readonly element: HTMLElement;
  readonly name: string;
  readonly options: RenderOptions | undefined;

  /**
   * If this attribute part represents an interpolation, this contains the
   * static strings of the interpolation. For single-value, complete bindings,
   * this is undefined.
   */
  readonly strings?: ReadonlyArray<string>;
  /** @internal */
  _$committedValue: unknown | Array<unknown> = nothing;
  /** @internal */
  __directives?: Array<Directive | undefined>;
  /** @internal */
  _$parent: Disconnectable;
  /** @internal */
  _$disconnectableChildren?: Set<Disconnectable> = undefined;

  protected _sanitizer: ValueSanitizer | undefined;

  get tagName() {
    return this.element.tagName;
  }

  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }

  constructor(
    element: HTMLElement,
    name: string,
    strings: ReadonlyArray<string>,
    parent: Disconnectable,
    options: RenderOptions | undefined
  ) {
    this.element = element;
    this.name = name;
    this._$parent = parent;
    this.options = options;
    if (strings.length > 2 || strings[0] !== '' || strings[1] !== '') {
      this._$committedValue = new Array(strings.length - 1).fill(new String());
      this.strings = strings;
    } else {
      this._$committedValue = nothing;
    }
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._sanitizer = undefined;
    }
  }

  /**
   * Sets the value of this part by resolving the value from possibly multiple
   * values and static strings and committing it to the DOM.
   * If this part is single-valued, `this._strings` will be undefined, and the
   * method will be called with a single value argument. If this part is
   * multi-value, `this._strings` will be defined, and the method is called
   * with the value array of the part's owning TemplateInstance, and an offset
   * into the value array from which the values should be read.
   * This method is overloaded this way to eliminate short-lived array slices
   * of the template instance values, and allow a fast-path for single-valued
   * parts.
   *
   * @param value The part value, or an array of values for multi-valued parts
   * @param valueIndex the index to start reading values from. `undefined` for
   *   single-valued parts
   * @param noCommit causes the part to not commit its value to the DOM. Used
   *   in hydration to prime attribute parts with their first-rendered value,
   *   but not set the attribute, and in SSR to no-op the DOM operation and
   *   capture the value for serialization.
   *
   * @internal
   */
  _$setValue(
    value: unknown | Array<unknown>,
    directiveParent: DirectiveParent = this,
    valueIndex?: number,
    noCommit?: boolean
  ) {
    const strings = this.strings;

    // Whether any of the values has changed, for dirty-checking
    let change = false;

    if (strings === undefined) {
      // Single-value binding case
      value = resolveDirective(this, value, directiveParent, 0);
      change =
        !isPrimitive(value) ||
        (value !== this._$committedValue && value !== noChange);
      if (change) {
        this._$committedValue = value;
      }
    } else {
      // Interpolation case
      const values = value as Array<unknown>;
      value = strings[0];

      let i, v;
      for (i = 0; i < strings.length - 1; i++) {
        v = resolveDirective(this, values[valueIndex! + i], directiveParent, i);

        if (v === noChange) {
          // If the user-provided value is `noChange`, use the previous value
          v = (this._$committedValue as Array<unknown>)[i];
        }
        change ||=
          !isPrimitive(v) || v !== (this._$committedValue as Array<unknown>)[i];
        if (v === nothing) {
          value = nothing;
        } else if (value !== nothing) {
          value += (v ?? '') + strings[i + 1];
        }
        // We always record each value, even if one is `nothing`, for future
        // change detection.
        (this._$committedValue as Array<unknown>)[i] = v;
      }
    }
    if (change && !noCommit) {
      this._commitValue(value);
    }
  }

  /** @internal */
  _commitValue(value: unknown) {
    if (value === nothing) {
      (wrap(this.element) as Element).removeAttribute(this.name);
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._sanitizer === undefined) {
          this._sanitizer = sanitizerFactoryInternal(
            this.element,
            this.name,
            'attribute'
          );
        }
        value = this._sanitizer(value ?? '');
      }
      debugLogEvent &&
        debugLogEvent({
          kind: 'commit attribute',
          element: this.element,
          name: this.name,
          value,
          options: this.options,
        });
      (wrap(this.element) as Element).setAttribute(
        this.name,
        (value ?? '') as string
      );
    }
  }
}

export type {PropertyPart};
class PropertyPart extends AttributePart {
  override readonly type = PROPERTY_PART;

  /** @internal */
  override _commitValue(value: unknown) {
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      if (this._sanitizer === undefined) {
        this._sanitizer = sanitizerFactoryInternal(
          this.element,
          this.name,
          'property'
        );
      }
      value = this._sanitizer(value);
    }
    debugLogEvent &&
      debugLogEvent({
        kind: 'commit property',
        element: this.element,
        name: this.name,
        value,
        options: this.options,
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.element as any)[this.name] = value === nothing ? undefined : value;
  }
}

export type {BooleanAttributePart};
class BooleanAttributePart extends AttributePart {
  override readonly type = BOOLEAN_ATTRIBUTE_PART;

  /** @internal */
  override _commitValue(value: unknown) {
    debugLogEvent &&
      debugLogEvent({
        kind: 'commit boolean attribute',
        element: this.element,
        name: this.name,
        value: !!(value && value !== nothing),
        options: this.options,
      });
    (wrap(this.element) as Element).toggleAttribute(
      this.name,
      !!value && value !== nothing
    );
  }
}

type EventListenerWithOptions = EventListenerOrEventListenerObject &
  Partial<AddEventListenerOptions>;

/**
 * An AttributePart that manages an event listener via add/removeEventListener.
 *
 * This part works by adding itself as the event listener on an element, then
 * delegating to the value passed to it. This reduces the number of calls to
 * add/removeEventListener if the listener changes frequently, such as when an
 * inline function is used as a listener.
 *
 * Because event options are passed when adding listeners, we must take case
 * to add and remove the part as a listener when the event options change.
 */
export type {EventPart};
class EventPart extends AttributePart {
  override readonly type = EVENT_PART;

  constructor(
    element: HTMLElement,
    name: string,
    strings: ReadonlyArray<string>,
    parent: Disconnectable,
    options: RenderOptions | undefined
  ) {
    super(element, name, strings, parent, options);

    if (DEV_MODE && this.strings !== undefined) {
      throw new Error(
        `A \`<${element.localName}>\` has a \`@${name}=...\` listener with ` +
          'invalid content. Event listeners in templates must have exactly ' +
          'one expression and no surrounding text.'
      );
    }
  }

  // EventPart does not use the base _$setValue/_resolveValue implementation
  // since the dirty checking is more complex
  /** @internal */
  override _$setValue(
    newListener: unknown,
    directiveParent: DirectiveParent = this
  ) {
    newListener =
      resolveDirective(this, newListener, directiveParent, 0) ?? nothing;
    if (newListener === noChange) {
      return;
    }
    const oldListener = this._$committedValue;

    // If the new value is nothing or any options change we have to remove the
    // part as a listener.
    const shouldRemoveListener =
      (newListener === nothing && oldListener !== nothing) ||
      (newListener as EventListenerWithOptions).capture !==
        (oldListener as EventListenerWithOptions).capture ||
      (newListener as EventListenerWithOptions).once !==
        (oldListener as EventListenerWithOptions).once ||
      (newListener as EventListenerWithOptions).passive !==
        (oldListener as EventListenerWithOptions).passive;

    // If the new value is not nothing and we removed the listener, we have
    // to add the part as a listener.
    const shouldAddListener =
      newListener !== nothing &&
      (oldListener === nothing || shouldRemoveListener);

    debugLogEvent &&
      debugLogEvent({
        kind: 'commit event listener',
        element: this.element,
        name: this.name,
        value: newListener,
        options: this.options,
        removeListener: shouldRemoveListener,
        addListener: shouldAddListener,
        oldListener,
      });
    if (shouldRemoveListener) {
      this.element.removeEventListener(
        this.name,
        this,
        oldListener as EventListenerWithOptions
      );
    }
    if (shouldAddListener) {
      // Beware: IE11 and Chrome 41 don't like using the listener as the
      // options object. Figure out how to deal w/ this in IE11 - maybe
      // patch addEventListener?
      this.element.addEventListener(
        this.name,
        this,
        newListener as EventListenerWithOptions
      );
    }
    this._$committedValue = newListener;
  }

  handleEvent(event: Event) {
    if (typeof this._$committedValue === 'function') {
      this._$committedValue.call(this.options?.host ?? this.element, event);
    } else {
      (this._$committedValue as EventListenerObject).handleEvent(event);
    }
  }
}

export type {ElementPart};
class ElementPart implements Disconnectable {
  readonly type = ELEMENT_PART;

  /** @internal */
  __directive?: Directive;

  // This is to ensure that every Part has a _$committedValue
  _$committedValue: undefined;

  /** @internal */
  _$parent!: Disconnectable;

  /** @internal */
  _$disconnectableChildren?: Set<Disconnectable> = undefined;

  options: RenderOptions | undefined;

  constructor(
    public element: Element,
    parent: Disconnectable,
    options: RenderOptions | undefined
  ) {
    this._$parent = parent;
    this.options = options;
  }

  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }

  _$setValue(value: unknown): void {
    debugLogEvent &&
      debugLogEvent({
        kind: 'commit to element binding',
        element: this.element,
        value,
        options: this.options,
      });
    resolveDirective(this, value);
  }
}

/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * Private exports for use by other Lit packages, not intended for use by
 * external users.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports mangled in the
 * client side code, we export a _$LH object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-export them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in `dev` mode or `prod` mode.
 *
 * This has a unique name, to disambiguate it from private exports in
 * lit-element, which re-exports all of lit-html.
 *
 * @private
 */
export const _$LH = {
  // Used in lit-ssr
  _boundAttributeSuffix: boundAttributeSuffix,
  _marker: marker,
  _markerMatch: markerMatch,
  _HTML_RESULT: HTML_RESULT,
  _getTemplateHtml: getTemplateHtml,
  // Used in tests and private-ssr-support
  _TemplateInstance: TemplateInstance,
  _isIterable: isIterable,
  _resolveDirective: resolveDirective,
  _ChildPart: ChildPart,
  _AttributePart: AttributePart,
  _BooleanAttributePart: BooleanAttributePart,
  _EventPart: EventPart,
  _PropertyPart: PropertyPart,
  _ElementPart: ElementPart,
};

// Apply polyfills if available
const polyfillSupport = DEV_MODE
  ? global.litHtmlPolyfillSupportDevMode
  : global.litHtmlPolyfillSupport;
polyfillSupport?.(Template, ChildPart);

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
(global.litHtmlVersions ??= []).push('3.2.0');
if (DEV_MODE && global.litHtmlVersions.length > 1) {
  issueWarning!(
    'multiple-versions',
    `Multiple versions of Lit loaded. ` +
      `Loading multiple versions is not recommended.`
  );
}

/**
 * Renders a value, usually a lit-html TemplateResult, to the container.
 *
 * This example renders the text "Hello, Zoe!" inside a paragraph tag, appending
 * it to the container `document.body`.
 *
 * ```js
 * import {html, render} from 'lit';
 *
 * const name = "Zoe";
 * render(html`<p>Hello, ${name}!</p>`, document.body);
 * ```
 *
 * @param value Any [renderable
 *   value](https://lit.dev/docs/templates/expressions/#child-expressions),
 *   typically a {@linkcode TemplateResult} created by evaluating a template tag
 *   like {@linkcode html} or {@linkcode svg}.
 * @param container A DOM container to render to. The first render will append
 *   the rendered value to the container, and subsequent renders will
 *   efficiently update the rendered value if the same result type was
 *   previously rendered there.
 * @param options See {@linkcode RenderOptions} for options documentation.
 * @see
 * {@link https://lit.dev/docs/libraries/standalone-templates/#rendering-lit-html-templates| Rendering Lit HTML Templates}
 */
export const render = (
  value: unknown,
  container: HTMLElement | DocumentFragment,
  options?: RenderOptions
): RootPart => {
  if (DEV_MODE && container == null) {
    // Give a clearer error message than
    //     Uncaught TypeError: Cannot read properties of null (reading
    //     '_$litPart$')
    // which reads like an internal Lit error.
    throw new TypeError(`The container to render into may not be ${container}`);
  }
  const renderId = DEV_MODE ? debugLogRenderId++ : 0;
  const partOwnerNode = options?.renderBefore ?? container;
  // This property needs to remain unminified.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let part: ChildPart = (partOwnerNode as any)['_$litPart$'];
  debugLogEvent &&
    debugLogEvent({
      kind: 'begin render',
      id: renderId,
      value,
      container,
      options,
      part,
    });
  if (part === undefined) {
    const endNode = options?.renderBefore ?? null;
    // This property needs to remain unminified.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (partOwnerNode as any)['_$litPart$'] = part = new ChildPart(
      container.insertBefore(createMarker(), endNode),
      endNode,
      undefined,
      options ?? {}
    );
  }
  part._$setValue(value);
  debugLogEvent &&
    debugLogEvent({
      kind: 'end render',
      id: renderId,
      value,
      container,
      options,
      part,
    });
  return part as RootPart;
};

if (ENABLE_EXTRA_SECURITY_HOOKS) {
  render.setSanitizer = setSanitizer;
  render.createSanitizer = createSanitizer;
  if (DEV_MODE) {
    render._testOnlyClearSanitizerFactoryDoNotCallOrElse =
      _testOnlyClearSanitizerFactoryDoNotCallOrElse;
  }
}

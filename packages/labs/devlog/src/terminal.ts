import {
  html,
  css,
  DebugLog,
  nothing,
  TemplateResult,
  noChange,
  Part,
} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Directive, directive} from 'lit/directive.js';
import {
  DebugLogLitElement,
  DebugLitController,
  FrameEntry,
  TreeEntry,
  RenderEntry,
} from './capture-logs.js';

// We use long tag names to avoid clashing with user code.

interface TerminalPreferences {
  collapsed: boolean;
  expandedHeight: string | number;
}
const terminalPreferenceKey = '__lit-debug-terminal-preferences';
const terminalPreferences = ((): TerminalPreferences => {
  const storedPrefs = sessionStorage.getItem(terminalPreferenceKey);
  if (storedPrefs != null) {
    return JSON.parse(storedPrefs) as TerminalPreferences;
  }
  return {
    collapsed: false,
    expandedHeight: '50%',
  };
})();

@customElement('lit-debug-terminal')
export class DebugLitTerminal extends DebugLogLitElement {
  static override styles = css`
    :host {
      position: absolute;
      box-sizing: border-box;
      border-top: 1px solid white;
      margin: 0;
      bottom: 0px;
      left: 0px;
      display: block;
      width: 100%;
      min-height: 48px;
      max-height: 80%;
      /* height set programatically below */
      overflow-y: scroll;
      background: #222;
      color: #eee;
    }
    .entry {
      padding: 2px;
      border-bottom: 1px solid #eee;
    }
    .collapser {
      cursor: pointer;
      position: absolute;
      top: 2px;
      right: 0;
      font-size: 200%;
      background-color: #222;
      padding: 0 6px;
      border: 1px solid #eee;
    }
    .handle {
      height: 3px;
      background-color: white;
    }
    .lone {
      padding-bottom: 10px;
    }
    .grabbable {
      cursor: grab;
    }
  `;

  constructor() {
    super();
    this.prefsUpdated();
  }

  static install() {
    document.body.appendChild(new DebugLitTerminal());
  }

  private log = DebugLitController.connect(this);

  override render() {
    const entries = (() => {
      if (terminalPreferences.collapsed) {
        if (this.log.length === 0) {
          return nothing;
        }
        const idx = this.log.length - 1;
        // just display the last one when collapsed
        return html`<div class="lone">
          ${this.renderFrame(this.log[idx], idx)}
        </div>`;
      }
      return this.log.map(
        (entry, i) =>
          html`<div class="entry">${this.renderFrame(entry, i)}</div>`
      );
    })();

    return html`
      <div class="${terminalPreferences.collapsed ? 'collapsed' : 'expanded'}">
        ${this.renderGrabHandle()}
        <div class="collapser" @click=${this.toggleCollapsed}>
          ${terminalPreferences.collapsed ? '↟' : '↡'}
        </div>
        ${entries}
      </div>
    `;
  }

  private renderGrabHandle() {
    const grabbable = !terminalPreferences.collapsed;
    return html`
      <div
        class="handle ${grabbable ? 'grabbable' : ''}"
        @mousedown=${this.grabStart}
      ></div>
    `;
  }

  private serializePrefsNextRender = false;

  private grabStart() {
    if (terminalPreferences.collapsed) {
      return;
    }
    this.requestUpdate();
    const mouseMove = (event: MouseEvent) => {
      terminalPreferences.expandedHeight = window.innerHeight - event.pageY;
      this.serializePrefsNextRender = true;
      this.requestUpdate();
    };
    window.addEventListener(
      'mouseup',
      () => {
        this.requestUpdate();
        window.removeEventListener('mousemove', mouseMove);
      },
      {once: true}
    );
    window.addEventListener('mousemove', mouseMove);
  }

  override updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (this.serializePrefsNextRender) {
      this.serializePrefsNextRender = false;
      this.serializePrefs();
    }
    this.updateHeight();
    this.scrollTo({top: 100000000000});
    return super.updated(changedProperties);
  }

  private renderFrame(entry: FrameEntry, i: number) {
    return html`
      <lit-debug-frame-entry
        .frame=${entry}
        .index=${i}
      ></lit-debug-frame-entry>
    `;
  }

  private toggleCollapsed() {
    terminalPreferences.collapsed = !terminalPreferences.collapsed;
    this.prefsUpdated();
  }

  private updateHeight() {
    this.style.height = (() => {
      if (terminalPreferences.collapsed) {
        return 'auto';
      }
      if (typeof terminalPreferences.expandedHeight === 'string') {
        return terminalPreferences.expandedHeight;
      }
      const cleanedHeight = Math.min(
        Math.floor(window.innerHeight * 0.8),
        Math.max(48, terminalPreferences.expandedHeight)
      );
      return `${cleanedHeight}px`;
    })();
  }

  private serializePrefs() {
    sessionStorage.setItem(
      terminalPreferenceKey,
      JSON.stringify(terminalPreferences)
    );
  }

  private prefsUpdated() {
    this.serializePrefs();
    this.updateHeight();
    this.requestUpdate();
  }
}

const summaryStyles = css`
  .section {
    display: inline-block;
    padding-left: 20px;
  }
  .vocab {
    /* dotted underline */
    text-decoration: underline dotted;
    /* questionmark pointer mouse cursor */
    cursor: help;
  }
  .highlighting {
    background-color: #580303;
  }
  .triangle {
    font-size: 40%;
  }
`;

@customElement('lit-debug-frame-entry')
export class FrameEntryElement extends DebugLogLitElement {
  static override styles = [
    css`
      :host {
        display: block;
        box-sizing: border-box;
      }
      .main {
        padding-left: 20px;
      }
      .entries {
        padding-left: 40px;
      }
      .clickable {
        cursor: pointer;
      }
    `,
    summaryStyles,
  ];
  @property({attribute: false}) frame: FrameEntry | undefined = undefined;
  @property({type: Number}) index: number | undefined = undefined;
  @property({type: Boolean}) expanded = false;

  override render() {
    const frame = this.frame;
    const index = this.index;
    if (frame === undefined || index === undefined) {
      return nothing;
    }

    let children: unknown = nothing;
    if (this.expanded) {
      children = html`
        <div class="entries">
          ${frame.entries.map((e) => this.renderEntry(e))}
        </div>
      `;
    }
    const frameEntries = this.getFrameEntries(frame);
    const toHighlight = [
      ...(function* () {
        for (const entry of frameEntries) {
          const highlightable = getRegionToHighlight(entry);
          if (highlightable !== undefined) {
            yield highlightable;
          }
        }
      })(),
    ];

    return html`
      <div
        @click=${() => (this.expanded = !this.expanded)}
        class="clickable main"
        ${highlightElemOnHover(toHighlight)}
      >
        <span class="triangle">${this.expanded ? '▼' : '▶'}</span>
        Frame ${index}: ${summaryHtml(this.getFrameEntries(frame))}
      </div>
      ${children}
    `;
  }

  private *getFrameEntries(frame: FrameEntry) {
    for (const entry of frame.entries) {
      yield* getEntries(entry);
    }
  }

  private renderEntry(entry: TreeEntry) {
    switch (entry.kind) {
      case 'template prep':
        return html`<lit-debug-template-prep-entry
          .entry=${entry}
        ></lit-debug-template-prep-entry>`;
      case 'template instantiated':
        return html`Template cloned`;
      case 'render':
        return html`<lit-debug-render-entry
          .entry=${entry}
        ></lit-debug-render-entry>`;
      default:
        return entry.kind;
    }
  }
}

function summaryHtml(entries: Iterable<TreeEntry>) {
  const {
    parsed,
    instantiated,
    renders,
    unknown,
    mutations,
    holes,
    nodes,
    duplicatedRenders,
  } = summarize(entries);

  const summary: Array<string | TemplateResult> = [];
  const rendered = (() => {
    const explanation = `A call to Lit's render() method, either directly or indirectly (e.g. via a LitElement updating).`;
    return html`<span class="vocab" title=${explanation}>render()</span>`;
  })();
  if (renders > 0) {
    summary.push(
      html`<span class="section"
        >${renders} ${rendered} call${renders === 1 ? '' : 's'}</span
      >`
    );
  }
  const comparisons = (() => {
    const explanation = `The number of places Lit needed to compare the previously rendered value (if any) to the updated value.`;
    return html`<span class="vocab" title=${explanation}
      >comparison${holes === 1 ? '' : 's'}</span
    >`;
  })();
  if (holes > 0) {
    summary.push(html`<span class="section">${holes} ${comparisons}</span>`);
  }
  // if (firstRenders === renders) {
  // summary.push(html`${rendered} ${renders} (first time)`);
  // } else if (rerenders === renders) {
  //   summary.push(html`${rendered} ${renders} (update)`);
  // } else {
  //   summary.push(html`${rendered} ${renders} (${firstRenders} first time, ${rerenders} update)`);
  // }
  if (parsed.size > 0) {
    const explanation =
      `When a template is first rendered it is parsed as HTML, ` +
      `and the locations of dynamic parts are determined in ` +
      `that parsed HTML`;
    summary.push(html` <span class="section">
      ${parsed.size}
      <span class="vocab" title="${explanation}">parsed</span>
      template${parsed.size === 1 ? '' : 's'}
    </span>`);
  }
  if (instantiated.length > 0) {
    const explanation =
      `When a template is being rendered into a fresh location, ` +
      `the template's HTML is cloned, and the dynamic parts are set up for fast updates.`;
    summary.push(html` <span class="section">
      ${instantiated.length}
      <span class="vocab" title="${explanation}">instantiated</span>
      template${instantiated.length === 1 ? '' : 's'}
    </span>`);
  }
  if (unknown > 0) {
    summary.push(
      html`<span class="section"
        >${unknown} unknown entr${unknown === 1 ? 'y' : 'ies'} (version
        mismatch?)</span
      >`
    );
  }
  if (mutations > 0) {
    const detail =
      mutations === nodes
        ? nothing
        : html` (${nodes} total HTML node${nodes === 1 ? '' : 's'})`;
    summary.push(
      html`<span class="section"
        >${mutations} mutation${mutations === 1 ? '' : 's'}${detail}</span
      >`
    );
  }
  if (duplicatedRenders > 0) {
    const explanation =
      `When you render into the same container multiple times in a single frame, ` +
      `this is usually a sign of wasted work.`;
    summary.push(html` <span class="section warning">
      ${duplicatedRenders}
      <span class="vocab" title="${explanation}">duplicated</span>
      render${duplicatedRenders === 1 ? '' : 's'}
    </span>`);
  }
  return summary;
}

function* allDescendents(node: Node): IterableIterator<Node> {
  for (const child of node.childNodes) {
    yield child;
    yield* allDescendents(child);
  }
}

function summarize(entries: Iterable<TreeEntry>) {
  const parsed = new Set<unknown>();
  const instantiated = [];
  // TODO: count number of rendered nodes in first renders as individual mutations
  let renders = 0;
  let firstRenders = 0;
  let rerenders = 0;
  let unknown = 0;
  let mutations = 0;
  let holes = 0;
  let nodes = 0;
  let duplicatedRenders = 0;
  const renderRoots = new Set<Node>();

  for (const entry of entries) {
    switch (entry.kind) {
      case 'template prep': {
        parsed.add(entry.template);
        break;
      }
      case 'template instantiated': {
        instantiated.push(entry.template);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _ of allDescendents(entry.instance._clone(entry.options))) {
          nodes++;
        }
        entry.fragment;
        mutations++;
        break;
      }
      case 'template instantiated and updated':
      case 'template updating':
        break;
      case 'render': {
        holes++;
        renders++;
        if (entry.begin.part === undefined) {
          firstRenders++;
        } else {
          rerenders++;
        }
        if (renderRoots.has(entry.end.container)) {
          duplicatedRenders++;
        } else {
          renderRoots.add(entry.end.container);
        }
        break;
      }
      case 'set part': {
        holes++;
        break;
      }
      case 'commit nothing to child':
      case 'commit text':
      case 'commit attribute':
      case 'commit event listener':
      case 'commit to element binding':
      case 'commit node':
      case 'commit boolean attribute':
      case 'commit property': {
        mutations++;
        nodes++;
        break;
      }
      default: {
        const never: never = entry;
        logErrorOnce`
            Internal error in Lit debug terminal, potentially a sign
            of version mismatch between Lit and this terminal.
            Error: unknown kind of entry: ${never}`;
        console.error();
        unknown++;
      }
    }
  }
  return {
    parsed,
    instantiated,
    renders,
    firstRenders,
    rerenders,
    unknown,
    mutations,
    nodes,
    holes,
    duplicatedRenders,
  };
}

const alreadyLogged = new WeakSet<TemplateStringsArray>();
function logErrorOnce(messageParts: TemplateStringsArray, ...args: unknown[]) {
  if (alreadyLogged.has(messageParts)) {
    return;
  }
  alreadyLogged.add(messageParts);
  const toLog: unknown[] = [];
  for (let i = 0; i < messageParts.length; i++) {
    toLog.push(messageParts[i].replace(/ *\n +/g, ' '));
    if (i < args.length) {
      toLog.push(args[i]);
    }
  }
  console.error(...toLog);
}

function* getEntries(entry: TreeEntry): IterableIterator<TreeEntry> {
  yield entry;
  switch (entry.kind) {
    case 'template prep':
    case 'template instantiated':
    case 'template updating':
    case 'template instantiated and updated':
    case 'commit nothing to child':
    case 'commit text':
    case 'commit to element binding':
    case 'commit node':
    case 'commit boolean attribute':
    case 'commit attribute':
    case 'commit event listener':
    case 'commit property':
    case 'set part':
      // no children
      return;
    case 'render':
      for (const e of entry.events) {
        yield* getEntries(e);
      }
      return;
    default: {
      const never: never = entry;
      logErrorOnce`
          Internal error in Lit debug terminal, potentially a sign of version mismatch
          between Lit and this terminal.
          Error: unknown kind of entry: ${never}`;
    }
  }
}

function getRegionToHighlight(entry: TreeEntry): Highlightable | undefined {
  switch (entry.kind) {
    case 'template prep':
    case 'template instantiated':
    case 'template updating':
    case 'template instantiated and updated':
    case 'render':
    case 'set part':
      return;
    case 'commit nothing to child':
    case 'commit node': {
      if (entry.start.parentNode) {
        return entry.start.parentNode;
      }
      const range = document.createRange();
      range.setStartAfter(entry.start);
      const maybeEnd = (entry as Partial<DebugLog.CommitNothingToChildEntry>)
        .end;
      if (maybeEnd) {
        range.setEndBefore(maybeEnd);
      } else {
        let cur = entry.start;
        while (cur.nextSibling) {
          cur = cur.nextSibling;
          range.selectNodeContents(cur);
        }
      }
      return range;
    }
    case 'commit text': {
      return entry.node;
    }
    case 'commit to element binding':
    case 'commit boolean attribute':
    case 'commit attribute':
    case 'commit event listener':
    case 'commit property':
      return entry.element;
    default: {
      const never: never = entry;
      logErrorOnce`
          Internal error in Lit debug terminal, potentially a sign
          of version mismatch between Lit and this terminal.
          Error: unknown kind of entry: ${never}`;
    }
  }
  return;
}

@customElement('lit-debug-template-prep-entry')
export class TemplatePrepEntryElement extends DebugLogLitElement {
  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      padding: 2px;
      height: 2.5ex;
      overflow-y: hidden;
      cursor: pointer;
    }

    :host([expanded]) {
      height: auto;
    }

    .dummyInterpolation {
      color: #e0b25b;
    }

    .constString {
      color: #17a50a;
    }
  `;

  @property({attribute: false}) entry: DebugLog.TemplatePrep | undefined =
    undefined;

  @property({type: Boolean, reflect: true}) expanded = false;

  override render() {
    const entry = this.entry;
    if (!entry) {
      return nothing;
    }
    const joined = [];
    for (let i = 0; i < entry.strings.length; i++) {
      joined.push(html`<span class="constString">${entry.strings[i]}</span>`);
      if (i < entry.strings.length - 1) {
        joined.push(html`<span class="dummyInterpolation">\${…}</span>`);
      }
    }
    return html`
      <div @click=${() => (this.expanded = !this.expanded)}>
        <span>Parsed template</span>
        <span>${joined}</span>
      </div>
    `;
  }
}

function isIterable(value: unknown): value is Iterable<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as unknown as {[Symbol.iterator]?(): void})[
      Symbol.iterator
    ] === 'function'
  );
}

type Highlightable = Node | Range;

class Highlighter {
  private readonly highlightedRects: HTMLDivElement[] = [];
  constructor(elems: Highlightable | Iterable<Highlightable>) {
    for (const rect of this.getClientRects(elems)) {
      const highlight = document.createElement('div');
      this.highlightedRects.push(highlight);
      highlight.style.position = 'absolute';
      highlight.style.outline = '3px solid #f008';
      highlight.style.left = `${rect.left}px`;
      highlight.style.top = `${rect.top}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.style.pointerEvents = 'none';
      highlight.style.zIndex = '9999';
      document.body.appendChild(highlight);
    }
  }

  private *getClientRects(nodes: Highlightable | Iterable<Highlightable>) {
    if (!isIterable(nodes)) {
      yield* this.getClientRectsForOne(nodes);
      return;
    }
    for (const elem of nodes) {
      yield* this.getClientRectsForOne(elem);
    }
  }

  private *getClientRectsForOne(highlightable: Highlightable) {
    if (highlightable instanceof Element || highlightable instanceof Range) {
      yield* highlightable.getClientRects();
    } else if (highlightable instanceof ShadowRoot) {
      yield* highlightable.host.getClientRects();
    } else {
      const range = document.createRange();
      range.selectNode(highlightable);
      yield* range.getClientRects();
    }
  }

  restore() {
    for (const highlight of this.highlightedRects) {
      highlight.remove();
    }
    this.highlightedRects.length = 0;
  }
}

const highlightElemOnHover = directive(
  class HighlightElemOnHover extends Directive {
    render(
      _toHighlight: undefined | Highlightable | Array<Highlightable>
    ): unknown {
      return noChange;
    }

    private highlight: Highlighter | undefined = undefined;
    private toHighlight: Highlightable | Array<Highlightable> | undefined =
      undefined;
    private initialized = false;

    override update(
      part: Part,
      [toHighlight]: [undefined | Highlightable | Array<Highlightable>]
    ) {
      if (part.type !== 6) {
        throw new Error(
          'highlightElemOnHover expected to be called as an element part'
        );
      }
      this.highlight?.restore();
      this.toHighlight = toHighlight;
      this.init(part.element);
    }

    private init(elem: Element) {
      if (this.initialized) {
        return;
      }
      this.initialized = true;
      elem.addEventListener('mouseover', () => {
        elem.classList.add('highlighting');
        if (this.highlight) {
          this.highlight.restore();
          this.highlight = undefined;
        }
        if (this.toHighlight === undefined) {
          return;
        }
        this.highlight = new Highlighter(this.toHighlight);
      });
      elem.addEventListener('mouseout', () => {
        elem.classList.remove('highlighting');
        if (this.highlight) {
          this.highlight.restore();
          this.highlight = undefined;
        }
      });
    }
  }
);

@customElement('lit-debug-render-entry')
export class RenderEntryElement extends DebugLogLitElement {
  static override styles = [
    css`
      :host {
        display: block;
        padding: 2px;
        box-sizing: border-box;
        /* height: 2.5ex; */
        /* overflow-y: hidden; */
      }
      .clickable {
        cursor: pointer;
      }
      .children {
        padding-left: 20px;
      }
    `,
    summaryStyles,
  ];

  @property({attribute: false}) entry: RenderEntry | undefined = undefined;

  @property({type: Boolean, reflect: true}) expanded = false;

  override render() {
    const entry = this.entry;
    if (!entry) {
      return nothing;
    }
    const container = entry.begin.container;
    let context: unknown = nothing;
    if (container instanceof Element) {
      context = ` into <${container.localName}>`;
    } else if (
      container instanceof ShadowRoot &&
      container.host instanceof Element
    ) {
      context = ` into <${container.host.localName}>`;
    }

    let children: unknown = nothing;
    if (this.expanded) {
      const renderedChildren = [];
      for (const child of entry.events) {
        renderedChildren.push(this.renderChild(child));
      }
      children = html`<div class="children">${renderedChildren}</div>`;
    }

    const toHighlght = [
      ...(function* () {
        for (const e of getEntries(entry)) {
          const highlightable = getRegionToHighlight(e);
          if (highlightable !== undefined) {
            yield highlightable;
          }
        }
      })(),
    ];

    return html`
      <div class="clickable" @click=${() =>
        (this.expanded = !this.expanded)} ${highlightElemOnHover(toHighlght)}>
          <span class="triangle">${this.expanded ? '▼' : '▶'}</span>
          <span>render${context}</span>
          <!-- <span>${(entry.endTime - entry.beginTime).toFixed(
            1
          )}ms</span> -->
          ${summaryHtml(entry.events)}
          <!-- <span @mouseover=${this.displayBefore} @mouseout=${
      this.restore
    }>[Before]</span>
          <span @mouseover=${this.displayAfter} @mouseout=${
      this.restore
    }>[After]</span> -->
        </div>
      </div>
      ${children}
    `;
  }

  private renderChild(child: TreeEntry) {
    switch (child.kind) {
      case 'commit attribute':
        return html`<div ${highlightElemOnHover(child.element)}>
          Set attribute ${JSON.stringify(child.name)} to
          ${JSON.stringify(String(child.value))} on
          &lt;${child.element.localName}&gt;
        </div>`;
      case 'commit property':
        return html`<div ${highlightElemOnHover(child.element)}>
          Set property ${JSON.stringify(child.name)} to
          ${JSON.stringify(child.value)} on &lt;${child.element.localName}&gt;
        </div>`;
      case 'commit boolean attribute': {
        const operation = child.value ? 'add' : 'remove';
        return html`<div ${highlightElemOnHover(child.element)}>
          ${operation} attribute ${JSON.stringify(child.name)} on
          &lt;${child.element.localName}&gt;
        </div>`;
      }
      case 'commit text':
        return html`<div ${highlightElemOnHover(child.node)}>
          Set text to ${JSON.stringify(String(child.value))}
        </div>`;
      case 'commit nothing to child': {
        const range = document.createRange();
        const start = child.start;
        const end = child.end;
        range.setStartAfter(start);
        if (end) {
          range.setEndBefore(end);
        }
        return html`<div ${highlightElemOnHover(range)}>clear contents</div>`;
      }
      case 'commit node': {
        let value = '';
        if (child.value instanceof Element) {
          value = child.value.innerHTML;
        } else if (child.value instanceof Text) {
          value = child.value.textContent ?? '';
        } else if (child.value instanceof Comment) {
          value = `<!--${child.value.textContent}-->`;
        } else if (child.value instanceof DocumentFragment) {
          const xmlResult = new XMLSerializer().serializeToString(child.value);
          value = xmlResult
            .replace(/ xmlns="http:\/\/www.w3.org\/1999\/xhtml"/g, '')
            .replace(/<!--\?lit\$\d+\$-->/g, '');
        }
        if (value.length > 30) {
          value = value.slice(0, 30) + '...';
        }
        return html`<div ${highlightElemOnHover(getRegionToHighlight(child))}>
          wrote HTML: ${JSON.stringify(value)}
        </div>`;
      }
      case 'commit event listener': {
        if (child.removeListener && !child.addListener) {
          return html`<div ${highlightElemOnHover(child.element)}>
            Removed ${child.name} event listener on
            &lt;${child.element.localName}&gt;
          </div>`;
        } else if (!child.addListener) {
          return html`<div ${highlightElemOnHover(child.element)}>
            Updated reference to ${child.name} event listener on
            &lt;${child.element.localName}&gt;
          </div>`;
        }
        return html`<div ${highlightElemOnHover(child.element)}>
          Added ${child.name} event listener on
          &lt;${child.element.localName}&gt;
        </div>`;
      }
      case 'commit to element binding':
        return html`<div ${highlightElemOnHover(child.element)}>
          Set element binding on &lt;${child.element.localName}&gt; (probably a
          directive)
        </div>`;
      case 'template prep':
      case 'template instantiated':
      case 'template instantiated and updated':
      case 'render':
      case 'template updating':
      case 'set part':
        // Not a mutation
        return nothing;
      default: {
        const never: never = child;
        return html`<div>
          (unknown entry kind
          ${JSON.stringify((never as unknown as {kind: string}).kind)})
        </div>`;
      }
    }
    return nothing;
  }

  private restoreContent: null | (() => void) = null;

  private displayBefore() {
    this.restoreContent?.();
    const entry = this.entry;
    if (entry === undefined) {
      return;
    }
    const container = entry.begin.container;
    const previous = entry.beginContent;
    if (container instanceof HTMLElement && previous instanceof HTMLElement) {
      container.replaceWith(previous);
      this.restoreContent = () => {
        previous.replaceWith(container);
        this.restoreContent = null;
      };
      return;
    } else if (
      container instanceof ShadowRoot &&
      previous instanceof DocumentFragment
    ) {
      const currentFragment = document.createDocumentFragment();
      for (const child of container.childNodes) {
        currentFragment.appendChild(child);
      }
      for (const child of previous.childNodes) {
        container.appendChild(child.cloneNode(true));
      }
      this.restoreContent = () => {
        // clear out the temporary content
        while (container.childNodes.length > 0) {
          container.removeChild(container.childNodes[0]);
        }
        // restore the original content
        for (const child of currentFragment.childNodes) {
          container.appendChild(child);
        }
        this.restoreContent = null;
      };
    }
  }

  private displayAfter() {}

  private restore() {
    this.restoreContent?.();
  }
}
DebugLitTerminal.install();

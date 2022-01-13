import {LitElement, DebugLog, RenderOptions} from 'lit';

/**
 * A collection of all of the debug log events that took place in inside of a single
 * Lit render() call.
 */
export interface RenderEntry {
  kind: 'render';
  begin: DebugLog.BeginRender;
  beginContent: Node;
  beginTime: number;
  endTime: number;
  end: DebugLog.EndRender;
  endContent: Node;
  events: TreeEntry[];
}
export type TreeEntry =
  | RenderEntry
  | DebugLog.TemplateInstantiated
  | DebugLog.TemplateInstantiatedAndUpdated
  | DebugLog.TemplateUpdating
  | DebugLog.TemplatePrep
  | DebugLog.SetPartValue
  | DebugLog.CommitPartEntry;

/**
 * All of the debug log events that were emitted in a single frame.
 *
 * i.e. from the time that the first entry in entries was emitted until the next time the browser calls requestAnimationFrame callbacks.
 */
export type FrameEntry = {entries: TreeEntry[]};

/**
 * Exposes a growing array of render logs, as well as notifying its host when new entries are added.
 */
export class DebugLitController {
  public readonly entries: FrameEntry[] = [];
  private renderStack: Array<
    Omit<Omit<RenderEntry, 'end'>, 'endContent'> & {
      end: undefined;
      endContent: undefined;
    }
  > = [];
  private hosts: DebugLogLitElement[] = [];
  private currentFrameEntries: TreeEntry[] = [];

  // We should probably create the instance lazily. The danger with that though, is that we might miss some debug entries.
  private static readonly instance = new DebugLitController();
  static getInstance() {
    return this.instance;
  }

  static connect(host: DebugLogLitElement): readonly FrameEntry[] {
    const instance = this.getInstance();
    instance.hosts.push(host);
    return instance.entries;
  }

  private nextFrameInternal: Promise<void> | null = null;
  private get nextFrame(): Promise<void> {
    if (this.nextFrameInternal === null) {
      this.nextFrameInternal = new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          this.nextFrameInternal = null;
          resolve();
        });
      });
    }
    return this.nextFrameInternal;
  }

  private constructor() {
    // Ask lit to start emitting debug log events
    (
      window as unknown as {emitLitDebugLogEvents?: boolean}
    ).emitLitDebugLogEvents = true;
    // memory leak, but ensures we capture as many events as possible by subscribing here and never unsubscribing
    window.addEventListener('lit-debug', (e: Event) => {
      const event = e as CustomEvent<DebugLog.Entry>;
      const entry = event.detail;
      const maybeOptions = (entry as {options?: ExtendedRenderOptions}).options;

      if (entry.kind === 'begin render') {
        this.renderStack.push({
          kind: 'render',
          begin: entry,
          beginContent: this.clone(entry.container),
          events: [],
          end: undefined,
          endContent: undefined,
          beginTime: performance.now(),
          endTime: 0,
        });
      } else if (entry.kind === 'end render') {
        const begin = this.renderStack.pop()! as unknown as RenderEntry;
        if (
          (begin.begin.options as ExtendedRenderOptions)?.__litDebugInternal
        ) {
          return; // drop all work done by the debug viewer itself
        }
        begin.endTime = performance.now();
        begin.end = entry;
        begin.endContent = this.clone(entry.container);
        if (begin.begin.id !== entry.id) {
          throw new Error(
            `render stack mismatch: ${begin.begin.id} !== ${entry.id}`
          );
        }
        this.pushEntry(begin);
      } else {
        if (maybeOptions?.__litDebugInternal) {
          return; // drop all work done by the debug viewer itself
        }
        if (entry.kind === 'commit event listener') {
          if (
            !entry.addListener &&
            !entry.removeListener &&
            entry.value === entry.oldListener
          ) {
            return; // no-op
          }
        }
        this.pushEntry(entry);
      }
    });
  }

  /** We often need to create clones of nodes as they were at the time the debug log entry was generated. */
  private clone(node: Node): Node {
    if (node instanceof ShadowRoot) {
      const fragment = document.createDocumentFragment();
      for (const child of Array.from(node.childNodes)) {
        fragment.appendChild(child.cloneNode(true));
      }
      return fragment;
    }
    return node.cloneNode(true);
  }

  private pushEntry(entry: TreeEntry) {
    if (this.nextFrameInternal === null) {
      (async () => {
        await this.nextFrame;
        if (this.currentFrameEntries.length === 0) {
          return;
        }
        this.entries.push({
          entries: this.currentFrameEntries,
        });
        this.currentFrameEntries = [];
        for (const host of this.hosts) {
          host.requestUpdate();
        }
      })();
    }
    if (this.renderStack.length === 0) {
      this.currentFrameEntries.push(entry);
    } else {
      const renderEntry = this.renderStack[this.renderStack.length - 1];
      renderEntry.events!.push(entry);
    }
  }
}
export interface ExtendedRenderOptions extends RenderOptions {
  __litDebugInternal?: boolean;
}

/**
 * A LitElement whose render activity will be ignored by DebugLitController.
 *
 * Generally useful for Lit Elements that themselves display debug log entries,
 * to prevent infinite loops, as well as avoiding displaying info unrelated to the
 * application being debugged.
 */
export abstract class DebugLogLitElement extends LitElement {
  // Ensures that updates to these elements don't end up as entries
  // for themselves to rerender, resulting in an infinite loop.
  override readonly renderOptions: ExtendedRenderOptions = {
    ...this.renderOptions,
    __litDebugInternal: true,
  };
}

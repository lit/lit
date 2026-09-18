/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as fs from 'fs';
// eslint-disable-next-line import/extensions
import {compile, preprocess} from 'svelte/compiler';
import ts from 'typescript';

import {utilTemplate} from '../lib/util-template.js';

// This package compiles with `lib: ["es2021"]` and `types: []`, so the DOM
// globals used below are not declared. Only the members these tests touch are
// described here.
interface FakeEvent {
  type: string;
}
interface FakeEventTarget {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
  dispatchEvent(event: FakeEvent): boolean;
}
declare const EventTarget: {new (): FakeEventTarget};
declare const CustomEvent: {new (type: string): FakeEvent};

type Entry = {name: string};
type SlotList = {
  property: string;
  event: string;
  set: (slots: Entry[]) => void;
};
type TrackSlotLists = (
  node: FakeEventTarget,
  lists: SlotList[]
) => {update(lists: SlotList[]): void; destroy(): void};

/** Loads `trackSlotLists` from the generated `util.ts` source itself. */
const loadTrackSlotLists = async (): Promise<TrackSlotLists> => {
  const {outputText} = ts.transpileModule(utilTemplate(), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2021,
      module: ts.ModuleKind.ES2020,
    },
  });
  const module = await import(
    `data:text/javascript,${encodeURIComponent(outputText)}`
  );
  return module.trackSlotLists as TrackSlotLists;
};

const element = (cellSlots: Entry[]) =>
  Object.assign(new EventTarget(), {cellSlots});

const list = (set: (slots: Entry[]) => void): SlotList => ({
  property: 'cellSlots',
  event: 'cell-slots-change',
  set,
});

test('reads the list on mount', async () => {
  const trackSlotLists = await loadTrackSlotLists();
  const calls: Entry[][] = [];
  trackSlotLists(element([{name: 'cell-a-1'}]), [
    list((slots) => calls.push(slots)),
  ]);

  assert.equal(calls, [[{name: 'cell-a-1'}]]);
});

test('reads the list again on the change event', async () => {
  const trackSlotLists = await loadTrackSlotLists();
  const node = element([]);
  const calls: Entry[][] = [];
  trackSlotLists(node, [list((slots) => calls.push(slots))]);

  node.cellSlots = [{name: 'cell-a-1'}, {name: 'cell-a-2'}];
  node.dispatchEvent(new CustomEvent('cell-slots-change'));

  assert.equal(calls, [[], [{name: 'cell-a-1'}, {name: 'cell-a-2'}]]);
});

test('treats a missing property as an empty list', async () => {
  const trackSlotLists = await loadTrackSlotLists();
  const calls: Entry[][] = [];
  trackSlotLists(new EventTarget(), [list((slots) => calls.push(slots))]);

  assert.equal(calls, [[]]);
});

test('calls the setter supplied by the most recent update', async () => {
  const trackSlotLists = await loadTrackSlotLists();
  const node = element([]);
  const first: Entry[][] = [];
  const second: Entry[][] = [];
  const action = trackSlotLists(node, [list((slots) => first.push(slots))]);

  action.update([list((slots) => second.push(slots))]);
  node.dispatchEvent(new CustomEvent('cell-slots-change'));

  assert.is(first.length, 1, 'only the mount read uses the replaced setter');
  assert.is(second.length, 1);
});

test('stops listening on destroy', async () => {
  const trackSlotLists = await loadTrackSlotLists();
  const node = element([]);
  const calls: Entry[][] = [];
  const action = trackSlotLists(node, [list((slots) => calls.push(slots))]);

  action.destroy();
  node.dispatchEvent(new CustomEvent('cell-slots-change'));

  assert.is(calls.length, 1);
});

test('the generated wrapper for computed slot names compiles', async () => {
  const source = fs.readFileSync(
    'goldens/test-element-a/src/lib/ElementSlots.svelte',
    'utf8'
  );
  const {code} = await preprocess(
    source,
    {
      script: ({content}) => ({
        code: ts.transpileModule(content, {
          compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
          },
        }).outputText,
      }),
    },
    {filename: 'ElementSlots.svelte'}
  );
  const compiled = compile(code.replace(' lang="ts"', ''), {
    generate: 'client',
    runes: true,
  });

  assert.ok(compiled.js.code.includes('trackSlotLists'));
  assert.equal(
    compiled.warnings.map((warning) => warning.code),
    []
  );
});

test.run();

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import '../../polyfill-support-lite.js';
import {html, render, TemplateResult} from '../../lit-html.js';
import {
  litCustomElements,
  LitHTMLElement,
} from '../../directives/lit-custom-element.js';
import {
  litSlot,
  renderLitShadow,
  flush,
  getHostSlots,
} from '../../directives/lit-shadow.js';
import {range} from '../../directives/range.js';
import {map} from '../../directives/map.js';
import {assert} from '@esm-bundle/chai';

import '../lit-html_test.js';
// selected directive tests
import '../directives/class-map_test.js';
import '../directives/style-map_test.js';
import '../directives/live_test.js';
import '../directives/ref_test.js';
import '../directives/repeat_test.js';
import '../directives/template-content_test.js';
import '../directives/unsafe-html_test.js';

suite('polyfill-support-lite', () => {
  const nextFrame = () => new Promise<number>(requestAnimationFrame);

  let host: HTMLDivElement;

  setup(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });
  teardown(() => {
    host.remove();
  });

  suite('lit custom element', () => {
    test('upgrades when rendered', () => {
      class MyElement extends LitHTMLElement {
        upgraded = false;
        constructor() {
          super();
          this.upgraded = true;
        }

        method(v: string) {
          return v;
        }
      }
      litCustomElements.define('my-element', MyElement);
      //
      render(html`<my-element>Hi</my-element>`, host);
      const el = host.firstElementChild as MyElement;
      assert.isTrue(el.upgraded);
      const v = 'test';
      assert.equal(el.method(v), v);
    });

    test('upgrades lazily when rendered/updated', () => {
      const renderCe = () => render(html`<my-element2>Hi</my-element2>`, host);
      renderCe();
      // not upgraded on initial render
      const el = host.firstElementChild;
      assert.notOk((el as MyElement).upgraded);
      class MyElement extends LitHTMLElement {
        upgraded = false;
        constructor() {
          super();
          this.upgraded = true;
        }
      }
      litCustomElements.define('my-element2', MyElement);
      // TODO: not upgraded on define, should it be?
      assert.notOk((el as MyElement).upgraded);
      // upgraded on re-render/update
      renderCe();
      assert.isTrue((el as MyElement).upgraded);
    });

    test('attributeChangedCallback/observedAttributes', () => {
      class MyElementOA extends LitHTMLElement {
        static override observedAttributes = ['foo'];
        attrChanges: Array<{
          name: string;
          old: null | string;
          value: null | string;
        }> = [];
        attributeChangedCallback(
          name: string,
          old: null | string,
          value: null | string
        ) {
          this.attrChanges.push({name, old, value});
        }
      }
      litCustomElements.define('my-element-oa', MyElementOA);
      //
      render(html`<my-element-oa>Hi</my-element-oa>`, host);
      const el = host.firstElementChild as MyElementOA;
      el.setAttribute('foo', '1');
      assert.equal(el.attrChanges.length, 1);
      assert.deepEqual(el.attrChanges[0], {name: 'foo', old: null, value: '1'});
      el.setAttribute('foo', '2');
      assert.equal(el.attrChanges.length, 2);
      assert.deepEqual(el.attrChanges[1], {name: 'foo', old: '1', value: '2'});
      el.removeAttribute('foo');
      assert.equal(el.attrChanges.length, 3);
      assert.deepEqual(el.attrChanges[2], {name: 'foo', old: '2', value: null});
      el.setAttribute('foo', '3');
      assert.equal(el.attrChanges.length, 4);
      assert.deepEqual(el.attrChanges[3], {name: 'foo', old: null, value: '3'});
      el.setAttribute('bar', '4');
      assert.equal(el.attrChanges.length, 4);
      el.removeAttribute('bar');
      assert.equal(el.attrChanges.length, 4);
    });

    test('connected/disconnected', () => {
      class MyElementCD extends LitHTMLElement {
        litConnected?: boolean;
        connectedCallback() {
          this.litConnected = true;
        }

        disconnectedCallback() {
          this.litConnected = false;
        }
      }
      litCustomElements.define('my-element-cd', MyElementCD);
      //
      const part = render(html`<my-element-cd>Hi</my-element-cd>`, host);
      let el = host.firstElementChild as MyElementCD;
      assert.isTrue(el.litConnected);
      part.setConnected(false);
      assert.isFalse(el.litConnected);
      part.setConnected(true);
      assert.isTrue(el.litConnected);
      const t = (v: boolean) =>
        html`${v ? html`<my-element-cd>Hi</my-element-cd>` : ''}`;
      render(t(true), host);
      // element disconnected when rendering another template
      assert.isFalse(el.litConnected);
      // element connected when rendered as nested template
      el = host.firstElementChild as MyElementCD;
      assert.isTrue(el.litConnected);
      // element disconnected when nested template is removed.
      render(t(false), host);
      assert.isFalse(el.litConnected);
    });
  });

  suite('lit shadow', () => {
    test('`renderLitShadow` renders "shadow" content', () => {
      renderLitShadow(html`<div>shadow</div>`, host);
      render(html`<div>light</div>`, host);
      const shadowNode = host.firstElementChild;
      assert.equal(shadowNode!.textContent, 'shadow');
      const lightNode = host.lastElementChild;
      assert.equal(lightNode!.textContent, 'light');
      renderLitShadow(html`<div>shadow</div>`, host);
      // light content removed after rendering.
      assert.notOk(lightNode!.parentNode);
    });
  });

  suite('lit slot', () => {
    const getChildNodesWithoutComments = (container: Element) =>
      Array.from(container.childNodes).filter(
        (n) => n.nodeType !== Node.COMMENT_NODE
      );

    const assertSlottedChildren = (
      slotContainer: Element,
      count?: number,
      slotName = ''
    ) => {
      const nodes = Array.from(slotContainer.children);
      if (count !== undefined) {
        assert.equal(nodes.length, count);
      }
      nodes.forEach((n) => {
        assert.equal(n.getAttribute('slot') ?? '', slotName);
      });
    };

    const getSlots = (n: HTMLElement = host) => Array.from(getHostSlots(n));
    const getSlot = (index = 0, n: HTMLElement = host) => getSlots(n)[index];
    const getSlotContainerChildren = (index = 0, n: HTMLElement = host) =>
      getSlot(index, n).slotPart.parentNode.children;

    test('`litSlot` renders lit rendered light children', async () => {
      const renderLight = (count = 2) => {
        render(
          html`${map(
            range(count),
            (i) =>
              html`
                <div id="${i}.1">${i}.1</div>
                <div id="${i}.2">${i}.2</div>
                <div id="${i}.3">${i}.3</div>`
          )}`,
          host
        );
      };
      const renderShadow = () => {
        renderLitShadow(html`<div>${litSlot()}</div>`, host);
      };
      renderShadow();
      const slotContainer = host.firstElementChild!;
      assert.equal(slotContainer.children.length, 0);
      assert.equal(host.children.length, 1);
      renderLight();
      assert.equal(host.children.length, 7);
      // can wait a beat to assert
      await nextFrame();
      assert.equal(host.children.length, 1);
      assertSlottedChildren(slotContainer, 6);
      renderLight(5);
      await nextFrame();
      assert.equal(host.children.length, 1);
      assertSlottedChildren(slotContainer, 15);
      renderLight(0);
      await nextFrame();
      assert.equal(host.children.length, 1);
      assertSlottedChildren(slotContainer, 0);
      renderLight(10);
      await nextFrame();
      assert.equal(host.children.length, 1);
      assertSlottedChildren(slotContainer, 30);
      renderLight(4);
      await nextFrame();
      assert.equal(host.children.length, 1);
      assertSlottedChildren(slotContainer, 12);
      // distributes when shadow renders
      renderLight(2);
      renderShadow();
      assert.equal(host.children.length, 1);
      assertSlottedChildren(slotContainer, 6);
      // distributes when flushed
      renderLight(6);
      flush();
      assert.equal(host.children.length, 1);
      assertSlottedChildren(slotContainer, 18);
    });

    // Note, this mode has limitations. The childNodes are not virtualized
    // so the user must explicitly track and make sure to add all children
    // wholistically.
    test('`litSlot` renders non-lit light children', async () => {
      const renderShadow = () => {
        renderLitShadow(html`<div>${litSlot()}</div>`, host);
      };
      renderShadow();
      const slotContainer = host.firstElementChild!;
      assert.equal(slotContainer.children.length, 0);
      assert.equal(host.children.length, 1);
      const child1 = document.createElement('div');
      child1.textContent = 'child1';
      const text = document.createTextNode('text');
      const child2 = document.createElement('div');
      child2.textContent = 'child2';
      child2.setAttribute('slot', 'foo');
      host.append(child1, text, child2);
      await nextFrame();
      assert.sameMembers(getChildNodesWithoutComments(slotContainer), [
        child1,
        text,
      ]);
      child1.setAttribute('slot', 'foo');
      child2.setAttribute('slot', '');
      host.append(child1, text, child2);
      await nextFrame();
      assert.sameMembers(getChildNodesWithoutComments(slotContainer), [
        text,
        child2,
      ]);
      // Exposes limitation: re-rendering without explicitly setting
      // children, removes distributed nodes.
      renderShadow();
      assert.sameMembers(getChildNodesWithoutComments(slotContainer), []);
    });

    test('`litSlot` renders named slots', async () => {
      const specialSlot = 'special';
      const renderLight = (count = 2) => {
        render(
          html`${map(
            range(count),
            (i) => html`
              <div slot=${i % 2 ? specialSlot : ''} id="${i}.1">${i}.1</div>
              <div slot=${i % 2 ? '' : specialSlot} id="${i}.2">${i}.2</div>`
          )}`,
          host
        );
      };
      const renderShadow = (omitSpecial = false) => {
        renderLitShadow(
          html`
          <div>${litSlot()}</div>
          ${omitSpecial ? '' : html`<div>${litSlot({name: specialSlot})}</div>`}
          `,
          host
        );
      };
      renderShadow();
      const slotContainer = host.firstElementChild!;
      let specialSlotContainer = host.lastElementChild!;
      assert.equal(host.children.length, 2);
      assertSlottedChildren(slotContainer, 0);
      assertSlottedChildren(specialSlotContainer, 0, specialSlot);
      renderLight();
      await nextFrame();
      assertSlottedChildren(slotContainer, 2);
      assertSlottedChildren(specialSlotContainer, 2, specialSlot);
      renderLight(6);
      await nextFrame();
      assert.equal(host.children.length, 2);
      assertSlottedChildren(slotContainer, 6);
      assertSlottedChildren(specialSlotContainer, 6, specialSlot);
      renderLight(0);
      await nextFrame();
      assert.equal(host.children.length, 2);
      assertSlottedChildren(slotContainer, 0);
      assertSlottedChildren(specialSlotContainer, 0, specialSlot);
      renderLight();
      await nextFrame();
      // conditionally render "special" slot
      renderShadow(true);
      assertSlottedChildren(slotContainer, 2);
      assert.equal(host.children.length, 1);
      await nextFrame();
      renderShadow();
      specialSlotContainer = host.lastElementChild!;
      assertSlottedChildren(slotContainer, 2);
      assertSlottedChildren(specialSlotContainer, 2, specialSlot);
      assert.equal(host.children.length, 2);
    });

    test('`litSlot` light nodes can change slot', () => {
      const renderLight = (slots: string[] = []) => {
        render(
          html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
          host
        );
      };
      const renderShadow = () => {
        renderLitShadow(
          html`
          <div id="default">${litSlot()}</div>
          <div id="uno">${litSlot({name: 'uno'})}</div>
          <div id="duo">${litSlot({name: 'duo'})}</div>
          `,
          host
        );
      };
      renderShadow();
      const [defaultSlot, unoSlot, duoSlot] = Array.from(host.children!);
      assert.equal(host.children.length, 3);
      assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(duoSlot).length, 0);
      renderLight();
      flush();
      assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(duoSlot).length, 0);
      renderLight(['', '']);
      flush();
      assert.equal(getChildNodesWithoutComments(defaultSlot).length, 2);
      assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(duoSlot).length, 0);
      renderLight(['uno', '', 'duo']);
      flush();
      assert.equal(getChildNodesWithoutComments(defaultSlot).length, 1);
      assert.equal(getChildNodesWithoutComments(unoSlot).length, 1);
      assert.equal(getChildNodesWithoutComments(duoSlot).length, 1);
      // Note, this does not cause a childlist mutation.
      renderLight(['uno', 'uno', 'duo']);
      flush();
      assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(unoSlot).length, 2);
      assert.equal(getChildNodesWithoutComments(duoSlot).length, 1);
      renderLight(['duo', 'duo', 'duo']);
      flush();
      assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(duoSlot).length, 3);
      renderLight([]);
      flush();
      assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
      assert.equal(getChildNodesWithoutComments(duoSlot).length, 0);
      renderLight(['duo', 'duo', 'uno', '', '', '', '']);
      flush();
      assert.equal(getChildNodesWithoutComments(defaultSlot).length, 4);
      assert.equal(getChildNodesWithoutComments(unoSlot).length, 1);
      assert.equal(getChildNodesWithoutComments(duoSlot).length, 2);
    });

    test('`litSlot` in the same parent', async () => {
      const renderLight = (slots: string[] = []) => {
        render(
          html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
          host
        );
      };
      const renderShadow = () => {
        renderLitShadow(
          html`
          <div>${litSlot()}${litSlot({name: 'uno'})}<div>Hi</div>${litSlot({
            name: 'duo',
          })}</div>
          `,
          host
        );
      };
      renderShadow();
      const slotContainer = host.firstElementChild!;
      assert.equal(getChildNodesWithoutComments(slotContainer).length, 1);
      const [defaultSlot, unoSlot, duoSlot] = Array.from(getHostSlots(host));
      renderLight();
      flush();
      assert.equal(defaultSlot.assignedElements().length, 0);
      assert.equal(unoSlot.assignedElements().length, 0);
      assert.equal(duoSlot.assignedElements().length, 0);
      renderLight(['', '', 'uno', 'duo']);
      flush();
      assert.equal(getChildNodesWithoutComments(slotContainer).length, 5);
      assert.equal(defaultSlot.assignedElements().length, 2);
      assert.equal(unoSlot.assignedElements().length, 1);
      assert.equal(duoSlot.assignedElements().length, 1);
      renderLight(['uno', '', 'duo', '']);
      flush();
      assert.equal(getChildNodesWithoutComments(slotContainer).length, 5);
      assert.equal(defaultSlot.assignedElements().length, 2);
      assert.equal(unoSlot.assignedElements().length, 1);
      assert.equal(duoSlot.assignedElements().length, 1);
      renderLight();
      flush();
      renderLight(['', '', 'uno', '', 'duo', 'uno']);
      flush();
      assert.equal(getChildNodesWithoutComments(slotContainer).length, 7);
      assert.equal(defaultSlot.assignedElements().length, 3);
      assert.equal(unoSlot.assignedElements().length, 2);
      assert.equal(duoSlot.assignedElements().length, 1);
      renderLight();
      flush();
      assert.equal(getChildNodesWithoutComments(slotContainer).length, 1);
      assert.equal(defaultSlot.assignedElements().length, 0);
      assert.equal(unoSlot.assignedElements().length, 0);
      assert.equal(duoSlot.assignedElements().length, 0);
      renderLight(['duo', 'uno']);
      flush();
      assert.equal(getChildNodesWithoutComments(slotContainer).length, 3);
      assert.equal(defaultSlot.assignedElements().length, 0);
      assert.equal(unoSlot.assignedElements().length, 1);
      assert.equal(duoSlot.assignedElements().length, 1);
    });

    test('`litSlot` can be added and removed and change name', async () => {
      const renderLight = (slots: string[] = []) => {
        render(
          html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
          host
        );
      };
      const renderShadow = (slots: string[] = ['']) => {
        renderLitShadow(
          html`${slots.map(
            (name: string) => html`<div id=${name}>${litSlot({name})}</div>`
          )}`,
          host
        );
      };
      // add/remove slots
      renderShadow(['']);
      assert.equal(getSlots().length, 1);
      assert.equal(getSlot().assignedElements().length, 0);
      assert.equal(getSlotContainerChildren().length, 0);
      renderShadow([]);
      renderLight(['', '']);
      flush();
      assert.equal(getSlots().length, 0);
      assert.equal(host.children.length, 0);
      renderShadow(['']);
      renderLight(['', '']);
      flush();
      assert.equal(getSlots().length, 1);
      assert.equal(getSlot().assignedElements().length, 2);
      assert.equal(getSlotContainerChildren().length, 2);
      renderLight([]);
      flush();
      assert.equal(getSlot().assignedElements().length, 0);
      assert.equal(getSlotContainerChildren().length, 0);
      // TODO: limitation: if slots are removed, nodes are not placed *back*
      // into physical location.
      assert.equal(host.children.length, 1);
      // change slot names
      renderLight(['']);
      flush();
      assert.equal(getSlot().assignedElements().length, 1);
      assert.equal(getSlotContainerChildren().length, 1);
      renderShadow(['foo']);
      flush();
      assert.equal(getSlot().assignedElements().length, 0);
      assert.equal(getSlotContainerChildren().length, 0);
      renderShadow(['']);
      flush();
      assert.equal(getSlot().assignedElements().length, 1);
      assert.equal(getSlotContainerChildren().length, 1);
      renderShadow(['foo', 'bar', '']);
      flush();
      assert.equal(getSlot(0).assignedElements().length, 0);
      assert.equal(getSlotContainerChildren(0).length, 0);
      assert.equal(getSlot(1).assignedElements().length, 0);
      assert.equal(getSlotContainerChildren(1).length, 0);
      assert.equal(getSlot(2).assignedElements().length, 1);
      assert.equal(getSlotContainerChildren(2).length, 1);
      renderShadow(['', 'nug']);
      flush();
      assert.equal(getSlot(0).assignedElements().length, 1);
      assert.equal(getSlotContainerChildren(0).length, 1);
      assert.equal(getSlot(1).assignedElements().length, 0);
      assert.equal(getSlotContainerChildren(1).length, 0);
      renderLight(['nug', '', 'bar', '', '']);
      flush();
      assert.equal(getSlot(0).assignedElements().length, 3);
      assert.equal(getSlotContainerChildren(0).length, 3);
      assert.equal(getSlot(1).assignedElements().length, 1);
      assert.equal(getSlotContainerChildren(1).length, 1);
    });

    test('`litSlot` can show `fallback` content', () => {
      const renderLight = (slots: string[] = []) => {
        render(
          html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
          host
        );
      };
      const renderShadow = (
        slots: Array<{name?: string; fallback?: TemplateResult}>
      ) => {
        renderLitShadow(
          html`${slots.map(
            ({name, fallback}) =>
              html`<div id=${name || ''}>${litSlot({name, fallback})}</div>`
          )}`,
          host
        );
      };
      renderShadow([{name: '', fallback: html`<div>fallback</div>`}]);
      renderLight();
      flush();
      assert.equal(getSlot(0).assignedElements().length, 1);
      assert.equal(getSlot(0).assignedElements()[0].textContent, 'fallback');
      renderLight(['', '']);
      flush();
      assert.equal(getSlot(0).assignedElements().length, 2);
      assert.equal(getSlot(0).assignedElements()[0].textContent, '');
      renderShadow([
        {name: 'foo', fallback: html`<div>foo:fallback</div>`},
        {name: 'bar', fallback: html`<div>bar:fallback</div>`},
      ]);
      flush();
      assert.equal(getSlot(0).assignedElements().length, 1);
      assert.equal(
        getSlot(0).assignedElements()[0].textContent,
        'foo:fallback'
      );
      assert.equal(getSlot(1).assignedElements().length, 1);
      assert.equal(
        getSlot(1).assignedElements()[0].textContent,
        'bar:fallback'
      );
      renderLight(['foo', 'foo']);
      flush();
      assert.equal(getSlot(0).assignedElements().length, 2);
      assert.equal(getSlot(0).assignedElements()[0].textContent, 'foo');
      assert.equal(getSlot(0).assignedElements()[1].textContent, 'foo');
      assert.equal(getSlot(1).assignedElements().length, 1);
      assert.equal(
        getSlot(1).assignedElements()[0].textContent,
        'bar:fallback'
      );
      renderLight(['bar']);
      flush();
      assert.equal(getSlot(0).assignedElements().length, 1);
      assert.equal(
        getSlot(0).assignedElements()[0].textContent,
        'foo:fallback'
      );
      assert.equal(getSlot(1).assignedElements().length, 1);
      assert.equal(getSlot(1).assignedElements()[0].textContent, 'bar');
    });

    test('`litSlot` can re-project nodes', async () => {
      const renderLight = (slots: string[] = []) => {
        render(
          html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
          host
        );
      };
      const renderShadow = (
        container: HTMLElement,
        slots: Array<{name?: string; fallback?: TemplateResult}>
      ) => {
        renderLitShadow(
          html`${slots.map(
            ({name, fallback}) =>
              html`[<div id=${name || ''}>${litSlot({name, fallback})}</div>]`
          )}`,
          container
        );
      };
      renderShadow(host, [{name: 'outer'}]);
      const innerHost = host.firstElementChild! as HTMLElement;
      renderShadow(innerHost, [{name: 'inner'}]);
      renderLight(['outer', 'inner']);
      flush();
      // outer slot
      const outerSlot = getSlot(0);
      assert.equal(outerSlot.name, 'outer');
      assert.equal(outerSlot.assignedNodes().length, 1);
      // inner slot
      const innerSlot = getSlot(0, innerHost);
      // logical
      assert.equal(innerSlot.name, 'inner');
      assert.equal(innerSlot.assignedNodes().length, 0);
      // physical
      assert.equal(innerHost.children.length, 1);
      const innerSlotContainer = innerHost.children[0] as HTMLElement;
      assert.equal(innerSlotContainer.children.length, 0);
      // change outer slot "slot"
      outerSlot.slot = 'inner';
      flush();
      assert.equal(outerSlot.assignedNodes().length, 1);
      assert.equal(innerSlot.assignedNodes().length, 1);
      assert.equal(innerSlotContainer.children.length, 1);
      outerSlot.slot = '';
      flush();
      assert.equal(outerSlot.assignedNodes().length, 1);
      assert.equal(innerSlot.assignedNodes().length, 0);
      assert.equal(innerSlotContainer.children.length, 0);
      outerSlot.slot = 'inner';
      flush();
      assert.equal(outerSlot.assignedNodes().length, 1);
      assert.equal(innerSlot.assignedNodes().length, 1);
      assert.equal(innerSlotContainer.children.length, 1);
      // change inner slot "name"
      innerSlot.name = '';
      flush();
      assert.equal(outerSlot.assignedNodes().length, 1);
      assert.equal(innerSlot.assignedNodes().length, 0);
      assert.equal(innerSlotContainer.children.length, 0);
      innerSlot.name = 'inner';
      flush();
      assert.equal(outerSlot.assignedNodes().length, 1);
      assert.equal(innerSlot.assignedNodes().length, 1);
      assert.equal(innerSlotContainer.children.length, 1);
      // change outer slot "name"
      outerSlot.name = '';
      flush();
      assert.equal(outerSlot.assignedNodes().length, 0);
      assert.equal(innerSlot.assignedNodes().length, 0);
      assert.equal(innerSlotContainer.children.length, 0);
      outerSlot.name = 'inner';
      flush();
      assert.equal(outerSlot.assignedNodes().length, 1);
      assert.equal(innerSlot.assignedNodes().length, 1);
      assert.equal(innerSlotContainer.children.length, 1);
      // change light children
      renderLight(['inner', '', 'foo', 'inner', 'inner']);
      flush();
      assert.equal(outerSlot.assignedNodes().length, 3);
      assert.equal(innerSlot.assignedNodes().length, 3);
      assert.equal(innerSlotContainer.children.length, 3);
      // Add another slot!
      renderShadow(innerSlotContainer, [{name: ''}, {name: 'other'}]);
      flush();
      const innerInnerDefaultSlot = getSlot(0, innerSlotContainer);
      const innerInnerOtherSlot = getSlot(1, innerSlotContainer);
      assert.equal(outerSlot.assignedNodes().length, 3);
      assert.equal(innerSlot.assignedNodes().length, 3);
      assert.equal(innerInnerDefaultSlot.assignedNodes().length, 3);
      assert.equal(innerInnerOtherSlot.assignedNodes().length, 0);
      assert.equal(innerSlotContainer.children.length, 2);
      const [innerInnerDefaultSlotContainer, innerInnerOtherSlotContainer] =
        Array.from(innerSlotContainer.children);
      assert.equal(innerInnerDefaultSlotContainer.children.length, 3);
      assert.equal(innerInnerOtherSlotContainer.children.length, 0);
      innerSlot.slot = 'other';
      flush();
      assert.equal(outerSlot.assignedNodes().length, 3);
      assert.equal(innerSlot.assignedNodes().length, 3);
      assert.equal(innerInnerDefaultSlot.assignedNodes().length, 0);
      assert.equal(innerInnerOtherSlot.assignedNodes().length, 3);
      assert.equal(innerInnerDefaultSlotContainer.children.length, 0);
      assert.equal(innerInnerOtherSlotContainer.children.length, 3);
      renderLight([]);
      flush();
      assert.equal(outerSlot.assignedNodes().length, 0);
      assert.equal(innerSlot.assignedNodes().length, 0);
      assert.equal(innerInnerDefaultSlot.assignedNodes().length, 0);
      assert.equal(innerInnerOtherSlot.assignedNodes().length, 0);
      assert.equal(innerInnerDefaultSlotContainer.children.length, 0);
      assert.equal(innerInnerOtherSlotContainer.children.length, 0);
    });

    suite('`litSlot` via <slot>', () => {
      test('`litSlot` renders lit rendered light children', async () => {
        const renderLight = (count = 2) => {
          render(
            html`${map(
              range(count),
              (i) =>
                html`
                  <div id="${i}.1">${i}.1</div>
                  <div id="${i}.2">${i}.2</div>
                  <div id="${i}.3">${i}.3</div>`
            )}`,
            host
          );
        };
        const renderShadow = () => {
          renderLitShadow(html`<div><slot></slot></div>`, host);
        };
        renderShadow();
        const slotContainer = host.firstElementChild!;
        assert.equal(slotContainer.children.length, 0);
        assert.equal(host.children.length, 1);
        renderLight();
        assert.equal(host.children.length, 7);
        // can wait a beat to assert
        await nextFrame();
        assert.equal(host.children.length, 1);
        assertSlottedChildren(slotContainer, 6);
        renderLight(5);
        await nextFrame();
        assert.equal(host.children.length, 1);
        assertSlottedChildren(slotContainer, 15);
        renderLight(0);
        await nextFrame();
        assert.equal(host.children.length, 1);
        assertSlottedChildren(slotContainer, 0);
        renderLight(10);
        await nextFrame();
        assert.equal(host.children.length, 1);
        assertSlottedChildren(slotContainer, 30);
        renderLight(4);
        await nextFrame();
        assert.equal(host.children.length, 1);
        assertSlottedChildren(slotContainer, 12);
        // distributes when shadow renders
        renderLight(2);
        renderShadow();
        assert.equal(host.children.length, 1);
        assertSlottedChildren(slotContainer, 6);
        // distributes when flushed
        renderLight(6);
        flush();
        assert.equal(host.children.length, 1);
        assertSlottedChildren(slotContainer, 18);
      });

      // Note, this mode has limitations. The childNodes are not virtualized
      // so the user must explicitly track and make sure to add all children
      // wholistically.
      test('`litSlot` renders non-lit light children', async () => {
        const renderShadow = () => {
          renderLitShadow(html`<div><slot></slot></div>`, host);
        };
        renderShadow();
        const slotContainer = host.firstElementChild!;
        assert.equal(slotContainer.children.length, 0);
        assert.equal(host.children.length, 1);
        const child1 = document.createElement('div');
        child1.textContent = 'child1';
        const text = document.createTextNode('text');
        const child2 = document.createElement('div');
        child2.textContent = 'child2';
        child2.setAttribute('slot', 'foo');
        host.append(child1, text, child2);
        await nextFrame();
        assert.sameMembers(getChildNodesWithoutComments(slotContainer), [
          child1,
          text,
        ]);
        child1.setAttribute('slot', 'foo');
        child2.setAttribute('slot', '');
        host.append(child1, text, child2);
        await nextFrame();
        assert.sameMembers(getChildNodesWithoutComments(slotContainer), [
          text,
          child2,
        ]);
        // Exposes limitation: re-rendering without explicitly setting
        // children, removes distributed nodes.
        renderShadow();
        assert.sameMembers(getChildNodesWithoutComments(slotContainer), []);
      });

      test('`litSlot` renders named slots', async () => {
        const specialSlot = 'special';
        const renderLight = (count = 2) => {
          render(
            html`${map(
              range(count),
              (i) => html`
                <div slot=${i % 2 ? specialSlot : ''} id="${i}.1">${i}.1</div>
                <div slot=${i % 2 ? '' : specialSlot} id="${i}.2">${i}.2</div>`
            )}`,
            host
          );
        };
        const renderShadow = (omitSpecial = false) => {
          renderLitShadow(
            html`
            <div><slot></slot></div>
            ${
              omitSpecial
                ? ''
                : html`<div><slot name=${specialSlot}></slot></div>`
            }
            `,
            host
          );
        };
        renderShadow();
        const slotContainer = host.firstElementChild!;
        let specialSlotContainer = host.lastElementChild!;
        assert.equal(host.children.length, 2);
        assertSlottedChildren(slotContainer, 0);
        assertSlottedChildren(specialSlotContainer, 0, specialSlot);
        renderLight();
        await nextFrame();
        assertSlottedChildren(slotContainer, 2);
        assertSlottedChildren(specialSlotContainer, 2, specialSlot);
        renderLight(6);
        await nextFrame();
        assert.equal(host.children.length, 2);
        assertSlottedChildren(slotContainer, 6);
        assertSlottedChildren(specialSlotContainer, 6, specialSlot);
        renderLight(0);
        await nextFrame();
        assert.equal(host.children.length, 2);
        assertSlottedChildren(slotContainer, 0);
        assertSlottedChildren(specialSlotContainer, 0, specialSlot);
        renderLight();
        await nextFrame();
        // conditionally render "special" slot
        renderShadow(true);
        assertSlottedChildren(slotContainer, 2);
        assert.equal(host.children.length, 1);
        await nextFrame();
        renderShadow();
        specialSlotContainer = host.lastElementChild!;
        assertSlottedChildren(slotContainer, 2);
        assertSlottedChildren(specialSlotContainer, 2, specialSlot);
        assert.equal(host.children.length, 2);
      });

      test('`litSlot` light nodes can change slot', () => {
        const renderLight = (slots: string[] = []) => {
          render(
            html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
            host
          );
        };
        const renderShadow = () => {
          renderLitShadow(
            html`
            <div id="default"><slot></slot></div>
            <div id="uno"><slot name="uno"></slot></div>
            <div id="duo"><slot name="duo"></slot></div>
            `,
            host
          );
        };
        renderShadow();
        const [defaultSlot, unoSlot, duoSlot] = Array.from(host.children!);
        assert.equal(host.children.length, 3);
        assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(duoSlot).length, 0);
        renderLight();
        flush();
        assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(duoSlot).length, 0);
        renderLight(['', '']);
        flush();
        assert.equal(getChildNodesWithoutComments(defaultSlot).length, 2);
        assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(duoSlot).length, 0);
        renderLight(['uno', '', 'duo']);
        flush();
        assert.equal(getChildNodesWithoutComments(defaultSlot).length, 1);
        assert.equal(getChildNodesWithoutComments(unoSlot).length, 1);
        assert.equal(getChildNodesWithoutComments(duoSlot).length, 1);
        // Note, this does not cause a childlist mutation.
        renderLight(['uno', 'uno', 'duo']);
        flush();
        assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(unoSlot).length, 2);
        assert.equal(getChildNodesWithoutComments(duoSlot).length, 1);
        renderLight(['duo', 'duo', 'duo']);
        flush();
        assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(duoSlot).length, 3);
        renderLight([]);
        flush();
        assert.equal(getChildNodesWithoutComments(defaultSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(unoSlot).length, 0);
        assert.equal(getChildNodesWithoutComments(duoSlot).length, 0);
        renderLight(['duo', 'duo', 'uno', '', '', '', '']);
        flush();
        assert.equal(getChildNodesWithoutComments(defaultSlot).length, 4);
        assert.equal(getChildNodesWithoutComments(unoSlot).length, 1);
        assert.equal(getChildNodesWithoutComments(duoSlot).length, 2);
      });

      test('`litSlot` in the same parent', async () => {
        const renderLight = (slots: string[] = []) => {
          render(
            html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
            host
          );
        };
        const renderShadow = () => {
          renderLitShadow(
            html`
            <div><slot></slot><slot name="uno"></slot><div>Hi</div><slot name="duo"></slot></div>
            `,
            host
          );
        };
        renderShadow();
        const slotContainer = host.firstElementChild!;
        assert.equal(getChildNodesWithoutComments(slotContainer).length, 1);
        const [defaultSlot, unoSlot, duoSlot] = Array.from(getHostSlots(host));
        renderLight();
        flush();
        assert.equal(defaultSlot.assignedElements().length, 0);
        assert.equal(unoSlot.assignedElements().length, 0);
        assert.equal(duoSlot.assignedElements().length, 0);
        renderLight(['', '', 'uno', 'duo']);
        flush();
        assert.equal(getChildNodesWithoutComments(slotContainer).length, 5);
        assert.equal(defaultSlot.assignedElements().length, 2);
        assert.equal(unoSlot.assignedElements().length, 1);
        assert.equal(duoSlot.assignedElements().length, 1);
        renderLight(['uno', '', 'duo', '']);
        flush();
        assert.equal(getChildNodesWithoutComments(slotContainer).length, 5);
        assert.equal(defaultSlot.assignedElements().length, 2);
        assert.equal(unoSlot.assignedElements().length, 1);
        assert.equal(duoSlot.assignedElements().length, 1);
        renderLight();
        flush();
        renderLight(['', '', 'uno', '', 'duo', 'uno']);
        flush();
        assert.equal(getChildNodesWithoutComments(slotContainer).length, 7);
        assert.equal(defaultSlot.assignedElements().length, 3);
        assert.equal(unoSlot.assignedElements().length, 2);
        assert.equal(duoSlot.assignedElements().length, 1);
        renderLight();
        flush();
        assert.equal(getChildNodesWithoutComments(slotContainer).length, 1);
        assert.equal(defaultSlot.assignedElements().length, 0);
        assert.equal(unoSlot.assignedElements().length, 0);
        assert.equal(duoSlot.assignedElements().length, 0);
        renderLight(['duo', 'uno']);
        flush();
        assert.equal(getChildNodesWithoutComments(slotContainer).length, 3);
        assert.equal(defaultSlot.assignedElements().length, 0);
        assert.equal(unoSlot.assignedElements().length, 1);
        assert.equal(duoSlot.assignedElements().length, 1);
      });

      test('`litSlot` can be added and removed and change name', async () => {
        const renderLight = (slots: string[] = []) => {
          render(
            html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
            host
          );
        };
        const renderShadow = (slots: string[] = ['']) => {
          renderLitShadow(
            html`${slots.map(
              (name: string) =>
                html`<div id=${name}><slot name=${name}></slot></div>`
            )}`,
            host
          );
        };
        // add/remove slots
        renderShadow(['']);
        assert.equal(getSlots().length, 1);
        assert.equal(getSlot().assignedElements().length, 0);
        assert.equal(getSlotContainerChildren().length, 0);
        renderShadow([]);
        renderLight(['', '']);
        flush();
        assert.equal(getSlots().length, 0);
        assert.equal(host.children.length, 0);
        renderShadow(['']);
        renderLight(['', '']);
        flush();
        assert.equal(getSlots().length, 1);
        assert.equal(getSlot().assignedElements().length, 2);
        assert.equal(getSlotContainerChildren().length, 2);
        renderLight([]);
        flush();
        assert.equal(getSlot().assignedElements().length, 0);
        assert.equal(getSlotContainerChildren().length, 0);
        // TODO: limitation: if slots are removed, nodes are not placed *back*
        // into physical location.
        assert.equal(host.children.length, 1);
        // change slot names
        renderLight(['']);
        flush();
        assert.equal(getSlot().assignedElements().length, 1);
        assert.equal(getSlotContainerChildren().length, 1);
        renderShadow(['foo']);
        flush();
        assert.equal(getSlot().assignedElements().length, 0);
        assert.equal(getSlotContainerChildren().length, 0);
        renderShadow(['']);
        flush();
        assert.equal(getSlot().assignedElements().length, 1);
        assert.equal(getSlotContainerChildren().length, 1);
        renderShadow(['foo', 'bar', '']);
        flush();
        assert.equal(getSlot(0).assignedElements().length, 0);
        assert.equal(getSlotContainerChildren(0).length, 0);
        assert.equal(getSlot(1).assignedElements().length, 0);
        assert.equal(getSlotContainerChildren(1).length, 0);
        assert.equal(getSlot(2).assignedElements().length, 1);
        assert.equal(getSlotContainerChildren(2).length, 1);
        renderShadow(['', 'nug']);
        flush();
        assert.equal(getSlot(0).assignedElements().length, 1);
        assert.equal(getSlotContainerChildren(0).length, 1);
        assert.equal(getSlot(1).assignedElements().length, 0);
        assert.equal(getSlotContainerChildren(1).length, 0);
        renderLight(['nug', '', 'bar', '', '']);
        flush();
        assert.equal(getSlot(0).assignedElements().length, 3);
        assert.equal(getSlotContainerChildren(0).length, 3);
        assert.equal(getSlot(1).assignedElements().length, 1);
        assert.equal(getSlotContainerChildren(1).length, 1);
      });

      test('`litSlot` can show `fallback` content', () => {
        const renderLight = (slots: string[] = []) => {
          render(
            html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
            host
          );
        };
        const renderShadow = (
          slots: Array<{name?: string; fallback?: TemplateResult}>
        ) => {
          renderLitShadow(
            html`${slots.map(
              ({name, fallback}) =>
                html`<div id=${name || ''}><slot name=${
                  name || ''
                }>${fallback}</slot></div>`
            )}`,
            host
          );
        };
        renderShadow([{name: '', fallback: html`<div>fallback</div>`}]);
        renderLight();
        flush();
        assert.equal(getSlot(0).assignedElements().length, 1);
        assert.equal(getSlot(0).assignedElements()[0].textContent, 'fallback');
        renderLight(['', '']);
        flush();
        assert.equal(getSlot(0).assignedElements().length, 2);
        assert.equal(getSlot(0).assignedElements()[0].textContent, '');
        renderShadow([
          {name: 'foo', fallback: html`<div>foo:fallback</div>`},
          {name: 'bar', fallback: html`<div>bar:fallback</div>`},
        ]);
        flush();
        assert.equal(getSlot(0).assignedElements().length, 1);
        assert.equal(
          getSlot(0).assignedElements()[0].textContent,
          'foo:fallback'
        );
        assert.equal(getSlot(1).assignedElements().length, 1);
        assert.equal(
          getSlot(1).assignedElements()[0].textContent,
          'bar:fallback'
        );
        renderLight(['foo', 'foo']);
        flush();
        assert.equal(getSlot(0).assignedElements().length, 2);
        assert.equal(getSlot(0).assignedElements()[0].textContent, 'foo');
        assert.equal(getSlot(0).assignedElements()[1].textContent, 'foo');
        assert.equal(getSlot(1).assignedElements().length, 1);
        assert.equal(
          getSlot(1).assignedElements()[0].textContent,
          'bar:fallback'
        );
        renderLight(['bar']);
        flush();
        assert.equal(getSlot(0).assignedElements().length, 1);
        assert.equal(
          getSlot(0).assignedElements()[0].textContent,
          'foo:fallback'
        );
        assert.equal(getSlot(1).assignedElements().length, 1);
        assert.equal(getSlot(1).assignedElements()[0].textContent, 'bar');
      });

      test('`litSlot` can re-project nodes', async () => {
        const renderLight = (slots: string[] = []) => {
          render(
            html`${slots.map((s) => html`<div slot=${s} id=${s}>${s}</div>`)}`,
            host
          );
        };
        const renderShadow = (
          container: HTMLElement,
          slots: Array<{name?: string; fallback?: TemplateResult}>
        ) => {
          renderLitShadow(
            html`${slots.map(
              ({name, fallback}) =>
                html`[<div id=${name || ''}><slot name=${
                  name || ''
                }>${fallback}</slot></div>]`
            )}`,
            container
          );
        };
        renderShadow(host, [{name: 'outer'}]);
        const innerHost = host.firstElementChild! as HTMLElement;
        renderShadow(innerHost, [{name: 'inner'}]);
        renderLight(['outer', 'inner']);
        flush();
        // outer slot
        const outerSlot = getSlot(0);
        assert.equal(outerSlot.name, 'outer');
        assert.equal(outerSlot.assignedNodes().length, 1);
        // inner slot
        const innerSlot = getSlot(0, innerHost);
        // logical
        assert.equal(innerSlot.name, 'inner');
        assert.equal(innerSlot.assignedNodes().length, 0);
        // physical
        assert.equal(innerHost.children.length, 1);
        const innerSlotContainer = innerHost.children[0] as HTMLElement;
        assert.equal(innerSlotContainer.children.length, 0);
        // change outer slot "slot"
        outerSlot.slot = 'inner';
        flush();
        assert.equal(outerSlot.assignedNodes().length, 1);
        assert.equal(innerSlot.assignedNodes().length, 1);
        assert.equal(innerSlotContainer.children.length, 1);
        outerSlot.slot = '';
        flush();
        assert.equal(outerSlot.assignedNodes().length, 1);
        assert.equal(innerSlot.assignedNodes().length, 0);
        assert.equal(innerSlotContainer.children.length, 0);
        outerSlot.slot = 'inner';
        flush();
        assert.equal(outerSlot.assignedNodes().length, 1);
        assert.equal(innerSlot.assignedNodes().length, 1);
        assert.equal(innerSlotContainer.children.length, 1);
        // change inner slot "name"
        innerSlot.name = '';
        flush();
        assert.equal(outerSlot.assignedNodes().length, 1);
        assert.equal(innerSlot.assignedNodes().length, 0);
        assert.equal(innerSlotContainer.children.length, 0);
        innerSlot.name = 'inner';
        flush();
        assert.equal(outerSlot.assignedNodes().length, 1);
        assert.equal(innerSlot.assignedNodes().length, 1);
        assert.equal(innerSlotContainer.children.length, 1);
        // change outer slot "name"
        outerSlot.name = '';
        flush();
        assert.equal(outerSlot.assignedNodes().length, 0);
        assert.equal(innerSlot.assignedNodes().length, 0);
        assert.equal(innerSlotContainer.children.length, 0);
        outerSlot.name = 'inner';
        flush();
        assert.equal(outerSlot.assignedNodes().length, 1);
        assert.equal(innerSlot.assignedNodes().length, 1);
        assert.equal(innerSlotContainer.children.length, 1);
        // change light children
        renderLight(['inner', '', 'foo', 'inner', 'inner']);
        flush();
        assert.equal(outerSlot.assignedNodes().length, 3);
        assert.equal(innerSlot.assignedNodes().length, 3);
        assert.equal(innerSlotContainer.children.length, 3);
        // Add another slot!
        renderShadow(innerSlotContainer, [{name: ''}, {name: 'other'}]);
        flush();
        const innerInnerDefaultSlot = getSlot(0, innerSlotContainer);
        const innerInnerOtherSlot = getSlot(1, innerSlotContainer);
        assert.equal(outerSlot.assignedNodes().length, 3);
        assert.equal(innerSlot.assignedNodes().length, 3);
        assert.equal(innerInnerDefaultSlot.assignedNodes().length, 3);
        assert.equal(innerInnerOtherSlot.assignedNodes().length, 0);
        assert.equal(innerSlotContainer.children.length, 2);
        const [innerInnerDefaultSlotContainer, innerInnerOtherSlotContainer] =
          Array.from(innerSlotContainer.children);
        assert.equal(innerInnerDefaultSlotContainer.children.length, 3);
        assert.equal(innerInnerOtherSlotContainer.children.length, 0);
        innerSlot.slot = 'other';
        flush();
        assert.equal(outerSlot.assignedNodes().length, 3);
        assert.equal(innerSlot.assignedNodes().length, 3);
        assert.equal(innerInnerDefaultSlot.assignedNodes().length, 0);
        assert.equal(innerInnerOtherSlot.assignedNodes().length, 3);
        assert.equal(innerInnerDefaultSlotContainer.children.length, 0);
        assert.equal(innerInnerOtherSlotContainer.children.length, 3);
        renderLight([]);
        flush();
        assert.equal(outerSlot.assignedNodes().length, 0);
        assert.equal(innerSlot.assignedNodes().length, 0);
        assert.equal(innerInnerDefaultSlot.assignedNodes().length, 0);
        assert.equal(innerInnerOtherSlot.assignedNodes().length, 0);
        assert.equal(innerInnerDefaultSlotContainer.children.length, 0);
        assert.equal(innerInnerOtherSlotContainer.children.length, 0);
      });
    });
  });
});

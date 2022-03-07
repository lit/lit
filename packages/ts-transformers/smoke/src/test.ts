import {LitElement, html} from 'lit';

export class MyElement extends LitElement {
  foo = 5;
  protected override render() {
    return html`
      <x-foo .foo=${'hi'}>${html`<slot slot="bar" name="foo"></slot>`}</x-foo>
    `;
    // return html`
    //   <x-foo .foo=${'hi'}>
    //     <span>${'default1'}</span>
    //     <span slot="special">${'special1'}</span>
    //     ${'default2'}
    //     <span>${'default3'}</span>
    //     <span slot="special">${'special2'}</span>
    //   </x-foo>
    //   <div>
    //     <slot name="foo"></slot>
    //   </div>
    // `;
  }
}

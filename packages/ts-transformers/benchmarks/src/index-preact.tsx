import * as React from 'preact';
import {runBenchmark} from './runner.js';
import type { SimpleItem } from './simple-item.js';

const {Component, render} = React;

declare module 'preact' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'x-thing': any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'x-item': any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'x-app': any;
    }
  }
}

class XThing extends Component<{from: string; time: string; subject: string}> {
  render() {
    return (
      <x-thing>
        <div class="container style-scope x-thing">
          <div class="from style-scope x-thing">{this.props.from}</div>
          <div class="time style-scope x-thing">{this.props.time}</div>
          <div class="subject style-scope x-thing">{this.props.subject}</div>
          <div class="style-scope x-thing">
            slotted: {this.props.children}
          </div>
        </div>
      </x-thing>
    );
  }
}

class XItem extends Component<{item: SimpleItem}> {

  render() {
    return (
      <x-item>
        <div onClick={() => this.onClick()} class="item style-scope x-item">
          <XThing
            from={this.props.item.value0}
            time={this.props.item.value1}
            subject={this.props.item.value2}
          >
            <div class="style-scope x-item">s-{this.props.item.value0}</div>
            <div class="style-scope x-item">s-{this.props.item.value1}</div>
            <div class="style-scope x-item">s-{this.props.item.value2}</div>
          </XThing>
          <XThing
            from={this.props.item.value3}
            time={this.props.item.value4}
            subject={this.props.item.value5}
          >
            <div class="style-scope x-item">s-{this.props.item.value3}</div>
            <div class="style-scope x-item">s-{this.props.item.value4}</div>
            <div class="style-scope x-item">s-{this.props.item.value5}</div>
          </XThing>
          <XThing
            from={this.props.item.value6}
            time={this.props.item.value7}
            subject={this.props.item.value8}
          >
            <div class="style-scope x-item">s-{this.props.item.value6}</div>
            <div class="style-scope x-item">s-{this.props.item.value7}</div>
            <div class="style-scope x-item">s-{this.props.item.value8}</div>
          </XThing>
          <XThing
            from={this.props.item.value9}
            time={this.props.item.value10}
            subject={this.props.item.value11}
          >
            <div class="style-scope x-item">s-{this.props.item.value9}</div>
            <div class="style-scope x-item">s-{this.props.item.value10}</div>
            <div class="style-scope x-item">s-{this.props.item.value11}</div>
          </XThing>
          <XThing
            from={this.props.item.value12}
            time={this.props.item.value13}
            subject={this.props.item.value14}
          >
            <div class="style-scope x-item">s-${this.props.item.value12}</div>
            <div class="style-scope x-item">s-${this.props.item.value13}</div>
            <div class="style-scope x-item">s-${this.props.item.value14}</div>
          </XThing>
          <XThing
            from={this.props.item.value15}
            time={this.props.item.value16}
            subject={this.props.item.value17}
          >
            <div class="style-scope x-item">s-{this.props.item.value15}</div>
            <div class="style-scope x-item">s-{this.props.item.value16}</div>
            <div class="style-scope x-item">s-{this.props.item.value17}</div>
          </XThing>
        </div>
      </x-item>
    );
  }

  onClick() {
    console.log('click');
  }
}

class XApp extends Component<{items: SimpleItem[]}> {

  render() {
    return (
      <x-app>
        {this.props.items.map((item) => <XItem item={item}></XItem>)}
      </x-app>
    );
  }
}

const updateComplete = () => new Promise((r) => requestAnimationFrame(r));

const renderApp = async (data: SimpleItem[]) => {
  render(<XApp items={data}></XApp>, document.body);
  await updateComplete();
};

runBenchmark(renderApp);

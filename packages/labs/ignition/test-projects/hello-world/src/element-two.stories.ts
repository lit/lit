import type {ComponentAnnotations, WebRenderer} from '@storybook/types';
import type {StoryObj} from '@storybook/web-components';

import {html, render} from 'lit';

import type {ElementTwo} from './element-two.js';
import './element-two.js';

interface PlainWebRenderer extends WebRenderer {
  component: string;
  storyResult: void;
}

type Meta<T> = ComponentAnnotations<PlainWebRenderer, T>;

const meta: Meta<ElementTwo> = {
  title: 'Element Two',
  component: 'element-two',
  render: (_args, {canvasElement}) => {
    render(html`<element-two></element-two>`, canvasElement);
  },
};
export default meta;
// TODO (justinfagnani): dedupe the bounds definition wtih the one in
// component-story-format.js. We probably want our own storybaord package at
// some point.
type Story = StoryObj<ElementTwo> & {
  bounds?: {left: number; top: number; width: number; height: number};
};

export const storyOne: Story = {
  name: 'Element Two',
};

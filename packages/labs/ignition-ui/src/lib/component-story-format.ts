/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ComponentAnnotations, WebRenderer} from '@storybook/types';
import type {StoryObj} from '@storybook/web-components';

export type {StoryObj} from '@storybook/web-components';
export type {
  ComponentAnnotations,
  StoryContext,
  WebRenderer,
} from '@storybook/types';

export interface PlainWebRenderer extends WebRenderer {
  component: string;
  storyResult: void;
}

export type Meta<T> = ComponentAnnotations<PlainWebRenderer, T>;

export type StoryModule<T> = Record<string, StoryObj> & {default: Meta<T>};

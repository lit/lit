/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import React from 'react';
import {createComponent} from '@lit-labs/react';
import {SimpleGreeter} from './simple-greeter';

const SimpleGreeterReact = createComponent({
  react: React,
  tagName: 'simple-greeter',
  elementClass: SimpleGreeter,
});

export function SimpleGreeterReactLazy(props: React.ComponentProps<typeof SimpleGreeterReact> & {forwardRef: React.Ref<SimpleGreeter>;}) {
  const { forwardRef, ...args } = props;
  return <SimpleGreeterReact ref={forwardRef} {...args} />
}

export default SimpleGreeterReact;
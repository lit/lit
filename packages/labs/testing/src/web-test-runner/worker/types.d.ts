/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {TemplateResult} from 'lit';

export interface InitializeRequest {
  type: 'initialize-request';
  imports: string[];
}

export interface InitializeResponse {
  type: 'initialize-response';
}

export interface RenderRequest {
  type: 'render-request';
  template: TemplateResult;
}

export interface RenderResponse {
  type: 'render-response';
  rendered: string;
}

export type RequestMessage = InitializeRequest | RenderRequest;
export type ResponseMessage = InitializeResponse | RenderResponse;

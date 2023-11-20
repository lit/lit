/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

interface InitializeRequest {
  type: 'initialize-request';
  imports: string[];
}

interface InitializeResponse {
  type: 'initialize-response';
}

interface RenderRequest {
  type: 'render-request';
  id: number;
  content: string;
}

interface RenderResponse {
  type: 'render-response';
  id: number;
  rendered: string;
}

export type Message =
  | InitializeRequest
  | InitializeResponse
  | RenderRequest
  | RenderResponse;

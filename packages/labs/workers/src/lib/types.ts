/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {PropertyDeclaration, PropertyValues, TemplateResult} from 'lit';

/**
 * @fileoverview
 *
 * Common interfaces for cross-thread messages.
 */

export type Message =
  | InitializeMessage
  | InitializeReplyMessage
  | RenderMessage
  | RenderReplyMessage
  | ErrorMessage;

export type MessageKind = Message['kind'];

export interface InitializeMessage {
  kind: 'initialize';
  url: string;
  tagName: string;
}

export interface InitializeReplyMessage {
  kind: 'initialize-reply';
  styles: Array<StyleMessage>;
  properties: {[key: string]: PropertyDeclaration};
}

export interface RenderMessage {
  kind: 'render';
  changedProperties: PropertyValues;
  currentValues: Record<string, unknown>;
  currentAttributes: Record<string, string>;
}

export interface RenderReplyMessage {
  kind: 'render-reply';
  result: TemplateResult;
}

export interface ErrorMessage {
  kind: 'error';
  errors: Array<string>;
}

/**
 * Represents a CSSResult
 */
export interface StyleMessage {
  id: number;
  cssText?: string;
}

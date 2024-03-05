/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export type MessageFromWebviewToExtension =
  | FocusSourceAtLocation
  | SetAutoChangeStoryUrl
  | Edit;

interface FocusSourceAtLocation {
  kind: 'focus-source-at-location';
  filename: string;
  line: number;
  column: number;
}

interface SetAutoChangeStoryUrl {
  kind: 'set-auto-change-story-url';
  autoChangeStoryUrl: boolean;
}

interface Edit {
  kind: 'edit';
  edit: SourceEdit;
}

export type SourceEdit = {
  kind: 'delete-element';
  url: string;
  sourceId: string;
};

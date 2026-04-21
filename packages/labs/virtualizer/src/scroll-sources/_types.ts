/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Physical-coordinate label types shared by the DOM-driven `ScrollSource`
// implementations for translating between logical (block/inline) coordinates
// and the platform's physical scroll APIs. Internal to the scroll-sources
// subsystem — not part of the layout-author surface.

export type fixedSizeDimensionCapitalized = 'Height' | 'Width';
export type fixedInsetLabel = 'top' | 'bottom' | 'left' | 'right';

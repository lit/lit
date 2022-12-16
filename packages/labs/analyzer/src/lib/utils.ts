/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Helper utilities for analyzing declarations
 */

import ts from 'typescript';
import {hasJSDocTag} from './javascript/jsdoc.js';
import {Privacy} from './model.js';

export const hasModifier = (node: ts.Node, modifier: ts.SyntaxKind) => {
  return Boolean(node.modifiers?.some((s) => s.kind === modifier));
};

export const hasExportModifier = (node: ts.Node) => {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
};

export const hasDefaultModifier = (node: ts.Node) => {
  return hasModifier(node, ts.SyntaxKind.DefaultKeyword);
};

export const hasStaticModifier = (node: ts.Node) => {
  return hasModifier(node, ts.SyntaxKind.StaticKeyword);
};

export const hasPrivateModifier = (node: ts.Node) => {
  return hasModifier(node, ts.SyntaxKind.PrivateKeyword);
};

export const hasProtectedModifier = (node: ts.Node) => {
  return hasModifier(node, ts.SyntaxKind.ProtectedKeyword);
};

const isPrivate = (node: ts.Node) => {
  return hasPrivateModifier(node) || hasJSDocTag(node, 'private');
};

const isProtected = (node: ts.Node) => {
  return hasProtectedModifier(node) || hasJSDocTag(node, 'protected');
};

export const getPrivacy = (node: ts.Node): Privacy => {
  return isPrivate(node)
    ? 'private'
    : isProtected(node)
    ? 'protected'
    : 'public';
};

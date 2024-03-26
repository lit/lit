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

import type ts from 'typescript';
import {hasJSDocTag} from './javascript/jsdoc.js';
import {Privacy} from './model.js';

export type TypeScript = typeof ts;

export const hasModifier = (
  ts: TypeScript,
  node: ts.HasModifiers,
  modifier: ts.SyntaxKind
) => {
  return ts.getModifiers(node)?.some((s) => s.kind === modifier) ?? false;
};

export const hasExportModifier = (ts: TypeScript, node: ts.HasModifiers) => {
  return hasModifier(ts, node, ts.SyntaxKind.ExportKeyword);
};

export const hasDefaultModifier = (ts: TypeScript, node: ts.HasModifiers) => {
  return hasModifier(ts, node, ts.SyntaxKind.DefaultKeyword);
};

export const hasStaticModifier = (ts: TypeScript, node: ts.HasModifiers) => {
  return hasModifier(ts, node, ts.SyntaxKind.StaticKeyword);
};

export const hasPrivateModifier = (ts: TypeScript, node: ts.HasModifiers) => {
  return hasModifier(ts, node, ts.SyntaxKind.PrivateKeyword);
};

export const hasProtectedModifier = (ts: TypeScript, node: ts.HasModifiers) => {
  return hasModifier(ts, node, ts.SyntaxKind.ProtectedKeyword);
};

const isPrivate = (ts: TypeScript, node: ts.Node) => {
  return (
    (ts.canHaveModifiers(node) && hasPrivateModifier(ts, node)) ||
    ((ts.isPropertyDeclaration(node) || ts.isMethodDeclaration(node)) &&
      ts.isPrivateIdentifier(node.name)) ||
    hasJSDocTag(ts, node, 'private')
  );
};

const isProtected = (ts: TypeScript, node: ts.Node) => {
  return (
    (ts.canHaveModifiers(node) && hasProtectedModifier(ts, node)) ||
    hasJSDocTag(ts, node, 'protected')
  );
};

export const getPrivacy = (ts: TypeScript, node: ts.Node): Privacy => {
  return isPrivate(ts, node)
    ? 'private'
    : isProtected(ts, node)
    ? 'protected'
    : 'public';
};

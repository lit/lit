/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Reader for Custom Elements Manifest (CEM) files.
 *
 * Follows the Custom Elements Manifest v1 specification to extract
 * custom element metadata from dependency packages that publish a
 * `custom-elements.json` file.
 */

import {
  DependencyCustomElement,
  DependencyProperty,
  DependencyAttribute,
  DependencyEvent,
} from './dependency-analyzer.js';

// CEM v1 schema types (subset relevant to element discovery)

interface CEMManifest {
  schemaVersion: string;
  modules?: CEMModule[];
}

interface CEMModule {
  kind?: string;
  path?: string;
  declarations?: CEMDeclaration[];
  exports?: CEMExport[];
}

interface CEMDeclaration {
  kind?: string;
  name?: string;
  customElement?: boolean;
  tagName?: string;
  description?: string;
  members?: CEMMember[];
  attributes?: CEMAttribute[];
  events?: CEMEvent[];
  superclass?: {name?: string; package?: string; module?: string};
}

interface CEMMember {
  kind?: string;
  name?: string;
  type?: {text?: string};
  default?: string;
  description?: string;
  attribute?: string;
  reflects?: boolean;
  privacy?: string;
  static?: boolean;
  readonly?: boolean;
}

interface CEMAttribute {
  name?: string;
  type?: {text?: string};
  default?: string;
  description?: string;
  fieldName?: string;
}

interface CEMEvent {
  name?: string;
  type?: {text?: string};
  description?: string;
}

interface CEMExport {
  kind?: string;
  name?: string;
  declaration?: {name?: string; module?: string};
}

/**
 * Parses a Custom Elements Manifest JSON string and extracts custom element
 * metadata.
 *
 * @param jsonContent The raw JSON content of a `custom-elements.json` file
 * @param packageName The npm package name this manifest belongs to
 * @returns Array of custom element metadata found in the manifest
 */
export function parseCustomElementsManifest(
  jsonContent: string,
  packageName: string
): DependencyCustomElement[] {
  let manifest: CEMManifest;
  try {
    manifest = JSON.parse(jsonContent) as CEMManifest;
  } catch {
    return [];
  }

  if (!manifest.modules || !Array.isArray(manifest.modules)) {
    return [];
  }

  const elements: DependencyCustomElement[] = [];
  // Track tag name → class name from custom-element-definition exports
  const definitionExports = new Map<
    string,
    {className: string; modulePath: string}
  >();

  // First pass: collect custom-element-definition exports
  for (const module of manifest.modules) {
    if (!module.exports) continue;
    for (const exp of module.exports) {
      if (
        exp.kind === 'custom-element-definition' &&
        exp.name &&
        exp.declaration?.name
      ) {
        definitionExports.set(exp.name, {
          className: exp.declaration.name,
          modulePath: exp.declaration.module ?? module.path ?? '',
        });
      }
    }
  }

  // Second pass: extract element metadata from declarations
  for (const module of manifest.modules) {
    if (!module.declarations) continue;
    for (const decl of module.declarations) {
      if (decl.kind !== 'class' || !decl.customElement) continue;

      // Determine tag name from the declaration or from definition exports
      const tagName =
        decl.tagName ?? getTagNameFromExports(decl.name, definitionExports);
      if (!tagName || !decl.name) continue;

      const properties = new Map<string, DependencyProperty>();
      const attributes = new Map<string, DependencyAttribute>();
      const events = new Map<string, DependencyEvent>();

      // Extract members (fields and methods)
      if (decl.members) {
        for (const member of decl.members) {
          if (
            member.kind === 'field' &&
            member.name &&
            member.privacy !== 'private' &&
            member.privacy !== 'protected' &&
            !member.static
          ) {
            properties.set(member.name, {
              name: member.name,
              type: member.type?.text,
              default: member.default,
              description: member.description,
              attribute: member.attribute,
              reflects: member.reflects,
            });
          }
        }
      }

      // Extract attributes
      if (decl.attributes) {
        for (const attr of decl.attributes) {
          if (attr.name) {
            attributes.set(attr.name, {
              name: attr.name,
              type: attr.type?.text,
              default: attr.default,
              description: attr.description,
              fieldName: attr.fieldName,
            });
          }
        }
      }

      // Extract events
      if (decl.events) {
        for (const event of decl.events) {
          if (event.name) {
            events.set(event.name, {
              name: event.name,
              type: event.type?.text,
              description: event.description,
            });
          }
        }
      }

      elements.push({
        tagName,
        className: decl.name,
        packageName,
        modulePath: module.path ?? '',
        properties,
        attributes,
        events,
        description: decl.description,
        source: 'cem',
      });
    }
  }

  return elements;
}

function getTagNameFromExports(
  className: string | undefined,
  exports: Map<string, {className: string; modulePath: string}>
): string | undefined {
  if (!className) return undefined;
  for (const [tagName, info] of exports) {
    if (info.className === className) {
      return tagName;
    }
  }
  return undefined;
}

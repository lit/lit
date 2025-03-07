/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {Node, SyntaxKind} from 'typescript';

/**
 * A test harness for testing the TypeScript AST parsing.
 *
 * This class provides utilities for testing the TypeScript AST functionality,
 * including serializing nodes and asserting on their structure.
 */
export class TsAstTestHarness {
  /**
   * Serializes a TypeScript AST node into a human-readable format.
   *
   * @param node The node to serialize
   * @returns A human-readable representation of the node
   */
  serializeNode(node: Node): Record<string, unknown> {
    // Skip circular references and position information
    const seenNodes = new Set<Node>();
    return this._serializeNode(node, seenNodes);
  }

  /**
   * Helper method for serializeNode that handles circular references.
   *
   * @param node The node to serialize
   * @param seenNodes Set of already processed nodes
   * @returns A serialized representation of the node
   */
  private _serializeNode(
    node: Node,
    seenNodes: Set<Node>
  ): Record<string, unknown> {
    if (seenNodes.has(node)) {
      return {circular: true};
    }

    seenNodes.add(node);

    // Create a simplified representation
    const result: Record<string, unknown> = {
      kind: SyntaxKind[node.kind],
    };

    // Add other properties based on node type
    for (const key in node) {
      if (
        key !== 'parent' &&
        key !== 'pos' &&
        key !== 'end' &&
        key !== 'flags' &&
        key !== 'modifierFlagsCache' &&
        key !== 'transformFlags' &&
        key !== 'original' &&
        Object.prototype.hasOwnProperty.call(node, key)
      ) {
        const value = (node as unknown as Record<string, unknown>)[key];

        if (value === undefined) {
          continue;
        }

        if (value === null) {
          result[key] = null;
        } else if (Array.isArray(value)) {
          result[key] = value.map((item) => {
            if (item && typeof item === 'object' && 'kind' in item) {
              // Create a new set with the same nodes for recursion
              const newSet = new Set<Node>(seenNodes);
              return this._serializeNode(item as Node, newSet);
            }
            return item;
          });
        } else if (
          typeof value === 'object' &&
          value !== null &&
          'kind' in value
        ) {
          // Create a new set with the same nodes for recursion
          const newSet = new Set<Node>(seenNodes);
          result[key] = this._serializeNode(value as Node, newSet);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Asserts that a node's structure matches the expected serialized representation.
   *
   * @param node The node to check
   * @param expectedSerialized The expected serialized representation
   */
  assertNodeStructure(node: Node, expectedSerialized: string): void {
    const serialized = JSON.stringify(this.serializeNode(node), null, 2);
    assert.equal(serialized, expectedSerialized);
  }

  /**
   * Asserts that a node is of the expected kind.
   *
   * @param node The node to check
   * @param expectedKind The expected syntax kind
   */
  assertNodeKind(node: Node, expectedKind: SyntaxKind): void {
    assert.equal(node.kind, expectedKind);
  }

  /**
   * Creates a basic expected structure object for a specific node kind.
   * This is useful for quickly starting a test case.
   *
   * @param kind The syntax kind
   * @returns A basic expected structure
   */
  createBasicExpectedStructure(kind: SyntaxKind): Record<string, unknown> {
    return {
      kind: SyntaxKind[kind],
    };
  }

  /**
   * Simplifies comparing a real node to an expected structure by allowing
   * partial matching of properties.
   *
   * @param node The actual node
   * @param expectedPartial An object with the expected properties
   */
  assertNodePartialMatch(
    node: Node,
    expectedPartial: Record<string, unknown>
  ): void {
    const serialized = this.serializeNode(node);

    for (const key in expectedPartial) {
      if (Object.prototype.hasOwnProperty.call(expectedPartial, key)) {
        const expectedValue = expectedPartial[key];
        const actualValue = serialized[key];

        if (typeof expectedValue === 'object' && expectedValue !== null) {
          assert.deepEqual(
            actualValue,
            expectedValue,
            `Mismatch in property "${key}"`
          );
        } else {
          assert.equal(
            actualValue,
            expectedValue,
            `Mismatch in property "${key}"`
          );
        }
      }
    }
  }
}

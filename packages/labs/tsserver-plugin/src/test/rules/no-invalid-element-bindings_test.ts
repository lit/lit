/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {createTestProjectService} from '../project-service.js';
import {LitDiagnosticCode} from '../../lib/diagnostic-codes.js';
import type {Diagnostic} from 'typescript';

function assertDiagnosticMessages(
  diagnostics: readonly Diagnostic[],
  expectedMessages: string[]
) {
  const messages = diagnostics.map((d) => String(d.messageText)).sort();
  assert.deepEqual(messages, expectedMessages.sort());
}

suite('no-invalid-element-bindings', () => {
  test('No diagnostics for valid element bindings', () => {
    const projectService = createTestProjectService();
    const file = path.resolve(
      'test-files/basic-templates/src/element-binding-valid.ts'
    );
    const result = projectService.openClientFile(file);
    assert.ok(result.configFileName);
    const info = projectService.getScriptInfo(file)!;
    const project = info.containingProjects[0]!;
    const languageService = project.getLanguageService();
    const diagnostics = languageService
      .getSemanticDiagnostics(info.path)
      .filter(
        (d) => d.code === LitDiagnosticCode.ElementBindingNotDirectiveResult
      );
    assertDiagnosticMessages(diagnostics, []);
  });

  test('Invalid element bindings produce diagnostics', () => {
    const projectService = createTestProjectService();
    const file = path.resolve(
      'test-files/basic-templates/src/element-binding-invalid.ts'
    );
    const result = projectService.openClientFile(file);
    assert.ok(result.configFileName);
    const info = projectService.getScriptInfo(file)!;
    const project = info.containingProjects[0]!;
    const languageService = project.getLanguageService();
    const diagnostics = languageService
      .getSemanticDiagnostics(info.path)
      .filter(
        (d) => d.code === LitDiagnosticCode.ElementBindingNotDirectiveResult
      );
    assertDiagnosticMessages(
      diagnostics,
      [
        `Only DirectiveResults may be used in element-level bindings, but found '"foo"' in binding to <div>`,
        "Only DirectiveResults may be used in element-level bindings, but found '123' in binding to <div>",
        "Only DirectiveResults may be used in element-level bindings, but found 'true' in binding to <div>",
        "Only DirectiveResults may be used in element-level bindings, but found '{}' in binding to <div>",
      ].sort()
    );
  });
});

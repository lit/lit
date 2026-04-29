/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {getReusableTestProjectService} from '../project-service.js';
import {LitDiagnosticCode} from '../../lib/diagnostic-codes.js';
import type {Diagnostic} from 'typescript';

function assertDiagnosticMessages(
  diagnostics: readonly Diagnostic[],
  expectedMessages: string[]
) {
  const messages = diagnostics.map((d) => String(d.messageText)).sort();
  assert.deepEqual(messages, expectedMessages.sort());
}

suite('no-unassignable-property-bindings', () => {
  test('Unknown property diagnostic', () => {
    using cleanup = getReusableTestProjectService();
    const projectService = cleanup.projectService;
    const file = path.resolve(
      'test-files/basic-templates/src/property-binding-unknown.ts'
    );
    const result = projectService.openClientFile(file);
    assert.ok(result.configFileName);
    const info = projectService.getScriptInfo(file)!;
    const project = info.containingProjects[0]!;
    const languageService = project.getLanguageService();
    const diagnostics = languageService
      .getSemanticDiagnostics(info.path)
      .filter((d) => d.code === LitDiagnosticCode.UnknownProperty);
    assertDiagnosticMessages(diagnostics, [
      'Unknown property "unknown" on element <span>',
      'Unknown property "unknownelprop" on element <unknownel>',
    ]);
  });

  test('No diagnostics for assignable bindings', () => {
    using cleanup = getReusableTestProjectService();
    const projectService = cleanup.projectService;
    const file = path.resolve(
      'test-files/basic-templates/src/property-binding-assignable.ts'
    );
    const result = projectService.openClientFile(file);
    assert.ok(result.configFileName);
    const info = projectService.getScriptInfo(file)!;
    const project = info.containingProjects[0]!;
    const languageService = project.getLanguageService();
    const diagnostics = languageService
      .getSemanticDiagnostics(info.path)
      .filter(
        (d) =>
          d.code === LitDiagnosticCode.UnassignablePropertyBinding ||
          d.code === LitDiagnosticCode.UnknownProperty
      );
    assertDiagnosticMessages(diagnostics, []);
  });

  test('Unassignable bindings produce diagnostics', () => {
    using cleanup = getReusableTestProjectService();
    const projectService = cleanup.projectService;
    const file = path.resolve(
      'test-files/basic-templates/src/property-binding-unassignable.ts'
    );
    const result = projectService.openClientFile(file);
    assert.ok(result.configFileName);
    const info = projectService.getScriptInfo(file)!;
    const project = info.containingProjects[0]!;
    const languageService = project.getLanguageService();
    const diagnostics = languageService
      .getSemanticDiagnostics(info.path)
      .filter((d) => d.code === LitDiagnosticCode.UnassignablePropertyBinding);
    assertDiagnosticMessages(
      diagnostics,
      [
        `'123' is not assignable to 'string'`,
        `'"not-bool"' is not assignable to 'boolean'`,
        `'unique symbol' is not assignable to 'string'`,
        `'unique symbol' is not assignable to 'boolean'`,
        `'string' is not assignable to 'FailureType1'`,
        `'string' is not assignable to 'FailureType2'`,
        `'string' is not assignable to 'FailureType3'`,
        "'string' is not assignable to 'FailureType4'",
        "'string' is not assignable to 'FailureType5'",
        "'FailureType6' is not assignable to 'string'",
        "'FailureType7' is not assignable to 'string'",
      ].sort()
    );
  });
});

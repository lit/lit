import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {createTestProjectService} from '../project-service.js';
import {LitDiagnosticCode} from '../../lib/diagnostic-codes.js';

suite('no-unassignable-property-bindings', () => {
  test('Unknown property diagnostic', () => {
    const projectService = createTestProjectService();
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
    assert.equal(diagnostics.length, 1);
    assert.equal(
      diagnostics[0].messageText,
      'Unknown property "unknown" on element <span>'
    );
  });

  test('No diagnostics for assignable bindings', () => {
    const projectService = createTestProjectService();
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
    assert.equal(diagnostics.length, 0);
  });

  test('Unassignable bindings produce diagnostics', () => {
    const projectService = createTestProjectService();
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
    assert.equal(diagnostics.length, 2);
    const messages = diagnostics.map((d) => String(d.messageText)).sort();
    assert.deepEqual(
      messages,
      [
        `'123' is not assignable to 'string'`,
        `'"not-bool"' is not assignable to 'boolean'`,
      ].sort()
    );
  });
});

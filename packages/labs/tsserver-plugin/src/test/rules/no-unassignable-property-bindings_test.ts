import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {createTestProjectService} from '../project-service.js';

suite('no-unassignable-property-bindings', () => {
  test('Unknown property diagnostic (6303)', () => {
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
      .filter((d) => d.code === 6303);
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
      .filter((d) => d.code === 6302 || d.code === 6303);
    assert.equal(diagnostics.length, 0);
  });

  test('Unassignable bindings produce 6302 diagnostics', () => {
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
      .filter((d) => d.code === 6302);
    assert.equal(diagnostics.length, 2);
    const messages = diagnostics.map((d) => String(d.messageText));
    assert.ok(
      messages.some((m) => /is not assignable to string$/.test(m)),
      `Expected string assignability error. Got: ${messages.join('\n')}`
    );
    assert.ok(
      messages.some((m) => /is not assignable to boolean$/.test(m)),
      `Expected boolean assignability error. Got: ${messages.join('\n')}`
    );
  });
});

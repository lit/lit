import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {createTestProjectService} from '../project-service.js';

suite('no-unassignable-property-bindings', () => {
  test('Reports problems with property bindings', async () => {
    const projectService = createTestProjectService();

    const pathName = path.resolve(
      'test-files/basic-templates/src/property-binding.ts'
    );
    const result = projectService.openClientFile(pathName);
    assert.ok(result.configFileName);

    const info = projectService.getScriptInfo(pathName)!;
    const project = info.containingProjects[0]!;
    const languageService = project.getLanguageService();
    const diagnostics = languageService.getSemanticDiagnostics(info.path);

    assert.equal(diagnostics.length, 1);
    assert.equal(
      diagnostics[0].messageText,
      'Unknown property "unknown" on element <span>'
    );
    assert.equal(diagnostics[0].code, 6303);
  });
});

import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {createTestProjectService} from '../project-service.js';

suite('no-unassignable-property-bindings', () => {
  test('Reports every property binding (placeholder)', async () => {
    const {projectService, loaded} = createTestProjectService();

    const pathName = path.resolve(
      'test-files/basic-templates/src/property-binding.ts'
    );
    const result = projectService.openClientFile(pathName);
    assert.ok(result.configFileName);

    await loaded;

    const info = projectService.getScriptInfo(pathName)!;
    const project = info.containingProjects[0]!;
    const languageService = project.getLanguageService();
    const diagnostics = languageService
      .getSemanticDiagnostics(info.path)
      .filter((d) => d.code === 6302);

    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].messageText, '(placeholder) Property binding');
    assert.equal(diagnostics[0].code, 6302);
    const sourceText = diagnostics[0].source ?? '';
    assert.ok(
      sourceText.startsWith('.textContent=${value}'),
      `Unexpected source: ${sourceText}`
    );
  });
});

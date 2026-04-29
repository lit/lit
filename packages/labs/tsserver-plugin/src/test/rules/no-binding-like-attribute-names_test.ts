import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {LitDiagnosticCode} from '../../lib/diagnostic-codes.js';
import {getReusableTestProjectService} from '../project-service.js';

suite('no-binding-like-attribute-names', () => {
  test('Reports on property-binding-like attribute names', () => {
    using cleanup = getReusableTestProjectService();
    const projectService = cleanup.projectService;

    const pathName = path.resolve(
      'test-files/basic-templates/src/bad-attribute-name.ts'
    );
    const result = projectService.openClientFile(pathName);
    assert.ok(result.configFileName);

    const info = projectService.getScriptInfo(pathName);
    const project = info?.containingProjects[0];
    assert.ok(project);

    const languageService = project.getLanguageService();
    const diagnostics = languageService
      .getSemanticDiagnostics(info.path)
      .filter((d) => d.code === LitDiagnosticCode.BindingLikeAttributeName);
    assert.deepEqual(
      diagnostics.map((d) => d.messageText),
      ['Attribute name starts with a binding prefix (.)']
    );
    assert.equal(diagnostics[0].source, '.foo');
  });
});

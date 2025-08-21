import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {createTestProjectService} from '../project-service.js';
import {getLitTemplateExpressions} from '@lit-labs/analyzer/lib/lit/template.js';
import ts from 'typescript';

function setupLanguageService(pathName: string): {
  languageService: ts.LanguageService;
  program: ts.Program;
  testSourceFile: ts.SourceFile;
} {
  const projectService = createTestProjectService();
  const result = projectService.openClientFile(pathName);
  assert.ok(result.configFileName);

  const info = projectService.getScriptInfo(pathName);
  const project = info!.containingProjects[0];
  const languageService = project.getLanguageService();
  // Ensure that the LitLanguageService is being used
  assert.equal(languageService.constructor.name, 'LitLanguageService');
  const program = languageService.getProgram()!;
  const testSourceFile = program.getSourceFile(pathName);
  assert.ok(testSourceFile);
  return {languageService, program, testSourceFile};
}

function testDefinitionAtPosition(
  pathName: string,
  tagName: string,
  expectedDefinitionSourceText: string
) {
  const {languageService, program, testSourceFile} =
    setupLanguageService(pathName);

  const templates = getLitTemplateExpressions(
    testSourceFile,
    ts,
    program.getTypeChecker()
  );

  assert.equal(templates.length, 2);
  const standaloneTemplate = templates[1];
  const tagNamePosition = standaloneTemplate.getFullText().indexOf(tagName);
  if (tagNamePosition < 0) {
    throw new Error(
      `Tag name "${tagName}" not found in template: ${standaloneTemplate.getFullText()}`
    );
  }
  const position = standaloneTemplate.getFullStart() + tagNamePosition + 1;

  const definitions = languageService.getDefinitionAtPosition(
    pathName,
    position
  );
  const firstDefinition = definitions![0];

  // get the source text for the definition
  const definitionSourceFile = program.getSourceFile(firstDefinition.fileName);
  const definitionSourceText = definitionSourceFile!
    .getFullText()
    .slice(
      firstDefinition.textSpan.start,
      firstDefinition.textSpan.start + firstDefinition.textSpan.length
    );
  assert.equal(definitionSourceText, expectedDefinitionSourceText);
}

suite('lit-language-service', () => {
  test('getDefinitionAtPosition via analyzer', async () => {
    const pathName = path.resolve(
      'test-files/basic-templates/src/custom-element.ts'
    );
    await testDefinitionAtPosition(
      pathName,
      'x-foo',
      `@customElement('x-foo')
export class XFoo extends LitElement {
  render() {
    return html\`<slot></slot>\`;
  }
}`
    );
  });

  test('getDefinitionAtPosition via HTMLElementTagNameMap', async () => {
    const pathName = path.resolve(
      'test-files/basic-templates/src/custom-element.ts'
    );
    await testDefinitionAtPosition(
      pathName,
      'external-element',
      `declare class ExternalElement extends LitElement {\n  value: number;\n}`
    );
  });
});

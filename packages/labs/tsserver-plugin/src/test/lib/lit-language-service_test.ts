import assert from 'node:assert';
import * as path from 'node:path';
import {describe as suite, test} from 'node:test';
import {createTestProjectService} from '../project-service.js';
import {getLitTemplateExpressions} from '@lit-labs/analyzer/lib/lit/template.js';
import ts from 'typescript';

suite('lit-language-service', () => {
  test('test test', async () => {
    const {projectService, loaded} = createTestProjectService();

    const pathName = path.resolve(
      'test-files/basic-templates/src/custom-element.ts'
    );
    const result = projectService.openClientFile(pathName);
    assert.ok(result.configFileName);

    // The plugin is loaded async, so we need to wait for it to be loaded
    await loaded;

    const info = projectService.getScriptInfo(pathName);
    const project = info!.containingProjects[0];
    const languageService = project.getLanguageService();
    const program = languageService.getProgram()!;
    const testSourceFile = program.getSourceFile(pathName);
    assert.ok(testSourceFile);

    const templates = getLitTemplateExpressions(
      testSourceFile,
      ts,
      program.getTypeChecker()
    );

    assert.equal(templates.length, 2);
    const standaloneTemplate = templates[1];
    const xFooPosition =
      standaloneTemplate.getFullStart() +
      standaloneTemplate.getFullText().indexOf('x-foo') +
      1;

    const definitions = languageService.getDefinitionAtPosition(
      pathName,
      xFooPosition
    );
    const firstDefinition = definitions![0];

    // get the source text for the definition
    const definitionSourceFile = program.getSourceFile(
      firstDefinition.fileName
    );
    const definitionSourceText = definitionSourceFile!
      .getFullText()
      .slice(
        firstDefinition.textSpan.start,
        firstDefinition.textSpan.start + firstDefinition.textSpan.length
      );
    assert.equal(
      definitionSourceText,
      `@customElement('x-foo')
export class XFoo extends LitElement {
  render() {
    return html\`<slot></slot>\`;
  }
}`
    );
  });

  test('getReferencesAtPosition', async () => {
    const {projectService, loaded} = createTestProjectService();

    const pathName = path.resolve(
      'test-files/basic-templates/src/custom-element-children.ts'
    );
    const result = projectService.openClientFile(pathName);
    assert.ok(result.configFileName);
    await loaded;

    const info = projectService.getScriptInfo(pathName);
    const project = info!.containingProjects[0];
    const languageService = project.getLanguageService();
    const program = languageService.getProgram()!;
    const testSourceFile = program.getSourceFile(pathName);
    assert.ok(testSourceFile);

    const templates = getLitTemplateExpressions(
      testSourceFile,
      ts,
      program.getTypeChecker()
    );

    const standaloneTemplate = templates[0];
    const xFooPosition =
      standaloneTemplate.getFullStart() +
      standaloneTemplate.getFullText().indexOf('x-foo') +
      1;

    const refs = languageService.getReferencesAtPosition(
      pathName,
      xFooPosition
    );
    const firstRef = refs![0];

    const definitionSourceFile = program.getSourceFile(firstRef.fileName);
    const definitionSourceText = definitionSourceFile!
      .getFullText()
      .slice(
        firstRef.textSpan.start,
        firstRef.textSpan.start + firstRef.textSpan.length
      );
    assert.equal(
      definitionSourceText,
      `@customElement('x-foo')
export class XFoo extends LitElement {
  render() {
    return html\`<slot></slot>\`;
  }
}`
    );
  });
});

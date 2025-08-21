import assert from 'node:assert';
import path from 'node:path';
import {describe as suite, test} from 'node:test';
import * as ts from 'typescript';
import {getLitExpressionType} from '../../lib/type-helpers/lit-expression-type.js';

// Ensure the declarations are part of the program (side-effect import only).
import './fake-lit-html-types.js';

// Helper to build a Program including our fake lit-html types file.
function buildProgram(): ts.Program {
  // Build the path relative to the package root (cwd during tests) to avoid
  // accidentally duplicating path segments. The previous value incorrectly
  // prefixed the repository path twice when running inside the package.
  const fakeTypesPath = path.resolve('src/test/lib/fake-lit-html-types.ts');
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
  };
  return ts.createProgram([fakeTypesPath], options);
}

function getExportType(
  program: ts.Program,
  exportName: string
): ts.Type | undefined {
  const sourceFiles = program.getSourceFiles();
  const fakeFile = sourceFiles.find((f) =>
    /fake-lit-html-types\.ts$/.test(f.fileName)
  );
  if (!fakeFile) return undefined;
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(fakeFile);
  if (!moduleSymbol) return undefined;
  const exports = checker.getExportsOfModule(moduleSymbol);
  const symbol = exports.find((e) => e.getEscapedName() === exportName);
  if (!symbol) return undefined;
  const type = checker.getTypeOfSymbol(symbol);
  return type;
}

suite('getLitExpressionType', () => {
  test('sentinel unique symbols map to any', () => {
    const program = buildProgram();
    // Use the direct exported sentinel symbols so the type has the correct symbol name.
    const noChangeType = getExportType(program, 'noChange');
    const nothingType = getExportType(program, 'nothing');
    const noChangeResult = getLitExpressionType(noChangeType!, ts, program);
    const nothingResult = getLitExpressionType(nothingType!, ts, program);
    assert.ok(noChangeResult.flags & ts.TypeFlags.Any, 'noChange -> any');
    assert.ok(nothingResult.flags & ts.TypeFlags.Any, 'nothing -> any');
  });

  test('DirectiveResult unwraps to render return type (primitive)', () => {
    const program = buildProgram();
    const directiveResultNumber = getExportType(
      program,
      'directiveResultNumber'
    );
    const unwrapped = getLitExpressionType(directiveResultNumber!, ts, program);
    assert.ok(unwrapped.flags & ts.TypeFlags.Number, 'Expected number');
  });

  test('DirectiveResult unwraps to union of render return types', () => {
    const program = buildProgram();
    const directiveResultUnion = getExportType(program, 'directiveResultUnion');
    const unwrapped = getLitExpressionType(directiveResultUnion!, ts, program);
    assert.ok(unwrapped.isUnion(), 'Expected union');
    const flags = unwrapped.types.reduce((acc, t) => acc | t.flags, 0);
    assert.ok(flags & ts.TypeFlags.String, 'Union includes string');
    // Accept either Boolean or BooleanLiteral flags (the union currently consists of the literal true/false types).
    assert.ok(
      flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral),
      'Union includes boolean'
    );
  });

  test('Union containing DirectiveResult unwraps only that member', () => {
    const program = buildProgram();
    const mixed = getExportType(program, 'directiveResultOrString');
    const transformed = getLitExpressionType(mixed!, ts, program);
    assert.ok(transformed.isUnion(), 'Expected union');
    const hasNumber = transformed.types.some(
      (t) => t.flags & ts.TypeFlags.Number
    );
    const hasString = transformed.types.some(
      (t) => t.flags & ts.TypeFlags.String
    );
    assert.ok(hasNumber, 'Contains number from directive render');
    assert.ok(hasString, 'Contains original string');
  });

  test('Union with sentinel symbol collapses to any', () => {
    const program = buildProgram();
    const sentinelUnion = getExportType(program, 'sentinelUnion');
    const transformed = getLitExpressionType(sentinelUnion!, ts, program);
    assert.ok(
      transformed.flags & ts.TypeFlags.Any,
      'Expected any from union including sentinel'
    );
  });

  test('Plain non-special type is unchanged', () => {
    const plainProgram = buildProgram();
    const plainNumber = getExportType(plainProgram, 'plainNumber');
    const result = getLitExpressionType(plainNumber!, ts, plainProgram);
    assert.strictEqual(result, plainNumber);
  });

  test('Union without special values is unchanged', () => {
    const plainProgram = buildProgram();
    const plainUnion = getExportType(plainProgram, 'plainUnion');
    const result = getLitExpressionType(plainUnion!, ts, plainProgram);
    assert.strictEqual(result, plainUnion);
  });

  test('Sentinel-like symbol outside lit-html scope not treated as special', () => {
    // Create a synthetic unique symbol type named noChange but from a different file.
    const sourceText = 'export const noChange = Symbol("local");';
    const tempFile = path.resolve('src/test/lib/local-file.ts');
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      strict: true,
    };
    const host = ts.createCompilerHost(compilerOptions);
    host.readFile = (fileName) => {
      if (fileName === tempFile) return sourceText;
      return ts.sys.readFile(fileName);
    };
    host.fileExists = (fileName) => {
      if (fileName === tempFile) return true;
      return ts.sys.fileExists(fileName);
    };
    const shadowProgram = ts.createProgram(
      [path.resolve('src/test/lib/fake-lit-html-types.ts'), tempFile],
      compilerOptions,
      host
    );
    const checker = shadowProgram.getTypeChecker();
    const sf = shadowProgram
      .getSourceFiles()
      .find((f) => /local-file\.ts$/.test(f.fileName))!;
    const moduleSymbol = checker.getSymbolAtLocation(sf)!;
    const localSymbol = checker
      .getExportsOfModule(moduleSymbol)
      .find((s) => s.getEscapedName() === 'noChange')!;
    const localType = checker.getTypeOfSymbol(localSymbol);
    assert.ok(localType, 'got localtype');
    const result = getLitExpressionType(localType, ts, shadowProgram);
    // Should be unchanged (unique symbol stays unique symbol) not widened to any.
    assert.strictEqual(result, localType);
  });
});

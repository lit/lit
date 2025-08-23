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
  function normalizeUnion(s: string): string {
    // Split on ' | ' and sort for order-insensitive comparison.
    return s
      .split(' | ')
      .map((p) => p.trim())
      .sort()
      .join(' | ');
  }

  test('sentinel unique symbols map to any', () => {
    const program = buildProgram();
    const checker = program.getTypeChecker();
    // Use the direct exported sentinel symbols so the type has the correct symbol name.
    const noChangeType = getExportType(program, 'noChange');
    const nothingType = getExportType(program, 'nothing');
    assert.strictEqual(checker.typeToString(noChangeType!), 'unique symbol');
    assert.strictEqual(checker.typeToString(nothingType!), 'unique symbol');
    const noChangeResult = getLitExpressionType(noChangeType!, ts, program);
    const nothingResult = getLitExpressionType(nothingType!, ts, program);
    assert.strictEqual(checker.typeToString(noChangeResult), 'any');
    assert.strictEqual(checker.typeToString(nothingResult), 'any');
    assert.ok(noChangeResult.flags & ts.TypeFlags.Any, 'noChange -> any');
    assert.ok(nothingResult.flags & ts.TypeFlags.Any, 'nothing -> any');
  });

  test('DirectiveResult unwraps to render return type (primitive)', () => {
    const program = buildProgram();
    const checker = program.getTypeChecker();
    const directiveResultNumber = getExportType(
      program,
      'directiveResultNumber'
    );
    assert.strictEqual(
      checker.typeToString(directiveResultNumber!),
      'DirectiveResult<typeof MyDirective>'
    );
    const unwrapped = getLitExpressionType(directiveResultNumber!, ts, program);
    assert.ok(unwrapped.flags & ts.TypeFlags.Number, 'Expected number');
    assert.strictEqual(checker.typeToString(unwrapped), 'number');
  });

  test('DirectiveResult unwraps to union of render return types', () => {
    const program = buildProgram();
    const checker = program.getTypeChecker();
    const directiveResultUnion = getExportType(program, 'directiveResultUnion');
    assert.strictEqual(
      checker.typeToString(directiveResultUnion!),
      'DirectiveResult<typeof OtherDirective>'
    );
    const unwrapped = getLitExpressionType(directiveResultUnion!, ts, program);
    assert.ok(unwrapped.isUnion(), 'Expected union');
    const flags = unwrapped.types.reduce((acc, t) => acc | t.flags, 0);
    assert.ok(flags & ts.TypeFlags.String, 'Union includes string');
    // Accept either Boolean or BooleanLiteral flags (the union currently consists of the literal true/false types).
    assert.ok(
      flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral),
      'Union includes boolean'
    );
    // Union order can vary; normalize.
    assert.strictEqual(
      normalizeUnion(checker.typeToString(unwrapped)),
      normalizeUnion('boolean | string')
    );
  });

  test('Union containing DirectiveResult unwraps only that member', () => {
    const program = buildProgram();
    const checker = program.getTypeChecker();
    const mixed = getExportType(program, 'directiveResultOrString');
    assert.strictEqual(
      normalizeUnion(checker.typeToString(mixed!)),
      normalizeUnion('DirectiveResult<typeof MyDirective> | string')
    );
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
    assert.strictEqual(
      normalizeUnion(checker.typeToString(transformed)),
      normalizeUnion('number | string')
    );
  });

  test('Union with sentinel symbol collapses to any', () => {
    const program = buildProgram();
    const checker = program.getTypeChecker();
    const sentinelUnion = getExportType(program, 'sentinelUnion');
    const originalStr = checker.typeToString(sentinelUnion!);
    const transformed = getLitExpressionType(sentinelUnion!, ts, program);
    assert.ok(
      transformed.flags & ts.TypeFlags.Any,
      'Expected any from union including sentinel'
    );
    // The sentinel side is a value symbol reference; we assert membership not order.
    const parts = normalizeUnion(originalStr).split(' | ');
    assert.ok(parts.includes('number')); // union with number
    assert.ok(parts.includes('unique symbol'));
    assert.strictEqual(checker.typeToString(transformed), 'any');
  });

  test('Plain non-special type is unchanged', () => {
    const plainProgram = buildProgram();
    const checker = plainProgram.getTypeChecker();
    const plainNumber = getExportType(plainProgram, 'plainNumber');
    assert.strictEqual(checker.typeToString(plainNumber!), '123');
    const result = getLitExpressionType(plainNumber!, ts, plainProgram);
    assert.strictEqual(result, plainNumber);
    // literal 123 keeps its literal type.
    assert.strictEqual(checker.typeToString(result), '123');
  });

  test('Union without special values is unchanged', () => {
    const plainProgram = buildProgram();
    const checker = plainProgram.getTypeChecker();
    const plainUnion = getExportType(plainProgram, 'plainUnion');
    const result = getLitExpressionType(plainUnion!, ts, plainProgram);
    assert.strictEqual(result, plainUnion);
    assert.strictEqual(
      normalizeUnion(checker.typeToString(plainUnion!)),
      normalizeUnion(checker.typeToString(result))
    );
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
    assert.strictEqual(checker.typeToString(localType), 'unique symbol');
    assert.strictEqual(checker.typeToString(result), 'unique symbol');
  });
});

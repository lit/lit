# AST Test Harnesses

This directory contains test harnesses for testing the AST-related functionality in the Lit parser.

## HTML Parser Test Harnesses

### HtmlParserTestHarness

Located in `html-parser/html-parser-test-harness.ts`, this is a general-purpose test harness for testing HTML parsing functionality. It provides methods for:

- Creating mock templates with expressions
- Parsing HTML content
- Creating mock parser states
- Asserting on the structure of parsed HTML nodes

Example usage:

```typescript
const harness = new HtmlParserTestHarness();

// Parse HTML and assert on the result
harness.testParse('<div class="test">Hello</div>', (fragment) => {
  harness.assertChildCount(fragment, 1);
  const div = fragment.childNodes[0] as Element;
  harness.assertElement(div, 'div');
  harness.assertAttribute(div, 'class', 'test');
  harness.assertChildCount(div, 1);
  harness.assertTextNode(div.childNodes[0], 'Hello');
});
```

### HtmlParserModeTestHarness

Located in `html-parser/html-parser-mode-test-harness.ts`, this test harness focuses specifically on testing the mode transitions within the HTML parser. It provides methods for:

- Getting the current parser mode after parsing content
- Asserting on the current mode
- Testing sequences of inputs and mode transitions

Example usage:

```typescript
const harness = new HtmlParserModeTestHarness();

// Test a specific mode transition
harness.assertParserMode('<div class="', Mode.ATTRIBUTE_VALUE);

// Test attribute mode specifically
harness.assertParserAttributeMode('<div class="', AttributeMode.STRING);

// Test a sequence of inputs and mode transitions
harness.testModeSequence(
  ['<div>', 'Hello', '</div>'],
  [Mode.TEXT, Mode.TEXT, Mode.TEXT]
);
```

## ESTree Test Harness

Located in `estree/estree-test-harness.ts`, this test harness is designed for testing ESTree AST-related functionality. It provides methods for:

- Creating mock tagged template expressions
- Asserting on node types and structure
- Serializing nodes for comparison

Example usage:

```typescript
const harness = new EsTreeTestHarness();

// Create a mock tagged template expression
const node = harness.createMockTaggedTemplateExpression('html', '<div></div>');

// Assert it's a Lit tagged template
harness.assertIsLitTaggedTemplateExpression(node);

// Assert on tag name
harness.assertTagName(node, 'html');
```

## TypeScript AST Test Harness

Located in `ts-ast/ts-ast-test-harness.ts`, this test harness is designed for testing TypeScript AST-related functionality. It provides methods for:

- Serializing TS AST nodes into human-readable formats
- Asserting on node structure and kind
- Partial matching of node properties

Example usage:

```typescript
const harness = new TsAstTestHarness();

// Assert on node kind
harness.assertNodeKind(node, ts.SyntaxKind.TaggedTemplateExpression);

// Assert partial structure match
harness.assertNodePartialMatch(node, {
  kind: 'TaggedTemplateExpression',
  tag: {
    kind: 'Identifier',
    text: 'html',
  },
});
```

## Usage Guidelines

1. Choose the appropriate test harness based on what you're testing (HTML parsing, ESTree nodes, or TS AST).
2. Use the harness to create mock objects and assert on their structure.
3. When writing new tests:
   - Focus on testing the behavior, not the implementation details.
   - Consider edge cases and error conditions.
   - Use descriptive test names that clearly indicate what's being tested.

## Creating a New Test File

When creating a new test file:

1. Import the appropriate test harness.
2. Create a new instance of the harness in the `setup` function.
3. Organize tests into logical suites.
4. Use the harness methods to create test objects and make assertions.

Example structure:

```typescript
import {HtmlParserTestHarness} from './html-parser-test-harness.js';

suite('Feature Name', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Specific Functionality', () => {
    test('should handle specific case', () => {
      harness.testParse('...', (fragment) => {
        // Make assertions...
      });
    });
  });
});
```

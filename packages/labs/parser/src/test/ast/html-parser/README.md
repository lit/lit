# HTML Parser Test Harness

This directory contains a test harness for the HTML parser in the `@lit-labs/parser` package. The test harness provides utilities for testing the HTML parser functionality, including creating mock template expressions, parsing templates, and asserting on the resulting AST.

## Files

- `html-parser-test-harness.ts`: The main test harness class with utilities for testing the HTML parser
- `parse5-shim_test.ts`: Tests for the parse5-shim module
- `template-literal_test.ts`: Tests for the template-literal module
- `html-parser_test.ts`: Integration tests for the HTML parser

## Using the Test Harness

The `HtmlParserTestHarness` class provides several utilities for testing the HTML parser:

### Creating Mock Templates

```typescript
const harness = new HtmlParserTestHarness();
const mockTemplate = harness.createMockTemplate('<div>Hello world</div>');
```

### Parsing HTML

```typescript
const harness = new HtmlParserTestHarness();
const fragment = harness.parseHtml('<div>Hello world</div>');
```

### Testing with Expressions

```typescript
const harness = new HtmlParserTestHarness();
const expr = harness.createMockExpression({});
const fragment = harness.parseHtml('Hello ${expr} world', [expr]);
```

### Making Assertions

```typescript
harness.testParse('<div>Hello world</div>', (fragment) => {
  harness.assertChildCount(fragment, 1);
  const div = fragment.childNodes[0] as Element;
  harness.assertElement(div, 'div');
  harness.assertChildCount(div, 1);
  harness.assertTextNode(div.childNodes[0], 'Hello world');
});
```

### Testing Parser State

```typescript
const template = {
  start: 0,
  end: 5,
  value: {
    raw: '<div>',
  },
};

const initialState = harness.createMockState(Mode.TEXT);

harness.testParseSpan(template, initialState, (state) => {
  assert.equal(state.mode, Mode.TAG);
  assert.isNotNull(state.currentElementNode);
  assert.equal(String(state.currentElementNode!.tagName), 'div');
});
```

## Running Tests

To run the tests, use the following command:

```bash
npm test  # This will automatically build the test files and run them
```

This will run all the tests in the `packages/labs/parser/test` directory using the web-test-runner.

## Adding New Tests

To add new tests, create a new test file in this directory and import the `HtmlParserTestHarness` class. Then use the utilities provided by the harness to test the HTML parser functionality.

For example:

```typescript
import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';

suite('My New Tests', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  test('my test', () => {
    harness.testParse('<my-element></my-element>', (fragment) => {
      // Make assertions here
    });
  });
});
```

## Parser State Machine

The HTML parser operates as a state machine, transitioning between different modes as it processes HTML content. Understanding these transitions is crucial for writing effective tests.

### Main Parser Modes

- `TEXT`: The parser is in text mode, parsing text content outside of tags
- `TAG`: The parser is in tag mode, parsing tag content (attributes, etc.)
- `TAG_NAME`: The parser is parsing a tag name
- `ATTRIBUTE`: The parser is parsing an attribute name
- `ATTRIBUTE_VALUE`: The parser is parsing an attribute value
- `COMMENT`: The parser is parsing a comment
- `CLOSING_TAG`: The parser is parsing a closing tag

### Attribute Modes

When in `ATTRIBUTE_VALUE` mode, the parser can be in one of the following attribute modes:

- `STRING`: Standard string attribute (e.g., `class="foo"`)
- `PROPERTY`: Property binding (e.g., `.property="value"`)
- `BOOLEAN`: Boolean attribute (e.g., `?checked="${expr}"`)
- `EVENT`: Event binding (e.g., `@click="${handler}"`)

### Expected State Transitions

Here are the expected transitions for common HTML parsing scenarios:

1. **Opening tags**: `TEXT` → `TAG` → `TAG_NAME` → `TAG` → `TEXT`

   - Example: `<div>` transitions from `TEXT` to `TAG` when encountering `<`, then to `TAG_NAME` after a character, then back to `TAG` after the name, and finally to `TEXT` after `>`

2. **Attributes**: `TAG` → `ATTRIBUTE` → `ATTRIBUTE_VALUE` → `TAG`

   - Example: `<div class="foo">` enters `ATTRIBUTE` mode after the space, then `ATTRIBUTE_VALUE` after `=`, and back to `TAG` after the closing quote

3. **Self-closing tags**: `TAG` → `TAG_NAME` → `TAG` → `TEXT`

   - Example: `<input />` ends in `TEXT` mode after parsing the `/>`

4. **Closing tags**: `TEXT` → `CLOSING_TAG` → `TEXT`

   - Example: `</div>` transitions from `TEXT` to `CLOSING_TAG` when encountering `</`, then back to `TEXT` after `>`

5. **Comments**: `TEXT` → `COMMENT` → `TEXT`
   - Example: `<!-- comment -->` enters `COMMENT` mode after `<!--` and returns to `TEXT` after `-->`

When writing tests, make sure to assert the expected mode after each parsing step to validate the parser's behavior correctly.

### State Machine Diagram

```
                  Opening '>'
                      │
                      ▼
              ┌───────────────┐     '<'     ┌───────────────┐
              │               │◄────────────┤               │
              │     TEXT      │             │      TAG      │◄─┐
              │               │─────────────►               │  │
              └───────────────┘     '</'    └───────────────┘  │
                      ▲                            │           │
                      │                            │ [a-zA-Z]  │
                      │                            ▼           │
                      │                    ┌───────────────┐   │
              '>'     │                    │   TAG_NAME    │   │
              ─────────                    │               │   │
                      │                    └───────────────┘   │
              ┌───────────────┐                  │            │
              │               │                  │ ' '        │
              │  CLOSING_TAG  │                  └────────────┘
              │               │                       ┌─────────────┐
              └───────────────┘                       │             │
                                                      │  ATTRIBUTE  │
                                                      │             │
               ┌──────────────┐                       └─────────────┘
               │              │                             │
          ────►│   COMMENT    │                             │ '='
          '!--'│              │                             ▼
               └──────────────┘                       ┌─────────────┐
                      │  '-->'                        │  ATTRIBUTE  │
                      └────────────────────────────────►   VALUE    │
                                                      │             │
                                                      └─────────────┘
                                                             │
                                                             │ '"' or "'"
                                                             │ ' ' (unquoted)
                                                             └─────►
```

This diagram shows the primary state transitions in the HTML parser. The arrows represent the characters or conditions that trigger each transition. Understanding this flow is essential for writing tests that correctly validate the parser's behavior.

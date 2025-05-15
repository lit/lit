import {
  LitHtmlExpression,
  LitTagLiteral,
  SimpleLocation,
  SimpleElementLocation,
  Attribute,
} from './parse5-shim.js';
import {AttributeMode, State} from './state.js';

/**
 * Converts an array of LitTagLiteral and LitHtmlExpression objects into a string representation.
 *
 * This utility function is used to create a string representation of tag names or other HTML content
 * that may contain a mix of literal strings and expressions. Literal values are preserved as-is,
 * while expressions are replaced with the placeholder '[[EXPRESSION]]'.
 *
 * @param expressionList - An array of LitTagLiteral and/or LitHtmlExpression objects to convert
 * @returns A string where literals are preserved and expressions are replaced with '[[EXPRESSION]]'
 */
export function coerceLiteralExpressionString(
  ...expressionList: Array<LitTagLiteral | LitHtmlExpression>
): string {
  return expressionList
    .map((tag) => (tag.type === 'LitTagLiteral' ? tag.value : '[[EXPRESSION]]'))
    .join('');
}

/**
 * Generates a unique identifier for a LitHtmlExpression in an attribute context.
 *
 * This function creates a unique name by combining the expression's nodeName with its
 * source code start offset position, ensuring each expression can be uniquely identified.
 *
 * @param expression - The LitHtmlExpression to generate a unique name for
 * @returns A string in the format `nodeName--startOffset` that uniquely identifies the expression
 */
export function getUniqueAttributeExpressionName(
  expression: LitHtmlExpression
) {
  return `#LitElementExpression-${expression.sourceCodeLocation.startOffset}`;
}

/**
 * Type guard to check if a location is a SimpleElementLocation
 *
 * @param location The location to check
 */
export function isElementLocation(
  location: SimpleLocation | SimpleElementLocation
): location is SimpleElementLocation {
  return 'startTag' in location;
}

/**
 * Updates the source code location for a node.
 *
 * @param charLocation The current character location
 * @param options Additional options for updating the source location
 */
export function updateSourceLocation(
  charLocation: number,
  node: {
    sourceCodeLocation?: SimpleLocation | SimpleElementLocation | undefined;
  },
  options?: {
    /** Additional offset to add to the end offset */
    additionalEndOffset?: number;
    /** Update start tag end offset (for element nodes) */
    updateStartTag?: boolean;
  }
) {
  if (node.sourceCodeLocation) {
    node.sourceCodeLocation.endOffset =
      charLocation + (options?.additionalEndOffset ?? 0);

    if (
      options?.updateStartTag &&
      isElementLocation(node.sourceCodeLocation) &&
      node.sourceCodeLocation.startTag
    ) {
      node.sourceCodeLocation.startTag!.endOffset =
        node.sourceCodeLocation.endOffset;
    }
  }
}

/**
 * Updates the attribute source locations for an element node.
 *
 * @param charLocation The current character location
 * @param attributeNode The attribute node
 * @param sigil The attribute sigil (., ?, @, or empty string)
 */
export function updateAttributeSourceLocation(
  charLocation: number,
  elementNode: {
    sourceCodeLocation?: SimpleElementLocation | undefined;
  },
  attributeNode: Exclude<Attribute, LitHtmlExpression>
) {
  if (elementNode.sourceCodeLocation) {
    // Calculate the attribute name string and first part start offset
    const attrNameString = coerceLiteralExpressionString(...attributeNode.name);
    const firstAttrPartStart =
      attributeNode.name[0]?.sourceCodeLocation?.startOffset ?? charLocation;

    // Update the source location using the provided character location
    elementNode.sourceCodeLocation.attrs![attrNameString] = {
      startOffset: firstAttrPartStart,
      endOffset: charLocation,
    };
    elementNode.sourceCodeLocation.startTag!.attrs =
      elementNode.sourceCodeLocation.attrs!;
  }
}

export function isValidAttributeStartCharacter(char: string): boolean {
  if (char === '/') {
    return false;
  }
  return !char.match(/[\s\n]/);
}

/**
 * Prepares the parser state for attribute mode.
 *
 * This function is used when the parser encounters the start of a new attribute.
 * It creates a new tag literal with the provided character (if any) and sets up
 * a new attribute node with the current attribute mode.
 *
 * @param state The current parser state
 * @param char The character to include in the new tag literal (empty for binding sigils)
 */
export function prepareForAttributeMode(state: State, char = '') {
  if (!state.attributeMode) {
    state.attributeMode = AttributeMode.STRING;
  }

  state.currentTagLiteral = {
    type: 'LitTagLiteral',
    value: char,
    sourceCodeLocation: {
      // we don't pass the binding sigil, so start offset is the length of the
      // current char, because this handles string attributes as well which
      // don't have a binding sigil
      startOffset: state.charLocation - char.length,
      endOffset: state.charLocation,
    },
  };

  state.currentAttributeNode = {
    name: [],
    value: [],
    type: state.attributeMode,
    element: state.currentElementNode!,
  };
}

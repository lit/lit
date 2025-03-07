import {css, html, LitElement, type PropertyValues} from 'lit';
import {customElement, query, state, property} from 'lit/decorators.js';
import type {CodeMirrorEditor, SelectionChangeEvent} from 'codemirror-elements';
import 'codemirror-elements';
import './output/output-panel.js';
import {LanguageSupport, LRLanguage} from '@codemirror/language';
import {LRParser} from '@lezer/lr';
import {Input, parseMixed, SyntaxNodeRef} from '@lezer/common';
import {htmlLanguage} from '@codemirror/lang-html';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirrorExtensionElement} from 'codemirror-elements/lib/cm-extension-element.js';

function mixedTaggedTemplate(node: SyntaxNodeRef, input: Input) {
  const isTaggedTemplate = node.type.name === 'TaggedTemplateExpression';
  let isHtmlTag = false;

  if (isTaggedTemplate) {
    const tag = node.node.getChild('VariableName');
    isHtmlTag = !!tag && input.read(tag.from, tag.to) === 'html';
  }

  // Check if the node is a TaggedTemplate literal and the tag is "html"
  if (isHtmlTag) {
    const content = node.node.getChild('TemplateString');
    // jump into the html language parser
    if (content) {
      return {
        from: content.from,
        to: content.to,
        parser: htmlLanguage.parser,
        delims: {open: '${', close: '}'},
      };
    }
  }
  return null;
}

// Create our mixed wrapper using parseMixed.
const mixedWrapper = parseMixed(mixedTaggedTemplate);
@customElement('cm-lang-javascript')
export class CodeMirrorLangJavascript extends CodeMirrorExtensionElement {
  @property({type: Boolean})
  jsx = false;

  @property({type: Boolean})
  typescript = false;

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('jsx') || changedProperties.has('typescript')) {
      // Create the base JavaScript language support extension
      const jsSupport = javascript({
        jsx: this.jsx,
        typescript: this.typescript,
      });

      const baseParser = jsSupport.language.parser as LRParser;
      // Configure the parser to use our mixed-language wrapper.
      const wrappedParser = baseParser.configure({wrap: mixedWrapper});

      // Create a language from the wrapped parser
      const taggedTemplateLanguage = LRLanguage.define({
        parser: wrappedParser,
        languageData: jsSupport.language.data.of({}),
      });

      // Build a new LanguageSupport extension with the new parser.
      const taggedTemplateLiteralLanguageSupport = new LanguageSupport(
        taggedTemplateLanguage,
        jsSupport.extension
      );

      // Set the new extension on the editor.
      this.setExtensions([taggedTemplateLiteralLanguageSupport]);
    }
    super.update(changedProperties);
  }
}

@customElement('code-mirror')
export class CodeMirrorElement extends LitElement {
  @query('cm-editor') editor!: CodeMirrorEditor;
  @state() value = '';
  @state() selectionStart = 0;

  override render() {
    return html`
      <div>
        <cm-editor
          @codemirror-document-change=${this.#onChange}
          @codemirror-selection-change=${this.#onSelectionChange}
          value="const name = 'world';

const asdf = html\`<div>Hello \${name}</div>\`"
        >
          <cm-lang-javascript typescript></cm-lang-javascript>
        </cm-editor>
        <output-panel
          .source=${this.value}
          .selectionStart=${this.selectionStart}
        ></output-panel>
      </div>
    `;
  }

  override firstUpdated() {
    this.value = this.editor.value ?? '';
  }

  #onChange() {
    this.value = this.editor.value ?? '';
  }

  #onSelectionChange(e: SelectionChangeEvent) {
    if (e.selection.ranges.length === 0) {
      return;
    }

    this.selectionStart = e.selection.ranges[0].from;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }
    div {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'code-mirror': CodeMirrorElement;
    'cm-lang-javascript': CodeMirrorLangJavascript;
  }
}

import type * as shiki from 'shiki';
import {createHighlighter} from 'shiki';
import {html, TemplateResult} from 'lit';

export type ShikiLang = string;

let highlighterPromise: Promise<shiki.Highlighter>;

export function getHighlighter(): Promise<shiki.Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light'],
      langs: ['json', 'typescript', 'css'],
    });
  }
  return highlighterPromise;
}

export async function highlight(
  code: string,
  lang: ShikiLang
): Promise<TemplateResult> {
  try {
    const highlighter = await getHighlighter();
    const tokens = highlighter.codeToTokens(code, {
      lang: lang as shiki.BundledLanguage,
      theme: 'github-light',
    });

    // Convert tokens to lit-html template
    return html`
      <pre class="shiki" style="background-color: transparent">
        <code>
          ${tokens.tokens.map(
        (line, i) => html`
          <span class="line">
            ${line.map(
              (token) => html`
                <span style="color: ${token.color}">${token.content}</span>
              `
            )}
          </span>
          ${i < tokens.tokens.length - 1 ? html`` : ''}
        `
      )}
        </code>
      </pre>
    `;
  } catch (error) {
    console.error('Error highlighting code:', error);
    return html`
      <pre class="language-${lang}">
        <code>${code}</code>
      </pre
      >
    `;
  }
}

export async function getHighlightColor(
  code: string | undefined,
  lang: shiki.BundledLanguage | shiki.SpecialLanguage
): Promise<string> {
  if (code == null) return '';
  try {
    const highlighter = await getHighlighter();
    const result = highlighter.codeToTokens(code, {
      lang,
      theme: 'github-light',
    });
    const token = result.tokens[0];
    const idx = code.startsWith('"') && token.length > 1 ? 1 : 0;
    return token[idx].color || '';
  } catch (error) {
    console.error('Error getting highlight color:', error);
    return '';
  }
}

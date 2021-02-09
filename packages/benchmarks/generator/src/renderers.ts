/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {depthForLevel, nextLevel} from './utils.js';

// Abstract renderer
export interface TemplateRenderer {
  legacyScripts?: string[];
  startBenchmark: (variant: string) => string;
  startTemplate: (s: string, name: string) => string;
  openTagStart: (
    s: string,
    level: string,
    tag: string,
    attrCount: number,
    staticAttrCount: number
  ) => string;
  setAttr: (
    s: string,
    level: string,
    name: string,
    isStatic: boolean,
    isConstant: boolean,
    valPerDynAttr: number
  ) => string;
  openTagEnd: (
    s: string,
    level: string,
    tag: string,
    attrCount: number
  ) => string;
  textNode: (
    s: string,
    level: string,
    isStatic: boolean,
    value: string
  ) => string;
  closeTag: (s: string, level: string, tag: string) => string;
  callTemplate: (
    s: string,
    level: string,
    name: string,
    isConstant: boolean
  ) => string;
  endTemplate: (s: string, level?: string) => string;
  render: () => string;
  endBenchmark: () => string;
}

export const getRenderers = (opts: {
  pretty: boolean;
}): {[key: string]: TemplateRenderer} => {
  // Returns padding for pretty-printing appropriate for the depth of the level,
  // or nothing if pretty printing is disabled
  const indent = (level: string, more = 0) => {
    return opts.pretty ? '  '.repeat(depthForLevel(level) + more) : '';
  };
  // Returns carriage return, or nothing if pretty printing is disabled
  const cr = () => {
    return opts.pretty ? '\n' : '';
  };

  // Concrete renderers...

  const litRenderer: TemplateRenderer = {
    startBenchmark() {
      return `
  import {html, render as litRender} from 'lit-html';
  `;
    },
    startTemplate(s: string, name: string) {
      return s + `const ${name} = () => html\`${cr()}`;
    },
    openTagStart: (
      s: string,
      level: string,
      tag: string,
      _attrCount: number,
      _staticAttrCount: number
    ) => {
      return s + `${indent(level)}<${tag}`;
    },
    setAttr(
      s: string,
      _level: string,
      name: string,
      isStatic: boolean,
      isConstant: boolean,
      valPerDynAttr: number
    ) {
      if (isStatic) {
        return s + ` a${name}="${name}"`;
      } else {
        return (
          s +
          ` a${name}="` +
          Array(valPerDynAttr)
            .fill(0)
            .map((_, i) => {
              const mod = valPerDynAttr > 1 ? `:${i}` : '';
              return `\${'${name}${mod}${isConstant ? `'` : `#' + updateId`}}`;
            })
            .join('-') +
          '"'
        );
      }
    },
    openTagEnd(s: string, _level: string, _tag: string, _attrCount: number) {
      return s + `>${cr()}`;
    },
    textNode(s: string, level: string, _isStatic: boolean, value: string) {
      return s + `${indent(level, 1)}${value}${cr()}`;
    },
    closeTag(s: string, level: string, tag: string) {
      return s + `${indent(level)}</${tag}>${cr()}`;
    },
    callTemplate(s: string, level: string, name: string, isConstant: boolean) {
      if (isConstant) {
        return s + `${indent(level, 1)}\${${name}()}${cr()}`;
      } else {
        return (
          s +
          `${indent(
            level,
            1
          )}\${useTemplateA ? ${name}A() :  ${name}B()}${cr()}`
        );
      }
    },
    endTemplate(s: string, _level = '') {
      return s + `\`;\n`;
    },
    render() {
      return `litRender(render(), container);`;
    },
    endBenchmark() {
      return `</script>`;
    },
  };

  const idomRenderer: TemplateRenderer = {
    legacyScripts: [
      '../node_modules/incremental-dom/dist/incremental-dom-min.js',
    ],
    startBenchmark() {
      return `
  const {elementOpen, elementOpenStart, elementOpenEnd, text, attr, elementClose, patch} = window.IncrementalDOM;
  `;
    },
    startTemplate(s: string, name: string) {
      return s + `const ${name} = () => {${cr()}`;
    },
    openTagStart(
      s: string,
      level: string,
      tag: string,
      attrCount: number,
      _staticAttrCount: number
    ) {
      if (attrCount > 0) {
        return s + `${indent(level)}elementOpenStart('${tag}');${cr()}`;
      } else {
        return s + `${indent(level)}elementOpen('${tag}');${cr()}`;
      }
    },
    setAttr(
      s: string,
      level: string,
      name: string,
      isStatic: boolean,
      isConstant: boolean,
      valPerDynAttr: number
    ) {
      if (isStatic) {
        return s + `${indent(level)}attr('a${name}', '${name}');${cr()}`;
      } else {
        return (
          s +
          `${indent(level)}attr('a${name}', ` +
          Array(valPerDynAttr)
            .fill(0)
            .map((_, i) => {
              const mod = valPerDynAttr > 1 ? `:${i}` : '';
              return `'${name}${mod}${isConstant ? `'` : `#' + updateId`}`;
            })
            .join(` + '-' + `) +
          ');' +
          cr()
        );
      }
    },
    openTagEnd(s: string, level: string, tag: string, attrCount: number) {
      if (attrCount > 0) {
        return s + `${indent(level)}elementOpenEnd('${tag}');${cr()}`;
      } else {
        return s;
      }
    },
    textNode(s: string, level: string, _isStatic: boolean, value: string) {
      return s + `${indent(level, 1)}text('${value}');${cr()}`;
    },
    closeTag(s: string, level: string, tag: string) {
      return s + `${indent(level)}elementClose('${tag}');${cr()}`;
    },
    callTemplate(s: string, level: string, name: string, isConstant: boolean) {
      if (isConstant) {
        return s + `${indent(level, 1)}${name}();${cr()}`;
      } else {
        return (
          s +
          `${indent(
            level,
            1
          )}if (useTemplateA) { ${name}A(); } else { ${name}B(); };${cr()}`
        );
      }
    },
    endTemplate(s: string, _level = '') {
      return s + `};\n`;
    },
    render() {
      return `patch(container, () => render());`;
    },
    endBenchmark() {
      return `</script>`;
    },
  };

  const idomKeyedStaticsRenderer: TemplateRenderer = {
    ...idomRenderer,
    openTagStart(
      s: string,
      level: string,
      tag: string,
      attrCount: number,
      staticAttrCount: number
    ) {
      if (staticAttrCount > 0) {
        const statics = Array(staticAttrCount)
          .fill(0)
          .map((_, attrIndex) => {
            const attrLevel = nextLevel(level, attrIndex);
            return `'a${attrLevel}', '${attrLevel}'`;
          })
          .join(',');
        if (attrCount > staticAttrCount) {
          return (
            s +
            `${indent(
              level
            )}elementOpenStart('${tag}', '${level}', [${statics}]);${cr()}`
          );
        } else {
          return (
            s +
            `${indent(
              level
            )}elementOpen('${tag}', '${level}', [${statics}]);${cr()}`
          );
        }
      } else {
        return idomRenderer.openTagStart(
          s,
          level,
          tag,
          attrCount,
          staticAttrCount
        );
      }
    },
    setAttr(
      s: string,
      level: string,
      name: string,
      isStatic: boolean,
      isConstant: boolean,
      valPerDynAttr: number
    ) {
      if (isStatic) {
        return s;
      } else {
        return idomRenderer.setAttr(
          s,
          level,
          name,
          isStatic,
          isConstant,
          valPerDynAttr
        );
      }
    },
  };

  const reactRenderer: TemplateRenderer = {
    legacyScripts: [
      '../node_modules/react/umd/react.production.min.js',
      '../node_modules/react-dom/umd/react-dom.production.min.js',
    ],
    startBenchmark() {
      return `
  const {createElement, Fragment} = window.React;
  const {render: reactRender} = window.ReactDOM;
  `;
    },
    startTemplate(s: string, name: string) {
      return s + `const ${name} = () => createElement(Fragment, null, ${cr()}`;
    },
    openTagStart: (
      s: string,
      level: string,
      tag: string,
      attrCount: number,
      _staticAttrCount: number
    ) => {
      return (
        s +
        `${indent(level)}createElement('${tag}', ${attrCount ? '{' : 'null'}`
      );
    },
    setAttr(
      s: string,
      _level: string,
      name: string,
      isStatic: boolean,
      isConstant: boolean,
      valPerDynAttr: number
    ) {
      if (isStatic) {
        return s + ` a${name}: '${name}',`;
      } else {
        return (
          s +
          ` a${name}: ` +
          Array(valPerDynAttr)
            .fill(0)
            .map((_, i) => {
              const mod = valPerDynAttr > 1 ? `:${i}` : '';
              return `'${name}${mod}${isConstant ? `'` : `#' + updateId`}`;
            })
            .join(` + '-' + `) +
          ','
        );
      }
    },
    openTagEnd(s: string, _level: string, _tag: string, attrCount: number) {
      return s + `${attrCount ? '}' : ''},${cr()}`;
    },
    textNode(s: string, level: string, _isStatic: boolean, value: string) {
      return s + `${indent(level, 1)}'${value}',${cr()}`;
    },
    closeTag(s: string, level: string) {
      return s + `${indent(level)}),${cr()}`;
    },
    callTemplate(s: string, level: string, name: string, isConstant: boolean) {
      if (isConstant) {
        return s + `${indent(level, 1)}${name}(),${cr()}`;
      } else {
        return (
          s +
          `${indent(level, 1)}useTemplateA ? ${name}A() : ${name}B(),${cr()}`
        );
      }
    },
    endTemplate(s: string, _level = '') {
      return s + `);\n`;
    },
    render() {
      return `reactRender(render(), container);`;
    },
    endBenchmark() {
      return `</script>`;
    },
  };

  const preactRenderer: TemplateRenderer = {
    ...reactRenderer,
    legacyScripts: ['../node_modules/preact/dist/preact.umd.js'],
    startBenchmark() {
      return `
  const {h: createElement, Fragment, render: reactRender} = window.preact;
  `;
    },
  };

  // Map of renderers (not inlined to allow for easy extension)
  return {
    'lit-html': litRenderer,
    idom: idomRenderer,
    'idom-statics': idomKeyedStaticsRenderer,
    react: reactRenderer,
    preact: preactRenderer,
  };
};

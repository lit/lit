/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  LitElementDeclaration,
  PackageJson,
  getImportsStringForReferences,
} from '@oicl-lit/analyzer';
import {
  Declaration,
  ReactiveProperty as ModelProperty,
  Event as EventModel,
  Reference,
} from '@oicl-lit/analyzer/lib/model.js';
import {javascript} from '@oicl-lit/gen-utils/lib/str-utils.js';

const getTypeReferencesForMap = (
  map: Map<string, ModelProperty | EventModel>
) => Array.from(map.values()).flatMap((e) => e.type?.references ?? []);

const getElementTypeReferences = (declarations: LitElementDeclaration[]) => {
  const refs: Reference[] = [];
  declarations.forEach((declaration) => {
    const {events, reactiveProperties} = declaration;
    refs.push(
      ...getTypeReferencesForMap(events),
      ...getTypeReferencesForMap(reactiveProperties)
    );
  });
  return refs;
};

// A reference that resolves to something the module has at runtime: a class,
// an enum or variable, a function. Anything the analyzer cannot resolve, such
// as an interface or a type alias, is a type.
const isValueReference = (ref: Reference) => {
  try {
    const declaration = ref.dereference() as Declaration | undefined;
    return (
      declaration !== undefined &&
      (declaration.isClassDeclaration() ||
        declaration.isVariableDeclaration() ||
        declaration.isFunctionDeclaration())
    );
  } catch {
    return false;
  }
};

// The flattened .d.ts that ng-packagr publishes drops `type` from a re-export,
// so `export type {X}` of a runtime value promises a value the bundle does
// not have. Values are re-exported as values; types keep `export type`.
const renderReexports = (refs: Reference[], localNames: Set<string>) => {
  const modules = new Map<string, {types: Set<string>; values: Set<string>}>();
  for (const ref of refs) {
    if (ref.isGlobal) {
      continue;
    }
    const specifier = ref.moduleSpecifier!;
    let names = modules.get(specifier);
    if (names === undefined) {
      modules.set(specifier, (names = {types: new Set(), values: new Set()}));
    }
    const asValue = !localNames.has(ref.name) && isValueReference(ref);
    (asValue ? names.values : names.types).add(ref.name);
  }
  return Array.from(modules)
    .flatMap(([specifier, {types, values}]) => [
      ...(types.size > 0
        ? [`export type {${Array.from(types).join(', ')}} from '${specifier}';`]
        : []),
      ...(values.size > 0
        ? [`export {${Array.from(values).join(', ')}} from '${specifier}';`]
        : []),
    ])
    .join('\n');
};

export const wrapperModuleTemplate = (
  packageJson: PackageJson,
  moduleJsPath: string,
  elements: LitElementDeclaration[]
) => {
  const imports = [`Component`, `ElementRef`, `NgZone`];
  if (elements.filter((e) => e.reactiveProperties.size).length > 0) {
    imports.push(`Input`);
  }
  if (elements.filter((e) => e.events.size).length > 0) {
    imports.push(`EventEmitter`, `Output`);
  }
  const refs = getElementTypeReferences(elements);
  const typeImports = getImportsStringForReferences(refs);
  // The wrapper classes carry the element names; a reference to one of them
  // must not become a conflicting value re-export.
  const typeExports = renderReexports(
    refs,
    new Set(elements.map((element) => element.name!))
  );
  moduleJsPath = moduleJsPath.replace(/\\/g, '/');
  return javascript`import {
  ${imports.join(',\n  ')}

} from '@angular/core';
${typeImports}
${typeExports}
${elements.map(
  (
    element
  ) => javascript`import type {${element.name} as ${element.name}Element} from '${packageJson.name}/${moduleJsPath}';
import '${packageJson.name}/${moduleJsPath}';`
)}

${elements.map((element) => wrapperTemplate(element))}
`;
};

const wrapperTemplate = (element: LitElementDeclaration) => {
  const {name, tagname, events, reactiveProperties} = element;
  const requiresNgZone = reactiveProperties.size > 0;
  const requiresEl = reactiveProperties.size > 0 || events.size > 0;
  return javascript`@Component({
  selector: '${tagname}',
  template: '<ng-content></ng-content>',
  standalone: true,
  imports: []
})
export class ${name} {
  ${requiresEl ? javascript`private _el: ${name}Element;` : ''}
  ${requiresNgZone ? javascript`private _ngZone: NgZone;` : ''}

  constructor(
    ${requiresEl ? 'e' : '_e'}: ElementRef<${name}Element>,
    ${requiresNgZone ? 'ngZone' : '_ngZone'}: NgZone
  ) {
    ${requiresEl ? javascript`this._el = e.nativeElement;` : ''}
    ${requiresNgZone ? javascript`this._ngZone = ngZone;` : ''}
    ${Array.from(events.keys()).map((eventName) => {
      const eventType = events.get(eventName)!.type?.text;
      return javascript`
    this._el.addEventListener('${eventName}', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.${eventToPropertyName(eventName)}Event.emit(${eventType ? javascript`e as ${eventType}` : 'e'});
    });
    `;
    })}
  }

  ${Array.from(reactiveProperties.entries()).map(
    ([propertyName, property]) => javascript`
  @Input()
  set ${propertyName}(v: ${property.type?.text ?? 'any'}) {
    this._ngZone.runOutsideAngular(() => (this._el.${propertyName} = v));
  }

  get ${propertyName}() {
    return this._el.${propertyName};
  }
  `
  )}

  ${Array.from(events.keys()).map(
    (eventName) => javascript`
  @Output()
  ${eventToPropertyName(eventName)}Event = new EventEmitter<${
    events.get(eventName)!.type?.text || `unknown`
  }>();
  `
  )}
}
`;
};

const eventToPropertyName = (eventName: string) =>
  eventName.replace(/-+([a-zA-Z])/g, (_, c) => c.toUpperCase());

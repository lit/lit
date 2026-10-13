/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ClassDeclaration,
  Declaration,
  Event,
  LitElementDeclaration,
  Module,
  Package,
  Reference,
  Type,
  VariableDeclaration,
  MixinDeclaration,
  LitElementExport,
  ClassField,
  ClassMethod,
  Parameter,
  Return,
  DeprecatableDescribed,
  FunctionDeclaration,
} from '@lit-labs/analyzer';
import type {ReactiveProperty} from '@lit-labs/analyzer/lib/model.js';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import type * as cem from 'custom-elements-manifest/schema';

/**
 * For optional entries in the manifest, if the value has no meaningful value
 * (i.e. it's an empty string or array or `false`), return `undefined` so that
 * we don't serialize a key with a meaningless value to JSON, to cut down size
 * of the manifest (note that `JSON.serialize` will not emit keys with
 * `undefined` values)
 */
const ifNotEmpty = <T>(v: T): T | undefined => {
  if (
    (v as unknown) === false ||
    ((typeof v === 'string' || Array.isArray(v)) && v.length === 0)
  ) {
    return undefined;
  }
  return v;
};

/**
 * Transform the given value only if it had a meaningful value, otherwise
 * return `undefined` so that it is not serialized to JSON.
 */
const transformIfNotEmpty = <T, R>(
  value: T,
  transformer: (v: NonNullable<T>) => R
): R | undefined => {
  const v = ifNotEmpty(value);
  if (v !== undefined) {
    return ifNotEmpty(transformer(v as NonNullable<T>));
  }
  return undefined;
};

/**
 * Options that control how the manifest is generated.
 */
export interface GenerateManifestOptions {
  /**
   * If true, members (fields, methods, etc.) inherited from a custom element
   * superclass or mixin within the same package will be included in the
   * generated manifest, marked with an `inheritedFrom` reference. By default,
   * only members defined on the element itself are emitted, matching the
   * `superclass`/`mixins` references already present in the manifest.
   *
   * This is useful for toolchains that consume Custom Elements Manifests and
   * expect each element to enumerate its full public API surface, even where
   * that surface comes from an ancestor component.
   */
  inheritProperties?: boolean;
}

/**
 * Our command for the Lit CLI.
 *
 * See ../../cli/src/lib/generate/generate.ts
 */
export const getCommand = () => {
  return {
    name: 'manifest',
    description: 'Generate custom-elements.json manifest.',
    kind: 'resolved',
    options: [
      {
        name: 'inheritProperties',
        type: Boolean,
        description:
          'Include members inherited from a custom element superclass or ' +
          'mixin (in the same package) on each element, marked with ' +
          '`inheritedFrom`.',
      },
    ],
    async generate(options: {
      package: Package;
      inheritProperties?: boolean;
    }): Promise<FileTree> {
      return await generateManifest(options.package, {
        inheritProperties: options.inheritProperties,
      });
    },
  };
};

export const generateManifest = async (
  analysis: Package,
  options: GenerateManifestOptions = {}
): Promise<FileTree> => {
  return {
    'custom-elements.json': JSON.stringify(
      convertPackage(analysis, {inheritProperties: !!options.inheritProperties})
    ),
  };
};

/**
 * State threaded through manifest conversion so that the (opt-in) inheritance
 * walking can be applied uniformly to every declaration in the package.
 */
interface ConvertState {
  /**
   * When true, members inherited from a custom element superclass or mixin
   * within the same package will be included in the generated manifest.
   */
  inheritProperties: boolean;
}

const convertPackage = (pkg: Package, state: ConvertState): cem.Package => {
  return {
    schemaVersion: '1.0.0',
    modules: [...pkg.modules.map((m) => convertModule(m, state))],
  };
};

const convertModule = (module: Module, state: ConvertState): cem.Module => {
  return {
    kind: 'javascript-module',
    path: module.jsPath,
    description: ifNotEmpty(module.description),
    summary: ifNotEmpty(module.summary),
    deprecated: ifNotEmpty(module.deprecated),
    declarations: transformIfNotEmpty(module.declarations, (d) =>
      d.map((dec) => convertDeclaration(dec, state))
    ),
    exports: ifNotEmpty([
      ...module.exportNames.map((name) =>
        convertJavascriptExport(name, module.getExportReference(name))
      ),
      ...module.getCustomElementExports().map(convertCustomElementExport),
    ]),
  };
};

const convertCommonInfo = (info: DeprecatableDescribed) => {
  return {
    description: ifNotEmpty(info.description),
    summary: ifNotEmpty(info.summary),
    deprecated: ifNotEmpty(info.deprecated),
  };
};

const convertCommonDeclarationInfo = (declaration: Declaration) => {
  return {
    name: declaration.name!, // TODO(kschaaf) name isn't optional in CEM
    ...convertCommonInfo(declaration),
  };
};

const convertDeclaration = (
  declaration: Declaration,
  state: ConvertState
): cem.Declaration => {
  if (declaration.isLitElementDeclaration()) {
    return convertLitElementDeclaration(declaration, state);
  } else if (declaration.isClassDeclaration()) {
    return convertClassDeclaration(declaration, state);
  } else if (declaration.isVariableDeclaration()) {
    return convertVariableDeclaration(declaration);
  } else if (declaration.isMixinDeclaration()) {
    return convertMixinDeclaration(declaration);
  } else if (declaration.isFunctionDeclaration()) {
    return convertFunctionDeclaration(declaration);
  } else {
    // TODO: CustomElementMixinDeclaration;
    throw new Error(
      `Unknown declaration: ${(declaration as Object).constructor.name}`
    );
  }
};

const convertJavascriptExport = (
  name: string,
  reference: Reference
): cem.JavaScriptExport => {
  return {
    kind: 'js',
    name,
    declaration: convertReference(reference),
  };
};

const convertCustomElementExport = (
  declaration: LitElementExport
): cem.CustomElementExport => {
  return {
    kind: 'custom-element-definition',
    name: declaration.tagname,
    declaration: {
      name: declaration.name,
    },
  };
};

/**
 * Returns the immediate-class members plus any members inherited from a
 * custom element superclass or mixin in the same package, when inheritance
 * has been opted into. Members already declared on the immediate class take
 * precedence over inherited members with the same name, mirroring the
 * JavaScript class semantics.
 */
const getMembersForClassDeclaration = (
  declaration: ClassDeclaration,
  state: ConvertState
): {
  fields: ClassField[];
  staticFields: ClassField[];
  methods: ClassMethod[];
  staticMethods: ClassMethod[];
} => {
  const fields: ClassField[] = [...declaration.fields];
  const staticFields: ClassField[] = [...declaration.staticFields];
  const methods: ClassMethod[] = [...declaration.methods];
  const staticMethods: ClassMethod[] = [...declaration.staticMethods];

  if (state.inheritProperties) {
    const seen = new Set<string>();
    for (const member of fields) seen.add(member.name);
    for (const member of staticFields) seen.add(member.name);
    for (const member of methods) seen.add(member.name);
    for (const member of staticMethods) seen.add(member.name);

    const inherited = collectInheritedMembers(declaration, new Set(), seen);
    fields.push(...inherited.fields);
    staticFields.push(...inherited.staticFields);
    methods.push(...inherited.methods);
    staticMethods.push(...inherited.staticMethods);
  }

  return {fields, staticFields, methods, staticMethods};
};

/**
 * Walks the heritage chain (superclass + mixins) of a class declaration,
 * returning the members declared on each ancestor that:
 *
 *   1. Can be dereferenced to a ClassDeclaration in the current analyzer run
 *      (i.e. an ancestor declared in the same package; we cannot reflect on
 *      declarations imported from `node_modules`).
 *   2. Has not been visited before in the current walk (to break cyclic
 *      inheritance graphs, e.g. a mixin that also extends another class).
 *   3. Has a member name that has not already been seen on a more-derived
 *      class in the chain.
 *
 * Each returned member is a clone of the original with `inheritedFrom` set
 * to a reference to the declaring ancestor class.
 */
const collectInheritedMembers = (
  declaration: ClassDeclaration,
  visited: Set<ClassDeclaration>,
  seenNames: Set<string>
): {
  fields: ClassField[];
  staticFields: ClassField[];
  methods: ClassMethod[];
  staticMethods: ClassMethod[];
} => {
  const fields: ClassField[] = [];
  const staticFields: ClassField[] = [];
  const methods: ClassMethod[] = [];
  const staticMethods: ClassMethod[] = [];

  if (visited.has(declaration)) {
    return {fields, staticFields, methods, staticMethods};
  }
  visited.add(declaration);

  const ancestors: {reference: Reference; declaration: ClassDeclaration}[] = [];
  for (const ref of declaration.heritage.mixins) {
    const decl = safeDereferenceClass(ref);
    if (decl) {
      ancestors.push({reference: ref, declaration: decl});
    }
  }
  const superRef = declaration.heritage.superClass;
  if (superRef) {
    const decl = safeDereferenceClass(superRef);
    if (decl) {
      ancestors.push({reference: superRef, declaration: decl});
    }
  }

  for (const {reference, declaration: ancestor} of ancestors) {
    if (visited.has(ancestor)) {
      continue;
    }
    // Recurse first so that ancestors further up the chain are emitted
    // after nearer ones; nearer ancestors take precedence over more
    // distant ones, matching JavaScript class lookup semantics.
    const grand = collectInheritedMembers(ancestor, visited, seenNames);
    fields.push(...grand.fields);
    staticFields.push(...grand.staticFields);
    methods.push(...grand.methods);
    staticMethods.push(...grand.staticMethods);

    for (const field of ancestor.fields) {
      if (seenNames.has(field.name)) continue;
      seenNames.add(field.name);
      fields.push(withInheritedFrom(field, reference));
    }
    for (const field of ancestor.staticFields) {
      if (seenNames.has(field.name)) continue;
      seenNames.add(field.name);
      staticFields.push(withInheritedFrom(field, reference));
    }
    for (const method of ancestor.methods) {
      if (seenNames.has(method.name)) continue;
      seenNames.add(method.name);
      methods.push(withInheritedFrom(method, reference));
    }
    for (const method of ancestor.staticMethods) {
      if (seenNames.has(method.name)) continue;
      seenNames.add(method.name);
      staticMethods.push(withInheritedFrom(method, reference));
    }
  }

  return {fields, staticFields, methods, staticMethods};
};

/**
 * Returns a shallow clone of `member` with `inheritedFrom` set to
 * `reference`. This avoids mutating the underlying analyzer model, which is
 * shared across consumers.
 */
const withInheritedFrom = <T extends ClassField | ClassMethod>(
  member: T,
  reference: Reference
): T => {
  // Construct via `Object.assign` to preserve the prototype chain so the
  // returned object remains an instance of the same model class.
  return Object.assign(Object.create(Object.getPrototypeOf(member)), member, {
    inheritedFrom: reference,
  });
};

/**
 * Safely dereferences a `Reference` to a class-like declaration. Returns
 * `undefined` for references that cannot be dereferenced (e.g. external
 * `LitElement` from `node_modules`, or globals) so that inheritance
 * walking degrades gracefully.
 *
 * Note: we deliberately do NOT pass `ClassDeclaration` to
 * `reference.dereference()` here. The model's `dereference(type)` check
 * uses `instanceof` against the imported class, but cross-package import
 * boundaries can yield two distinct class objects for the same logical
 * class. Instead we perform a structural duck-type test on the members
 * we actually need.
 */
const safeDereferenceClass = (
  reference: Reference | undefined
): ClassDeclaration | undefined => {
  if (reference === undefined) return undefined;
  try {
    const model = reference.dereference();
    if (model === undefined) return undefined;
    // The model is typed as `Declaration | undefined`; we accept any
    // model that exposes the members we need (heritage + fields). This
    // includes `ClassDeclaration`, `CustomElementDeclaration`, and
    // `LitElementDeclaration` instances.
    const candidate = model as Partial<ClassDeclaration>;
    if (
      typeof candidate.heritage !== 'object' ||
      candidate.fields === undefined
    ) {
      return undefined;
    }
    return candidate as ClassDeclaration;
  } catch {
    return undefined;
  }
};

/**
 * Walks the heritage chain collecting reactive properties declared on
 * ancestors. Mirrors the semantics of `collectInheritedMembers` for
 * reactive properties: properties declared on the immediate class take
 * precedence, properties on nearer ancestors take precedence over
 * properties on more distant ones, and each returned property is tagged
 * with an `inheritedFrom` reference that points to the declaring class.
 */
const collectInheritedReactiveProperties = (
  declaration: LitElementDeclaration,
  seenNames: Set<string>
): {name: string; property: ReactiveProperty; inheritedFrom: Reference}[] => {
  const collected: {
    name: string;
    property: ReactiveProperty;
    inheritedFrom: Reference;
  }[] = [];

  const walk = (
    decl: ClassDeclaration,
    referenceToDecl: Reference | undefined,
    visited: Set<ClassDeclaration>
  ): void => {
    if (visited.has(decl)) return;
    visited.add(decl);

    // Recurse first so that nearer ancestors take precedence over more
    // distant ones, matching JavaScript class lookup semantics. Each
    // recursion passes the reference that points to the ancestor from
    // the perspective of the class that contains it, which is exactly
    // what we want for `inheritedFrom`.
    for (const ref of decl.heritage.mixins) {
      const ancestor = safeDereferenceClass(ref);
      if (ancestor) walk(ancestor, ref, visited);
    }
    const superRef = decl.heritage.superClass;
    if (superRef) {
      const ancestor = safeDereferenceClass(superRef);
      if (ancestor) walk(ancestor, superRef, visited);
    }

    if (!decl.isLitElementDeclaration()) return;
    const lit = decl as LitElementDeclaration;
    // If this class is the immediate declaration (i.e. the one we're
    // generating the manifest for), don't include its reactive
    // properties here: they're already emitted by the immediate-class
    // pass in `convertReactivePropertiesToAttributes`.
    if (referenceToDecl === undefined) return;
    for (const [name, property] of lit.reactiveProperties) {
      if (seenNames.has(name)) continue;
      seenNames.add(name);
      collected.push({
        name,
        property,
        inheritedFrom: referenceToDecl,
      });
    }
  };

  walk(declaration, undefined, new Set());
  return collected;
};

/**
 * Converts reactive properties that have attributes to CEM Attribute entries.
 *
 * When `inheritProperties` is enabled, inherited reactive properties (from
 * the superclass or from a mixin) are also included, with `inheritedFrom`
 * set to the declaring ancestor.
 */
const convertReactivePropertiesToAttributes = (
  declaration: LitElementDeclaration,
  state: ConvertState
): cem.Attribute[] | undefined => {
  const attributes: cem.Attribute[] = [];

  for (const [propertyName, property] of declaration.reactiveProperties) {
    pushReactivePropertyAsAttribute(attributes, propertyName, property);
  }

  if (state.inheritProperties) {
    const seen = new Set<string>(declaration.reactiveProperties.keys());
    const inherited = collectInheritedReactiveProperties(declaration, seen);
    for (const {name, property, inheritedFrom} of inherited) {
      pushReactivePropertyAsAttribute(
        attributes,
        name,
        property,
        inheritedFrom
      );
    }
  }

  return ifNotEmpty(attributes);
};

const pushReactivePropertyAsAttribute = (
  attributes: cem.Attribute[],
  propertyName: string,
  property: ReactiveProperty,
  inheritedFrom?: Reference
) => {
  if (property.attribute === false) {
    return;
  }

  const attributeName =
    typeof property.attribute === 'string'
      ? property.attribute
      : propertyName.toLowerCase();

  // This should work for our default support types of String, Number,
  // Boolean, Array, and Object. For other types, the type text will just be
  // the name of the type, which is hopefully good enough for CEM consumers.
  const typeText = property.typeOption?.toLowerCase() ?? 'string';

  attributes.push({
    name: attributeName,
    description: ifNotEmpty(property.description),
    summary: ifNotEmpty(property.summary),
    type: {text: typeText},
    default: ifNotEmpty(property.default),
    fieldName: propertyName,
    inheritedFrom: transformIfNotEmpty(inheritedFrom, convertReference),
  });
};

const convertLitElementDeclaration = (
  declaration: LitElementDeclaration,
  state: ConvertState
): cem.CustomElementDeclaration => {
  return {
    ...convertClassDeclaration(declaration, state),
    // Override members to add attribute/reflects info to fields
    members: convertLitElementMembers(declaration, state),
    tagName: declaration.tagname,
    customElement: true,
    attributes: convertReactivePropertiesToAttributes(declaration, state),
    events: transformIfNotEmpty(declaration.events, (v) =>
      Array.from(v.values()).map(convertEvent)
    ),
    slots: transformIfNotEmpty(declaration.slots, (v) =>
      Array.from(v.values())
    ),
    cssParts: transformIfNotEmpty(declaration.cssParts, (v) =>
      Array.from(v.values())
    ),
    cssProperties: transformIfNotEmpty(declaration.cssProperties, (v) =>
      Array.from(v.values())
    ),
    // demos: [], // TODO
  };
};

/**
 * Convert members for a LitElementDeclaration, adding `attribute` and
 * `reflects` properties to fields that are reactive properties.
 */
const convertLitElementMembers = (
  declaration: LitElementDeclaration,
  state: ConvertState
): cem.ClassMember[] | undefined => {
  const convertField = (field: ClassField): cem.CustomElementField => {
    const baseField = convertClassField(field);
    const reactiveProperty = declaration.reactiveProperties.get(field.name);

    if (reactiveProperty === undefined) {
      return baseField;
    }

    // Determine attribute name (if any)
    const attribute =
      reactiveProperty.attribute === false
        ? undefined
        : typeof reactiveProperty.attribute === 'string'
          ? reactiveProperty.attribute
          : field.name.toLowerCase();

    return {
      ...baseField,
      attribute: ifNotEmpty(attribute),
      reflects: ifNotEmpty(reactiveProperty.reflect),
    };
  };

  const {fields, staticFields, methods, staticMethods} =
    getMembersForClassDeclaration(declaration, state);

  return ifNotEmpty([
    ...fields.map(convertField),
    ...staticFields.map(convertClassField),
    ...methods.map(convertClassMethod),
    ...staticMethods.map(convertClassMethod),
  ]);
};

const convertClassDeclaration = (
  declaration: ClassDeclaration,
  state: ConvertState
): cem.ClassDeclaration => {
  const {fields, staticFields, methods, staticMethods} =
    getMembersForClassDeclaration(declaration, state);
  return {
    kind: 'class',
    ...convertCommonDeclarationInfo(declaration),
    superclass: transformIfNotEmpty(
      declaration.heritage.superClass,
      convertReference
    ),
    mixins: ifNotEmpty([
      ...Array.from(declaration.heritage.mixins).map(convertReference),
    ]),
    members: ifNotEmpty([
      ...fields.map(convertClassField),
      ...staticFields.map(convertClassField),
      ...methods.map(convertClassMethod),
      ...staticMethods.map(convertClassMethod),
    ]),
    // source: {href: 'TODO'}, // TODO
  };
};

const convertCommonMemberInfo = (member: ClassField | ClassMethod) => {
  return {
    static: ifNotEmpty(member.static),
    privacy: ifNotEmpty(member.privacy),
    inheritedFrom: transformIfNotEmpty(member.inheritedFrom, convertReference),
    source: ifNotEmpty(member.source),
  };
};

const convertMixinDeclaration = (
  declaration: MixinDeclaration
): cem.MixinDeclaration => {
  return {
    kind: 'mixin',
    ...convertCommonDeclarationInfo(declaration),
    ...convertCommonFunctionLikeInfo(declaration),
  };
};

const convertFunctionDeclaration = (
  declaration: FunctionDeclaration
): cem.FunctionDeclaration => {
  return {
    kind: 'function',
    ...convertCommonDeclarationInfo(declaration),
    ...convertCommonFunctionLikeInfo(declaration),
  };
};

const convertCommonFunctionLikeInfo = (functionLike: FunctionDeclaration) => {
  return {
    parameters: transformIfNotEmpty(functionLike.parameters, (p) =>
      p.map(convertParameter)
    ),
    return: transformIfNotEmpty(functionLike.return, convertReturn),
  };
};

const convertReturn = (ret: Return) => {
  return {
    type: transformIfNotEmpty(ret.type, convertType),
    summary: ifNotEmpty(ret.summary),
    description: ifNotEmpty(ret.description),
  };
};

const convertCommonPropertyLikeInfo = (
  propertyLike: Parameter | ClassField
) => {
  return {
    type: transformIfNotEmpty(propertyLike.type, convertType),
    default: ifNotEmpty(propertyLike.default),
  };
};

const convertParameter = (param: Parameter): cem.Parameter => {
  return {
    name: param.name,
    ...convertCommonInfo(param),
    ...convertCommonPropertyLikeInfo(param),
    optional: ifNotEmpty(param.optional),
    rest: ifNotEmpty(param.rest),
  };
};

const convertClassField = (field: ClassField): cem.ClassField => {
  return {
    kind: 'field',
    ...convertCommonDeclarationInfo(field),
    ...convertCommonMemberInfo(field),
    ...convertCommonPropertyLikeInfo(field),
  };
};

const convertClassMethod = (method: ClassMethod): cem.ClassMethod => {
  return {
    kind: 'method',
    ...convertCommonDeclarationInfo(method),
    ...convertCommonMemberInfo(method),
    ...convertCommonFunctionLikeInfo(method),
  };
};

const convertVariableDeclaration = (
  declaration: VariableDeclaration
): cem.VariableDeclaration => {
  return {
    kind: 'variable',
    ...convertCommonDeclarationInfo(declaration),
    type: transformIfNotEmpty(declaration.type, convertType) ?? {
      text: 'unknown',
    }, // TODO(kschaaf) type isn't optional in CEM
  };
};

const convertEvent = (event: Event): cem.Event => {
  return {
    name: event.name,
    type: transformIfNotEmpty(event.type, convertType) ?? {text: 'Event'}, // TODO(kschaaf) type isn't optional in CEM
    description: ifNotEmpty(event.description),
    summary: ifNotEmpty(event.summary),
  };
};

const convertType = (type: Type): cem.Type => {
  return {
    text: type.text,
    references: transformIfNotEmpty(type.references, (r) =>
      convertTypeReferences(type.text, r)
    ),
  };
};

const convertTypeReferences = (
  text: string,
  references: Reference[]
): cem.TypeReference[] => {
  const cemReferences: cem.TypeReference[] = [];
  let curr = 0;
  for (const ref of references) {
    const start = text.indexOf(ref.name, curr);
    if (start < 0) {
      throw new Error(
        `Could not find type reference '${ref.name}' in type '${text}'`
      );
    }
    curr = start + ref.name.length;
    cemReferences.push({
      ...convertReference(ref),
      start,
      end: curr,
    });
  }
  return cemReferences;
};

const convertReference = (reference: Reference): cem.TypeReference => {
  const refObj: cem.TypeReference = {
    name: reference.name,
  };
  if (reference.isGlobal) {
    refObj.package = 'global:';
  } else if (reference.package !== undefined) {
    refObj.package = reference.package;
  }
  if (reference.module !== undefined) {
    refObj.module = reference.module;
  }
  return refObj;
};

/**
 * @license
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
  LitElementExport,
  ClassField,
  ClassMethod,
  Parameter,
  Return,
  DeprecatableDescribed,
  FunctionDeclaration,
} from '@lit-labs/analyzer';
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
 * Our command for the Lit CLI.
 *
 * See ../../cli/src/lib/generate/generate.ts
 */
export const getCommand = () => {
  return {
    name: 'manifest',
    description: 'Generate custom-elements.json manifest.',
    kind: 'resolved',
    async generate(options: {package: Package}): Promise<FileTree> {
      return await generateManifest(options.package);
    },
  };
};

export const generateManifest = async (
  analysis: Package
): Promise<FileTree> => {
  return {
    'custom-elements.json': JSON.stringify(convertPackage(analysis)),
  };
};

const convertPackage = (pkg: Package): cem.Package => {
  return {
    schemaVersion: '1.0.0',
    modules: [...pkg.modules.map(convertModule)],
  };
};

const convertModule = (module: Module): cem.Module => {
  return {
    kind: 'javascript-module',
    path: module.jsPath,
    description: ifNotEmpty(module.description),
    summary: ifNotEmpty(module.summary),
    deprecated: ifNotEmpty(module.deprecated),
    declarations: transformIfNotEmpty(module.declarations, (d) =>
      d.map(convertDeclaration)
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

const convertDeclaration = (declaration: Declaration): cem.Declaration => {
  if (declaration.isLitElementDeclaration()) {
    return convertLitElementDeclaration(declaration);
  } else if (declaration.isClassDeclaration()) {
    return convertClassDeclaration(declaration);
  } else if (declaration.isVariableDeclaration()) {
    return convertVariableDeclaration(declaration);
  } else if (declaration.isFunctionDeclaration()) {
    return convertFunctionDeclaration(declaration);
  } else {
    // TODO: MixinDeclaration
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

const convertLitElementDeclaration = (
  declaration: LitElementDeclaration
): cem.CustomElementDeclaration => {
  return {
    ...convertClassDeclaration(declaration),
    tagName: declaration.tagname,
    customElement: true,
    // attributes: [], // TODO
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

const convertClassDeclaration = (
  declaration: ClassDeclaration
): cem.ClassDeclaration => {
  return {
    kind: 'class',
    ...convertCommonDeclarationInfo(declaration),
    superclass: transformIfNotEmpty(
      declaration.heritage.superClass,
      convertReference
    ),
    // mixins: [], // TODO
    members: ifNotEmpty([
      ...Array.from(declaration.fields).map(convertClassField),
      ...Array.from(declaration.staticFields).map(convertClassField),
      ...Array.from(declaration.methods).map(convertClassMethod),
      ...Array.from(declaration.staticMethods).map(convertClassMethod),
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

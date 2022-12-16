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
  NodeJSDocInfo,
} from '@lit-labs/analyzer';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import type * as cem from 'custom-elements-manifest/schema';

const isNotEmpty = (v: unknown) =>
  v !== undefined &&
  (typeof v !== 'boolean' || v === true) &&
  (typeof v !== 'string' || v.length > 0) &&
  (!Array.isArray(v) || v.length);

const pickIfNotEmpty = <O, K extends keyof O>(model: O, name: K) => {
  const obj: {[key in K]?: O[K]} = {};
  const v = model[name];
  if (isNotEmpty(v)) {
    obj[name] = model[name];
  }
  return obj;
};

const transformIfNotEmpty = <O, K extends keyof O, T>(
  model: O,
  name: K,
  transformer: (v: NonNullable<O[K]>) => T
) => {
  const obj: {[key in K]?: T} = {};
  const v = model[name];
  if (v !== undefined) {
    const t = transformer(v!);
    if (isNotEmpty(t)) {
      obj[name] = t;
    }
  }
  return obj;
};

const useIfNotEmpty = <K extends PropertyKey, T>(name: K, v: T) => {
  const obj: {[key in K]?: T} = {};
  if (isNotEmpty(v)) {
    obj[name] = v;
  }
  return obj;
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
    ...pickIfNotEmpty(module, 'description'),
    ...pickIfNotEmpty(module, 'summary'),
    ...pickIfNotEmpty(module, 'deprecated'),
    ...transformIfNotEmpty(module, 'declarations', (d) =>
      d.map(convertDeclaration)
    ),
    ...useIfNotEmpty('exports', [
      ...module.exportNames.map((name) =>
        convertJavascriptExport(name, module.getExportReference(name))
      ),
      ...module.getCustomElementExports().map(convertCustomElementExport),
    ]),
  };
};

const convertCommonInfo = (info: NodeJSDocInfo) => {
  return {
    ...pickIfNotEmpty(info, 'description'),
    ...pickIfNotEmpty(info, 'summary'),
    ...pickIfNotEmpty(info, 'deprecated'),
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
  } else {
    // TODO: FunctionDeclaration
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
    ...transformIfNotEmpty(declaration, 'events', (v) =>
      Array.from(v.values()).map(convertEvent)
    ),
    ...transformIfNotEmpty(declaration, 'slots', (v) => Array.from(v.values())),
    ...transformIfNotEmpty(declaration, 'cssParts', (v) =>
      Array.from(v.values())
    ),
    ...transformIfNotEmpty(declaration, 'cssProperties', (v) =>
      Array.from(v.values())
    ),
    // demos: [], // TODO
  };
};

const convertClassDeclaration = (
  declaration: ClassDeclaration
): cem.ClassDeclaration => {
  const {superClass} = declaration.heritage;
  return {
    kind: 'class',
    ...convertCommonDeclarationInfo(declaration),
    ...useIfNotEmpty(
      'superclass',
      superClass ? convertReference(superClass) : undefined
    ),
    // mixins: [], // TODO
    ...useIfNotEmpty('members', [
      ...(declaration.fields ?? []).map(convertClassField),
      ...(declaration.methods ?? []).map(convertClassMethod),
    ]),
    // source: {href: 'TODO'}, // TODO
  };
};

const convertCommonMemberInfo = (member: ClassField | ClassMethod) => {
  return {
    ...pickIfNotEmpty(member, 'static'),
    ...pickIfNotEmpty(member, 'privacy'),
    ...transformIfNotEmpty(member, 'inheritedFrom', convertReference),
    ...pickIfNotEmpty(member, 'source'),
  };
};

const convertCommonFunctionLikeInfo = (functionLike: ClassMethod) => {
  return {
    ...transformIfNotEmpty(functionLike, 'parameters', (p) =>
      p.map(convertParameter)
    ),
    ...transformIfNotEmpty(functionLike, 'return', convertReturn),
  };
};

const convertReturn = (ret: Return) => {
  return {
    ...transformIfNotEmpty(ret, 'type', convertType),
    ...pickIfNotEmpty(ret, 'summary'),
    ...pickIfNotEmpty(ret, 'description'),
  };
};

const convertCommonPropertyLikeInfo = (
  propertyLike: Parameter | ClassField
) => {
  return {
    ...transformIfNotEmpty(propertyLike, 'type', convertType),
    ...pickIfNotEmpty(propertyLike, 'default'),
  };
};

const convertParameter = (param: Parameter): cem.Parameter => {
  return {
    name: param.name,
    ...convertCommonInfo(param),
    ...convertCommonPropertyLikeInfo(param),
    ...pickIfNotEmpty(param, 'optional'),
    ...pickIfNotEmpty(param, 'rest'),
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
    type: declaration.type ? convertType(declaration.type) : {text: 'unknown'}, // TODO(kschaaf) type isn't optional in CEM
  };
};

const convertEvent = (event: Event): cem.Event => {
  return {
    name: event.name,
    type: event.type ? convertType(event.type) : {text: 'Event'}, // TODO(kschaaf) type isn't optional in CEM
    ...pickIfNotEmpty(event, 'description'),
    ...pickIfNotEmpty(event, 'summary'),
  };
};

const convertType = (type: Type): cem.Type => {
  return {
    text: type.text,
    ...transformIfNotEmpty(type, 'references', (references) =>
      convertTypeReference(type.text, references)
    ),
  };
};

const convertTypeReference = (
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

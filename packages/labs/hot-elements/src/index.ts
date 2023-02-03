// TODO: this should only do anything in devmode, ideally we'd like to publish
// this such that importing it does nothing in prod

import 'redefine-custom-elements';

interface Constructor<T> {
  new (): T;
}
interface HotReplaceableElementClass extends Constructor<HTMLElement> {
  notifyOnHotReplace(
    tagname: string,
    updatedClass: HotReplaceableElementClass
  ): void;
}

function patchCustomElementsDefine() {
  function isHotReplaceableElementClass(
    maybe: Constructor<HTMLElement>
  ): maybe is HotReplaceableElementClass {
    // This isn't rename safe, but this is definitely debug code, it's
    // not even compatible with bundling, let alone renaming, so that's fine.
    return 'notifyOnHotReplace' in maybe;
  }

  const redefinedDefine = customElements.define;

  const implMap = new Map<string, HotReplaceableElementClass>();
  function hotDefine(
    tagname: string,
    classObj: Constructor<HTMLElement>,
    options?: ElementDefinitionOptions
  ) {
    if (!isHotReplaceableElementClass(classObj)) {
      console.log(`${tagname} is not hot replacable`);
      redefinedDefine.call(customElements, tagname, classObj, options);
      return;
    }
    const impl = implMap.get(tagname);
    if (!impl) {
      implMap.set(tagname, classObj);
      redefinedDefine.call(customElements, tagname, classObj, options);
      console.log(`${tagname} was registered as hot replacable`);
    } else {
      redefinedDefine.call(customElements, tagname, classObj, options);
      impl.notifyOnHotReplace(tagname, classObj);
      console.log(`${tagname} was hot replaced`);
    }
  }

  customElements.define = hotDefine;
}
patchCustomElementsDefine();

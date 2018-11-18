import { NodePart, isPrimitive } from './parts';
import { TemplateResult } from './template-result';
import { TemplateInstance } from './template-instance';

export interface NodePartValueHandler<T> {
  test(value: any): value is T;
  insert(part: NodePart, value: T): void;
}

export const primitiveHandler: NodePartValueHandler<any> = {
  test(value: any): value is any {
    return isPrimitive(value);
  },
  insert(part: NodePart, value: any) {
    if (part.value === value) return;

    const node = part.startNode.nextSibling!;
    value = value == null ? '' : value;
    if (node === part.endNode.previousSibling &&
        node.nodeType === Node.TEXT_NODE) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      // TODO(justinfagnani): Can we just check if part.value is primitive?
      node.textContent = value;
    } else {
      nodeHandler.insert(part, document.createTextNode(
          typeof value === 'string' ? value : String(value)));
    }
    part.value = value;
  }
};

export const templateResultHandler: NodePartValueHandler<TemplateResult> = {
  test(value: any): value is TemplateResult {
    return value instanceof TemplateResult;
  },
  insert(part: NodePart, value: TemplateResult) {
    const template = part.options.templateFactory(value);
    if (part.value && part.value.template === template) {
      part.value.update(value.values);
    } else {
      // Make sure we propagate the template processor from the TemplateResult
      // so that we use its syntax extension, etc. The template factory comes
      // from the render function options so that it can control template
      // caching and preprocessing.
      const instance = new TemplateInstance(template, value.processor, part.options);
      const fragment = instance._clone();
      instance.update(value.values);
      nodeHandler.insert(part, fragment);
      part.value = instance;
    }
  }
};

export const nodeHandler: NodePartValueHandler<Node> = {
  test(value: any): value is Node {
    return value instanceof Node;
  },
  insert(part: NodePart, value: Node) {
    if (part.value === value) {
      return;
    }
    part.clear();
    part.endNode.parentNode!.insertBefore(value, part.endNode);
    part.value = value;
  }
};

export const iterableHandler: NodePartValueHandler<Iterable<any>> = {
  test(value: any): value is Iterable<any> {
    return Array.isArray(value) || value[Symbol.iterator];
  },
  insert(part: NodePart, value: Iterable<any>) {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.

    // If _value is an array, then the previous render was of an
    // iterable and _value will contain the NodeParts from the previous
    // render. If _value is not an array, clear this part and make a new
    // array for NodeParts.
    if (!Array.isArray(part.value)) {
      part.value = [];
      part.clear();
    }

    // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render
    const itemParts = part.value as NodePart[];
    let partIndex = 0;
    let itemPart: NodePart|undefined;

    for (const item of value) {
      // Try to reuse an existing part
      itemPart = itemParts[partIndex];

      // If no existing part, create a new one
      if (itemPart === undefined) {
        itemPart = new NodePart(part.options);
        itemParts.push(itemPart);
        if (partIndex === 0) {
          itemPart.appendIntoPart(part);
        } else {
          itemPart.insertAfterPart(itemParts[partIndex - 1]);
        }
      }
      itemPart.setValue(item);
      itemPart.commit();
      partIndex++;
    }

    if (partIndex < itemParts.length) {
      // Truncate the parts array so _value reflects the current state
      itemParts.length = partIndex;
      part.clear(itemPart && itemPart!.endNode);
    }
  }
};

export const promiseHandler: NodePartValueHandler<Promise<any>> = {
  test(value: any): value is Promise<any> {
    return value.then !== undefined;
  },
  insert(part: NodePart, value: Promise<any>) {
    part.value = value;
    value.then((v: any) => {
      if (part.value === value) {
        part.setValue(v);
        part.commit();
      }
    });
  }
};

// This is a function so that we don't accidentally mutate the default
// handler list.
export const getDefaultHandlers = () => [
  primitiveHandler,
  templateResultHandler,
  nodeHandler,
  iterableHandler,
  promiseHandler
];
## API

### Function `html`

`html(strings: TemplateStringsArray, ...expressions: any[]): TemplateResult`

`html` is a template tag for [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), which parses the literal as HTML and returns a `TemplateResult`.

### Class `TemplateResult`

`TemplateResult` is a class that holds a `Template` object parsed from a template literal and the values from its expressions.

  * Property `template: Template`

    A reference to the parsed `Template` object.

  *  Property `values: any[]`

    The values returned by the template literal's expressions.

### Function `render(result: TemplateResult, container: Element): void`

Renders a `TemplateResult`'s template to an element using the result's values. For re-renders, only the dynamic parts are updated.

### Class `Template`

  *  Property `element: HTMLTemplateElement`

  *  Property `parts: Part[]`

### Class `TemplateInstance`

 * Property `template: Template`

 * Method `_createPart(templatePart: TemplatePart, node: Node): Part`

 Creates a new Part for the given TemplatePart. This allows TemplateInstances to customize what kind of Parts are created for a template.

 * Method `_createInstance(template: Template): TemplateInstance`

 A factory for template instances, called when creating nested templates. This should usually just return a new instance of the implementing class.

### Abstract Class `Part`

A `Part` is a dynamic section of a `TemplateInstance`. It's value can be set to update the section.

Parts are either single-valued or multi-valued. If they have a `size` property they are multi-valued and take an array of values along with an index of where to start reading in the array.

Specially supported value types are `Node`, `Function`, and `TemplateResult`.

  * Optional Property `size: number`

  *  Method `setValue(value: any | any[], startIndex?: number): void`

  Sets the value of this part. If the part is multi-value, `value` will be an array, and `startIndex` will be a number.

---
layout: guide
title: Properties
slug: properties
---

{::options toc_levels="1..3" /}
* ToC
{:toc}

## Overview {#overview}

LitElement manages your declared properties and their corresponding attributes. By default, LitElement will: 

* Ensure that an element update is scheduled when any declared property changes.
* Capture instance values for declared properties. Apply any property values that are set before the browser registers a custom element definition.
* Set up an observed (not reflected) attribute with the lowercased name of each property.
* Handle attribute conversion for properties declared as type `String`, `Number`, `Boolean`, `Array`, and `Object`.
* Use direct comparison (`oldValue !== newValue`) to test for property changes.
* Apply any property options and accessors declared by a superclass. 

{:.alert .alert-warning}
<div>

**Remember to declare all of the properties that you want LitElement to manage.** For the property features above to be applied, you must [declare the property](#declare). 

</div>

## Declare properties {#declare}

Declare your element's properties using a static `properties` field, or using decorators:

_Properties field_

<div class="language-js">
<pre class="highlight">
static get properties() {
  return { 
    <var>propertyName</var>: <var>options</var>
  };
}
</pre>
</div>

_Decorator (requires TypeScript or Babel)_

<div class="language-ts">
<pre class="highlight">
export class MyElement extends LitElement {
  @property(<var>options</var>) 
  <var>propertyName</var>;
</pre>
</div>

In either case, you can pass an options object to configure features for the property. 

### Property options

The options object can have the following properties:

<dl>
<dt>

`attribute`

</dt>
<dd>

Whether the property is associated with an attribute, or a custom name for the associated attribute. Default: true. See [Configure observed attributes](#observed-attributes). If `attribute` is false, the `converter`, `reflect` and `type` options are ignored. 

</dd>
<dt>

`converter`

</dt>
<dd>

A [custom converter](#conversion-converter) for converting between properties and attributes. If unspecified, use the [default attribute converter](#conversion-type).

</dd>
<dt>

`hasChanged`

</dt>
<dd>

A function that takes an `oldValue` and `newValue` and returns a boolean to indicate whether a [property has changed](#haschanged) when being set. If unspecified, LitElement uses a strict inequality check (`newValue !== oldValue`) to determine whether the property value has changed.

</dd>
<dt>

`noAccessor`

</dt>
<dd>

Set to true to avoid generating the default [property accessor](#accessors). Default: false.

</dd>
<dt>

`reflect`

</dt>
<dd>

Whether property value is reflected back to the associated attribute. Default: false. See  [Configure reflected attributes](#reflected-attributes).

</dd>
<dt>

`type`

</dt>
<dd>

A type hint for converting between properties and attributes. This hint is used by LitElement's default attribute converter, and is ignored if `converter` is set. If `type` is unspecified, behaves like `type: String`. See [Use LitElement's default attribute converter](#conversion-type). 

</dd>

An empty options object is equivalent to specifying the default value for all options.

<div class="alert alert-info">

**An options object by another name.** This guide uses the descriptive term "options object." In practice the options object is an instance of `PropertyDeclaration`, so you'll see that name if you're using an IDE, or looking at the API reference. By either name, it's an object that defines a set of options.

</div>

### Declare properties in a static properties field

To declare properties in a static `properties` field:

```js
static get properties() { 
  return { 
    greeting: {type: String},
    data: {attribute: false},
    items: {}
  };
}
```

An empty option object is equivalent to specifying the default value for all options.

<div class="alert alert-info">

Declared properties are initialized like standard class fields—either in the constructor, or with a field initializer if you're using decorators.

</div>

**Example: Declare properties with a static `properties` field** 

```js
{% include projects/properties/declare/my-element.js %}
```

{% include project.html folder="properties/declare" openFile="my-element.js" %}

### Declare properties with decorators {#declare-with-decorators}

Use the `@property` decorator to declare properties (instead of the static `properties` field).

```js
@property({type: String})
mode = 'auto';

@property()
data = {};
```

The argument to the `@property` decorator is an [options object](#property-options). Omitting the argument is equivalent to specifying the default value for all options.

<div class="alert alert-info">

**Using decorators.** Decorators are a proposed JavaScript feature, so you'll need to use a transpiler like Babel or the TypeScript compiler to use decorators. See [Using decorators](decorators) for details.

</div>

There is also an `@internalProperty` decorator for private or protected properties that should trigger an update cycle. Properties declared with `@internalProperty` shouldn't be referenced from outside the component.

```ts
@internalProperty()
protected active = false;
```

The `@internalProperty` decorator automatically sets `attribute` to false; **the only option you can specify for an internal property is the `hasChanged` function.**

The `@internalProperty` decorator can serve as a hint to a code minifier that the property name can be changed during minification.

**Example: Declare properties with decorators** 

```js
{% include projects/properties/declaretypescript/my-element.ts %}
```

{% include project.html folder="properties/declaretypescript" openFile="my-element.ts" %}

## What happens when properties change

A property change can trigger an asynchronous update cycle, which causes the component to re-render its template.

When a property changes, the following sequence occurs:

1.  The property's setter is called.
1.  The setter calls the property's `hasChanged` function. The `hasChanged` function takes the property's old and new values, and returns true if the change should trigger an update. (The default `hasChanged` uses a strict inequality test (`oldValue !=== newValue`) to determine if the property has changed.)
1.  If `hasChanged` returns true, the setter calls `requestUpdate` to schedule an update. The update itself happens asynchronously, so if several properties are updated at once, they only trigger a single update.
1.  The component's `update` method is called, reflecting changed properties to attributes and re-rendering the component's templates.

There are many ways to hook into and modify the update lifecycle. For more information, see [Lifecycle](lifecycle).


## Initialize property values {#initialize}

Typically, you initialize property values in the element constructor. 

When using decorators, you can initialize the property value as part of the declaration (equivalent to setting the value in the constructor).

You may want to defer initializing a property if the value is expensive to compute and is not not required for the initial render of your component. This is a fairly rare case.

### Initialize property values in the element constructor {#initialize-constructor}

If you implement a static properties field, initialize your property values in the element constructor:

```js
static get properties() { return { /* Property declarations */ }; } 

constructor() {
  // Always call super() first
  super();

  // Initialize properties 
  this.greeting = 'Hello';
}
```

{:.alert .alert-warning}
<div> 

Remember to call `super()` first in your constructor, or your element won't render at all.

</div>

**Example: Initialize property values in the element constructor** 

{% include project.html folder="properties/declare" openFile="my-element.js" %}

### Initialize property values when using decorators

When using the `@property` decorator, you can initialize a property as part of the declaration:

```ts
@property({type : String}) 
greeting = 'Hello';
```

**Example: Initialize property values when using decorators** 

{% include project.html folder="properties/declaretypescript" openFile="my-element.ts" %}



## Configure attributes {#attributes}

### Convert between properties and attributes {#conversion}

While element properties can be of any type, attributes are always strings. This impacts the [observed attributes](#observed-attributes) and [reflected attributes](#reflected-attributes) of non-string properties:

  * To **observe** an attribute (set a property from an attribute), the attribute value must be converted from a string to match the property type. 

  * To **reflect** an attribute (set an attribute from a property), the property value must be converted to a string.

#### Use the default converter {#conversion-type}

LitElement has a default converter which handles `String`, `Number`, `Boolean`, `Array`, and `Object` property types.

To use the default converter, specify the `type` option in your property declaration:

```js
// Use LitElement's default converter 
prop1: { type: String },
prop2: { type: Number },
prop3: { type: Boolean },
prop4: { type: Array },
prop5: { type: Object }
```

The information below shows how the default converter handles conversion for each type.

**Convert from attribute to property**

* For **Strings**, when the attribute is defined, set the property to the attribute value.
* For **Numbers**, when the attribute is defined, set the property to `Number(attributeValue)`.
* For **Booleans**, when the attribute is:
  * non-`null`, set the property to `true`.
  * `null` or `undefined`, set the property to `false`.
* For **Objects and Arrays**, when the attribute is:
  * Defined, set the property value to `JSON.parse(attributeValue)`.

**Convert from property to attribute** 

* For **Strings**, when the property is:
  * `null`, remove the attribute.
  * `undefined`, don't change the attribute.
  * Defined and not `null`, set the attribute to the property value.
* For **Numbers**, when the property is:
  * `null`, remove the attribute.
  * `undefined`, don't change the attribute.
  * Defined and not `null`, set the attribute to the property value.
* For **Booleans**, when the property is:
  * truthy, create the attribute.
  * falsy, remove the attribute.
* For **Objects and Arrays**, when the property is:
  * `null` or `undefined`, remove the attribute.
  * Defined and not `null`, set the attribute value to `JSON.stringify(propertyValue)`.

**Example: Use the default converter** 

```js
{% include projects/properties/defaultconverter/my-element.js %}
```

{% include project.html folder="properties/defaultconverter" openFile="my-element.js" %}

#### Configure a custom converter {#conversion-converter}

You can specify a custom property converter in your property declaration with the `converter` option:

```js
myProp: { 
  converter: // Custom property converter
} 
```

`converter` can be an object or a function. If it is an object, it can have keys for `fromAttribute` and `toAttribute`: 

```js
prop1: { 
  converter: { 
    fromAttribute: (value, type) => { 
      // `value` is a string
      // Convert it to a value of type `type` and return it
    },
    toAttribute: (value, type) => { 
      // `value` is of type `type` 
      // Convert it to a string and return it
    }
  }
}
```

If `converter` is a function, it is used in place of `fromAttribute`:

```js
myProp: { 
  converter: (value, type) => { 
    // `value` is a string
    // Convert it to a value of type `type` and return it
  }
} 
```

If no `toAttribute` function is supplied for a reflected attribute, the attribute is set to the property value without conversion.

During an update: 

  * If `toAttribute` returns `null`, the attribute is removed. 

  * If `toAttribute` returns `undefined`, the attribute is not changed.

**Example: Configure a custom converter** 

```js
{% include projects/properties/attributeconverter/my-element.js %}
```

{% include project.html folder="properties/attributeconverter" openFile="my-element.js" %}

### Configure observed attributes {#observed-attributes}

An **observed attribute** fires the custom elements API callback `attributeChangedCallback` whenever it changes. By default, whenever an attribute fires this callback, LitElement sets the property value from the attribute using the property's `fromAttribute` function. See [Convert between properties and attributes](#conversion) for more information.

By default, LitElement creates a corresponding observed attribute for all declared properties. The name of the observed attribute is the property name, lowercased:

```js
// observed attribute name is "myprop"
myProp: { type: Number }
```

To create an observed attribute with a different name, set `attribute` to a string: 

```js
// Observed attribute will be called my-prop
myProp: { attribute: 'my-prop' }
```

To prevent an observed attribute from being created for a property, set `attribute` to `false`. The property will not be initialized from attributes in markup, and attribute changes won't affect it.

```js
// No observed attribute for this property
myProp: { attribute: false }
```

An observed attribute can be used to provide an initial value for a property via markup. See [Initialize properties with attributes in markup](#initialize-markup).

**Example: Configure observed attributes**

```js
{% include projects/properties/attributeobserve/my-element.js %}
```

{% include project.html folder="properties/attributeobserve" openFile="my-element.js" %}



### Configure reflected attributes {#reflected-attributes}

You can configure a property so that whenever it changes, its value is reflected to its [observed attribute](#observed-attributes). For example:

```js
// Value of property "myProp" will reflect to attribute "myprop"
myProp: {reflect: true}
```

When the property changes, LitElement uses the `toAttribute` function in the property's converter to set the attribute value from the new property value. 

* If `toAttribute` returns `null`, the attribute is removed.

* If `toAttribute` returns `undefined`, the attribute is not changed.

* If `toAttribute` itself is undefined, the attribute value is set to the property value without conversion.

{:.alert .alert-info}
<div>

**LitElement tracks reflection state during updates.** LitElement keeps track of  state information to avoid creating an infinite loop of changes between a property and an observed, reflected attribute.

</div>

**Example: Configure reflected attributes**

```js
{% include projects/properties/attributereflect/my-element.js %}
```

{% include project.html folder="properties/attributereflect" openFile="my-element.js" %}

### Set property values from attributes in markup {#initialize-markup}

If a property is configured with `attribute: true` (the default), users can set the property values from observed attributes in static markup:

_index.html_ 

```html
<my-element 
  mystring="hello world"
  mynumber="5"
  mybool
  myobj='{"stuff":"hi"}'
  myarray='[1,2,3,4]'></my-element>
```

See [observed attributes](#observed-attributes) and [converting between properties and attributes](#conversion) for more information on setting up initialization from attributes.

<div class="alert alert-info">

**Attributes versus property bindings.** Setting a static attribute value is not the same as binding to a property. See [Bind to a property](templates#bind-to-a-property).

</div>

## Configure property accessors {#accessors}

By default, LitElement generates a getter/setter pair for all declared properties. The setter is invoked whenever you set the property:

```js
// Declare a property
static get properties() { return { myProp: { type: String } }; }
...
// Later, set the property
this.myProp = 'hi'; // invokes myProp's generated property accessor
```

Generated accessors automatically call `requestUpdate`, initiating an update if one has not already begun.

### Create your own property accessors {#accessors-custom}

To specify how getting and setting works for a property, you can define your getter/setter pair. For example:

```js
static get properties() { return { myProp: { type: String } }; }

set myProp(value) {
  // Implement setter logic here... 
  // retrieve the old property value and store the new one
  this.requestUpdate('myProp', oldValue);
} 
get myProp() { ... }

...

// Later, set the property
this.myProp = 'hi'; // Invokes your setter
```

If your class defines its own accessors for a property, LitElement will not overwrite them with generated accessors. If your class does not define accessors for a property, LitElement will generate them, even if a superclass has defined the property or accessors. 

The setters that LitElement generates automatically call `requestUpdate`. If you write your own setter you must call `requestUpdate` manually, supplying the property name and its old value.

**Example**

A common pattern for accessors is to store the property value using a private property that's only accessed inside the component. This example uses an underscore prefix (`_prop`) to identify the private property—you could also use TypeScript's `private` or `protected` keywords.

```js
{% include projects/properties/customsetter/my-element.js %}
```

If you want to use your own property accessor with the `@property` decorator, you can achieve this by putting the decorator on the getter:

```ts
   private _myProp: string = '';

  @property({ type: String })
  get myProp(): string {
    return this._myProp;
  }
  set myProp(value: string) {
    const oldValue = this._myProp;
    this._myProp = value;
    this.requestUpdate('myProp', oldValue);
  }
```

### Prevent LitElement from generating a property accessor {#accessors-noaccessor}

In rare cases, a subclass may need to change or add property options for a property that exists on its superclass.

To prevent LitElement from generating a property accessor that overwrites the superclass's defined accessor, set `noAccessor` to `true` in the property declaration:

```js
static get properties() { 
  return { myProp: { type: Number, noAccessor: true } }; 
}
```

You don't need to set `noAccessor` when defining your own accessors. 

**Example** 

**Subclass element**

```js
{% include projects/properties/accessorssubclassing/sub-element.js %}
```

{% include project.html folder="properties/accessorssubclassing" openFile="sub-element.js" %}

## Configure property changes {#haschanged}

All declared properties have a function, `hasChanged`, which is called when the property is set. 

`hasChanged` compares the property's old and new values, and evaluates whether or not the property has changed. If `hasChanged` returns true, LitElement starts an element update if one is not already scheduled. See the [Element update lifecycle documentation](lifecycle) for more information on how updates work.

By default:

* `hasChanged` returns `true` if `newVal !== oldVal`.
* `hasChanged` returns `false` if both the new and old values are `NaN`.

To customize `hasChanged` for a property, specify it as a property option:

```js
myProp: { hasChanged(newVal, oldVal) {
  // compare newVal and oldVal
  // return `true` if an update should proceed
}}
```

<div class="alert alert-info">

**hasChanged may not be called for every change.** If a property's `hasChanged` returns true once, it won't be called again until after the next update, even if the property is changed multiple times. If you want to be notified each time a property is set, you should create a custom setter for the property, as described in [Create your own property accessors](#accessors-custom).

</div>

**Example: Configure property changes** 

```js
{% include projects/properties/haschanged/my-element.js %}
```

{% include project.html folder="properties/haschanged" openFile="my-element.js" %}

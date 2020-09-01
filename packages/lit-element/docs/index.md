---
layout: default
---

<header class="hero blm" markdown="0">
{% include topnav.html %}
<div class="blm-banner">
<p>
<a href="https://blacklivesmatter.com" target="_blank" rel="noopener noreferrer">Black Lives Matter.</a> Support the 
<a href="https://eji.org/" target="_blank" rel="noopener noreferrer">Equal Justice Initiative</a> and 
<a href="https://www.joincampaignzero.org/" target="_blank" rel="noopener noreferrer" >Campaign Zero</a>.</p> 
</div>
<div class="wrapper">
<div class="hero-title">{{ site.name }}</div>
<p class="hero-caption">{{ site.description }}</p>
<a class="hero-link link-with-arrow" href="{{ site.baseurl }}/guide">Get Started</a>
</div>
</header>

<section id="section-snippet">
<div class="wrapper">
<h1 class="title">
Easily Create Fast, Lightweight Web Components
</h1>

<div class="responsive-row">

<div class="fixed-width-caption">
<h3 class="description">LitElement makes it easy to define Web Components – ideal for sharing elements across your organization or building a UI design system.</h3>
<h3 class="description">Use your components anywhere you use HTML: in your main document, a CMS, Markdown, or a framework like React or Vue.</h3>
</div>


<div>
```js
{% include projects/index-typescript/simple-greeting.ts %}
```
```html
<simple-greeting name="Everyone"></simple-greeting>
```
</div>
</div>

<div class="inline-action-buttons">
{% include project.html label="Launch Code Editor (TypeScript)" folder="index-typescript" openFile="simple-greeting.ts" %}
{% include project.html label="Launch Code Editor (JavaScript)" folder="index" openFile="simple-greeting.js" %}
</div>

</div>
</section>

<section>
<div class="wrapper">

<h1 class="title">Why use LitElement?</h1>

<div class="responsive-row">
<div style="flex: 1">

<h2 class="caption">Delightfully declarative</h2>

LitElement's simple, familiar development model makes it easier than ever to build Web Components.

Express your UI declaratively, as a function of state. No need to learn a custom templating language – you can use the full power of JavaScript in your templates. Elements update automatically when their properties change.

</div>
<div style="flex: 1">

<h2 class="caption">Fast and light</h2>

Whether your end users are in emerging markets or Silicon Valley, they’ll appreciate that LitElement is extremely fast.

LitElement uses [lit-html](https://github.com/Polymer/lit-html) to define and render HTML templates. DOM updates are lightning-fast, because lit-html only re-renders the dynamic parts of your UI – no diffing required.

</div>
<div style="flex: 1">

<h2 class="caption">Seamlessly interoperable</h2>

LitElement follows the [Web Components standards](https://developer.mozilla.org/en-US/docs/Web/Web_Components), so your components will work with any framework.

LitElement uses Custom Elements for easy inclusion in web pages, and Shadow DOM for encapsulation. There’s no new abstraction on top of the web platform.

</div>
</div>
</div>
</section>


<section style="margin-bottom: 60px;">
<div class="wrapper">
<h1 class="title">Next Steps</h1>

<div class="responsive-row">

<div style="flex:1">
<h2 class="caption">One.</h2>
<p>[Try LitElement]({{ site.baseurl }}/try) in our live tutorial. You don’t need to install anything.</p>
</div>

<div style="flex:1">
<h2 class="caption">Two.</h2>
<p>When you’re ready to dive in, [set up LitElement locally]({{ site.baseurl }}/guide/start) and start building components!</p>
</div>

<div style="flex:1">
</div>

</div>
</div>
</section>

<section>
<div class="wrapper">

<h1 class="title">Browser Compatibility</h1>
<h2 class="description">LitElement works in all major browsers (Chrome, Firefox, IE, Edge, Safari, and Opera). </h2>
<div id="browser-thumbnails" style="margin-bottom: 20px;">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/chrome_128x128.png" alt="chrome logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/firefox_128x128.png" alt="firefox logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/internet-explorer_128x128.png" alt="internet explorer logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/edge_128x128.png" alt="edge logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/safari_128x128.png" alt="safari logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/opera_128x128.png" alt="opera logo">
</div>

</div>
</section>
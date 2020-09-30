# lit-ssr

Experimental lit-html & LitElement SSR server

Note: This requires npm linking the `hydration` branch of lit-html.

## Setup

This repo requires Node 13.9.0 because of it's use of experimental VM modules. It also requires unreleased versions of lit-html and lit-element. Nothing here is for public comsumption yet.

To keep the experimental dependencies localized, they should be checked out into sibling folders. lit-ssr uses file dependencies to reference them:

```
SSR
├── lit-element (patched to use the lit-html)
├── lit-html (checkout and build the hydration-repeat branch)
├── lit-ssr (this repo)
└── template-attach-shadow (will be required soon)
```

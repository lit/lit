---
'@lit-labs/nextjs': minor
---

Add support for Next.js 14 and App Router. No longer supports Next.js 12.

Note: Components in the App Router are by default React Server Components. Deep SSR of Lit components does **not** work within server components as they result in React hydration mismatch due to the presence of the `<template>` element in React Flight serialized server component data, and the custom element definitions will not be included with the client bundle either.

Make sure any Lit components you wish to use are beyond the `'use client';` boundary. These will still be server rendered for the initial page load just like they did for the Pages Router.

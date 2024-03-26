---
'@lit-labs/nextjs': minor
---

Add support for Next.js 14 and App Router. No longer support Next.js 12.

Note: By default, components in the App Router are React Server Components (RSCs). Deep SSR of Lit components does **not** work within server components as they result in React hydration mismatch due to the presence of the `<template>` element in the RSC payload containing the serialized server component tree, and the custom element definitions will not be included with the client bundle either when imported in server component files.

Make sure any Lit components you wish to use are beyond the `'use client';` boundary. These will still be server rendered for the initial page load just like they did for the Pages Router.

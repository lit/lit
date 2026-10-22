# Lit in Next.js example

This is a barebones demonstration of a Web Component authored with Lit working
in a Next.js project with the App Router. You can also see an example of `@lit/react` usage.

It uses the plugin from `@lit-labs/nextjs` to enable deep server rendering of
Lit components.

Note: Both bare custom elements and `@lit/react` wrapped components are placed in files with the `'use client';` directive. Deeply server rendering Lit components with declarative shadow DOM is not supported in React Server Components as React Flight server rendered data will contain the `<template>` element causing React hydration errors, and custom element definitions will not get included with client bundle.

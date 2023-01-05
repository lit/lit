# Lit in Next.js example

This is a barebones demonstration of a Web Component authored with Lit working
in a Next.js project. You can also see an example of `@lit-labs/react` usage.

These components are shallowly rendered on the server, i.e. only the host
element tag will be server-rendered. When client-side JS is loaded, the
components will be upgraded with its contents rendered, and become interactive.

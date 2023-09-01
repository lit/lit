/**
 * @license
 * Copyright 2014 Definitely Typed authors
 * SPDX-License-Identifier: MIT
 */

/* MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Type definitions for React 18.2
Project: https://react.dev/
Definitions by: Asana <https://asana.com>
                AssureSign <http://www.assuresign.com>
                Microsoft <https://microsoft.com>
                John Reilly <https://github.com/johnnyreilly>
                Benoit Benezech <https://github.com/bbenezech>
                Patricio Zavolinsky <https://github.com/pzavolinsky>
                Eric Anderson <https://github.com/ericanderson>
                Dovydas Navickas <https://github.com/DovydasNavickas>
                Josh Rutherford <https://github.com/theruther4d>
                Guilherme Hübner <https://github.com/guilhermehubner>
                Ferdy Budhidharma <https://github.com/ferdaber>
                Johann Rakotoharisoa <https://github.com/jrakotoharisoa>
                Olivier Pascal <https://github.com/pascaloliv>
                Martin Hochel <https://github.com/hotell>
                Frank Li <https://github.com/franklixuefei>
                Jessica Franco <https://github.com/Jessidhia>
                Saransh Kataria <https://github.com/saranshkataria>
                Kanitkorn Sujautra <https://github.com/lukyth>
                Sebastian Silbermann <https://github.com/eps1lon>
                Kyle Scully <https://github.com/zieka>
                Cong Zhang <https://github.com/dancerphil>
                Dimitri Mitropoulos <https://github.com/dimitropoulos>
                JongChan Choi <https://github.com/disjukr>
                Victor Magalhães <https://github.com/vhfmag>
                Dale Tan <https://github.com/hellatan>
                Priyanshu Rav <https://github.com/priyanshurav>
                Dmitry Semigradsky <https://github.com/Semigradsky>
Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
TypeScript Version: 2.8 */

/**
 * @fileoverview
 * Exports a copy of `React.PropsWithoutRef` taken from
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/05094b6df4fb6f4404333725f13d63dd8aabeb34/types/react/index.d.ts#L825-L830
 * so that Preact users can benefit from type checking with `preact/compat`.
 */

/** Ensures that the props do not include ref at all */
export type PropsWithoutRef<P> =
  // Omit would not be sufficient for this. We'd like to avoid unnecessary mapping and need a distributive conditional to support unions.
  // see: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
  // https://github.com/Microsoft/TypeScript/issues/28339
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P extends any ? ('ref' extends keyof P ? Omit<P, 'ref'> : P) : P;

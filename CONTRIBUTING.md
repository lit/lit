# Contributing to Lit

Thank you for your interest in contributing to Lit!

There are many ways to contribute to the Lit project, and we have many different needs to be addressed. All contributions, from issues, to PRs, to reports of successful usage, are appreciated and valuable.

## Code of Conduct

We have a [Code of Conduct](./CODE_OF_CONDUCT.md), please follow it in all interactions with project maintainers and fellow users.

## Filing Issues

Issues are one of the most important ways to contribute to Lit.

Please search though open and closed issues to see if a similar issue already exists. If not, open an issue and try to provide a minimal reproduction if you can.

Occasionally we'll close issues if they appear stale or are too vague - please don't take this personally! Please feel free to re-open issues we've closed if there's something we've missed and they still need to be addressed.

## RFCs

The Lit project handles "significant" changes and feature requests via our [RFC (Request for Comment) Process](https://github.com/lit/rfcs).

Medium-to-large feature requests should be done via RFC, and feature request issues may be closed after asking that they be submitted as an RFC. If you're wondering whether there's interest in an idea before creating an RFC, file an [RRFC issue](https://github.com/lit/rfcs#before-opening-an-rfc) in https://github.com/lit/rfcs to discuss it.

## Pull Requests

Pull requests are greatly appreciated! To ensure a smooth review process, please follow these steps:

1.  Make sure there's an open issue or RFC that the PR addresses. If there's an issue, add "Fixes #(issue number)" to the PR description.
2.  Please discuss the general shape of the change ahead of time. This can save much time for reviewers and submitters alike. Many times there may be existing ideas on how to handle an issue that are not fully written out, and asking about it will bring out more details.
3.  All PRs that change behavior or fix bugs should have new or updated tests.
4.  Try to create a set of descriptive commits that each do one focused change. Avoid commits like "oops", and prefer commits like "Added method foo to Bar".
5.  When addressing review comments, try to add new commits, rather than modifying previous commits. This makes it easier for reviewers to see what changed since the last review. `git commit --fixup {SHA}` is really useful for this. Obviously, requests like "Please rebase onto master" require changing commits.
6.  If you [allow changes to be committed to your PR branches](https://help.github.com/articles/allowing-changes-to-a-pull-request-branch-created-from-a-fork/) we can fix some small things in the PR for you, speeding up the review process. This is especially useful if you're new to TypeScript and need help with type annotations.
7.  Please run `npm run lint` and `npm run format` before submitting PRs. PRs that don't lint and aren't formatted will fail continuous integration tests.

## Discord Chat

Our engineering team uses the [Lit Discord](https://lit.dev/discord/) to chat. You can read the development channels, or join us in `#get-involved`.

## Code Style

We follow the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html), but there are a couple of points worth emphasizing:

1.  Clear is better than clever. Optimize for simple, readable code first.
2.  Prefer longer, more descriptive names, over shorter names. For most variables, minification means we don't pay for extra characters in production.
3.  Always err on the side of too many comments. When commenting, "why" is more important than "what".
4.  If you're tempted to add a "what" comment, see if you can't restructure the code and use more descriptive names so that the comment is unnecessary.

## TypeScript

We use TypeScript on Lit in order to automatically check the code for type errors and document the types of fields and attributes for easier reading. If you don't know TypeScript, we hope it doesn't discourage you from contributing - TypeScript is a superset of JavaScript that focuses on adding type annotations.

TypeScript is hopefully relatively easy to pick up, but if you have any problems we're more than happy to help. You can submit a pull request with type warnings and we'll either help you fix them, or if you allow commits to your PR branch, fix them for you. VS Code is a very nice IDE for TypeScript development if you care to try it.

We stick to subset of TypeScript that is more strict and closer to standard JavaScript.

1.  We have strict compiler options turned on. Do not change them.
2.  Prefer the `unknown` type over `any`.
3.  Prefer the `object` type over `Object`
4.  Prefer named type alias over complex inline types.
5.  Use web-compatible, full URLs as import specifiers, including file extensions. ie, `import * as foo from './foo.js`, not `import * as foo from './foo`
6.  Only use TypeScript for types:
    1. We compile to the `esnext` target and don't use TypeScript for "downlevel" compilation. Do not change that.
    2. Don't use features that are not part of the type system:
       1. `namespace`
       2. `enum`
       3. Parameter properties (initialize class fields in the constructor parameter list)

## Private Property Prefixing

This codebase follows some specific conventions regarding prefixing for private
properties/fields, which serve several purposes: hiding and/or communicating
"private" status to non-TypeScript users, allowing code-size optimization via
object/class property minification, and ensuring compatibility between objects
shared between different versions of the libraries on the same page.

When submitting code, please take care to follow the conventions below:

1. **`_` prefix for private properties** - Most`private`-annotated fields should
   be prefixed with a single underscore, and will be minified
   ("mangled" by Terser) to a randomly-assigned short property name. See the
   following two cases for exceptions.
2. **`_$` prefix for private properties on objects shared between versions** - Any
   private property that is considered "private" to the library but could be
   accessed by a different version of the library running on the same page
   should be prefixed with `_$`**and** added to the list of`stableProperties` in [`rollup-common.js`](./rollup-common.js). These properties are assigned a stable minified symbol that will not change between releases. These properties are often marked with the `// @internal`annotation when it is not possible to mark them as`private` for type reasons.
3. **`__` prefix for private fields on exported classes** - Any private fields on a class
   intended to be subclassed outside of the package it is defined in should be
   prefixed with a double-underscore. We use the double-underscore convention to
   automatically assign a unicode character prefix to the randomly-assigned
   short property name chosen by Terser to namespace private class fields by
   package, to avoid collisions.

## Contributor License Agreement

You might notice our friendly CLA-bot commenting on a pull request you open if you haven't yet signed our CLA. We use the same CLA for all open-source Google projects, so you only have to sign it once. Once you complete the CLA, all your pull-requests will automatically get the `cla: yes` tag.

If you've already signed a CLA but are still getting bothered by the awfully insistent CLA bot, it's possible we don't have your GitHub username or you're using a different email address. Check the [information on your CLA](https://cla.developers.google.com/clas) or see this help article on [setting the email on your git commits](https://help.github.com/articles/setting-your-email-in-git/).

[Complete the CLA](https://cla.developers.google.com/clas)

## Set up

```bash
git clone https://github.com/lit/lit.git
cd lit
npm ci
npm run build
```

## Tests

### Test using Playwright chromium/firefox/webkit

1. `npm test`

### Test on the Sauce browsers we test in CI

1. `export SAUCE_USERNAME=your-username SAUCE_ACCESS_KEY=xxx`
2. `BROWSERS=preset:sauce npm test`

### Test on a custom set of browsers

1. `BROWSERS="chromium,sauce:Windows 10/firefox@78" npm test`

   Examples:

   ```
   sauce:macOS 10.15/safari@13
   sauce:Windows 10/MicrosoftEdge@18
   sauce:Windows 7/internet explorer@11
   sauce:Linux/chrome@latest-3
   sauce:Linux/firefox@78
   ```

   See https://wiki.saucelabs.com/display/DOCS/Platform+Configurator for all
   options.

### Test manually in any browser

1. `BROWSERS=chromium npm test`
2. Wait for the chromium tests to pass. There is not yet a way to bypass running
   the tests at least once, see https://github.com/modernweb-dev/web/issues/592
3. Press `M` to enter manual mode
4. Copy/paste the address into a browser of your choice.

### Set up a Sauce tunnel for manual testing

1. Download _Sauce Connect_ from https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy
2. Unzip the archive. Optionally move it somewhere you prefer. Optionally add
   its `bin` directory to your `$PATH`, or symlink the `sc` binary to your own
   `bin` directory if you have one.
3. `export SAUCE_USERNAME=your-username SAUCE_ACCESS_KEY=xxx`
4. Run `sc`. If successful, Sauce Labs VMs can now access local services.
5. See [Test manually in any browser](#test-manually-in-any-browser) to get
   `@web/test-runner` running in manual mode.
6. Visit https://app.saucelabs.com/live/web-testing to configure and start a new
   interactive VM session.
   - Select your tunnel from the _SAUCE CONNECT PROXY_ dropdown. The tunnel ID
     is shown in the console output of `sc`.
   - Copy/paste the URL with your IP address (instead of the `localhost` URL)
     reported by `@web/test-runner` into the _URL_ field.

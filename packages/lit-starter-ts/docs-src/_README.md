This directory contains the sources for the static site contained in the /docs/ directory. The site is based on the [eleventy](11ty.dev) static site generator.

The site is intended to be used with GitHub pages. To enable the site go to the GitHub settings and change the GitHub Pages "Source" setting to "master branch /docs folder".

To view the site locally, run `npm run docs:serve`.

To edit the site, add to or edit the files in this directory then run `npm run docs` to build the site. The built files must be checked in and pushed to GitHub to appear on GitHub pages.

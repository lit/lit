#!/usr/bin/env bash

# Create a new worktree at `gh-pages/`
if ! git worktree add gh-pages ; then
  git worktree remove gh-pages
  git worktree add gh-pages
fi

# Clean it out
rm -rf gh-pages/*

# Build uni-virtualizer-examples and copy the build into the gh-pages worktree
npm run build --prefix packages/uni-virtualizer-examples/
cp -r packages/uni-virtualizer-examples/public/* gh-pages

# Commit and push to deploy
cd gh-pages
if ! { git add -A && git commit -m "deploy examples" && git push origin HEAD:gh-pages; } ; then
  echo $'\nNothing to deploy.'
fi
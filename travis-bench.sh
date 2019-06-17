#!/usr/bin/env bash
# Run the lit-html benchmarks using Travis environment variables.

set -e

if [[ -z "${TRAVIS_REPO_SLUG}" || -z "${TRAVIS_COMMIT}" ]]; then
  echo "We do not appear to be running from Travis"
  exit 1
fi

set -o nounset

BENCHMARK="shack=./node_modules/lit-html-benchmarks/shack"
BROWSER="chrome-headless"

# Keep sampling until we're confident that all differences lie squarely within
# one of the regions defined by these points (or until the timeout expires).
MIN_SAMPLE_SIZE=50
HORIZON="0%,1%,10%"
TIMEOUT_MINS=3

# This commit is the right one regardless of whether this is a branch build, a
# PR from the origin repo, or a PR from a fork.
THIS="${TRAVIS_REPO_SLUG}#${TRAVIS_COMMIT}"

# If this is a PR build, then THIS is an auto-generated merge commit with the
# tip of the target branch (e.g. master) as its first parent, which is what we
# want (note GitHub always creates a merge, even if it could fast-forward). If
# this is a branch build (e.g. a commit to master or some other branch) then we
# also want its first parent.
PARENT="${THIS}^"

if [[ "${TRAVIS_SECURE_ENV_VARS}" == "true" ]]; then
  # This number be found at the top of
  # https://github.com/organizations/Polymer/settings/apps/tachometer-benchmarks
  APP_ID=29262
  # This number can be found at
  # https://github.com/organizations/Polymer/settings/installations
  # by clicking "Configure" and looking at the URL.
  INSTALLATION_ID=851456

  if [[ "${TRAVIS_PULL_REQUEST}" == "false" ]]; then
    CHECK_LABEL="Tachometer - Branch"
    CHECK_COMMIT="${TRAVIS_COMMIT}"
  else
    CHECK_LABEL="Tachometer - Pull Request"
    # Note that for a PR, $TRAVIS_COMMIT will be the SHA of the generated merge
    # commit, but in order to show up in the GitHub UI we need to instead attach
    # the check to the feature branch SHA.
    CHECK_COMMIT="${TRAVIS_PULL_REQUEST_SHA}"
  fi

  GITHUB_CHECK="{\"label\":\"${CHECK_LABEL}\",\"appId\":${APP_ID},\"installationId\":${INSTALLATION_ID},\"repo\":\"${TRAVIS_REPO_SLUG}\",\"commit\":\"${CHECK_COMMIT}\"}"

else
  # We can't report a GitHub Check unless this is a trusted build with access to
  # our GitHub App's private key. Note that benchmark results can still be seen
  # in the Travis build log.
  GITHUB_CHECK=""
fi

# See https://github.com/PolymerLabs/tachometer
echo -e "\nBenchmarking ${THIS}\n  versus ${PARENT}\n  and NPM latest\n"
npx tach $BENCHMARK \
  --browser=$BROWSER \
  --sample-size=$MIN_SAMPLE_SIZE --horizon=$HORIZON --timeout=$TIMEOUT_MINS \
  --package-version=this=lit-html@github:${THIS} \
  --package-version=parent=lit-html@github:${PARENT} \
  --package-version=published=lit-html@* \
  --github-check="${GITHUB_CHECK}"

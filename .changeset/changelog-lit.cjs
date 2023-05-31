/**
 * @license
 * Copyright 2019 Ben Conolly
 * SPDX-License-Identifier: MIT
 */

const {
  getInfo,
  getInfoFromPullRequest,
} = require('@changesets/get-github-info');

// Forked from: https://github.com/atlassian/changesets/blob/main/packages/changelog-github/src/index.ts

const repo = 'lit/lit';

const changelogFunctions = {
  getDependencyReleaseLine: async (
    changesets,
    dependenciesUpdated,
    _options
  ) => {
    if (dependenciesUpdated.length === 0) return '';

    const changesetLink = `- Updated dependencies [${(
      await Promise.all(
        changesets.map(async (cs) => {
          if (cs.commit) {
            let {links} = await getInfo({
              repo,
              commit: cs.commit,
            });
            return links.commit;
          }
        })
      )
    )
      .filter((_) => _)
      .join(', ')}]:`;

    const updatedDependenciesList = dependenciesUpdated.map(
      (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
    );

    return [changesetLink, ...updatedDependenciesList].join('\n');
  },
  getReleaseLine: async (changeset, type, options) => {
    let prFromSummary;
    let commitFromSummary;
    let usersFromSummary = [];

    const replacedChangelog = changeset.summary
      .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
        let num = Number(pr);
        if (!isNaN(num)) prFromSummary = num;
        return '';
      })
      .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
        commitFromSummary = commit;
        return '';
      })
      .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
        usersFromSummary.push(user);
        return '';
      })
      .trim();

    const [firstLine, ...futureLines] = replacedChangelog
      .split('\n')
      .map((l) => l.trimRight());

    const links = await (async () => {
      if (prFromSummary !== undefined) {
        let {links} = await getInfoFromPullRequest({
          repo,
          pull: prFromSummary,
        });
        if (commitFromSummary) {
          links = {
            ...links,
            commit: `[\`${commitFromSummary}\`](https://github.com/${repo}/commit/${commitFromSummary})`,
          };
        }
        return links;
      }
      const commitToFetchFrom = commitFromSummary || changeset.commit;
      if (commitToFetchFrom) {
        let {links} = await getInfo({
          repo,
          commit: commitToFetchFrom,
        });
        return links;
      }
      return {
        commit: null,
        pull: null,
        user: null,
      };
    })();

    const users = usersFromSummary.length
      ? usersFromSummary
          .filter((u) => !containsLitTeamMemberUsername(u))
          .map(
            (userFromSummary) =>
              `[@${userFromSummary}](https://github.com/${userFromSummary})`
          )
          .join(', ')
      : containsLitTeamMemberUsername(links.user)
      ? null
      : links.user;

    /**
     * containsLitTeamMemberUsername lets us only congratulate community
     * contributions.
     * @param {string} s - any string that may contain a username.
     * @returns boolean indicating if a Lit team member was found in the string.
     */
    function containsLitTeamMemberUsername(s) {
      return new RegExp(
        `\\b(${[
          'AndrewJakubowicz',
          'augustjk',
          'bicknellr',
          'dfreedm',
          'e111077',
          'justinfagnani',
          'kevinpschaaf',
          'rictic',
          'sorvell',
          'usergenic',
        ].join('|')})\\b`,
        'i'
      ).test(s);
    }

    const prefix = [
      links.pull === null ? '' : ` ${links.pull}`,
      links.commit === null ? '' : ` ${links.commit}`,
      users === null || users === '' ? '' : ` Thanks ${users}!`,
    ].join('');

    return `\n\n-${prefix ? `${prefix} -` : ''} ${firstLine}\n${futureLines
      .map((l) => `  ${l}`)
      .join('\n')}`;
  },
};

module.exports = changelogFunctions;

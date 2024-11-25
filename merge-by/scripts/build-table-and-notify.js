const { QUERIES, MUTATIONS } = require("./graphql");
const { getPullRequests } = require("./promises");

/** @typedef {import("./promises").PullInfo} PullInfo */

/**
 * @param {number} days Days between PR marked as ready and current date
 * @returns {string} The appropriate string based on the number given
 */
const getDaysReady = (days) => {
  switch (days) {
    case -1:
      return "Not ready";
    case 0:
      return "Today";
    case 1:
      return "a day ago";
    default:
      return `${days} days ago`;
  }
};

/**
 * Builds a row for the Markdown table given the GitHub repo owner, repo name and pull request.
 * @param {string} owner The owner of the repository (user or organization)
 * @param {string} repo The name of the repository on GitHub
 * @param {PullInfo} pr The pull request data to use for the table row
 * @returns
 */
const buildTableRow = (owner, repo, pr) =>
  `| [#${pr.number}](https://github.com/${owner}/${repo}/pull/${
    pr.number
  }) | [**${pr.title.trim()}**](https://github.com/${owner}/${repo}/pull/${
    pr.number
  }) | ${pr.author} | ${pr.mergeBy ?? "N/A"} | ${getDaysReady(
    pr.daysSinceReady
  )} | ${
    pr.hasReviews && pr.mergeable !== false
      ? ":white_check_mark:"
      : ":white_large_square:"
  }`;

const TABLE_HEADER = `
| # | Title | Author | Merge by | Marked ready | Can merge? | 
| - | ----- | ------ | -------- | ------------ | ---------- |`;

const DISCUSSION_NAME = "PR Status List";

/**
 * Scans PRs and builds a table using Markdown. Updates an issue or creates a new one with the table.
 *
 * @param {Object} github The OctoKit/rest.js API for making requests to GitHub
 * @param {string} owner The owner of the repository (user or organization)
 * @param {PullInfo[]} pullRequests The list of pull requests to include in the table
 * @param {string} pullRequests[].mergeBy (optional) The merge-by date for the pull request
 * @param {string} repo The name of the repository on GitHub
 */
const scanPRsAndUpdateTable = async ({ github, owner, pullRequests, repo }) => {
  // Build a table using Markdown to post within the issue
  const body = `${TABLE_HEADER}\n${pullRequests
    .map((pr) => buildTableRow(owner, repo, pr))
    .join("\n")}`;

  // Search through discussions for the title "PR Status List"
  const discussionsQuery = await github.graphql(QUERIES.GET_DISCUSSIONS, {
    owner,
    repo,
  });
  const discussion = discussionsQuery?.repository?.discussions?.nodes?.find(
    (d) => d.title === DISCUSSION_NAME
  );

  if (discussion != null) {
    // Create a discussion for the PR statuses since one does not exist.
    await github.graphql(MUTATIONS.UPDATE_DISCUSSION, {
      input: {
        discussionId: discussion.id,
        body,
      },
    });
  } else {
    // Update the existing discussion with the new PR statuses.
    // The discussion is in the "General" category.
    const generalCategory =
      discussionsQuery.repository?.discussionCategories?.nodes?.find(
        (cat) => cat.name === "General"
      );
    await github.graphql(MUTATIONS.CREATE_DISCUSSION, {
      input: {
        categoryId: generalCategory.id,
        repositoryId: discussionsQuery?.repository?.id,
        body,
        title: DISCUSSION_NAME,
      },
    });
  }
};

/**
 * Notifies users for PRs that have a merge-by date <24 hours from now.
 *
 * @param {Object} dayJs Day.js exports for manipulating/querying time differences
 * @param {Object} github The OctoKit/rest.js API for making requests to GitHub
 * @param {string} owner The owner of the repo (user or organization)
 * @param {PullInfo[]} pullRequests The list of pull requests to include in the table
 * @param {string} repo The name of the GitHub repo
 * @param {Object} today Today's date represented as a Day.js object
 */
const notifyUsers = async ({
  dayJs,
  github,
  owner,
  pullRequests,
  repo,
  today,
}) => {
  const prsCloseToMergeDate = pullRequests.filter((pr) => {
    if (pr.mergeBy == null) {
      return false;
    }

    // Filter out any PRs that don't have merge-by dates within a day from now
    const mergeByDate = dayJs(pr.mergeBy);
    return mergeByDate.diff(today, "day") <= 1;
  });

  for (const pr of prsCloseToMergeDate) {
    const comments = (
      await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: pr.number,
      })
    ).data;
    // Try to find the reminder comment
    const existingComment = comments?.find(
      (comment) =>
        comment.user.login === "github-actions[bot]" &&
        comment.body.includes(
          "**Reminder:** This pull request has a merge-by date coming up within the next 24 hours. Please review this PR as soon as possible."
        )
    );

    if (existingComment != null) {
      continue;
    }

    // Make a comment on the PR and tag reviewers
    const body = `**Reminder:** This pull request has a merge-by date coming up within the next 24 hours. Please review this PR as soon as possible.\n\n${pr.reviewers
      .map((r) => `@${r.login}`)
      .join(" ")}`;
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr.number,
      body,
    });
  }
};

/**
 * Fetches PRs with a merge-by date < 1 week from now.
 *
 * @param {Object} dayJs Day.js exports for manipulating/querying time differences
 * @param {Object} github The OctoKit/rest.js API for making requests to GitHub
 * @param {string} owner The owner of the repository (user or organization)
 * @param {string} repo The name of the repository on GitHub
 * @param {Object} today Today's date, represented as a day.js object
 */
const fetchPullRequests = async ({ dayJs, github, owner, repo, today }) => {
  const nextWeek = today.add(7, "day");
  return (await Promise.all(getPullRequests({ dayJs, github })))
    .filter((pr) => {
      if (pr.mergeBy == null) {
        return true;
      }

      // Filter out any PRs that have merge-by dates > 1 week from now
      const mergeByDate = dayJs(pr.mergeBy);
      return nextWeek.diff(mergeByDate, "day") <= 7;
    })
    .reverse();
};

module.exports = async ({ github, context, require }) => {
  const dayJs = require("dayjs");
  const today = dayJs();
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const pullRequests = await fetchPullRequests({
    dayJs,
    github,
    owner,
    repo,
    today,
  });
  // Look over existing PRs, grab all PRs with a merge-by date <= 1w from now, and update the issue with the new table
  await scanPRsAndUpdateTable({ github, owner, pullRequests, repo });
  // Notify users for PRs with merge-by dates coming up within 24hrs from now
  if (context.eventName === "schedule") {
    await notifyUsers({ dayJs, github, owner, pullRequests, repo, today });
  }
};

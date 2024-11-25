/**
 * Metadata about a pull request.
 *
 * @typedef {{
 *   number: number;
 *   title: string;
 *   author: string;
 *   hasReviews: boolean;
 *   mergeable: boolean;
 *   reviewers: { login: string }[];
 *   daysSinceReady: number;
 *   mergeBy: string;
 * }} PullInfo
 */

/**
 *
 * @param {Object} dayJs Day.js exports for manipulating/querying time differences
 * @param {Object} github The github object for interacting w/ REST APIs
 * @returns {PullInfo[]} List of metadata for each pull request
 */
export async function getPullRequests({ dayJs, github }) {
    return (
        await github.rest.pulls.list({
            owner,
            repo,
            state: "open",
        })
    )?.data
        .filter((pr) => !pr.draft)
        .map(async (pr) => {
            const comments = (
                await github.rest.issues.listComments({
                    owner,
                    repo,
                    issue_number: pr.number,
                })
            ).data;
            // Attempt to parse the merge-by date from the bot comment
            const existingComment = comments?.find(
                (comment) =>
                    comment.user.login === "github-actions[bot]" &&
                    comment.body.includes("**📅 Suggested merge-by date:")
            );

            const reviews = (
                await github.rest.pulls.listReviews({
                    owner,
                    repo,
                    pull_number: pr.number,
                })
            ).data;

            const hasTwoReviews =
                reviews.reduce(
                    (all, review) => (review.state === "APPROVED" ? all + 1 : all),
                    0
                ) >= 2;

            // Filter out reviewers if they have already reviewed and approved the pull request
            const reviewersNotApproved = pr.requested_reviewers.filter(
                (reviewer) =>
                    reviews.find(
                        (review) =>
                            review.state === "APPROVED" &&
                            reviewer.login === review.user.login
                    ) == null
            );

            // Check if this PR was marked as ready
            const timeline = (
                await github.rest.issues.listEventsForTimeline({
                    owner,
                    repo,
                    issue_number: pr.number,
                })
            ).data;
            const timeLineLastToFirst = timeline.reverse();
            const lastReadyEvent = timeLineLastToFirst.findIndex((ev) => ev.event === "ready_for_review");
            const daysSinceReady = pr.draft ? -1 :
                dayJs().diff(dayjs(timeLineLastToFirst(lastReadyEvent).created_at), "day");

            return {
                number: pr.number,
                title: pr.title,
                author: pr.user.login,
                hasReviews: hasTwoReviews,
                mergeable: pr.mergeable,
                reviewers: reviewersNotApproved,
                daysSinceReady,
                mergeBy: existingComment?.body
                    .substring(existingComment.body.lastIndexOf("*") + 1)
                    .trim(),
            };
        });
}

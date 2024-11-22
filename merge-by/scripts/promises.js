export async function getPullRequests({ github }) {
    return (await github.rest.pulls.list({
        owner,
        repo,
        state: "open",
    }))?.data
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

            return {
                number: pr.number,
                title: pr.title,
                author: pr.user.login,
                hasReviews: hasTwoReviews,
                mergeable: pr.mergeable,
                reviewers: reviewersNotApproved,
                mergeBy: existingComment?.body
                    .substring(existingComment.body.lastIndexOf("*") + 1)
                    .trim(),
            };
        });
}
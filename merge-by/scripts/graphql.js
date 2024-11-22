export const QUERIES = {
    GET_DISCUSSIONS: `#graphql query($owner:String!, $repo:String!) {
        repository(owner:$owner, name:$repo) {
            id

            discussionCategories(first: 100) {
                nodes {
                    id
                    name
                }
            }

            discussions(first: 100) {
                nodes {
                    id
                    body
                    title
                }
            }
        }
    }`,
};

export const MUTATIONS = {
    CREATE_DISCUSSION: `#graphql mutation($input:CreateDiscussionInput!) {
        createDiscussion(input: $input) {
            discussion {
                id
            }
        }
    }`,
    UPDATE_DISCUSSION: `#graphql mutation($input:UpdateDiscussionInput!) {
        updateDiscussion(input: $input) {
            discussion {
                id
            }
        }
    }`,
};
